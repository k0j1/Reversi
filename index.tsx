import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { Level } from './types';
import { useFarcaster } from './hooks/useFarcaster';
import { useUserSync } from './hooks/useUserSync';
import { ErrorDialog } from './components/ErrorDialog';
import { supabase } from './lib/supabase';
import './styles.css';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  // Default to Normal (2)
  const [level, setLevel] = useState<Level>(2);
  const [error, setError] = useState<any>(null);
  
  // Use the consolidated Farcaster hook
  const { user, connectedAddress, connectWallet } = useFarcaster();

  // Centralized Error Handler
  const handleError = useCallback((err: any) => {
    console.error("Application Error:", err);
    setError(err);
  }, []);

  // Sync user data to Supabase whenever user or wallet changes
  useUserSync(user, connectedAddress, handleError);

  // Initial DB Connection Test
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const { error: dbError } = await supabase
          .from('reversi_game_stats')
          .select('count', { count: 'exact', head: true });
        
        if (dbError) {
          throw new Error(`DB Connection Failed: ${dbError.message} (${dbError.code})`);
        }
        console.log("DB Connection Verified");
      } catch (e: any) {
        // If it's a network error or missing table, report it
        // We only report if it seems like a configuration issue, not just offline
        console.error("DB Connection Check Failed:", e);
        // Only show dialog on startup if it's a critical config error to avoid annoying offline users too much
        if (e.message && (e.message.includes("Postgrest") || e.message.includes("apikey"))) {
             setError(e);
        }
      }
    };

    checkDbConnection();
  }, []);

  return (
    <>
        {error && <ErrorDialog error={error} onClose={() => setError(null)} />}
        
        {view === 'TITLE' ? (
            <TitleScreen 
                level={level} 
                setLevel={setLevel} 
                onStart={() => setView('GAME')} 
                user={user}
                connectedAddress={connectedAddress}
                connectWallet={connectWallet}
                onError={handleError}
            />
        ) : (
            <Game 
                level={level} 
                onExit={() => setView('TITLE')} 
                user={user}
                connectedAddress={connectedAddress}
                onError={handleError}
            />
        )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);