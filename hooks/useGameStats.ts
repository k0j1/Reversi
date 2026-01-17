import { useEffect, useRef } from 'react';
import { AppStats, Level, LevelStats } from '../types';

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

export const useGameStats = (gameOver: boolean, level: Level, scores: { black: number, white: number }) => {
    const savedRef = useRef(false);

    useEffect(() => {
        if (gameOver && !savedRef.current) {
            savedRef.current = true;
            try {
                const storageKey = 'reversi_pop_stats';
                const stored = localStorage.getItem(storageKey);
                
                let stats: AppStats = JSON.parse(JSON.stringify(INITIAL_STATS));

                if (stored) {
                    const parsed = JSON.parse(stored);
                    
                    // Restore Total Points
                    stats.points = parsed.points || 0;
                    
                    // Restore level stats that exist in current version
                    ([1, 2, 3, 4, 5] as Level[]).forEach(l => {
                        if (parsed.levels && parsed.levels[l]) {
                            stats.levels[l] = parsed.levels[l];
                        }
                    });

                    // Re-calculate totals based on active levels only
                    Object.values(stats.levels).forEach((lvlStats: any) => {
                        stats.total.win += lvlStats.win || 0;
                        stats.total.loss += lvlStats.loss || 0;
                        stats.total.draw += lvlStats.draw || 0;
                    });
                }

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
                const discCount = scores.black; // Player's discs

                if (isWin) {
                    pointsEarned = discCount * WIN_MULTIPLIERS[level];
                } else {
                    // Loss or Draw: 1x multiplier
                    pointsEarned = discCount * 1;
                }

                stats.points += pointsEarned;
                
                localStorage.setItem(storageKey, JSON.stringify(stats));
                console.log(`Game Saved: Earned ${pointsEarned} pts. Total: ${stats.points}`);

            } catch (e) {
                console.error("Failed to save stats", e);
            }
        } else if (!gameOver) {
            savedRef.current = false;
        }
    }, [gameOver, level, scores]);
};