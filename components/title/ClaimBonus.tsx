
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FarcasterUser } from '../../types';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';

// Contract ABI
export const CONTRACT_ABI = [
  "function claim(uint256 amount, bytes signature) external",
  "function getRemainingBalance() external view returns (uint256)",
  "function checkDailyLimit(address user) external view returns (bool)",
  "event Claimed(address indexed user, uint256 amount)"
];

// Deployed Contract Address
export const CONTRACT_ADDRESS = "0x38156DB0e482EB3a5C198d49917fdb6746344db1";
const API_ENDPOINT = "/api/sign_claim.php"; 

type ClaimBonusProps = {
    user?: FarcasterUser;
};

type ClaimStep = 'IDLE' | 'SIGNING' | 'SENDING' | 'SUCCESS' | 'ERROR';

export const ClaimBonus = ({ user }: ClaimBonusProps) => {
    const [loading, setLoading] = useState(false); // General loading for initial fetch
    const [claimableTotal, setClaimableTotal] = useState<number | null>(null);
    const [rewardPart, setRewardPart] = useState<number>(0);
    const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
    const [lastClaimedTrigger, setLastClaimedTrigger] = useState<number>(0);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [claimStep, setClaimStep] = useState<ClaimStep>('IDLE');
    const [errorLog, setErrorLog] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Initial check for display (Read-Only)
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reversi_game_stats')
                    .select('points, claimed_score, last_login_bonus')
                    .eq('fid', user.fid)
                    .single();

                if (error) {
                    console.error("Error fetching claim data:", error);
                    return;
                }

                if (data) {
                    const p = data.points || 0;
                    // @ts-ignore
                    const c = data.claimed_score || 0;
                    // @ts-ignore
                    const lastLoginStr = data.last_login_bonus;
                    
                    // Check reset time (00:00 UTC)
                    const now = new Date();
                    const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date(0);

                    const isDifferentUtcDay = 
                        now.getUTCFullYear() !== lastLoginDate.getUTCFullYear() ||
                        now.getUTCMonth() !== lastLoginDate.getUTCMonth() ||
                        now.getUTCDate() !== lastLoginDate.getUTCDate();
                    
                    if (isDifferentUtcDay) {
                        const rawDiff = Math.max(0, p - c);
                        const reward = Math.min(1000, rawDiff);
                        const total = 500 + reward;
                        setRewardPart(Math.floor(reward));
                        setClaimableTotal(Math.floor(total));
                        setNextClaimTime(null);
                    } else {
                        setClaimableTotal(0);
                        // Next reset is tomorrow 00:00 UTC
                        const next = new Date();
                        next.setUTCHours(24, 0, 0, 0);
                        setNextClaimTime(next);
                    }
                }
            } catch (e) {
                console.error("Error fetching claim data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, lastClaimedTrigger]);

    const handleClaim = async () => {
        if (!user || claimableTotal === null || claimableTotal <= 0) return;
        
        setClaimStep('SIGNING');
        setErrorLog(null);
        setTxHash(null);

        try {
            // 1. Get Wallet Provider
            await sdk.context; 
            
            // @ts-ignore
            let provider = (sdk as any).wallet?.ethProvider || (window as any).ethereum;
            
            if (!provider) {
                throw new Error("No wallet connected. Please connect your wallet first via the profile menu.");
            }

            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const userAddress = await signer.getAddress();

            // Use RAW integer amount (Contract handles 10^18 multiplication)
            const amountToSend = Math.floor(claimableTotal).toString();

            // 2. Request Signature from Backend (PHP)
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fid: user.fid,
                    address: userAddress,
                    amount: amountToSend, 
                    contractAddress: CONTRACT_ADDRESS
                })
            });

            if (!response.ok) {
                const text = await response.text();
                let errMsg = "Server signature failed";
                try {
                    const json = JSON.parse(text);
                    if(json.error) errMsg = json.error;
                } catch(e) {
                    errMsg += ": " + text;
                }
                throw new Error(errMsg);
            }

            const { amount, signature, isMock, signerAddress } = await response.json();

            // 3. Validation
            if (isMock) {
                throw new Error(`Server is in Mock Mode.\nSigner: ${signerAddress}\nBackend wallet not configured.`);
            }

            setClaimStep('SENDING');

            // 4. Execute Smart Contract Transaction
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Gas estimation
            let gasLimit = BigInt(500000); // Set high default buffer
            try {
                // Estimate with the RAW amount
                const estimated = await contract.claim.estimateGas(amount, signature);
                gasLimit = (estimated * 120n) / 100n; // +20% buffer
            } catch (e) {
                console.warn("Gas estimation failed, using fallback limit", e);
            }

            // Send transaction with RAW amount
            const tx = await contract.claim(amount, signature, { gasLimit });
            
            // Set hash immediately so we have it even if waiting fails
            setTxHash(tx.hash);

            // Wait for confirmation, but don't block on specific provider errors
            try {
                await tx.wait(); 
            } catch (waitError: any) {
                console.warn("Transaction wait failed or not supported:", waitError);
                // If it's the "method not supported" error, we assume it was broadcasted since we have a hash.
                // We proceed to update the UI.
            }

            // 5. Update UI (Optimistic DB update)
            const nowIso = new Date().toISOString();
            
            const { data: currentData } = await supabase
                .from('reversi_game_stats')
                .select('claimed_score')
                .eq('fid', user.fid)
                .single();
            
            const currentClaimed = currentData?.claimed_score || 0;
            const currentReward = Math.max(0, claimableTotal - 500); 
            
            await supabase
                .from('reversi_game_stats')
                // @ts-ignore
                .update({ 
                    claimed_score: currentClaimed + currentReward,
                    last_login_bonus: nowIso
                })
                .eq('fid', user.fid);

            setLastClaimedTrigger(Date.now());
            setClaimStep('SUCCESS');

        } catch (e: any) {
            console.error("Claim process failed", e);

            // Handle User Rejection Gracefully
            if (e.code === 'ACTION_REJECTED' || e.info?.error?.code === 4001) {
                setClaimStep('IDLE');
                return;
            }
            
            let detailedMsg = e.message || "Unknown error";
            
            // Build detailed error log for user
            if (e.reason) detailedMsg += `\nReason: ${e.reason}`;
            if (e.code) detailedMsg += `\nCode: ${e.code}`;
            if (e.data) detailedMsg += `\nData: ${e.data}`;
            if (e.info) detailedMsg += `\nInfo: ${JSON.stringify(e.info, null, 2)}`;
            if (e.stack) detailedMsg += `\n\nStack: ${e.stack}`;

            setErrorLog(detailedMsg);
            setClaimStep('ERROR');
        }
    };

    const handleCopyLog = () => {
        if (errorLog) {
            navigator.clipboard.writeText(errorLog).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        // Reset state if it was successful or error, so next time it starts fresh (if applicable)
        if (claimStep === 'SUCCESS' || claimStep === 'ERROR') {
            setClaimStep('IDLE');
            setErrorLog(null);
            setTxHash(null);
        }
    };

    if (!user) return null;
    if (claimableTotal === null && !loading) return null;

    // Helper to format countdown
    const getCooldownText = () => {
        if (!nextClaimTime) return "";
        const diff = nextClaimTime.getTime() - Date.now();
        if (diff <= 0) return "Ready!";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const canClaim = claimableTotal !== null && claimableTotal > 0;

    return (
        <>
            {/* 1. Simple Title Screen Button */}
            <div className="w-full px-2 animate-fade-in">
                <button
                    onClick={() => canClaim && setIsModalOpen(true)}
                    disabled={!canClaim}
                    className={`
                        w-full py-3 px-6 rounded-xl font-bold shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-between
                        ${canClaim 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-orange-600 text-white hover:brightness-110' 
                            : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'}
                    `}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🎁</span>
                        <span className="uppercase tracking-wider text-sm">
                            {canClaim ? "Claim Daily Bonus" : "Bonus Claimed"}
                        </span>
                    </div>
                    
                    <span className="text-sm font-mono bg-black/10 px-2 py-1 rounded">
                        {canClaim ? "Ready!" : getCooldownText()}
                    </span>
                </button>
            </div>

            {/* 2. Detail / Claim Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={claimStep !== 'SIGNING' && claimStep !== 'SENDING' ? handleClose : undefined}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 flex flex-col gap-6 animate-bounce-in border-4 border-slate-100 max-h-[85vh] overflow-y-auto">
                        
                        {/* Header */}
                        <div className="text-center">
                            <span className="text-4xl">🎁</span>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2">Daily Bonus</h2>
                            <p className="text-slate-400 font-bold text-sm">Earn $CHH tokens</p>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center text-slate-600 text-sm font-bold">
                                <span>Base Reward</span>
                                <span>500 CHH</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 text-sm font-bold">
                                <span>Game Performance</span>
                                <span className="text-orange-500">+{rewardPart} CHH</span>
                            </div>
                            <div className="h-px bg-slate-200 w-full my-1"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-700 font-black">Total Claim</span>
                                <span className="text-2xl font-black text-orange-500">{claimableTotal} CHH</span>
                            </div>
                        </div>

                        {/* Status / Action Area */}
                        <div className="space-y-3">
                            {claimStep === 'IDLE' && (
                                <button 
                                    onClick={handleClaim}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Claim to Wallet
                                </button>
                            )}

                            {(claimStep === 'SIGNING' || claimStep === 'SENDING') && (
                                <div className="flex flex-col items-center justify-center py-4 gap-3 text-slate-500 font-bold animate-pulse">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                                    <span>{claimStep === 'SIGNING' ? "Requesting Signature..." : "Confirming Transaction..."}</span>
                                </div>
                            )}

                            {claimStep === 'SUCCESS' && (
                                <div className="text-center space-y-4">
                                    <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 font-bold">
                                        Successfully Claimed!
                                    </div>
                                    {txHash && (
                                        <a 
                                            href={`https://basescan.org/tx/${txHash}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="block text-xs text-slate-400 hover:text-orange-500 underline truncate"
                                        >
                                            View Tx: {txHash}
                                        </a>
                                    )}
                                    <button 
                                        onClick={handleClose}
                                        className="w-full bg-slate-800 text-white font-bold py-3 px-6 rounded-xl"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {claimStep === 'ERROR' && (
                                <div className="space-y-3">
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-left">
                                        <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>Claim Failed</span>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-red-100 max-h-32 overflow-y-auto custom-scrollbar">
                                            <pre className="text-[10px] font-mono text-slate-600 break-all whitespace-pre-wrap">
                                                {errorLog}
                                            </pre>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCopyLog}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {copySuccess ? "Copied!" : "Copy Log"}
                                        </button>
                                        <button 
                                            onClick={() => setClaimStep('IDLE')}
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Close (X) */}
                        {claimStep !== 'SIGNING' && claimStep !== 'SENDING' && (
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
