
type ToastProps = {
  msg: string;
  type: 'info' | 'warn';
};

export const Toast = ({ msg, type }: ToastProps) => {
  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce pointer-events-none w-[90%] max-w-sm flex justify-center">
      <div className={`
        w-full px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-4 font-bold text-lg flex items-center justify-center gap-3 text-center
        ${type === 'warn' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-green-500 text-green-600'}
      `}>
        {type === 'warn' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ) : (
          <span className="text-2xl flex-shrink-0">🏆</span>
        )}
        {msg}
      </div>
    </div>
  );
};
