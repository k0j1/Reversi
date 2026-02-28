<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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

$fid = $_GET['fid'] ?? null;
if (!$fid) {
    http_response_code(400);
    echo json_encode(['error' => 'fid is required']);
    exit;
}

$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID');
$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET');
$appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? 'https://reversi.k0j1.v2002.coreserver.jp';

$client = new Google\Client();
$client->setClientId($clientId);
$client->setClientSecret($clientSecret);
$client->setRedirectUri($appUrl . '/api/google_callback.php');
$client->addScope("email");
$client->addScope("profile");
$client->setAccessType('offline');
$client->setPrompt('consent');

// Generate state and store it in a simple file-based cache or just pass fid in state
// Since we don't have a session, we can encode fid into the state
$state = base64_encode(json_encode(['fid' => $fid, 'nonce' => bin2hex(random_bytes(16))]));
$client->setState($state);

$authUrl = $client->createAuthUrl();

echo json_encode(['url' => $authUrl]);
