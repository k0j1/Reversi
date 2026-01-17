
import { Board, Cell, Level } from '../types';
import { searchBestMove } from './minimax';

/**
 * Returns the best move for the AI based on the selected difficulty level.
 */
export const getBestMove = (board: Board, player: Cell, level: Level): { r: number, c: number } | null => {
  // Level 1: Depth 1 (Fastest/Weakest)
  // Level 2: Depth 2
  // Level 3: Depth 3 (Normal)
  // Level 4: Depth 4
  // Level 5: Depth 5 (Strongest)
  
  let depth = 1;
  switch (level) {
      case 1: depth = 1; break;
      case 2: depth = 2; break;
      case 3: depth = 3; break;
      case 4: depth = 4; break;
      case 5: depth = 5; break;
      default: depth = 3;
  }
  
  // If Level 1 is too strong with depth 1 minimax (which uses positional weights), 
  // we could introduce randomness or use a simpler evaluator. 
  // For now, depth 1 is a good "Easy" baseline that doesn't make completely random/stupid moves.
  
  return searchBestMove(board, player, depth);
};
