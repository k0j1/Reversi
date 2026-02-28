import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google OAuth Setup
const appUrl = process.env.APP_URL || 'http://localhost:3000';
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${appUrl}/api/auth/google/callback`
);

// Store fid temporarily (in-memory, for simplicity in this demo)
// In a real app, use a secure session or state parameter
const stateMap = new Map<string, string>(); // state -> fid

app.get("/api/auth/google/url", (req, res) => {
  const fid = req.query.fid as string;
  if (!fid) {
    return res.status(400).json({ error: "fid is required" });
  }

  const state = Math.random().toString(36).substring(7);
  stateMap.set(state, fid);

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: state,
    prompt: "consent",
  });

  res.json({ url });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.status(400).send("Invalid request");
  }

  const fid = stateMap.get(state);
  if (!fid) {
    return res.status(400).send("Invalid state or session expired");
  }
  stateMap.delete(state);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const googleId = userInfo.data.id;
    const googleEmail = userInfo.data.email;
    const googleName = userInfo.data.name;

    if (!googleId || !googleEmail) {
        throw new Error("Missing Google user info");
    }

    // 1. Upsert to google_accounts
    const { error: googleError } = await supabase
      .from("google_accounts")
      .upsert({
        google_id: googleId,
        fid: parseInt(fid, 10),
        google_email: googleEmail,
        google_name: googleName,
        google_refresh_token: tokens.refresh_token || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'google_id' });

    if (googleError) {
      console.error("Error upserting google account:", googleError);
      throw googleError;
    }

    // 2. Update reversi_game_stats with google_id
    const { error: statsError } = await supabase
      .from("reversi_game_stats")
      .update({ google_id: googleId })
      .eq("fid", parseInt(fid, 10));

    if (statsError) {
      console.error("Error updating game stats:", statsError);
      throw statsError;
    }

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Disconnect Google Account
app.post("/api/auth/google/disconnect", async (req, res) => {
    const { fid } = req.body;
    if (!fid) {
        return res.status(400).json({ error: "fid is required" });
    }

    try {
        // 1. Get google_id from stats
        const { data: statsData, error: statsSelectError } = await supabase
            .from("reversi_game_stats")
            .select("google_id")
            .eq("fid", fid)
            .single();

        if (statsSelectError || !statsData?.google_id) {
            return res.json({ success: true, message: "Already disconnected" });
        }

        const googleId = statsData.google_id;

        // 2. Remove google_id from stats
        const { error: statsUpdateError } = await supabase
            .from("reversi_game_stats")
            .update({ google_id: null })
            .eq("fid", fid);

        if (statsUpdateError) throw statsUpdateError;

        // 3. Delete from google_accounts
        const { error: deleteError } = await supabase
            .from("google_accounts")
            .delete()
            .eq("google_id", googleId);

        if (deleteError) throw deleteError;

        res.json({ success: true });
    } catch (error) {
        console.error("Disconnect error:", error);
        res.status(500).json({ error: "Failed to disconnect" });
    }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
      app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
