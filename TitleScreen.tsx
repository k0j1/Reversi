
import { useState, useEffect } from 'react';
import { Level, FarcasterUser } from './types';
import { ProfileButton } from './components/title/ProfileButton';
import { ProfileModal } from './components/title/ProfileModal';
import { LightpaperModal } from './components/title/LightpaperModal';
import { GameMenu } from './components/title/GameMenu';
import { StatsView } from './components/title/StatsView';
import { LeaderboardView } from './components/title/LeaderboardView';
import { BottomNav } from './components/title/BottomNav';

type TitleScreenProps = {
    level: Level;
    setLevel: (l: Level) => void;
    onStart: () => void;
    user?: FarcasterUser;
    connectedAddress: string | null;
    connectWallet: () => Promise<void>;
    onError: (error: any) => void;
};

type Tab = 'GAME' | 'STATS' | 'LEADERBOARD';

export const TitleScreen = ({ level, setLevel, onStart, user, connectedAddress, connectWallet, onError }: TitleScreenProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('GAME');
  const [showProfile, setShowProfile] = useState(false);
  const [showLightpaper, setShowLightpaper] = useState(false);

  // Auto-connect when profile is opened
  useEffect(() => {
    if (showProfile) {
        connectWallet();
    }
  }, [showProfile, connectWallet]);

  return (
    <div className="flex flex-col h-[100dvh] w-full relative">
        {/* Top Bar Buttons */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
            {/* Left: Lightpaper Button */}
            <button
                onClick={() => setShowLightpaper(true)}
                className="pointer-events-auto flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-slate-200 hover:bg-white transition-all active:scale-95 text-xl"
                aria-label="Open Lightpaper"
            >
                📄
            </button>

            {/* Right: Profile Button Wrapper (ProfileButton handles its own rendering) */}
            <div className="pointer-events-auto">
                 <ProfileButton user={user} onClick={() => setShowProfile(true)} />
            </div>
        </div>
        
        {/* Modals */}
        {showProfile && (
            <ProfileModal 
                user={user} 
                connectedAddress={connectedAddress} 
                connectWallet={connectWallet} 
                onClose={() => setShowProfile(false)} 
            />
        )}

        {showLightpaper && (
            <LightpaperModal onClose={() => setShowLightpaper(false)} />
        )}

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

                    {activeTab === 'GAME' && (
                        <GameMenu level={level} setLevel={setLevel} onStart={onStart} user={user} />
                    )}
                    
                    {activeTab === 'STATS' && (
                        <StatsView user={user} onError={onError} />
                    )}

                    {activeTab === 'LEADERBOARD' && (
                        <LeaderboardView currentFid={user?.fid} />
                    )}
                </div>
            </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};