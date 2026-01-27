<?php
// This script acts purely as a signing oracle. 
// It receives an amount from the frontend and signs it.
// It does NOT validate the score against the database (trusts frontend/game logic).
// Dependencies: kornrunner/keccak, simplito/elliptic-php, vlucas/phpdotenv

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 1. Load Dependencies
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// 2. Load Environment Variables
if (class_exists('Dotenv\Dotenv')) {
    try {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->safeLoad();
    } catch (Exception $e) {}
}

// Manual Fallback for .env
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
$privateKey = $_ENV['WALLET_PRIVATE_KEY'] ?? getenv('WALLET_PRIVATE_KEY') ?? $_ENV['PRIVATE_KEY'] ?? getenv('PRIVATE_KEY');

// 4. Input Parsing
// We trust the 'amount' sent from the frontend.
$input = json_decode(file_get_contents('php://input'), true);
$userAddress = $input['address'] ?? null;
$amountRaw = $input['amount'] ?? 0;

if (!$userAddress || $amountRaw <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Helper: Strip 0x
function strip0x($str) {
    return (strpos($str, '0x') === 0) ? substr($str, 2) : $str;
}

// Helper: Safe Decimal to Hex conversion (BCMath/GMP) to prevent precision loss
function dec2hex($number) {
    if (function_exists('gmp_init')) {
        return gmp_strval(gmp_init($number), 16);
    }
    if (function_exists('bcdiv')) {
        $hex = '';
        $num = $number;
        while (bccomp($num, '0') > 0) {
            $mod = bcmod($num, '16');
            $hex = dechex((int)$mod) . $hex;
            $num = bcdiv($num, '16', 0);
        }
        return $hex ?: '0';
    }
    return base_convert($number, 10, 16);
}

// 5. Signature Generation
$isMock = true;
$signature = "0x00";
$amountToSign = "0";
$signerAddress = null;

try {
    // We treat the input amount as the final value to sign.
    // No multiplication by 10^18 here.
    $amountToSign = (string)$amountRaw;

    // Validate that it contains only digits
    if (!ctype_digit($amountToSign)) {
        throw new Exception("Amount must be a numeric string");
    }

    if ($privateKey && class_exists('kornrunner\Keccak') && class_exists('Elliptic\EC')) {
        
        // Packing: abi.encodePacked(address, uint256)
        $addressHex = strip0x($userAddress);
        $addressBin = hex2bin($addressHex);
        
        $amountHex = dec2hex($amountToSign);
        $amountHex = str_pad($amountHex, 64, '0', STR_PAD_LEFT); // uint256 is 32 bytes
        $amountBin = hex2bin($amountHex);

        $packed = $addressBin . $amountBin;

        // Hash
        $dataHashHex = kornrunner\Keccak::hash($packed, 256);
        $dataHashBin = hex2bin($dataHashHex);

        // Prefix
        $prefix = "\x19Ethereum Signed Message:\n32";
        $finalHashHex = kornrunner\Keccak::hash($prefix . $dataHashBin, 256);

        // Sign
        $ec = new Elliptic\EC('secp256k1');
        $key = $ec->keyFromPrivate(strip0x($privateKey));
        $sig = $key->sign($finalHashHex, ['canonical' => true]);

        $r = str_pad($sig->r->toString(16), 64, '0', STR_PAD_LEFT);
        $s = str_pad($sig->s->toString(16), 64, '0', STR_PAD_LEFT);
        $v = dechex($sig->recoveryParam + 27);

        $signature = '0x' . $r . $s . $v;
        $isMock = false;

        // For Debugging
        try {
            $pubKey = $key->getPublic(false, 'hex');
            $pubKeyHash = kornrunner\Keccak::hash(hex2bin(substr($pubKey, 2)), 256);
            $signerAddress = '0x' . substr($pubKeyHash, -40);
        } catch (Exception $e) {}

    } else {
        $random = bin2hex(random_bytes(65));
        $signature = "0x" . $random;
        $isMock = true;
    }
} catch (Exception $e) {
    error_log("Signing failed: " . $e->getMessage());
    $isMock = true;
}

echo json_encode([
    'success' => true,
    'amount' => $amountToSign,
    'signature' => $signature,
    'displayAmount' => $amountRaw,
    'isMock' => $isMock,
    'signerAddress' => $signerAddress 
]);
?>