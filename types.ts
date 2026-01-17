
export const EMPTY = 0;
export const BLACK = 1; // Player (先行)
export const WHITE = 2; // AI (後攻)

export type Cell = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Board = Cell[][];
// Change back to 5 levels
export type Level = 1 | 2 | 3 | 4 | 5;

export type LevelStats = {
    win: number;
    loss: number;
    draw: number;
};

export type AppStats = {
    levels: Record<Level, LevelStats>;
    total: LevelStats;
    points: number;
};

export type FarcasterUser = {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    custodyAddress?: string;
    verifiedAddresses?: string[];
};
