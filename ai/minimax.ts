
import { Board, Cell, BLACK, WHITE } from '../types';
import { getValidMoves, applyMove } from '../gameLogic';
import { evaluateBoard, WEIGHTS } from './evaluator';

export const alphaBeta = (
  board: Board, 
  depth: number, 
  alpha: number, 
  beta: number, 
  maximizingPlayer: boolean,
  playerColor: Cell,
  opponentColor: Cell
): number => {
  if (depth === 0) {
    return evaluateBoard(board, playerColor);
  }

  const moves = getValidMoves(board, maximizingPlayer ? playerColor : opponentColor);
  if (moves.length === 0) {
     return evaluateBoard(board, playerColor);
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    // Move ordering optimization
    moves.sort((a, b) => WEIGHTS[b.r][b.c] - WEIGHTS[a.r][a.c]);
    
    for (const move of moves) {
      const newBoard = applyMove(board, move.r, move.c, playerColor);
      const evalScore = alphaBeta(newBoard, depth - 1, alpha, beta, false, playerColor, opponentColor);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    moves.sort((a, b) => WEIGHTS[b.r][b.c] - WEIGHTS[a.r][a.c]);
    
    for (const move of moves) {
      const newBoard = applyMove(board, move.r, move.c, opponentColor);
      const evalScore = alphaBeta(newBoard, depth - 1, alpha, beta, true, playerColor, opponentColor);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

/**
 * Searches for the best move with a given depth.
 */
export const searchBestMove = (board: Board, player: Cell, depth: number): { r: number, c: number } | null => {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;

  const opponent = player === BLACK ? WHITE : BLACK;
  let bestMove = moves[0];
  let maxEval = -Infinity;

  // Initial move sorting
  moves.sort((a, b) => WEIGHTS[b.r][b.c] - WEIGHTS[a.r][a.c]);

  for (const move of moves) {
    const newBoard = applyMove(board, move.r, move.c, player);
    const evalScore = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, false, player, opponent);
    
    // Add a tiny bit of randomness for equal scores to avoid robotic identical games
    if (evalScore > maxEval) {
      maxEval = evalScore;
      bestMove = move;
    } else if (evalScore === maxEval && Math.random() > 0.7) {
        bestMove = move;
    }
  }

  return bestMove;
};
