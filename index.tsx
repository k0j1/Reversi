
import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './Game';
import { TitleScreen } from './TitleScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { Level } from './types';
import { useFarcaster } from './hooks/useFarcaster';
import { useUserSync } from './hooks/useUserSync';
import { ErrorDialog } from './components/ErrorDialog';
import { supabase } from './lib/supabase';
import './styles.css';

const App = () => {
  const [view, setView] = useState<'TITLE' | 'GAME'>('TITLE');
  // Default to Normal (2)
  const [level, setLevel] = useState<Level>(2);
  const [error, setError] = useState<any>(null);
  
  // Real block state from DB
  const [isBlocked, setIsBlocked] = useState(false);
  // Manual test state from Admin Panel
  const [isMaintenanceTest, setIsMaintenanceTest] = useState(false);
  
  // Use the consolidated Farcaster hook
  const { user, connectedAddress, connectWallet } = useFarcaster();

  // Centralized Error Handler
  const handleError = useCallback((err: any) => {
    console.error("Application Error:", err);
    setError(err);
  }, []);

  // Sync user data to Supabase whenever user or wallet changes
  useUserSync(user, connectedAddress, handleError);

  // Initial Setup & Block Check
  useEffect(() => {
    // Test DB Connection
    const checkDbConnection = async () => {
      try {
        const { error: dbError } = await supabase
          .from('reversi_game_stats')
          .select('count', { count: 'exact', head: true });
        
        if (dbError) {
          console.warn(`DB Connection Warning: ${dbError.message} (${dbError.code})`);
        } else {
          console.log("DB Connection Verified");
        }
      } catch (e: any) {
        console.warn("DB Connection Check Failed (Network?):", e);
      }
    };

    checkDbConnection();
  }, []);

  // Check if user is blocked
  useEffect(() => {
    if (!user) return;

    const checkBlockStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('blocked_users')
          .select('fid')
          .eq('fid', user.fid)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is good
             console.warn("Block check warning:", error);
        }

        if (data) {
          setIsBlocked(true);
        }
      } catch (e) {
        console.error("Failed to check block status", e);
      }
    };

    checkBlockStatus();
  }, [user]);

  // Priority 1: Real DB Block (No Back Button)
  if (isBlocked) {
    return <MaintenanceScreen />;
  }

  // Priority 2: Admin Test Mode (With Back Button)
  if (isMaintenanceTest) {
    return <MaintenanceScreen onBack={() => setIsMaintenanceTest(false)} />;
  }

  return (
    <>
        {error && <ErrorDialog error={error} onClose={() => setError(null)} />}
        
        {view === 'TITLE' ? (
            <TitleScreen 
                level={level} 
                setLevel={setLevel} 
                onStart={() => setView('GAME')} 
                user={user}
                connectedAddress={connectedAddress}
                connectWallet={connectWallet}
                onError={handleError}
                onTestMaintenance={() => setIsMaintenanceTest(true)}
            />
        ) : (
            <Game 
                level={level} 
                onExit={() => setView('TITLE')} 
                user={user}
                connectedAddress={connectedAddress}
                onError={handleError}
            />
        )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
