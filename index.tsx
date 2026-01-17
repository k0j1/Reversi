
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import sdk, { type FrameContext } from '@farcaster/frame-sdk';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { Level, FarcasterUser } from './types';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  const [level, setLevel] = useState<Level>(5);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [user, setUser] = useState<FarcasterUser | undefined>();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (context?.user) {
        setUser({
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
        });
      }
      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  return (
    <>
        {view === 'TITLE' ? (
            <TitleScreen 
                level={level} 
                setLevel={setLevel} 
                onStart={() => setView('GAME')} 
                user={user}
            />
        ) : (
            <Game 
                level={level} 
                onExit={() => setView('TITLE')} 
                user={user}
            />
        )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
