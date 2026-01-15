
import { useState, useEffect } from 'react';
import { Level, AppStats, LevelStats } from './types';

export const TitleScreen = ({ level, setLevel, onStart }: { level: Level, setLevel: (l: Level) => void, onStart: () => void }) => {
  const [activeTab, setActiveTab] = useState<'GAME' | 'STATS'>('GAME');
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    if (activeTab === 'STATS') {
        try {
            const data = localStorage.getItem('reversi_pop_stats');
            if (data) {
                setStats(JSON.parse(data));
            } else {
                // Initialize if empty
                setStats({
                    1: { win: 0, loss: 0, draw: 0 },
                    2: { win: 0, loss: 0, draw: 0 },
                    3: { win: 0, loss: 0, draw: 0 },
                    4: { win: 0, loss: 0, draw: 0 },
                    5: { win: 0, loss: 0, draw: 0 },
                });
            }
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    }
  }, [activeTab]);

  const renderGameContent = () => (
    <div className="w-full bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] space-y-8 border-2 border-slate-100 animate-fade-in">
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-xl font-bold text-slate-700">AI Level</label>
                <span className={`text-lg font-bold px-4 py-1 rounded-full border-2 
                    ${level === 1 ? 'bg-green-100 text-green-600 border-green-200' : 
                      level === 2 ? 'bg-sky-100 text-sky-600 border-sky-200' :
                      level === 3 ? 'bg-yellow-100 text-yellow-600 border-yellow-200' :
                      level === 4 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                      'bg-red-100 text-red-600 border-red-200'}`}>
                    Lv. {level}
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
                            ${level >= 1 ? '#fb923c' : '#e2e8f0'} 0%, 
                            ${level >= 2 ? '#fb923c' : '#e2e8f0'} 25%, 
                            ${level >= 3 ? '#fb923c' : '#e2e8f0'} 50%, 
                            ${level >= 4 ? '#fb923c' : '#e2e8f0'} 75%, 
                            ${level >= 5 ? '#fb923c' : '#e2e8f0'} 100%)`
                    }}
                />
                <div className="flex justify-between text-xs text-slate-400 font-bold mt-3 px-1">
                    <span>Beginner</span>
                    <span>Normal</span>
                    <span>Hard</span>
                    <span>Very Hard</span>
                    <span>Master</span>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <p className="text-slate-600 font-medium">
                    {level === 1 && "Random moves. Great for learning!"}
                    {level === 2 && "Thinks 1 step ahead. A fair challenge."}
                    {level === 3 && "Thinks 2 steps ahead. Getting serious."}
                    {level === 4 && "Thinks 3 steps ahead. Pro level."}
                    {level === 5 && "Deep search strategy. Good luck!"}
                </p>
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
  );

  const renderStatsContent = () => (
    <div className="w-full space-y-4 animate-fade-in pb-20">
        <h2 className="text-2xl font-bold text-slate-700 text-center mb-6">Your Records</h2>
        {stats && (Object.entries(stats) as [string, LevelStats][]).map(([lvl, data]) => {
            const total = data.win + data.loss + data.draw;
            const winRate = total > 0 ? Math.round((data.win / total) * 100) : 0;
            const l = Number(lvl) as Level;
            
            const colorClass = 
                l === 1 ? 'text-green-500 bg-green-50 border-green-200' :
                l === 2 ? 'text-sky-500 bg-sky-50 border-sky-200' :
                l === 3 ? 'text-yellow-500 bg-yellow-50 border-yellow-200' :
                l === 4 ? 'text-orange-500 bg-orange-50 border-orange-200' :
                'text-red-500 bg-red-50 border-red-200';

            return (
                <div key={lvl} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className={`font-bold px-3 py-1 rounded-full text-sm border ${colorClass}`}>
                            Level {lvl}
                        </span>
                        <span className="text-slate-400 text-xs font-bold">Total Games: {total}</span>
                    </div>
                    
                    {total === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-2">No games played yet.</div>
                    ) : (
                        <>
                            <div className="flex justify-between text-sm font-bold text-slate-600 px-1">
                                <span className="text-green-600">Wins: {data.win}</span>
                                <span className="text-slate-400">Draws: {data.draw}</span>
                                <span className="text-orange-600">Losses: {data.loss}</span>
                            </div>
                            
                            {/* Win Rate Bar */}
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                <div style={{ width: `${(data.win / total) * 100}%` }} className="h-full bg-green-500"></div>
                                <div style={{ width: `${(data.draw / total) * 100}%` }} className="h-full bg-slate-300"></div>
                                <div style={{ width: `${(data.loss / total) * 100}%` }} className="h-full bg-orange-500"></div>
                            </div>
                            <div className="text-right text-xs font-bold text-slate-400">
                                Win Rate: {winRate}%
                            </div>
                        </>
                    )}
                </div>
            );
        })}
        
        <button 
            onClick={() => {
                if(confirm("Are you sure you want to reset all records?")) {
                    localStorage.removeItem('reversi_pop_stats');
                    setStats({
                        1: { win: 0, loss: 0, draw: 0 },
                        2: { win: 0, loss: 0, draw: 0 },
                        3: { win: 0, loss: 0, draw: 0 },
                        4: { win: 0, loss: 0, draw: 0 },
                        5: { win: 0, loss: 0, draw: 0 },
                    });
                }
            }}
            className="w-full mt-4 py-2 text-slate-400 text-sm font-bold hover:text-red-500 transition-colors"
        >
            Reset Records
        </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full relative">
        <div className="flex-1 overflow-y-auto w-full">
            <div className="flex flex-col items-center justify-center min-h-full p-4 w-full max-w-md mx-auto space-y-8 animate-fade-in relative z-10 pb-24">
                {/* Decorative Circles */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-50 -z-10"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-300 rounded-full blur-3xl opacity-50 -z-10"></div>

                <div className="text-center space-y-4 animate-float mt-8">
                    <div className="inline-block p-6 rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-b-8 border-slate-100 transform rotate-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="w-10 h-10 rounded-full bg-slate-800 shadow-md"></div>
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-md"></div>
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-md"></div>
                            <div className="w-10 h-10 rounded-full bg-slate-800 shadow-md"></div>
                        </div>
                    </div>
                    <h1 className="text-7xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                        <span className="text-orange-500">R</span>
                        <span className="text-yellow-500">e</span>
                        <span className="text-green-500">v</span>
                        <span className="text-sky-500">e</span>
                        <span className="text-purple-500">r</span>
                        <span className="text-pink-500">s</span>
                        <span className="text-red-500">i</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-lg">Can you beat the AI?</p>
                </div>

                {activeTab === 'GAME' ? renderGameContent() : renderStatsContent()}
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-md mx-auto flex justify-around p-2">
                <button 
                    onClick={() => setActiveTab('GAME')}
                    className={`flex flex-col items-center p-3 rounded-2xl w-full transition-all duration-200 ${activeTab === 'GAME' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    <span className="text-xs font-bold">Game</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('STATS')}
                    className={`flex flex-col items-center p-3 rounded-2xl w-full transition-all duration-200 ${activeTab === 'STATS' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="text-xs font-bold">Stats</span>
                </button>
            </div>
        </div>
    </div>
  );
};
