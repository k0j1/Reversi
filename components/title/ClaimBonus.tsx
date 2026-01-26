
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FarcasterUser } from '../../types';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';

// Contract ABI (Simplified)
const CONTRACT_ABI = [
  "function claim(uint256 amount, bytes signature) external",
  "function getRemainingBalance() external view returns (uint256)",
  "function checkDailyLimit(address user) external view returns (bool)",
  "event Claimed(address indexed user, uint256 amount)"
];

// Deployed Contract Address
const CONTRACT_ADDRESS = "0x23C476eD8710725B06EC33bE3195219aCcfCE0E4";
const API_ENDPOINT = "/api/sign_claim.php"; 

type ClaimBonusProps = {
    user?: FarcasterUser;
};

export const ClaimBonus = ({ user }: ClaimBonusProps) => {
    const [loading, setLoading] = useState(false);
    const [claimableTotal, setClaimableTotal] = useState<number | null>(null);
    const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
    const [lastClaimedTrigger, setLastClaimedTrigger] = useState<number>(0);

    // Initial check for display (Read-Only)
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
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
                        setClaimableTotal(500 + reward);
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
            }
        };

        fetchData();
    }, [user, lastClaimedTrigger]);

    const handleClaim = async () => {
        if (!user || claimableTotal === null || claimableTotal <= 0) return;
        setLoading(true);

        try {
            // 1. Get Wallet Provider
            const context = await sdk.context;
            // @ts-ignore
            let provider = (sdk as any).wallet?.ethProvider || (window as any).ethereum;
            
            if (!provider) {
                throw new Error("No wallet connected. Please connect your wallet first.");
            }

            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const userAddress = await signer.getAddress();

            // 2. Request Signature from Backend (PHP)
            // Now passing 'amount' as calculated by frontend
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fid: user.fid,
                    address: userAddress,
                    amount: claimableTotal // Pass the calculated amount
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server signature failed");
            }

            const { amount, signature, displayAmount } = await response.json();

            // 3. Execute Smart Contract Transaction
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            console.log("Submitting transaction...", { amount });
            const tx = await contract.claim(amount, signature);
            
            console.log("Transaction sent:", tx.hash);
            await tx.wait(); // Wait for confirmation

            // 4. Update UI (Optimistic DB update)
            const nowIso = new Date().toISOString();
            // We still update the DB to record that the user claimed, 
            // so the frontend knows not to show the button again today.
            // Note: This trusts the client side for the DB update, but the Contract claim is on-chain.
            
            // Re-fetch current DB state to increment properly
            const { data: currentData } = await supabase
                .from('reversi_game_stats')
                .select('claimed_score')
                .eq('fid', user.fid)
                .single();
            
            const currentClaimed = currentData?.claimed_score || 0;
            const rewardPart = Math.max(0, claimableTotal - 500); // reverse calc to find gameReward part
            
            await supabase
                .from('reversi_game_stats')
                // @ts-ignore
                .update({ 
                    claimed_score: currentClaimed + rewardPart,
                    last_login_bonus: nowIso
                })
                .eq('fid', user.fid);

            setLastClaimedTrigger(Date.now());
            alert(`Successfully claimed ${displayAmount} $CHH! (Tx: ${tx.hash.slice(0, 10)}...)`);

        } catch (e: any) {
            console.error("Claim process failed", e);
            alert("Claim failed: " + (e.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;
    
    // Only render if calculation is ready. 
    if (claimableTotal === null) return null;

    // Helper to format countdown
    const getCooldownText = () => {
        if (!nextClaimTime) return "";
        const diff = nextClaimTime.getTime() - Date.now();
        if (diff <= 0) return "Ready!";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `Next: ${hours}h ${minutes}m`;
    };

    const canClaim = claimableTotal > 0;

    return (
        <div className="w-full px-2 animate-fade-in">
            <button
                onClick={handleClaim}
                disabled={loading || !canClaim}
                className={`
                    w-full relative overflow-hidden group
                    py-4 px-6 rounded-2xl border-b-4 transition-all
                    flex items-center justify-between
                    ${canClaim 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-orange-600 hover:brightness-110 active:border-b-0 active:translate-y-1' 
                        : 'bg-slate-200 border-slate-300 cursor-not-allowed text-slate-400'}
                `}
            >
                {/* Shine effect */}
                {canClaim && (
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]"></div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm border-2
                        ${canClaim ? 'bg-yellow-300 border-yellow-100' : 'bg-slate-300 border-slate-200'}
                    `}>
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            '🎁'
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={`text-xs font-bold uppercase tracking-wider ${canClaim ? 'text-yellow-100' : 'text-slate-400'}`}>
                            Login Bonus (Resets 0:00 UTC)
                        </span>
                        <span className={`text-lg font-black ${canClaim ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>
                            {canClaim ? `Claim ${claimableTotal} $CHH` : (nextClaimTime ? getCooldownText() : 'Claimed')}
                        </span>
                    </div>
                </div>

                {canClaim && !loading && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </button>
        </div>
    );
};
