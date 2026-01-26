
<?php
// This script acts as a signing oracle. 
// It requires a Web3/Ethereum library (e.g. web3p/ethereum-util) to function correctly.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// --- Configuration ---
$privateKey = getenv('WALLET_PRIVATE_KEY'); // Should be a hex string (e.g. "0x...")
// Use provided address as default if env var is missing
$contractAddress = getenv('CONTRACT_ADDRESS') ?: '0x23C476eD8710725B06EC33bE3195219aCcfCE0E4';

if (!$privateKey || !$contractAddress) {
    http_response_code(500);
    echo json_encode(['error' => 'Server misconfiguration: Missing keys']);
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
$mockSignature = "0x" . bin2hex(random_bytes(65)); 

// Response
echo json_encode([
    'success' => true,
    'amount' => $amountWei, // String format for BigInt
    'signature' => $mockSignature,
    'displayAmount' => $amountRaw
]);
?>
