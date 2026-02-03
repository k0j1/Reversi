
import { Level, FarcasterUser, BLACK, WHITE } from './types';
import { useGameLogic } from './hooks/useGameLogic';
import { Board } from './components/Board';
import { ScoreBoard } from './components/ScoreBoard';
import { Toast } from './components/Toast';
import { WIN_MULTIPLIERS } from './constants';
import sdk from '@farcaster/frame-sdk';

type GameProps = {
    level: Level;
    onExit: () => void;
    user?: FarcasterUser;
    connectedAddress: string | null;
    onError: (error: any) => void;
};

export const Game = ({ level, onExit, user, connectedAddress, onError }: GameProps) => {
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
  } = useGameLogic(level, onError, user, connectedAddress);

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

  const handleShare = () => {
    // Generate Emoji Grid
    const emojiBoard = board.map(row => 
        row.map(cell => {
            if (cell === BLACK) return '⚫';
            if (cell === WHITE) return '⚪';
            return '🟩'; 
        }).join('')
    ).join('\n');

    // Construct Text
    const resultTitle = isWin ? "🏆 VICTORY!" : isDraw ? "🤝 DRAW" : "💀 DEFEAT";
    const text = `${resultTitle}\nReversi Pop (Lv.${level})\nScore: ${scores.black} - ${scores.white}\n\n${emojiBoard}\n`;

    // Current URL for embed
    const embedUrl = window.location.href;

    // Warpcast Compose URL
    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`;

    sdk.actions.openUrl(shareUrl);
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

                        <div className="w-full space-y-2">
                            {/* Share Button */}
                            <button 
                                onClick={handleShare}
                                className="w-full bg-[#855DCD] hover:bg-[#734eb8] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                Share on Warpcast
                            </button>

                            <button 
                                onClick={onExit}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                Back to Title
                            </button>
                        </div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Title
                </button>
            </div>
        )}
    </div>
  );
};
