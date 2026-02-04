
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ClaimBonus';

type AdminModalProps = {
    onClose: () => void;
};

// CHH Token Contract Address on Base Mainnet
const CHH_TOKEN_ADDRESS = "0xb0525542E3D818460546332e76E511562dFf9B07";

export const AdminModal = ({ onClose }: AdminModalProps) => {
    const [balance, setBalance] = useState<string>('Loading...');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                // Read-only provider (Base Mainnet)
                const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                
                const bal = await contract.getRemainingBalance();
                const formatted = ethers.formatUnits(bal, 18);
                setBalance(`${parseFloat(formatted).toLocaleString()} CHH`);
            } catch (e) {
                console.error("Balance fetch failed", e);
                setBalance("Error");
            }
        };

        fetchBalance();
    }, []);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
    };

    const handleSend = async () => {
        setStatus('PROCESSING');
        setStatusMsg("Opening wallet...");

        try {
            // Invoke Farcaster native send token screen
            // Documentation: https://miniapps.farcaster.xyz/docs/sdk/actions/send-token
            // Updated parameters based on user request
            await sdk.actions.sendToken({
                token: `eip155:8453/erc20:${CHH_TOKEN_ADDRESS}`,
                recipientAddress: CONTRACT_ADDRESS,
                amount: "0"
            } as any);
            
            setStatus('SUCCESS');
            setStatusMsg("Check your wallet to confirm.");
            
        } catch (e: any) {
            console.error(e);
            setStatus('ERROR');
            setStatusMsg("Action cancelled or failed");
        } finally {
            if (status !== 'PROCESSING') {
                setTimeout(() => {
                     setStatus('IDLE');
                     setStatusMsg('');
                }, 3000);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-20 flex flex-col gap-5 border-4 border-slate-200 animate-bounce-in max-h-[85vh] overflow-y-auto">
                
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <span>🛠️</span> Admin Panel
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Contract Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Contract Address</label>
                        <div 
                            onClick={handleCopyAddress}
                            className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-600 break-all cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            {CONTRACT_ADDRESS}
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                        <label className="text-xs font-bold text-slate-400 uppercase">Remaining Pool</label>
                        <span className="font-black text-slate-800">{balance}</span>
                    </div>
                </div>

                {/* Fund Tool */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-700">Fund Contract</h3>
                    
                    <p className="text-xs text-slate-500 font-medium">
                        Click the button below to open your wallet and send CHH tokens to the contract address.
                    </p>
                    
                    {status !== 'IDLE' && (
                         <div className={`text-xs p-2 rounded-lg font-bold break-all ${status === 'ERROR' ? 'bg-red-50 text-red-500' : status === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                            {statusMsg}
                         </div>
                    )}

                    <button 
                        onClick={handleSend}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>💸</span> Send CHH
                    </button>
                </div>
            </div>
        </div>
    );
};
