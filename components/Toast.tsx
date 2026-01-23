type ToastProps = {
  msg: string;
  type: 'info' | 'warn';
};

export const Toast = ({ msg, type }: ToastProps) => {
  return (
    // Changed positioning logic: Use left-4 right-4 with max-w to ensure it fits on screen
    // Moved z-index higher to ensure visibility over other elements
    <div className="fixed top-16 left-4 right-4 flex justify-center z-[150] pointer-events-none animate-bounce">
      <div className={`
        pointer-events-auto
        w-full max-w-sm px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-4 font-bold text-lg flex items-center justify-center gap-3 text-center
        ${type === 'warn' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-green-500 text-green-600'}
      `}>
        {type === 'warn' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ) : (
          <span className="text-2xl flex-shrink-0">🏆</span>
        )}
        <span className="break-words leading-tight">{msg}</span>
      </div>
    </div>
  );
};