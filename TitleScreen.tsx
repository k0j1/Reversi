
import { useState, useEffect } from 'react';
import { Level, AppStats, LevelStats, FarcasterUser } from './types';

const INITIAL_LEVEL_STATS: LevelStats = { win: 0, loss: 0, draw: 0 };
const INITIAL_STATS: AppStats = {
    levels: {
        1: { ...INITIAL_LEVEL_STATS },
        2: { ...INITIAL_LEVEL_STATS },
        3: { ...INITIAL_LEVEL_STATS },
        4: { ...INITIAL_LEVEL_STATS },
        5: { ...INITIAL_LEVEL_STATS },
    },
    total: { ...INITIAL_LEVEL_STATS },
    points: 0
};

export const TitleScreen = ({ level, setLevel, onStart, user }: { level: Level, setLevel: (l: Level) => void, onStart: () => void, user?: FarcasterUser }) => {
  const [activeTab, setActiveTab] = useState<'GAME' | 'STATS'>('GAME');
  const [stats, setStats] = useState<AppStats | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (activeTab === 'STATS') {
        try {
            const data = localStorage.getItem('reversi_pop_stats');
            if (data) {
                const parsed = JSON.parse(data);
                let loadedStats: AppStats = JSON.parse(JSON.stringify(INITIAL_STATS));
                
                if (parsed.levels) {
                    // Load intersecting levels
                    ([1, 2, 3, 4, 5] as Level[]).forEach(l => {
                        if (parsed.levels[l]) loadedStats.levels[l] = parsed.levels[l];
                    });
                    // Recalculate total
                    loadedStats.total = { win: 0, loss: 0, draw: 0 };
                    Object.values(loadedStats.levels).forEach((lvlStats: any) => {
                        loadedStats.total.win += lvlStats.win || 0;
                        loadedStats.total.loss += lvlStats.loss || 0;
                        loadedStats.total.draw += lvlStats.draw || 0;
                    });
                    loadedStats.points = parsed.points || 0;
                }
                setStats(loadedStats);
            } else {
                setStats(INITIAL_STATS);
            }
        } catch (e) {
            console.error("Failed to load stats", e);
            setStats(INITIAL_STATS);
        }
    }
  }, [activeTab]);

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

  const renderProfileButton = () => {
    if (!user) return null;
    return (
      <button
        onClick={() => setShowProfile(true)}
        className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 pr-3 rounded-full shadow-sm border border-slate-200 hover:bg-white transition-all active:scale-95"
      >
        {user.pfpUrl ? (
            <img src={user.pfpUrl} alt={user.username} className="w-8 h-8 rounded-full border border-slate-200" />
        ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm">👤</span>
            </div>
        )}
        <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
            {user.displayName || user.username}
        </span>
      </button>
    );
  };

  const renderProfileModal = () => {
    if (!showProfile || !user) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProfile(false)}></div>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 flex flex-col gap-6 animate-bounce-in max-h-[85vh] overflow-y-auto border-4 border-slate-100">
                <button
                    onClick={() => setShowProfile(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                
                {/* User Info Header */}
                <div className="flex flex-col items-center gap-2 pt-2">
                    {user.pfpUrl ? (
                        <img src={user.pfpUrl} alt={user.username} className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 object-cover" />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center text-4xl">👤</div>
                    )}
                    <div className="text-center">
                        <h3 className="text-xl font-black text-slate-800">{user.displayName}</h3>
                        <p className="text-slate-500 font-bold">@{user.username}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full border border-slate-200">FID: {user.fid}</span>
                    </div>
                </div>

                {/* Wallets Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 000-2z" clipRule="evenodd" />
                        </svg>
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">Wallet Information</h4>
                    </div>
                    
                    {/* Custody Address */}
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 pl-1">Custody Address</span>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 break-all text-xs font-mono text-slate-600 select-all hover:bg-slate-100 transition-colors">
                            {user.custodyAddress || "Not available"}
                        </div>
                    </div>

                    {/* Verified Addresses */}
                     <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 pl-1">Verified Addresses</span>
                        {user.verifiedAddresses && user.verifiedAddresses.length > 0 ? (
                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {user.verifiedAddresses.map((addr, i) => (
                                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 break-all text-xs font-mono text-slate-600 select-all hover:bg-slate-100 transition-colors">
                                        {addr}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic pl-1">No verified addresses linked.</div>
                        )}
                    </div>
                </div>
                
                <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-auto">
                    Connected via Farcaster
                </div>
            </div>
        </div>
    );
  };

  const renderGameContent = () => (
    <div className="w-full bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] space-y-8 border-2 border-slate-100 animate-fade-in">
        
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-xl font-bold text-slate-700">AI Strength</label>
                <span className={`text-lg font-bold px-4 py-1 rounded-full border-2 ${getLevelColor(level)}`}>
                    {getLevelLabel(level)}
                </span>
            </div>
            
            <div className="relative pt-2 pb-8">
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
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
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
  );

  const renderOtherApps = () => (
     <div className="w-full animate-fade-in flex flex-col items-center gap-4 px-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Other Apps</span>
        <a 
            href="https://farcaster.xyz/miniapps/7RH3c4fEALgF/runningchihuahua" 
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
  );

  const renderStatsContent = () => (
    <div className="w-full space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-700 text-center mb-4">Your Records</h2>
        
        {stats && (
            <>
                {/* Total Score & Points Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-[2rem] shadow-lg text-white mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <span className="text-slate-300 text-sm font-bold uppercase tracking-wider">Total Points</span>
                        <span className="text-5xl font-black text-yellow-400 drop-shadow-md">{stats.points.toLocaleString()}</span>
                        <div className="h-px w-full bg-white/10 my-2"></div>
                        <div className="flex justify-between w-full px-4 text-sm font-bold">
                            <div className="flex flex-col items-center">
                                <span className="text-green-400 text-lg">{stats.total.win}</span>
                                <span className="text-slate-400 text-xs">Wins</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-white text-lg">{stats.total.draw}</span>
                                <span className="text-slate-400 text-xs">Draws</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-orange-400 text-lg">{stats.total.loss}</span>
                                <span className="text-slate-400 text-xs">Losses</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Breakdown */}
                <h3 className="text-lg font-bold text-slate-500 px-2">Level Breakdown</h3>
                {([1, 2, 3, 4, 5] as Level[]).map((lvl) => {
                    const data = stats.levels[lvl] || { win: 0, loss: 0, draw: 0 };
                    const total = data.win + data.loss + data.draw;
                    const winRate = total > 0 ? Math.round((data.win / total) * 100) : 0;
                    
                    let colorClass = '';
                    switch(lvl) {
                        case 1: colorClass = 'text-green-500 bg-green-50 border-green-200'; break;
                        case 2: colorClass = 'text-teal-500 bg-teal-50 border-teal-200'; break;
                        case 3: colorClass = 'text-yellow-500 bg-yellow-50 border-yellow-200'; break;
                        case 4: colorClass = 'text-orange-500 bg-orange-50 border-orange-200'; break;
                        case 5: colorClass = 'text-red-500 bg-red-50 border-red-200'; break;
                    }
                    
                    return (
                        <div key={lvl} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className={`font-bold px-3 py-1 rounded-full text-sm border ${colorClass}`}>
                                    {getLevelLabel(lvl)}
                                </span>
                                <span className="text-slate-400 text-xs font-bold">Matches: {total}</span>
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
            </>
        )}
        
        <button 
            onClick={() => {
                if(confirm("Are you sure you want to reset all records and points?")) {
                    localStorage.removeItem('reversi_pop_stats');
                    setStats(INITIAL_STATS);
                }
            }}
            className="w-full mt-4 py-2 text-slate-400 text-sm font-bold hover:text-red-500 transition-colors"
        >
            Reset Records
        </button>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full relative">
        {/* Profile Button - Only visible if user is logged in */}
        {renderProfileButton()}
        
        {/* Modals */}
        {renderProfileModal()}

        <div className="flex-1 overflow-y-auto w-full">
            <div className="min-h-full flex flex-col items-center p-4 w-full max-w-md mx-auto relative z-10 pb-32">
                {/* Decorative Circles */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-50 -z-10"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-300 rounded-full blur-3xl opacity-50 -z-10"></div>

                <div className="flex-1 w-full flex flex-col items-center justify-center space-y-8">
                    <div className="text-center space-y-4 animate-float mt-4">
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

                    {activeTab === 'GAME' ? (
                        <>
                            {renderGameContent()}
                            {renderOtherApps()}
                        </>
                    ) : renderStatsContent()}
                </div>
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
