import { useState, useEffect } from 'react';
import { AppStats, Level, FarcasterUser } from '../../types';
import { supabase } from '../../lib/supabase';
import { INITIAL_STATS, INITIAL_LEVEL_STATS } from '../../constants';

type StatsViewProps = {
    user?: FarcasterUser;
    onError: (error: any) => void;
};

export const StatsView = ({ user, onError }: StatsViewProps) => {
    const [stats, setStats] = useState<AppStats | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                let loadedStats: AppStats = JSON.parse(JSON.stringify(INITIAL_STATS));
                let found = false;

                if (user) {
                    const { data, error } = await supabase
                        .from('reversi_game_stats')
                        .select('points, level_1, level_2, level_3, level_4, level_5')
                        .eq('fid', user.fid)
                        .single();
                    
                    if (data) {
                        loadedStats.points = data.points || 0;
                        loadedStats.levels[1] = data.level_1 || { ...INITIAL_LEVEL_STATS };
                        loadedStats.levels[2] = data.level_2 || { ...INITIAL_LEVEL_STATS };
                        loadedStats.levels[3] = data.level_3 || { ...INITIAL_LEVEL_STATS };
                        loadedStats.levels[4] = data.level_4 || { ...INITIAL_LEVEL_STATS };
                        loadedStats.levels[5] = data.level_5 || { ...INITIAL_LEVEL_STATS };
                        
                        loadedStats.total = { win: 0, loss: 0, draw: 0 };
                        Object.values(loadedStats.levels).forEach((lvlStats: any) => {
                            loadedStats.total.win += lvlStats.win || 0;
                            loadedStats.total.loss += lvlStats.loss || 0;
                            loadedStats.total.draw += lvlStats.draw || 0;
                        });

                        found = true;
                    } else if (error && error.code !== 'PGRST116') {
                        onError(error);
                    }
                }
                
                if (!found) {
                    const data = localStorage.getItem('reversi_pop_stats');
                    if (data) {
                        const parsed = JSON.parse(data);
                        if (parsed.levels) {
                            ([1, 2, 3, 4, 5] as Level[]).forEach(l => {
                                if (parsed.levels[l]) loadedStats.levels[l] = parsed.levels[l];
                            });
                            loadedStats.total = { win: 0, loss: 0, draw: 0 };
                            Object.values(loadedStats.levels).forEach((lvlStats: any) => {
                                loadedStats.total.win += lvlStats.win || 0;
                                loadedStats.total.loss += lvlStats.loss || 0;
                                loadedStats.total.draw += lvlStats.draw || 0;
                            });
                            loadedStats.points = parsed.points || 0;
                        }
                    }
                }
                
                setStats(loadedStats);

            } catch (e) {
                console.error("Failed to load stats", e);
                setStats(INITIAL_STATS);
                onError(e);
            }
        };

        loadStats();
    }, [user, onError]);

    const handleReset = async () => {
        if(confirm("Are you sure you want to reset all records and points?")) {
            try {
                if (user) {
                    const { error } = await supabase.from('reversi_game_stats')
                        .update({ 
                            points: 0,
                            level_1: INITIAL_LEVEL_STATS,
                            level_2: INITIAL_LEVEL_STATS,
                            level_3: INITIAL_LEVEL_STATS,
                            level_4: INITIAL_LEVEL_STATS,
                            level_5: INITIAL_LEVEL_STATS
                        })
                        .eq('fid', user.fid);
                    
                    if (error) throw error;
                }
                
                localStorage.removeItem('reversi_pop_stats');
                setStats(JSON.parse(JSON.stringify(INITIAL_STATS)));
                
            } catch (e) {
                console.error("Failed to reset stats", e);
                onError(e);
            }
        }
    };

    const getLevelLabel = (l: number) => {
        switch(l) {
            case 1: return 'Beginner';
            case 2: return 'Easy';
            case 3: return 'Normal';
            case 4: return 'Hard';
            case 5: return 'Expert';
            default: return 'Normal';
        }
    };

    if (!stats) return <div className="p-8 text-center text-slate-400">Loading...</div>;

    return (
        <div className="w-full space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-700 text-center mb-4">Your Records</h2>
            
            {/* Total Score & Points Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-[2rem] shadow-lg text-white mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className="text-slate-300 text-sm font-bold uppercase tracking-wider">Total Points</span>
                    <span className="text-5xl font-black text-yellow-400 drop-shadow-md">{stats.points.toLocaleString()}</span>
                    <div className="h-px w-full bg-white/10 my-2"></div>
                    <div className="flex justify-between w-full px-4 text-sm font-bold">
                        <div className="flex flex-col items-center">
                            <span className="text-green-400 text-lg">{stats.total.win}</span>
                            <span className="text-slate-400 text-xs">Wins</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-white text-lg">{stats.total.draw}</span>
                            <span className="text-slate-400 text-xs">Draws</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-orange-400 text-lg">{stats.total.loss}</span>
                            <span className="text-slate-400 text-xs">Losses</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Breakdown */}
            <h3 className="text-lg font-bold text-slate-500 px-2">Level Breakdown</h3>
            {([1, 2, 3, 4, 5] as Level[]).map((lvl) => {
                const data = stats.levels[lvl] || { win: 0, loss: 0, draw: 0 };
                const total = data.win + data.loss + data.draw;
                const winRate = total > 0 ? Math.round((data.win / total) * 100) : 0;
                
                let colorClass = '';
                switch(lvl) {
                    case 1: colorClass = 'text-green-500 bg-green-50 border-green-200'; break;
                    case 2: colorClass = 'text-teal-500 bg-teal-50 border-teal-200'; break;
                    case 3: colorClass = 'text-yellow-500 bg-yellow-50 border-yellow-200'; break;
                    case 4: colorClass = 'text-orange-500 bg-orange-50 border-orange-200'; break;
                    case 5: colorClass = 'text-red-500 bg-red-50 border-red-200'; break;
                }
                
                return (
                    <div key={lvl} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className={`font-bold px-3 py-1 rounded-full text-sm border ${colorClass}`}>
                                {getLevelLabel(lvl)}
                            </span>
                            <span className="text-slate-400 text-xs font-bold">Matches: {total}</span>
                        </div>
                        
                        {total === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-2">No games played yet.</div>
                        ) : (
                            <>
                                <div className="flex justify-between text-sm font-bold text-slate-600 px-1">
                                    <span className="text-green-600">Wins: {data.win}</span>
                                    <span className="text-slate-400">Draws: {data.draw}</span>
                                    <span className="text-orange-600">Losses: {data.loss}</span>
                                </div>
                                
                                {/* Win Rate Bar */}
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(data.win / total) * 100}%` }} className="h-full bg-green-500"></div>
                                    <div style={{ width: `${(data.draw / total) * 100}%` }} className="h-full bg-slate-300"></div>
                                    <div style={{ width: `${(data.loss / total) * 100}%` }} className="h-full bg-orange-500"></div>
                                </div>
                                <div className="text-right text-xs font-bold text-slate-400">
                                    Win Rate: {winRate}%
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
            
            <button 
                onClick={handleReset}
                className="w-full mt-4 py-2 text-slate-400 text-sm font-bold hover:text-red-500 transition-colors"
            >
                Reset Records
            </button>
        </div>
    );
};