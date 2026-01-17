import { Level, FarcasterUser } from './types';
import { useGameLogic } from './hooks/useGameLogic';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { Toast } from './components/Toast';

const WIN_MULTIPLIERS: Record<Level, number> = {
    1: 2,
    2: 4,
    3: 6,
    4: 9,
    5: 12
};

export const Game = ({ level, onExit, user }: { level: Level, onExit: () => void, user?: FarcasterUser }) => {
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

  // Calculate result details for display
  const isWin = scores.black > scores.white;
  const isDraw = scores.black === scores.white;
  const multiplier = isWin ? WIN_MULTIPLIERS[level] : 1;
  const points = scores.black * multiplier;

  const getLevelLabel = (l: number) => {
    switch(l) {
        case 1: return 'Beginner';
        case 2: return 'Easy';
        case 3: return 'Normal';
        case 4: return 'Hard';
        case 5: return 'Expert';
        default: return 'Normal';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4 w-full max-w-2xl animate-fade-in relative">
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <ScoreBoard 
            scores={scores} 
            turn={turn} 
            gameOver={gameOver} 
            level={level}
            user={user}
        />

        <div className="relative w-full">
            <Board 
                board={board}
                validMoves={validMoves}
                lastMove={lastMove}
                onCellClick={handleCellClick}
                turn={turn}
                gameOver={gameOver}
                aiThinking={aiThinking}
            />

            {/* Result Overlay */}
            {gameOver && (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-[2rem]"></div>
                    <div className="bg-white w-full max-w-xs p-6 rounded-3xl shadow-2xl relative z-50 animate-bounce-in flex flex-col items-center gap-4 border-4 border-slate-100">
                        
                        <div className="text-center">
                            <h2 className={`text-3xl font-black mb-1 ${isWin ? 'text-green-500' : isDraw ? 'text-slate-500' : 'text-orange-500'}`}>
                                {isWin ? "YOU WIN!" : isDraw ? "DRAW" : "YOU LOSE"}
                            </h2>
                            <p className="text-slate-400 font-bold text-sm">Game Finished</p>
                        </div>

                        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-slate-600 font-bold">
                                <span>Discs Left</span>
                                <span className="text-xl">{scores.black}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 font-bold text-sm">
                                <span>Multiplier ({getLevelLabel(level)})</span>
                                <span>× {multiplier}</span>
                            </div>
                            <div className="h-px bg-slate-200 w-full"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-bold">Points</span>
                                <span className="text-3xl font-black text-orange-500">+{points}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onExit}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            Back to Title
                        </button>
                    </div>
                </div>
            )}
        </div>

        {!gameOver && (
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
        )}
    </div>
  );
};