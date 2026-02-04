
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ClaimBonus';

type AdminModalProps = {
    onClose: () => void;
};

export const AdminModal = ({ onClose }: AdminModalProps) => {
    const [balance, setBalance] = useState<string>('Loading...');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [statusMsg, setStatusMsg] = useState('');
    
    // Stats State
    const [totalClaims, setTotalClaims] = useState<number | string>('Loading...');
    const [totalDistributed, setTotalDistributed] = useState<string>('Loading...');

    useEffect(() => {
        const fetchContractData = async () => {
            try {
                // Read-only provider (Base Mainnet)
                const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                
                // 1. Fetch Balance
                try {
                    const bal = await contract.getRemainingBalance();
                    const formatted = ethers.formatUnits(bal, 18);
                    setBalance(`${parseFloat(formatted).toLocaleString()} CHH`);
                } catch (e) {
                    console.error("Balance fetch failed", e);
                    setBalance("Error");
                }

                // 2. Fetch Event Logs for Statistics
                // Note: Public RPCs might limit block ranges. If history is long, this might need pagination.
                try {
                    const filter = contract.filters.Claimed();
                    const events = await contract.queryFilter(filter);
                    
                    setTotalClaims(events.length);

                    let totalDist = BigInt(0);
                    events.forEach((event: any) => {
                        if (event.args && event.args[1]) {
                            totalDist += event.args[1];
                        }
                    });
                    
                    const distFormatted = ethers.formatUnits(totalDist, 18);
                    setTotalDistributed(`${parseFloat(distFormatted).toLocaleString()} CHH`);

                } catch (e) {
                    console.error("Events fetch failed", e);
                    setTotalClaims("N/A (RPC Limit)");
                    setTotalDistributed("N/A");
                }

            } catch (e: any) {
                console.error("Provider error", e);
            }
        };

        fetchContractData();
    }, []);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
    };

    const handleSend = async () => {
        setStatus('PROCESSING');
        setStatusMsg("Opening wallet...");

        try {
            await sdk.context;
            // @ts-ignore
            let provider = (sdk as any).wallet?.ethProvider || (window as any).ethereum;
            
            if (!provider) {
                throw new Error("No wallet connected.");
            }

            // Request a transaction to the contract address.
            // We do not specify value or data, letting the user control this in their wallet.
            // This will typically open the "Send" screen with the 'to' address pre-filled.
            await provider.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        to: CONTRACT_ADDRESS,
                        // value: '0x0', // Optional: can be omitted to let user choose
                        from: (await provider.request({ method: 'eth_requestAccounts' }))[0]
                    },
                ],
            });
            
            setStatus('SUCCESS');
            setStatusMsg("Check your wallet to confirm.");
            
        } catch (e: any) {
            console.error(e);
            setStatus('ERROR');
            // User rejected or other error
            setStatusMsg(e.message?.includes("rejected") ? "Cancelled" : "Failed to open wallet");
        } finally {
            // Reset status after a delay if success/error
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

                {/* Statistics Section */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
                    <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Historical Stats</h3>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Total Claims</span>
                        <span className="font-black text-slate-800">{totalClaims}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-orange-200/50 pt-2">
                        <span className="text-xs font-bold text-slate-600">Total Distributed</span>
                        <span className="font-black text-slate-800">{totalDistributed}</span>
                    </div>
                </div>

                {/* Fund Tool */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-700">Fund Contract</h3>
                    
                    <p className="text-xs text-slate-500 font-medium">
                        Click the button below to open your wallet and send tokens/ETH to the contract address.
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
                        <span>💸</span> Send to Contract
                    </button>
                </div>
            </div>
        </div>
    );
};
