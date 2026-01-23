import { useState } from 'react';

type ErrorDialogProps = {
    error: any;
    onClose: () => void;
};

export const ErrorDialog = ({ error, onClose }: ErrorDialogProps) => {
    const [copied, setCopied] = useState(false);

    const errorMessage = typeof error === 'string' 
        ? error 
        : error instanceof Error 
            ? error.message 
            : JSON.stringify(error, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(errorMessage).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 border-2 border-red-100 animate-bounce-in">
                <div className="flex items-center gap-3 mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-xl font-bold">Error Occurred</h3>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 overflow-x-auto">
                    <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all">
                        {errorMessage}
                    </pre>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleCopy}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                    >
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Error
                            </>
                        )}
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};