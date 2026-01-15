import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { Level } from './types';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  const [level, setLevel] = useState<Level>(5);

  return (
    <>
        {view === 'TITLE' ? (
            <TitleScreen 
                level={level} 
                setLevel={setLevel} 
                onStart={() => setView('GAME')} 
            />
        ) : (
            <Game 
                level={level} 
                onExit={() => setView('TITLE')} 
            />
        )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
