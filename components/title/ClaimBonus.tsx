
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FarcasterUser } from '../../types';

type ClaimBonusProps = {
    user?: FarcasterUser;
};

export const ClaimBonus = ({ user }: ClaimBonusProps) => {
    const [loading, setLoading] = useState(false);
    const [claimableTotal, setClaimableTotal] = useState<number | null>(null); // 500 + gameReward
    const [gameReward, setGameReward] = useState<number>(0); // capped at 1000
    const [dbClaimed, setDbClaimed] = useState(0);
    const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
    const [lastClaimedTrigger, setLastClaimedTrigger] = useState<number>(0);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Fetch points, claimed_score, and last_login_bonus
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
                    
                    setDbClaimed(c);

                    // Check reset time (09:00 JST = 00:00 UTC)
                    // If last login was on a previous UTC day, user can claim.
                    const now = new Date();
                    const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date(0);

                    const isDifferentUtcDay = 
                        now.getUTCFullYear() !== lastLoginDate.getUTCFullYear() ||
                        now.getUTCMonth() !== lastLoginDate.getUTCMonth() ||
                        now.getUTCDate() !== lastLoginDate.getUTCDate();
                    
                    // Also check if last login is effectively "in the future" (sanity check)
                    // or if it's strictly same day
                    const canClaim = isDifferentUtcDay;

                    if (canClaim) {
                        // Calculate Game Reward: min(1000, points - claimed_score)
                        const rawDiff = Math.max(0, p - c);
                        const reward = Math.min(1000, rawDiff);
                        
                        setGameReward(reward);
                        setClaimableTotal(500 + reward);
                        setNextClaimTime(null);
                    } else {
                        // Cooldown active
                        setGameReward(0);
                        setClaimableTotal(0);
                        
                        // Next reset is tomorrow 00:00 UTC (09:00 JST)
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
            // Update Logic:
            // 1. claimed_score -> add only the gameReward part (capped at 1000)
            //    Remaining points are carried over to next time.
            // 2. last_login_bonus -> set to NOW
            
            const newClaimedScore = dbClaimed + gameReward;
            const nowIso = new Date().toISOString();

            const { error } = await supabase
                .from('reversi_game_stats')
                // @ts-ignore
                .update({ 
                    claimed_score: newClaimedScore,
                    last_login_bonus: nowIso
                })
                .eq('fid', user.fid);

            if (error) throw error;

            // Trigger refetch/UI update
            setLastClaimedTrigger(Date.now());
            alert(`Successfully claimed ${claimableTotal} $CHH!`);
            
        } catch (e: any) {
            console.error("Claim failed", e);
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
                        🎁
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={`text-xs font-bold uppercase tracking-wider ${canClaim ? 'text-yellow-100' : 'text-slate-400'}`}>
                            Login Bonus (Resets 9:00 JST)
                        </span>
                        <span className={`text-lg font-black ${canClaim ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>
                            {canClaim ? `Claim ${claimableTotal} $CHH` : (nextClaimTime ? getCooldownText() : 'Claimed')}
                        </span>
                    </div>
                </div>

                {canClaim && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </button>
        </div>
    );
};
