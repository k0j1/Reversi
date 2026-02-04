
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import sdk from '@farcaster/frame-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ClaimBonus';

type AdminModalProps = {
    onClose: () => void;
};

// Minimal ERC20 ABI for transfer
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

export const AdminModal = ({ onClose }: AdminModalProps) => {
    const [balance, setBalance] = useState<string>('Loading...');
    
    // Deposit Form State
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const fetchContractBalance = async () => {
            try {
                // Read-only provider (Base Mainnet)
                const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                
                // Fetch balance
                const bal = await contract.getRemainingBalance();
                // Assuming contract handles 18 decimals internally for CHH
                const formatted = ethers.formatUnits(bal, 18);
                setBalance(`${parseFloat(formatted).toLocaleString()} CHH`);
            } catch (e: any) {
                console.error("Failed to fetch balance", e);
                setBalance("Error fetching balance");
            }
        };

        fetchContractBalance();
    }, []);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
    };

    const handleDeposit = async () => {
        if (!tokenAddress || !amount) {
            setStatus('ERROR');
            setStatusMsg("Please fill in Token Address and Amount");
            return;
        }

        setStatus('PROCESSING');
        setStatusMsg("Initializing transaction...");

        try {
            await sdk.context;
            // @ts-ignore
            let provider = (sdk as any).wallet?.ethProvider || (window as any).ethereum;
            
            if (!provider) {
                throw new Error("No wallet connected.");
            }

            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            
            // Get decimals to format correctly
            let decimals = 18;
            try {
                decimals = await tokenContract.decimals();
            } catch (e) {
                console.warn("Could not fetch decimals, defaulting to 18");
            }

            const parsedAmount = ethers.parseUnits(amount, decimals);

            setStatusMsg("Please confirm transfer in your wallet...");
            
            const tx = await tokenContract.transfer(CONTRACT_ADDRESS, parsedAmount);
            setStatusMsg(`Transaction sent! Hash: ${tx.hash}`);
            
            await tx.wait();
            
            setStatus('SUCCESS');
            setStatusMsg("Deposit successful!");
            
            // Refresh balance after short delay
            setTimeout(() => {
                // Trigger re-fetch logic if needed, or just let user close/reopen
            }, 2000);

        } catch (e: any) {
            console.error(e);
            setStatus('ERROR');
            setStatusMsg(e.message || "Transaction failed");
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

                {/* Deposit Tool */}
                <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-slate-700">Fund Contract</h3>
                    
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Token Address (e.g. 0x...)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono outline-none focus:border-orange-400"
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                        />
                        <input 
                            type="number" 
                            placeholder="Amount to Send"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {status !== 'IDLE' && (
                         <div className={`text-xs p-2 rounded-lg font-bold break-all ${status === 'ERROR' ? 'bg-red-50 text-red-500' : status === 'SUCCESS' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                            {statusMsg}
                         </div>
                    )}

                    <button 
                        onClick={handleDeposit}
                        disabled={status === 'PROCESSING'}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${status === 'PROCESSING' ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-700 shadow-lg active:scale-95'}`}
                    >
                        {status === 'PROCESSING' ? 'Processing...' : 'Send to Contract'}
                    </button>
                </div>
            </div>
        </div>
    );
};
