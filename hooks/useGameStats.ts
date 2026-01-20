import { useEffect, useRef } from 'react';
import { AppStats, Level, LevelStats, FarcasterUser } from '../types';
import { supabase } from '../lib/supabase';

const WIN_MULTIPLIERS: Record<Level, number> = {
    1: 2,  // Beginner
    2: 4,  // Easy
    3: 6,  // Normal
    4: 9,  // Hard
    5: 12  // Expert
};

const INITIAL_LEVEL_STATS: LevelStats = { win: 0, loss: 0, draw: 0 };
const INITIAL_STATS: AppStats = {
    levels: {
        1: { ...INITIAL_LEVEL_STATS },
        2: { ...INITIAL_LEVEL_STATS },
        3: { ...INITIAL_LEVEL_STATS },
        4: { ...INITIAL_LEVEL_STATS },
        5: { ...INITIAL_LEVEL_STATS },
    },
    total: { ...INITIAL_LEVEL_STATS },
    points: 0
};

export const useGameStats = (
    gameOver: boolean, 
    level: Level, 
    scores: { black: number, white: number }, 
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
                        const { data } = await supabase
                            .from('reversi_game_stats')
                            .select('stats')
                            .eq('fid', user.fid)
                            .single();
                        
                        if (data?.stats) {
                            stats = data.stats;
                        }
                    } else {
                        const stored = localStorage.getItem('reversi_pop_stats');
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            // Merge logic for local storage backward compatibility
                            stats.points = parsed.points || 0;
                            ([1, 2, 3, 4, 5] as Level[]).forEach(l => {
                                if (parsed.levels && parsed.levels[l]) {
                                    stats.levels[l] = parsed.levels[l];
                                }
                            });
                            // Re-calc totals
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

                    // Update Level Stats
                    if (isWin) stats.levels[level].win += 1;
                    else if (isLoss) stats.levels[level].loss += 1;
                    else stats.levels[level].draw += 1;

                    // Update Total Stats
                    if (isWin) stats.total.win += 1;
                    else if (isLoss) stats.total.loss += 1;
                    else stats.total.draw += 1;

                    // Calculate Points
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
                        // Always update profile info along with stats
                        const { error } = await supabase
                            .from('reversi_game_stats')
                            .upsert({
                                fid: user.fid,
                                username: user.username,
                                display_name: user.displayName,
                                pfp_url: user.pfpUrl,
                                custody_address: user.custodyAddress,
                                verified_addresses: user.verifiedAddresses,
                                connected_address: connectedAddress,
                                stats: stats,
                                points: stats.points
                            });
                        
                        if (error) console.error("Supabase upsert error:", error);
                        else console.log(`Game Saved (Supabase): Earned ${pointsEarned} pts. Total: ${stats.points}`);
                    } else {
                        localStorage.setItem('reversi_pop_stats', JSON.stringify(stats));
                        console.log(`Game Saved (Local): Earned ${pointsEarned} pts. Total: ${stats.points}`);
                    }

                } catch (e) {
                    console.error("Failed to save stats", e);
                }
            };

            saveStats();

        } else if (!gameOver) {
            savedRef.current = false;
        }
    }, [gameOver, level, scores, user, connectedAddress]);
};