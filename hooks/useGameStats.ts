
import { useEffect, useRef } from 'react';
import { AppStats, Level, FarcasterUser } from '../types';
import { supabase } from '../lib/supabase';
import { INITIAL_STATS, WIN_MULTIPLIERS } from '../constants';

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
                    // Calculate expected points for display (Toast) only
                    // Actual calculation happens on server for DB
                    const isWin = scores.black > scores.white;
                    let pointsEarned = 0;
                    if (isWin) {
                        pointsEarned = scores.black * WIN_MULTIPLIERS[level];
                    } else {
                        pointsEarned = scores.black * 1;
                    }

                    if (user) {
                        // ---------------------------------------------------------
                        // Secure Server-Side Update (RPC)
                        // ---------------------------------------------------------
                        // We send the match result, NOT the new totals.
                        // The database calculates and increments the values atomically.
                        const { error } = await supabase.rpc('record_game_result', {
                            _fid: user.fid,
                            _level: level,
                            _user_score: scores.black,
                            _ai_score: scores.white
                        });

                        if (error) {
                            console.error("Supabase RPC error:", error);
                            onError(error);
                        } else {
                            console.log(`Game Saved (Server): Match ended. ${scores.black}-${scores.white}`);
                            onShowToast(`Record Saved! (+${pointsEarned} pts)`, 'info');
                        }

                    } else {
                        // ---------------------------------------------------------
                        // Local Storage Fallback (Offline / No User)
                        // ---------------------------------------------------------
                        let stats: AppStats = JSON.parse(JSON.stringify(INITIAL_STATS));
                        
                        // Load existing local stats
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
                            // Re-calc total
                            stats.total = { win: 0, loss: 0, draw: 0 };
                            Object.values(stats.levels).forEach((lvlStats: any) => {
                                stats.total.win += lvlStats.win || 0;
                                stats.total.loss += lvlStats.loss || 0;
                                stats.total.draw += lvlStats.draw || 0;
                            });
                        }

                        // Apply result
                        const isLoss = scores.black < scores.white;
                        if (isWin) stats.levels[level].win += 1;
                        else if (isLoss) stats.levels[level].loss += 1;
                        else stats.levels[level].draw += 1;

                        if (isWin) stats.total.win += 1;
                        else if (isLoss) stats.total.loss += 1;
                        else stats.total.draw += 1;

                        stats.points += pointsEarned;

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
