
import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../../types';
import { supabase } from '../../lib/supabase';

type LeaderboardViewProps = {
    currentFid?: number;
};

export const LeaderboardView = ({ currentFid }: LeaderboardViewProps) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<boolean>(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setFetchError(false);
                // Fetch top 50 users by points
                const { data, error } = await supabase
                    .from('reversi_game_stats')
                    .select('fid, username, display_name, pfp_url, points')
                    .order('points', { ascending: false })
                    .limit(50);
                
                if (error) {
                    throw error;
                }
                
                setEntries(data || []);
            } catch (e) {
                console.warn("Failed to load leaderboard", e);
                // Do not trigger global onError for leaderboard fetch failures
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                 <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
                 <span className="font-bold text-sm">Loading Rankings...</span>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="w-full space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Leaderboard</h2>
                <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-bold">Could not load rankings.</span>
                    <span className="text-xs">Please check your connection.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Leaderboard</h2>

            <div className="flex flex-col gap-3">
                {entries.length === 0 ? (
                     <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-2xl border border-slate-100">
                        No records found yet.
                     </div>
                ) : (
                    entries.map((entry, index) => {
                        const rank = index + 1;
                        const isMe = currentFid === entry.fid;
                        
                        let rankStyle = "bg-white text-slate-600";
                        let rankIcon = null;
                        
                        if (rank === 1) {
                            rankStyle = "bg-gradient-to-r from-yellow-100 to-white border-yellow-200";
                            rankIcon = "👑";
                        } else if (rank === 2) {
                            rankStyle = "bg-gradient-to-r from-slate-100 to-white border-slate-200";
                            rankIcon = "🥈";
                        } else if (rank === 3) {
                            rankStyle = "bg-gradient-to-r from-orange-100 to-white border-orange-200";
                            rankIcon = "🥉";
                        }

                        return (
                            <div 
                                key={entry.fid} 
                                className={`
                                    relative flex items-center gap-3 p-3 rounded-2xl shadow-sm border transition-all
                                    ${rankStyle}
                                    ${isMe ? 'ring-2 ring-orange-400 ring-offset-2' : 'border-slate-100'}
                                `}
                            >
                                {/* Rank */}
                                <div className="w-8 flex justify-center items-center flex-shrink-0 font-black text-lg text-slate-400">
                                    {rankIcon || rank}
                                </div>

                                {/* PFP */}
                                {entry.pfp_url ? (
                                    <img src={entry.pfp_url} alt={entry.username} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-200 flex items-center justify-center flex-shrink-0 text-lg">
                                        👤
                                    </div>
                                )}

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-700 truncate text-sm">
                                        {entry.display_name}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 truncate">
                                        @{entry.username}
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-right flex-shrink-0">
                                    <div className="font-black text-orange-500 text-lg">
                                        {entry.points.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                        Pts
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            <div className="text-center text-xs text-slate-300 font-bold mt-8 pb-4">
                Top 50 Players
            </div>
        </div>
    );
};