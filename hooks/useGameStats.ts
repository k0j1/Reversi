
import { useEffect, useRef } from 'react';
import { AppStats, Level, FarcasterUser } from '../types';
import { supabase } from '../lib/supabase';
import { INITIAL_STATS, INITIAL_LEVEL_STATS, WIN_MULTIPLIERS } from '../constants';

const STORAGE_KEY = 'reversi_stats';
const OLD_STORAGE_KEY = 'reversi_pop_stats';

export const useGameStats = (
    gameOver: boolean, 
    level: Level, 
    scores: { black: number, white: number }, 
    onShowToast: (msg: string, type: 'info' | 'warn') => void,
    onError: (error: any) => void,
    user?: FarcasterUser,
    connectedAddress: string | null = null
) => {
    const savedRef = useRef(false);

    useEffect(() => {
        if (gameOver && !savedRef.current) {
            savedRef.current = true;
            
            const saveStats = async () => {
                try {
                    let stats: AppStats = JSON.parse(JSON.stringify(INITIAL_STATS));
                    
                    // 1. Load current stats
                    if (user) {
                        const { data, error: fetchError } = await supabase
                            .from('reversi_game_stats')
                            .select('points, level_1, level_2, level_3, level_4, level_5')
                            .eq('fid', user.fid)
                            .single();
                        
                        if (fetchError && fetchError.code !== 'PGRST116') {
                            // If it's not a "not found" error, report it
                            console.error("Supabase fetch error:", fetchError);
                            // We don't block saving, but we warn
                        }

                        if (data) {
                            stats.points = data.points || 0;
                            stats.levels[1] = data.level_1 || { ...INITIAL_LEVEL_STATS };
                            stats.levels[2] = data.level_2 || { ...INITIAL_LEVEL_STATS };
                            stats.levels[3] = data.level_3 || { ...INITIAL_LEVEL_STATS };
                            stats.levels[4] = data.level_4 || { ...INITIAL_LEVEL_STATS };
                            stats.levels[5] = data.level_5 || { ...INITIAL_LEVEL_STATS };
                            
                            stats.total = { win: 0, loss: 0, draw: 0 };
                            Object.values(stats.levels).forEach((lvlStats: any) => {
                                stats.total.win += lvlStats.win || 0;
                                stats.total.loss += lvlStats.loss || 0;
                                stats.total.draw += lvlStats.draw || 0;
                            });
                        }
                    } else {
                        // LocalStorage Migration Check
                        let stored = localStorage.getItem(STORAGE_KEY);
                        if (!stored) {
                            stored = localStorage.getItem(OLD_STORAGE_KEY);
                            if (stored) {
                                localStorage.setItem(STORAGE_KEY, stored);
                                localStorage.removeItem(OLD_STORAGE_KEY);
                            }
                        }

                        if (stored) {
                            const parsed = JSON.parse(stored);
                            stats.points = parsed.points || 0;
                            ([1, 2, 3, 4, 5] as Level[]).forEach(l => {
                                if (parsed.levels && parsed.levels[l]) {
                                    stats.levels[l] = parsed.levels[l];
                                }
                            });
                            stats.total = { win: 0, loss: 0, draw: 0 };
                            Object.values(stats.levels).forEach((lvlStats: any) => {
                                stats.total.win += lvlStats.win || 0;
                                stats.total.loss += lvlStats.loss || 0;
                                stats.total.draw += lvlStats.draw || 0;
                            });
                        }
                    }

                    // 2. Calculate new stats
                    const isWin = scores.black > scores.white;
                    const isLoss = scores.black < scores.white;

                    if (isWin) stats.levels[level].win += 1;
                    else if (isLoss) stats.levels[level].loss += 1;
                    else stats.levels[level].draw += 1;

                    if (isWin) stats.total.win += 1;
                    else if (isLoss) stats.total.loss += 1;
                    else stats.total.draw += 1;

                    let pointsEarned = 0;
                    const discCount = scores.black;

                    if (isWin) {
                        pointsEarned = discCount * WIN_MULTIPLIERS[level];
                    } else {
                        pointsEarned = discCount * 1;
                    }

                    stats.points += pointsEarned;
                    
                    // 3. Save stats
                    if (user) {
                        const { error } = await supabase
                            .from('reversi_game_stats')
                            .upsert({
                                fid: user.fid,
                                username: user.username,
                                display_name: user.displayName,
                                pfp_url: user.pfpUrl,
                                custody_address: user.custodyAddress,
                                verified_addresses: user.verifiedAddresses,
                                // connected_address removed to fix schema error
                                points: stats.points,
                                level_1: stats.levels[1],
                                level_2: stats.levels[2],
                                level_3: stats.levels[3],
                                level_4: stats.levels[4],
                                level_5: stats.levels[5],
                            });
                        
                        if (error) {
                            console.error("Supabase upsert error:", error);
                            // Show Error Dialog
                            onError(error);
                        } else {
                            console.log(`Game Saved (Supabase): Earned ${pointsEarned} pts. Total: ${stats.points}`);
                            onShowToast("Records Saved Successfully!", 'info');
                        }
                    } else {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
                        console.log(`Game Saved (Local): Earned ${pointsEarned} pts. Total: ${stats.points}`);
                        onShowToast("Game Saved (Local)", 'info');
                    }

                } catch (e) {
                    console.error("Failed to save stats", e);
                    onError(e);
                }
            };

            saveStats();

        } else if (!gameOver) {
            savedRef.current = false;
        }
    }, [gameOver, level, scores, user, connectedAddress, onShowToast, onError]);
};
