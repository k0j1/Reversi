
import { Level, FarcasterUser } from '../../types';
import { ClaimBonus } from './ClaimBonus';

type GameMenuProps = {
    level: Level;
    setLevel: (l: Level) => void;
    onStart: () => void;
    user?: FarcasterUser;
};

export const GameMenu = ({ level, setLevel, onStart, user }: GameMenuProps) => {
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
  
    const getLevelColor = (l: number) => {
        switch(l) {
            case 1: return 'bg-green-100 text-green-600 border-green-200';
            case 2: return 'bg-teal-100 text-teal-600 border-teal-200';
            case 3: return 'bg-yellow-100 text-yellow-600 border-yellow-200';
            case 4: return 'bg-orange-100 text-orange-600 border-orange-200';
            case 5: return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full bg-white p-6 pb-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] space-y-6 border-2 border-slate-100 animate-fade-in">
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xl font-bold text-slate-700">AI Strength</label>
                        <span className={`text-lg font-bold px-4 py-1 rounded-full border-2 ${getLevelColor(level)}`}>
                            {getLevelLabel(level)}
                        </span>
                    </div>
                    
                    <div className="relative pt-2 pb-6">
                        <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            step="1"
                            value={level} 
                            onChange={(e) => setLevel(Number(e.target.value) as Level)}
                            className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 focus:outline-none"
                            style={{
                                background: `linear-gradient(to right, 
                                    #fb923c 0%, 
                                    #fb923c ${(level - 1) * 25}%, 
                                    #e2e8f0 ${(level - 1) * 25}%, 
                                    #e2e8f0 100%)`
                            }}
                        />
                        <div className="flex justify-between text-xs text-slate-400 font-bold mt-3 px-1">
                            <span>Beg</span>
                            <span>Easy</span>
                            <span>Norm</span>
                            <span>Hard</span>
                            <span>Exp</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onStart}
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold text-2xl py-5 px-6 rounded-2xl transition-all shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] flex items-center justify-center gap-3"
                >
                    <span>Play Now</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Login Bonus Button */}
            <ClaimBonus user={user} />

            <div className="w-full animate-fade-in flex flex-col items-start gap-3 px-2">
                <span className="w-full text-left text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Other Apps</span>
                
                <div className="flex justify-start gap-4">
                    <a 
                        href="https://farcaster.xyz/miniapps/3Si5HSEtMpTX/running-chihuahua" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative block w-16 h-16 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 ring-4 ring-white"
                    >
                        <img 
                            src="https://runningchihuahuaai.k0j1.v2002.coreserver.jp/images/icon.png" 
                            alt="Running Chihuahua" 
                            className="w-full h-full object-cover"
                        />
                    </a>
                </div>
            </div>
        </div>
    );
};
