
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import sdk from '@farcaster/frame-sdk';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { Level, FarcasterUser } from './types';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  // Default to Normal (2)
  const [level, setLevel] = useState<Level>(2);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [user, setUser] = useState<FarcasterUser | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          // Cast to any because TS types might lag behind the actual SDK response in some environments
          const u = context.user as any; 
          
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
            // Extract wallet info safely.
            // context.user.custodyAddress and context.user.verifiedAddresses should be available in newer SDKs
            custodyAddress: u.custodyAddress, 
            verifiedAddresses: u.verifiedAddresses,
          });
        }
        sdk.actions.ready();
      } catch (e) {
        console.error("Error loading Farcaster context:", e);
        // Fallback: indicate ready even if context fails
        sdk.actions.ready();
      }
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
