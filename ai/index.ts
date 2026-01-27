
import { Board, Cell, Level } from '../types';
import { searchBestMove } from './minimax';

/**
 * Returns the best move for the AI based on the selected difficulty level.
 */
export const getBestMove = (board: Board, player: Cell, level: Level): { r: number, c: number } | null => {
  // Level 1 (Beginner): Depth 1
  // Level 2 (Easy): Depth 2
  // Level 3 (Normal): Depth 3
  // Level 4 (Hard): Depth 4
  // Level 5 (Expert): Depth 5
  
  let depth = 3;
  switch (level) {
      case 1: depth = 1; break;
      case 2: depth = 2; break;
      case 3: depth = 3; break;
      case 4: depth = 4; break;
      case 5: depth = 5; break;
      default: depth = 3;
  }
  
  return searchBestMove(board, player, depth);
};