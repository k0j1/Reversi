
export const LightpaperModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 sm:p-8 shadow-2xl relative z-10 flex flex-col gap-6 animate-bounce-in max-h-[85vh] overflow-y-auto border-4 border-slate-100 custom-scrollbar">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors z-20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                <div className="text-center space-y-2">
                    <span className="text-4xl">📄</span>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lightpaper</h2>
                    <p className="text-slate-400 font-bold text-sm">Game Mechanics & Economy</p>
                </div>

                <div className="space-y-6">
                    {/* Section 1: Game Multipliers */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                            <span>🎯</span> Score Multipliers
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Earn points by winning against the AI. Your score (disc count) is multiplied based on the difficulty level.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-green-600 font-bold">Beginner (Lv.1)</span>
                                <span className="font-black text-slate-700 text-lg">x2</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-teal-600 font-bold">Easy (Lv.2)</span>
                                <span className="font-black text-slate-700 text-lg">x4</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-yellow-600 font-bold">Normal (Lv.3)</span>
                                <span className="font-black text-slate-700 text-lg">x6</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-orange-600 font-bold">Hard (Lv.4)</span>
                                <span className="font-black text-slate-700 text-lg">x9</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-red-600 font-bold">Expert (Lv.5)</span>
                                <span className="font-black text-slate-700 text-lg">x12</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 italic text-center mt-2">
                            * Losing gives 1x points (Draw gives 1x)
                        </p>
                    </div>

                    {/* Section 2: Login Bonus */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border border-orange-100 space-y-3">
                        <h3 className="text-lg font-black text-orange-600 flex items-center gap-2">
                            <span>🎁</span> Login Bonus Logic
                        </h3>
                        <p className="text-sm text-slate-600 font-medium">
                            Claim $CHH tokens daily (Resets at 00:00 UTC). The amount depends on your gameplay performance.
                        </p>
                        
                        <div className="bg-white/80 p-4 rounded-xl border border-orange-100 space-y-3">
                            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                                <span className="font-bold text-slate-600">Base Reward</span>
                                <span className="font-black text-orange-500">500 $CHH</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                                <span className="font-bold text-slate-600">Performance Bonus</span>
                                <span className="font-black text-orange-500">Max 1,000 $CHH</span>
                            </div>
                            
                            <div className="text-xs text-slate-500 bg-orange-100/50 p-3 rounded-lg">
                                <strong>Bonus Formula:</strong><br/>
                                <code>Unclaimed Points = Total Score - Already Claimed</code><br/>
                                <em className="block mt-1">You get your Unclaimed Points as a bonus, capped at 1,000 per day.</em>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                                <span className="font-black text-slate-700">Max Daily Total</span>
                                <span className="font-black text-2xl text-orange-600">1,500 $CHH</span>
                            </div>
                        </div>
                    </div>

                     {/* Section 3: About */}
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                            <span>🐶</span> About $CHH
                        </h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            $CHH (Chihuahua) is a community token on the Base network. Play Reversi Pop, accumulate points, and claim your daily allowance to join the ecosystem!
                        </p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                >
                    Close Lightpaper
                </button>
            </div>
        </div>
    );
};