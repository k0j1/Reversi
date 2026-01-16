
import { Board, Cell, BLACK, WHITE } from '../types';
import { BOARD_SIZE } from '../gameLogic';

// 盤面の重み付け評価テーブル
export const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
];

export const evaluateBoard = (board: Board, player: Cell): number => {
  const opponent = player === BLACK ? WHITE : BLACK;
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === player) {
        score += WEIGHTS[r][c];
      } else if (cell === opponent) {
        score -= WEIGHTS[r][c];
      }
    }
  }
  return score;
};
