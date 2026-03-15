<?php
header('Content-Type: text/html');

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

function manualLoadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        $name = trim($parts[0]);
        $value = trim($parts[1]);
        if (preg_match('/^"(.*)"$/', $value, $m)) $value = $m[1];
        elseif (preg_match("/^'(.*)'$/", $value, $m)) $value = $m[1];
        
        if (getenv($name) === false) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
manualLoadEnv(__DIR__ . '/.env');

$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;

if (!$code || !$state) {
    http_response_code(400);
    echo "Invalid request";
    exit;
}

$stateData = json_decode(base64_decode($state), true);
$fid = $stateData['fid'] ?? null;

if (!$fid) {
    http_response_code(400);
    echo "Invalid state";
    exit;
}

$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID');
$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET');
$appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? 'https://reversi.k0j1.v2002.coreserver.jp';
$redirectUri = $appUrl . '/api/google_callback.php';

try {
    // 1. Exchange code for token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => $code,
        'grant_type' => 'authorization_code',
        'redirect_uri' => $redirectUri
    ]));
    $tokenResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        throw new Exception("Token exchange failed: " . $tokenResponse);
    }

    $tokenData = json_decode($tokenResponse, true);
    $accessToken = $tokenData['access_token'] ?? null;
    $refreshToken = $tokenData['refresh_token'] ?? null;

    if (!$accessToken) {
        throw new Exception("No access token received");
    }

    // 2. Fetch user info
    $ch2 = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
    $userInfoResponse = curl_exec($ch2);
    $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);

    if ($httpCode2 >= 400) {
        throw new Exception("User info fetch failed: " . $userInfoResponse);
    }

    $userInfo = json_decode($userInfoResponse, true);
    $googleId = $userInfo['id'] ?? null;
    $googleEmail = $userInfo['email'] ?? null;
    $googleName = $userInfo['name'] ?? null;

    if (!$googleId || !$googleEmail) {
        throw new Exception("Missing Google user info");
    }

    // Supabase Update
    $supabaseUrl = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
    $supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('SUPABASE_SERVICE_ROLE_KEY') ?? $_ENV['VITE_SUPABASE_ANON_KEY'] ?? getenv('VITE_SUPABASE_ANON_KEY');

    // 1. Upsert to google_accounts
    $googleAccountData = [
        'google_id' => $googleId,
        'fid' => (int)$fid,
        'google_email' => $googleEmail,
        'google_name' => $googleName,
        'google_refresh_token' => $refreshToken,
        'updated_at' => date('c')
    ];

    $ch = curl_init($supabaseUrl . '/rest/v1/google_accounts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($googleAccountData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: resolution=merge-duplicates'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        throw new Exception("Supabase google_accounts upsert failed: " . $response);
    }

    // 2. Update reversi_game_stats
    // No action needed for reversi_game_stats

    echo "
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
    ";

} catch (Exception $e) {
    error_log("OAuth Error: " . $e->getMessage());
    http_response_code(500);
    echo "Authentication failed: " . htmlspecialchars($e->getMessage());
}
