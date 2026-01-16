
import { useEffect, useRef } from 'react';
import { AppStats, Level } from '../types';

export const useGameStats = (gameOver: boolean, level: Level, scores: { black: number, white: number }) => {
    const savedRef = useRef(false);

    useEffect(() => {
        if (gameOver && !savedRef.current) {
            savedRef.current = true;
            try {
                const storageKey = 'reversi_pop_stats';
                const stored = localStorage.getItem(storageKey);
                const stats: AppStats = stored ? JSON.parse(stored) : {
                    1: { win: 0, loss: 0, draw: 0 },
                    2: { win: 0, loss: 0, draw: 0 },
                    3: { win: 0, loss: 0, draw: 0 },
                    4: { win: 0, loss: 0, draw: 0 },
                    5: { win: 0, loss: 0, draw: 0 },
                };
                
                if (!stats[level]) stats[level] = { win: 0, loss: 0, draw: 0 };

                if (scores.black > scores.white) {
                    stats[level].win += 1;
                } else if (scores.black < scores.white) {
                    stats[level].loss += 1;
                } else {
                    stats[level].draw += 1;
                }
                
                localStorage.setItem(storageKey, JSON.stringify(stats));
            } catch (e) {
                console.error("Failed to save stats", e);
            }
        } else if (!gameOver) {
            savedRef.current = false;
        }
    }, [gameOver, level, scores]);
};
