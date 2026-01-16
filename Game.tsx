
import { Level } from './types';
import { useGameLogic } from './hooks/useGameLogic';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { Toast } from './components/Toast';

export const Game = ({ level, onExit }: { level: Level, onExit: () => void }) => {
  const {
    board,
    turn,
    gameOver,
    scores,
    validMoves,
    aiThinking,
    lastMove,
    toast,
    handleCellClick
  } = useGameLogic(level);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4 w-full max-w-2xl animate-fade-in relative">
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <ScoreBoard 
            scores={scores} 
            turn={turn} 
            gameOver={gameOver} 
            level={level} 
        />

        <Board 
            board={board}
            validMoves={validMoves}
            lastMove={lastMove}
            onCellClick={handleCellClick}
            turn={turn}
            gameOver={gameOver}
            aiThinking={aiThinking}
        />

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
