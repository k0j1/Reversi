
import { FarcasterUser } from '../../types';

type ProfileButtonProps = {
    user?: FarcasterUser;
    onClick: () => void;
};

export const ProfileButton = ({ user, onClick }: ProfileButtonProps) => {
    if (!user) return null;

    return (
      <button
        onClick={onClick}
        // Removed absolute positioning here to let TitleScreen control layout
        className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 pr-3 rounded-full shadow-sm border border-slate-200 hover:bg-white transition-all active:scale-95"
      >
        {user.pfpUrl ? (
            <img src={user.pfpUrl} alt={user.username} className="w-8 h-8 rounded-full border border-slate-200" />
        ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm">👤</span>
            </div>
        )}
        <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
            {user.displayName || user.username}
        </span>
      </button>
    );
};