<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

$input = json_decode(file_get_contents('php://input'), true);
$fid = $input['fid'] ?? null;

if (!$fid) {
    http_response_code(400);
    echo json_encode(['error' => 'fid is required']);
    exit;
}

$supabaseUrl = $_ENV['VITE_SUPABASE_URL'] ?? getenv('VITE_SUPABASE_URL');
$supabaseKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? getenv('SUPABASE_SERVICE_ROLE_KEY') ?? $_ENV['VITE_SUPABASE_ANON_KEY'] ?? getenv('VITE_SUPABASE_ANON_KEY');

try {
    // 1. Get google_id from google_accounts
    $ch = curl_init($supabaseUrl . '/rest/v1/google_accounts?select=google_id&fid=eq.' . $fid);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 400) {
        throw new Exception("Supabase select failed: " . $response);
    }

    $data = json_decode($response, true);
    if (empty($data) || !isset($data[0]['google_id'])) {
        echo json_encode(['success' => true, 'message' => 'Already disconnected']);
        exit;
    }

    $googleId = $data[0]['google_id'];

    // 2. Delete from google_accounts
    $ch3 = curl_init($supabaseUrl . '/rest/v1/google_accounts?google_id=eq.' . urlencode($googleId));
    curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch3, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch3, CURLOPT_HTTPHEADER, [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey
    ]);
    $response3 = curl_exec($ch3);
    $httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
    curl_close($ch3);

    if ($httpCode3 >= 400) {
        throw new Exception("Supabase google_accounts delete failed: " . $response3);
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    error_log("Disconnect Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to disconnect: ' . $e->getMessage()]);
}
