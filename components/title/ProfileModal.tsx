
import { useState, useEffect } from 'react';
import { FarcasterUser } from '../../types';
import { AdminModal } from './AdminModal';
import { supabase } from '../../lib/supabase';

type ProfileModalProps = {
    user?: FarcasterUser;
    connectedAddress: string | null;
    connectWallet: () => Promise<void>;
    onClose: () => void;
    onTestMaintenance: () => void;
};

const ADMIN_FIDS = [406233, 1379028];

export const ProfileModal = ({ user, connectedAddress, connectWallet, onClose, onTestMaintenance }: ProfileModalProps) => {
    const [showAdmin, setShowAdmin] = useState(false);
    const [googleEmail, setGoogleEmail] = useState<string | null>(null);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchGoogleAccount = async () => {
            setIsLoadingGoogle(true);
            try {
                const { data, error } = await supabase
                    .from('google_accounts')
                    .select('google_email')
                    .eq('fid', user.fid)
                    .single();
                
                if (data && !error) {
                    setGoogleEmail(data.google_email);
                } else {
                    setGoogleEmail(null);
                }
            } catch (err) {
                console.error("Error fetching google account:", err);
            } finally {
                setIsLoadingGoogle(false);
            }
        };

        fetchGoogleAccount();

        const handleMessage = (event: MessageEvent) => {
            const origin = event.origin;
            if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
                return;
            }
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                fetchGoogleAccount();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [user]);

    const handleConnectGoogle = async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/auth/google/url?fid=${user.fid}`);
            if (!response.ok) {
                throw new Error('Failed to get auth URL');
            }
            const { url } = await response.json();

            const authWindow = window.open(
                url,
                'oauth_popup',
                'width=600,height=700'
            );

            if (!authWindow) {
                alert('Please allow popups for this site to connect your account.');
            }
        } catch (error) {
            console.error('OAuth error:', error);
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!user || !confirm('Googleアカウントの連携を解除しますか？')) return;
        setIsLoadingGoogle(true);
        try {
            const response = await fetch('/api/auth/google/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid: user.fid })
            });
            if (response.ok) {
                setGoogleEmail(null);
            }
        } catch (error) {
            console.error('Disconnect error:', error);
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    if (!user) return null;

    const isAdmin = ADMIN_FIDS.includes(user.fid);

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
                <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 flex flex-col gap-6 animate-bounce-in max-h-[85vh] overflow-y-auto border-4 border-slate-100">
                    <button
                        onClick={onClose}
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

                    {/* Accounts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">Linked Accounts</h4>
                        </div>

                        {/* Google Account */}
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-500 pl-1">Google</span>
                            {isLoadingGoogle ? (
                                <div className="animate-pulse bg-slate-100 h-10 rounded-xl"></div>
                            ) : googleEmail ? (
                                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <span className="text-xs font-bold text-blue-700 truncate mr-2">{googleEmail}</span>
                                    <button 
                                        onClick={handleDisconnectGoogle}
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-blue-200"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleConnectGoogle}
                                    className="w-full bg-white border-2 border-slate-200 text-slate-600 text-xs font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Googleと連携する
                                </button>
                            )}
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
                        
                        {/* Connected Address */}
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-500 pl-1">Primary Address</span>
                            {connectedAddress ? (
                                 <div className="bg-green-50 p-3 rounded-xl border border-green-100 break-all text-xs font-mono text-green-700 select-all hover:bg-green-100 transition-colors">
                                    {connectedAddress}
                                 </div>
                            ) : (
                                <button 
                                    onClick={connectWallet}
                                    className="w-full bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Connect Wallet
                                </button>
                            )}
                        </div>

                        {/* Other Addresses */}
                        {(user.custodyAddress || (user.verifiedAddresses && user.verifiedAddresses.length > 0)) && (
                            <div className="pt-2">
                                 <span className="text-xs font-bold text-slate-400 pl-1 mb-2 block">Other Addresses</span>
                                 <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {user.verifiedAddresses?.map((addr, i) => (
                                        addr !== connectedAddress && (
                                            <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100 break-all text-[10px] font-mono text-slate-500 select-all">
                                                <span className="text-slate-400 font-bold mr-1">Verified:</span>
                                                {addr}
                                            </div>
                                        )
                                    ))}
                                    {user.custodyAddress && user.custodyAddress !== connectedAddress && (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 break-all text-[10px] font-mono text-slate-500 select-all">
                                            <span className="text-slate-400 font-bold mr-1">Custody:</span>
                                            {user.custodyAddress}
                                        </div>
                                    )}
                                 </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Admin Button */}
                    {isAdmin && (
                        <button 
                            onClick={() => setShowAdmin(true)}
                            className="mt-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
                        >
                            <span>🛠️</span> Admin Panel
                        </button>
                    )}

                    <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-auto">
                        Connected via Farcaster
                    </div>
                </div>
            </div>
            
            {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} onTestMaintenance={onTestMaintenance} />}
        </>
    );
};
