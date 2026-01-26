<?php
// This script acts as a signing oracle. 
// It requires Composer packages: kornrunner/keccak, simplito/elliptic-php, vlucas/phpdotenv

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 1. Load Dependencies (if Composer is used)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// 2. Environment Variable Loading
// Try vlucas/phpdotenv first
if (class_exists('Dotenv\Dotenv')) {
    try {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->safeLoad();
    } catch (Exception $e) {
        // Ignore errors if .env doesn't exist or is unreadable
    }
}

// Manual Fallback for .env loading (if library missing or failed)
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

// 3. Configuration
// Check multiple possible key names
$privateKey = $_ENV['WALLET_PRIVATE_KEY'] ?? getenv('WALLET_PRIVATE_KEY') ?? $_ENV['PRIVATE_KEY'] ?? getenv('PRIVATE_KEY');
$contractAddress = $_ENV['CONTRACT_ADDRESS'] ?? getenv('CONTRACT_ADDRESS') ?: '0x23C476eD8710725B06EC33bE3195219aCcfCE0E4';

// 4. Input Parsing
$input = json_decode(file_get_contents('php://input'), true);
$userAddress = $input['address'] ?? null;
$amountRaw = $input['amount'] ?? 0;

if (!$userAddress || $amountRaw <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input: Missing address or amount']);
    exit;
}

// Helper: Strip 0x
function strip0x($str) {
    return (strpos($str, '0x') === 0) ? substr($str, 2) : $str;
}

// 5. Signature Generation Logic
$isMock = true;
$signature = "0x00";

// Check if we have the private key and the necessary classes for real signing
if ($privateKey && class_exists('kornrunner\Keccak') && class_exists('Elliptic\EC')) {
    try {
        // --- Amount Conversion (to Wei) ---
        if (function_exists('bcmul')) {
            $amountWei = bcmul((string)$amountRaw, '1000000000000000000'); 
        } else {
            $amountWei = (string)($amountRaw * 1000000000000000000); 
        }

        // --- Packing Data ---
        // packing: userAddress (20 bytes) + amount (32 bytes)
        // matches solidity: abi.encodePacked(user, amount)
        
        $addressHex = strip0x($userAddress);
        $addressBin = hex2bin($addressHex);
        
        // Convert decimal string to hex, then pad to 32 bytes
        // Note: For very large numbers in PHP, dechex might lose precision if not using BCMath/GMP.
        // Simplified approach for standard reward amounts:
        if (function_exists('gmp_init')) {
            $amountHex = gmp_strval(gmp_init($amountWei), 16);
        } else {
            // Fallback (might not handle huge wei values correctly without GMP/BCMath custom hex conversion)
            // But sufficient for game points
            $amountHex = base_convert($amountWei, 10, 16);
        }
        $amountHex = str_pad($amountHex, 64, '0', STR_PAD_LEFT);
        $amountBin = hex2bin($amountHex);

        $packed = $addressBin . $amountBin;

        // --- Hashing ---
        $dataHashHex = kornrunner\Keccak::hash($packed, 256);
        $dataHashBin = hex2bin($dataHashHex);

        // --- EIP-191 Prefix ---
        $prefix = "\x19Ethereum Signed Message:\n32";
        $finalHashHex = kornrunner\Keccak::hash($prefix . $dataHashBin, 256);

        // --- Signing ---
        $ec = new Elliptic\EC('secp256k1');
        $key = $ec->keyFromPrivate(strip0x($privateKey));
        $sig = $key->sign($finalHashHex, ['canonical' => true]);

        $r = str_pad($sig->r->toString(16), 64, '0', STR_PAD_LEFT);
        $s = str_pad($sig->s->toString(16), 64, '0', STR_PAD_LEFT);
        $v = dechex($sig->recoveryParam + 27);

        $signature = '0x' . $r . $s . $v;
        $isMock = false;

    } catch (Exception $e) {
        // If signing fails (e.g. invalid key format), fallback to mock or error
        error_log("Signing failed: " . $e->getMessage());
        $isMock = true; 
    }
} else {
    // Missing libraries or private key -> Mock
    // Generate a random mock signature
    try {
        $random = bin2hex(random_bytes(65));
        $signature = "0x" . $random;
    } catch (Exception $e) {
        $signature = "0x" . md5(uniqid());
    }
    $isMock = true;
}

// Return
echo json_encode([
    'success' => true,
    'amount' => isset($amountWei) ? $amountWei : (string)($amountRaw * 1000000000000000000),
    'signature' => $signature,
    'displayAmount' => $amountRaw,
    'isMock' => $isMock
]);
?>