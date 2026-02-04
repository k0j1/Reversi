
import { useState } from 'react';
import { FarcasterUser } from '../../types';
import { AdminModal } from './AdminModal';

type ProfileModalProps = {
    user?: FarcasterUser;
    connectedAddress: string | null;
    connectWallet: () => Promise<void>;
    onClose: () => void;
};

const ADMIN_FIDS = [406233, 1379028];

export const ProfileModal = ({ user, connectedAddress, connectWallet, onClose }: ProfileModalProps) => {
    const [showAdmin, setShowAdmin] = useState(false);

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
            
            {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
        </>
    );
};
