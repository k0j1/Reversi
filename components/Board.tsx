
import { Board as BoardType, Cell, EMPTY, WHITE, BLACK } from '../types';

type BoardProps = {
  board: BoardType;
  validMoves: { r: number, c: number }[];
  lastMove: { r: number, c: number } | null;
  onCellClick: (r: number, c: number) => void;
  turn: Cell;
  gameOver: boolean;
  aiThinking: boolean;
};

export const Board = ({ board, validMoves, lastMove, onCellClick, turn, gameOver, aiThinking }: BoardProps) => {
  return (
    <div className="relative group w-full px-0.5 sm:px-0">
        <div className="bg-orange-100 p-1.5 sm:p-3 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border-b-4 sm:border-b-8 border-orange-200">
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
                    onClick={() => !aiThinking && onCellClick(r, c)}
                    >
                    {isValid && (
                        <div className="absolute w-3 h-3 rounded-full bg-black/10 animate-pulse"></div>
                    )}
                    
                    {isLastMove && cell !== EMPTY && (
                        <div className="absolute w-2 h-2 bg-red-400 rounded-full z-20 top-1 right-1 shadow-sm ring-1 ring-white"></div>
                    )}

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
  );
};
