
<?php
// This script acts as a signing oracle. 
// It requires a Web3/Ethereum library (e.g. web3p/ethereum-util) to function correctly.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// --- Helper: Load .env file manually ---
// Standard PHP getenv() does not load .env files from disk automatically.
// This function parses a .env file in the same directory if it exists.
function loadEnv($path) {
    if (!file_exists($path)) return;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments and empty lines
        if ($line === '' || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $name = trim($parts[0]);
        $value = trim($parts[1]);
        
        // Remove surrounding quotes if present (basic handling)
        if (preg_match('/^"(.*)"$/', $value, $m)) $value = $m[1];
        elseif (preg_match("/^'(.*)'$/", $value, $m)) $value = $m[1];

        // Set environment variable if not already set
        if (getenv($name) === false) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Attempt to load .env from the current directory
loadEnv(__DIR__ . '/.env');

// --- Configuration ---
// Attempt to get keys from environment
$privateKey = getenv('WALLET_PRIVATE_KEY'); 
// Use provided address as default if env var is missing
$contractAddress = getenv('CONTRACT_ADDRESS') ?: '0x23C476eD8710725B06EC33bE3195219aCcfCE0E4';

// Fallback for development/testing if private key is not set
if (!$privateKey) {
    // Use a dummy key to prevent "Server misconfiguration" error during initial testing.
    // NOTE: This will result in an invalid signature on-chain if used with the real contract.
    // Please configure WALLET_PRIVATE_KEY in your server environment or .env file for production.
    $privateKey = "0x0000000000000000000000000000000000000000000000000000000000000001";
}

if (!$contractAddress) {
    http_response_code(500);
    echo json_encode(['error' => 'Server misconfiguration: Missing contract address']);
    exit;
}

// --- Input Parsing ---
$input = json_decode(file_get_contents('php://input'), true);
$userAddress = $input['address'] ?? null;
$amountRaw = $input['amount'] ?? 0; // Integer amount (e.g. 500)

if (!$userAddress || $amountRaw <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input: Missing address or amount']);
    exit;
}

// --- Amount Conversion (to Wei) ---
// 1 CHH = 10^18 units. Using BCMath for precision with large numbers.
if (function_exists('bcmul')) {
    $amountWei = bcmul((string)$amountRaw, '1000000000000000000'); 
} else {
    // Fallback if bcmath is missing (risky for very large numbers but ok for simple integers)
    $amountWei = (string)($amountRaw * 1000000000000000000); 
}

// --- Signature Generation ---
/*
 * LOGIC DESCRIPTION FOR IMPLEMENTATION:
 * 1. Pack arguments: address(user), uint256(amount), address(contract)
 *    (Nonce is removed as per request)
 * 2. Hash: Keccak256 of packed data
 * 3. Sign: ECDSA sign the hash with $privateKey
 */

// MOCK SIGNATURE (Remove this and implement actual signing with a library)
// This signature will fail on-chain verification unless the contract signer matches the dummy key.
$mockSignature = "0x" . bin2hex(random_bytes(65)); 
$isMock = true; // Signal to frontend that this is not a valid on-chain signature

// Response
echo json_encode([
    'success' => true,
    'amount' => $amountWei, // String format for BigInt
    'signature' => $mockSignature,
    'displayAmount' => $amountRaw,
    'isMock' => $isMock
]);
?>
