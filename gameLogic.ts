
import { EMPTY, BLACK, WHITE, Cell, Board } from './types';

export const BOARD_SIZE = 8;

export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export const createInitialBoard = (): Board => {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = WHITE;
  board[mid][mid] = WHITE;
  board[mid - 1][mid] = BLACK;
  board[mid][mid - 1] = BLACK;
  return board;
};

export const isValidPos = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

export const getFlips = (board: Board, row: number, col: number, player: Cell): { r: number, c: number }[] => {
  if (board[row][col] !== EMPTY) return [];

  const opponent = player === BLACK ? WHITE : BLACK;
  const flips: { r: number, c: number }[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const potentialFlips: { r: number, c: number }[] = [];

    while (isValidPos(r, c) && board[r][c] === opponent) {
      potentialFlips.push({ r, c });
      r += dr;
      c += dc;
    }

    if (isValidPos(r, c) && board[r][c] === player) {
      flips.push(...potentialFlips);
    }
  }
  return flips;
};

export const getValidMoves = (board: Board, player: Cell): { r: number, c: number }[] => {
  const moves: { r: number, c: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getFlips(board, r, c, player).length > 0) {
        moves.push({ r, c });
      }
    }
  }
  return moves;
};

export const applyMove = (board: Board, r: number, c: number, player: Cell): Board => {
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = player;
  const flips = getFlips(board, r, c, player);
  flips.forEach(f => {
    newBoard[f.r][f.c] = player;
  });
  return newBoard;
};

export const countDiscs = (board: Board) => {
  let black = 0;
  let white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
};
