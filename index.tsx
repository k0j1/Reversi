import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { Level } from './types';
import { useFarcaster } from './hooks/useFarcaster';
import { useUserSync } from './hooks/useUserSync';
import './index.css';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  // Default to Normal (2)
  const [level, setLevel] = useState<Level>(2);
  
  // Use the consolidated Farcaster hook
  const { user, connectedAddress, connectWallet } = useFarcaster();

  // Sync user data to Supabase whenever user or wallet changes
  useUserSync(user, connectedAddress);

  return (
    <>
        {view === 'TITLE' ? (
            <TitleScreen 
                level={level} 
                setLevel={setLevel} 
                onStart={() => setView('GAME')} 
                user={user}
                connectedAddress={connectedAddress}
                connectWallet={connectWallet}
            />
        ) : (
            <Game 
                level={level} 
                onExit={() => setView('TITLE')} 
                user={user}
                connectedAddress={connectedAddress}
            />
        )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);