
type Tab = 'GAME' | 'STATS' | 'LEADERBOARD';

type BottomNavProps = {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
};

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-md mx-auto flex justify-around p-2">
                <button 
                    onClick={() => setActiveTab('GAME')}
                    className={`flex flex-col items-center p-2 rounded-2xl w-full transition-all duration-200 active:scale-95 ${activeTab === 'GAME' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    <span className="text-[10px] font-bold">Game</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('STATS')}
                    className={`flex flex-col items-center p-2 rounded-2xl w-full transition-all duration-200 active:scale-95 ${activeTab === 'STATS' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="text-[10px] font-bold">Stats</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('LEADERBOARD')}
                    className={`flex flex-col items-center p-2 rounded-2xl w-full transition-all duration-200 active:scale-95 ${activeTab === 'LEADERBOARD' ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 3.8a1 1 0 10-2 0v2.2a1 1 0 102 0V6.8zm-4 4a1 1 0 10-2 0v2.2a1 1 0 102 0v-2.2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-bold">Ranking</span>
                </button>
            </div>
        </div>
    );
};