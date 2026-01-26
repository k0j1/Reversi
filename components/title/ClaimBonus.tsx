
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FarcasterUser } from '../../types';

type ClaimBonusProps = {
    user?: FarcasterUser;
};

export const ClaimBonus = ({ user }: ClaimBonusProps) => {
    const [loading, setLoading] = useState(false);
    const [claimable, setClaimable] = useState<number | null>(null);
    const [dbPoints, setDbPoints] = useState(0);
    const [dbClaimed, setDbClaimed] = useState(0);
    const [lastClaimedTime, setLastClaimedTime] = useState<number>(0);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('reversi_game_stats')
                    .select('points, claimed_score')
                    .eq('fid', user.fid)
                    .single();

                if (data) {
                    const p = data.points || 0;
                    // @ts-ignore: claimed_score might not be in the generated types yet
                    const c = data.claimed_score || 0;
                    
                    setDbPoints(p);
                    setDbClaimed(c);

                    // Calculation: (points - claimed_score) + 500
                    const amount = Math.max(0, (p - c) + 500);
                    setClaimable(amount);
                }
            } catch (e) {
                console.error("Error fetching claim data", e);
            }
        };

        fetchData();
    }, [user, lastClaimedTime]);

    const handleClaim = async () => {
        if (!user || claimable === null || claimable <= 0) return;
        setLoading(true);

        try {
            // New claimed_score = current claimed_score + claimable amount
            const newClaimedScore = dbClaimed + claimable;

            const { error } = await supabase
                .from('reversi_game_stats')
                // @ts-ignore
                .update({ claimed_score: newClaimedScore })
                .eq('fid', user.fid);

            if (error) throw error;

            // Update local state to reflect change immediately
            setLastClaimedTime(Date.now());
            alert(`Successfully claimed ${claimable} $CHH!`);
            
        } catch (e: any) {
            console.error("Claim failed", e);
            alert("Claim failed: " + (e.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;
    
    // Only render if calculation is ready. If claimable is 0, we still render to show "Claimed" state
    if (claimable === null) return null;

    return (
        <div className="w-full px-2 animate-fade-in">
            <button
                onClick={handleClaim}
                disabled={loading || claimable <= 0}
                className={`
                    w-full relative overflow-hidden group
                    py-4 px-6 rounded-2xl border-b-4 transition-all
                    flex items-center justify-between
                    ${claimable > 0 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-orange-600 hover:brightness-110 active:border-b-0 active:translate-y-1' 
                        : 'bg-slate-200 border-slate-300 cursor-not-allowed text-slate-400'}
                `}
            >
                {/* Shine effect */}
                {claimable > 0 && (
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]"></div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm border-2
                        ${claimable > 0 ? 'bg-yellow-300 border-yellow-100' : 'bg-slate-300 border-slate-200'}
                    `}>
                        🎁
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={`text-xs font-bold uppercase tracking-wider ${claimable > 0 ? 'text-yellow-100' : 'text-slate-400'}`}>
                            Login Bonus
                        </span>
                        <span className={`text-lg font-black ${claimable > 0 ? 'text-white drop-shadow-sm' : 'text-slate-500'}`}>
                            {claimable > 0 ? `Claim ${claimable} $CHH` : 'Claimed'}
                        </span>
                    </div>
                </div>

                {claimable > 0 && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </button>
        </div>
    );
};
