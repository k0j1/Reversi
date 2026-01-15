
import { useState, useEffect, useRef } from 'react';
import { Level, Cell, Board, BLACK, WHITE, EMPTY, AppStats } from './types';

// --- Constants ---
const BOARD_SIZE = 8;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// 盤面の重み付け評価テーブル
const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
];

// --- Game Logic Helpers ---

const createInitialBoard = (): Board => {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = WHITE;
  board[mid][mid] = WHITE;
  board[mid - 1][mid] = BLACK;
  board[mid][mid - 1] = BLACK;
  return board;
};

const isValidPos = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

const getFlips = (board: Board, row: number, col: number, player: Cell): { r: number, c: number }[] => {
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

const getValidMoves = (board: Board, player: Cell): { r: number, c: number }[] => {
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

const applyMove = (board: Board, r: number, c: number, player: Cell): Board => {
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = player;
  const flips = getFlips(board, r, c, player);
  flips.forEach(f => {
    newBoard[f.r][f.c] = player;
  });
  return newBoard;
};

const countDiscs = (board: Board) => {
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

// --- AI Evaluation & Search ---

const evaluateBoard = (board: Board, player: Cell): number => {
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

const alphaBeta = (
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

const getBestMove = (board: Board, player: Cell, level: number): { r: number, c: number } | null => {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;

  // Level 1: Random (Beginner)
  if (level === 1) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Level 2: Greedy (Normal) - 1手読み、最良の手を選ぶ
  if (level === 2) {
    moves.sort((a, b) => WEIGHTS[b.r][b.c] - WEIGHTS[a.r][a.c]);
    // 上位3つの候補からランダムに選ぶことで少し人間味を出す
    const topMoves = moves.slice(0, Math.min(3, moves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }

  // AI Levels mapping to depth
  let depth = 1;
  if (level === 3) depth = 2; // Hard
  if (level === 4) depth = 3; // Very Hard
  if (level === 5) depth = 5; // Master

  const opponent = player === BLACK ? WHITE : BLACK;
  let bestMove = moves[0];
  let maxEval = -Infinity;

  moves.sort((a, b) => WEIGHTS[b.r][b.c] - WEIGHTS[a.r][a.c]);

  for (const move of moves) {
    const newBoard = applyMove(board, move.r, move.c, player);
    const evalScore = alphaBeta(newBoard, depth - 1, -Infinity, Infinity, false, player, opponent);
    
    if (evalScore > maxEval) {
      maxEval = evalScore;
      bestMove = move;
    } else if (evalScore === maxEval && Math.random() > 0.7) {
        bestMove = move;
    }
  }

  return bestMove;
};

// --- Component ---

export const Game = ({ level, onExit }: { level: Level, onExit: () => void }) => {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [turn, setTurn] = useState<Cell>(BLACK); 
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ black: 2, white: 2 });
  const [validMoves, setValidMoves] = useState<{ r: number, c: number }[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{r: number, c: number} | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'warn'} | null>(null);
  
  // Use a ref to prevent double saving in strict mode
  const savedRef = useRef(false);

  useEffect(() => {
    const moves = getValidMoves(board, turn);
    setValidMoves(moves);
    const { black, white } = countDiscs(board);
    setScores({ black, white });

    if (moves.length === 0) {
      const opponent = turn === BLACK ? WHITE : BLACK;
      const opponentMoves = getValidMoves(board, opponent);
      
      if (opponentMoves.length === 0) {
        setGameOver(true);
        const result = black > white ? "You Win! 🎉" : black < white ? "AI Wins 🤖" : "Draw! 🤝";
        setToast({ msg: result, type: 'info' });
      } else {
        const message = `${turn === BLACK ? "You have no moves!" : "AI has no moves!"}`;
        setToast({ msg: message + " Passing...", type: 'warn' });
        
        const timer = setTimeout(() => {
           setTurn(opponent);
           setToast(null);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [board, turn]);

  // Save Stats Effect
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
              
              // Ensure the level key exists
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
      }
  }, [gameOver, level, scores]);

  useEffect(() => {
    if (turn === WHITE && !gameOver) {
      const aiMoves = getValidMoves(board, WHITE);
      if (aiMoves.length > 0) {
        setAiThinking(true);
        const timer = setTimeout(() => {
          const move = getBestMove(board, WHITE, level);
          if (move) {
            executeMove(move.r, move.c);
          }
          setAiThinking(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, gameOver, board, level]);

  const executeMove = (r: number, c: number) => {
    const newBoard = applyMove(board, r, c, turn);
    setBoard(newBoard);
    setLastMove({ r, c });
    setTurn(turn === BLACK ? WHITE : BLACK);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || turn !== BLACK || aiThinking) return;
    const isValid = validMoves.some(m => m.r === r && m.c === c);
    if (isValid) {
      executeMove(r, c);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4 w-full max-w-2xl animate-fade-in relative">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce pointer-events-none w-[90%] max-w-sm flex justify-center">
            <div className={`
              w-full px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-4 font-bold text-lg flex items-center justify-center gap-3 text-center
              ${toast.type === 'warn' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-green-500 text-green-600'}
            `}>
              {toast.type === 'warn' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
              ) : (
                <span className="text-2xl flex-shrink-0">🏆</span>
              )}
              {toast.msg}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 text-center w-full">
            <div className="flex gap-2 sm:gap-4 items-center bg-white p-2 sm:p-2 pr-4 pl-4 sm:pr-6 sm:pl-6 rounded-[2rem] shadow-sm border border-slate-200">
                
                {/* Player Score */}
                <div className={`flex flex-col items-center transition-all duration-300 ${turn === BLACK ? 'scale-110 opacity-100' : 'opacity-60 scale-95'}`}>
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 shadow-md border-2 border-slate-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{scores.black}</span>
                        </div>
                        {turn === BLACK && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-1">YOU</span>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 sm:mx-2"></div>

                {/* Status Text */}
                <div className="w-24 sm:w-32 text-center">
                    <span className={`text-sm font-bold block ${turn === BLACK ? 'text-green-600' : 'text-orange-500'}`}>
                        {gameOver ? "FINISHED" : turn === BLACK ? "YOUR TURN" : "AI THINKING"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Lv.{level} Match</span>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-1 sm:mx-2"></div>

                {/* AI Score */}
                <div className={`flex flex-col items-center transition-all duration-300 ${turn === WHITE ? 'scale-110 opacity-100' : 'opacity-60 scale-95'}`}>
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-md border-2 border-slate-200 flex items-center justify-center">
                            <span className="text-slate-800 font-bold text-lg">{scores.white}</span>
                        </div>
                        {turn === WHITE && <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full animate-pulse"></div>}
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-1">CPU</span>
                </div>
            </div>
        </div>

        {/* Game Board - w-full applied to container, aspect-square on cells */}
        <div className="relative group w-full px-0.5 sm:px-0">
            <div className="bg-orange-100 p-1.5 sm:p-3 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border-b-4 sm:border-b-8 border-orange-200">
                {/* Grid gap creates the lines. Using dark green for lines. */}
                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 bg-green-900 p-0.5 sm:p-2 rounded-[1rem] sm:rounded-[1.5rem] border-2 sm:border-4 border-green-800">
                {board.map((row, r) => (
                    row.map((cell, c) => {
                    const isValid = turn === BLACK && !gameOver && validMoves.some(m => m.r === r && m.c === c);
                    const isLastMove = lastMove?.r === r && lastMove?.c === c;

                    return (
                        <div 
                        key={`${r}-${c}`} 
                        className={`
                            w-full aspect-square
                            rounded-sm sm:rounded-lg relative flex items-center justify-center
                            cursor-pointer select-none cell-perspective
                            transition-all duration-200
                            ${isValid 
                                ? 'bg-green-400 hover:bg-green-300 ring-2 ring-white/30' 
                                : (r+c)%2===0 ? 'bg-green-600' : 'bg-green-500'}
                        `}
                        onClick={() => handleCellClick(r, c)}
                        >
                        {/* Hint dot */}
                        {isValid && (
                            <div className="absolute w-3 h-3 rounded-full bg-black/10 animate-pulse"></div>
                        )}
                        
                        {/* Last move indicator */}
                        {isLastMove && cell !== EMPTY && (
                            <div className="absolute w-2 h-2 bg-red-400 rounded-full z-20 top-1 right-1 shadow-sm ring-1 ring-white"></div>
                        )}

                        {/* Disc */}
                        <div 
                            className={`disc w-[80%] h-[80%] ${cell !== EMPTY ? 'opacity-100' : 'opacity-0'} ${cell === WHITE ? 'flipped' : ''}`}
                        >
                            <div className="disc-front"></div>
                            <div className="disc-back"></div>
                        </div>
                        </div>
                    );
                    })
                ))}
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs">
            <button 
                onClick={onExit}
                className="w-full bg-white hover:bg-slate-50 text-slate-500 font-bold py-3 px-4 rounded-xl transition-all shadow-sm border-2 border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Title
            </button>
        </div>
    </div>
  );
};
