
import { BLACK, WHITE, Level, FarcasterUser } from '../types';

type ScoreBoardProps = {
  scores: { black: number, white: number };
  turn: number;
  gameOver: boolean;
  level: Level;
  user?: FarcasterUser;
};

export const ScoreBoard = ({ scores, turn, gameOver, level, user }: ScoreBoardProps) => {
  return (
    <div className="flex flex-col items-center gap-2 text-center w-full">
        <div className="flex gap-2 sm:gap-4 items-center bg-white p-2 sm:p-2 pr-4 pl-4 sm:pr-6 sm:pl-6 rounded-[2rem] shadow-sm border border-slate-200">
            {/* Player Score */}
            <div className={`flex flex-col items-center transition-all duration-300 ${turn === BLACK ? 'scale-110 opacity-100' : 'opacity-60 scale-95'}`}>
                <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 shadow-md border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                        {user?.pfpUrl ? (
                            <img src={user.pfpUrl} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-lg">{scores.black}</span>
                        )}
                        {/* Overlay score on top of image if image exists */}
                        {user?.pfpUrl && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{scores.black}</span>
                            </div>
                        )}
                    </div>
                    {turn === BLACK && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>}
                </div>
                <span className="text-xs font-bold text-slate-500 mt-1 max-w-[60px] truncate">
                    {user?.displayName || user?.username || "YOU"}
                </span>
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
  );
};
