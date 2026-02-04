
import { AppStats, Level, LevelStats } from './types';

export const WIN_MULTIPLIERS: Record<Level, number> = {
    1: 2,  // Beginner
    2: 4,  // Easy
    3: 6,  // Normal
    4: 9,  // Hard
    5: 12  // Expert
};

export const INITIAL_LEVEL_STATS: LevelStats = { win: 0, loss: 0, draw: 0 };

export const INITIAL_STATS: AppStats = {
    levels: {
        1: { ...INITIAL_LEVEL_STATS },
        2: { ...INITIAL_LEVEL_STATS },
        3: { ...INITIAL_LEVEL_STATS },
        4: { ...INITIAL_LEVEL_STATS },
        5: { ...INITIAL_LEVEL_STATS },
    },
    total: { ...INITIAL_LEVEL_STATS },
    points: 0,
    claimedScore: 0
};
