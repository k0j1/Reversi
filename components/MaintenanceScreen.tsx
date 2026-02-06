
type MaintenanceScreenProps = {
    onBack?: () => void;
};

export const MaintenanceScreen = ({ onBack }: MaintenanceScreenProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-100 p-6 animate-fade-in text-center relative">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border-4 border-slate-200 max-w-sm w-full space-y-6">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-5xl shadow-inner mx-auto">
                        🚧
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-800">
                        Maintenance
                    </h1>
                    <p className="text-slate-500 font-bold leading-relaxed">
                        The application is currently undergoing maintenance. Please try again later.
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-mono">
                        System Status: Restricted Access
                    </p>
                </div>

                {onBack && (
                    <button 
                        onClick={onBack}
                        className="w-full mt-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🔓</span> Exit Test Mode
                    </button>
                )}
            </div>
        </div>
    );
};
