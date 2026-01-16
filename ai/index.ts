
import { Board, Cell, Level } from '../types';
import { getValidMoves } from '../gameLogic';
import { searchBestMove } from './minimax';

// Level 1: Random (Beginner)
const getLevel1Move = (board: Board, player: Cell): { r: number, c: number } | null => {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
};

// Level 2: Depth 1 (Greedy / Novice)
const getLevel2Move = (board: Board, player: Cell): { r: number, c: number } | null => {
  return searchBestMove(board, player, 1);
};

// Level 3: Depth 2 (Normal)
const getLevel3Move = (board: Board, player: Cell): { r: number, c: number } | null => {
  return searchBestMove(board, player, 2);
};

// Level 4: Depth 4 (Strong)
const getLevel4Move = (board: Board, player: Cell): { r: number, c: number } | null => {
  return searchBestMove(board, player, 4);
};

// Level 5: Depth 6 (Master)
const getLevel5Move = (board: Board, player: Cell): { r: number, c: number } | null => {
  return searchBestMove(board, player, 6);
};

/**
 * Returns the best move for the AI based on the selected difficulty level.
 */
export const getBestMove = (board: Board, player: Cell, level: Level): { r: number, c: number } | null => {
  switch (level) {
    case 1: return getLevel1Move(board, player);
    case 2: return getLevel2Move(board, player);
    case 3: return getLevel3Move(board, player);
    case 4: return getLevel4Move(board, player);
    case 5: return getLevel5Move(board, player);
    default: return getLevel3Move(board, player);
  }
};
