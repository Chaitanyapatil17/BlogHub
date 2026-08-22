import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  Crown, 
  Globe, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  Zap,
  Sparkles
} from 'lucide-react';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-md w-full max-w-full overflow-x-clip">
      {/* Left: Branding & Portal Badge */}
      <div className="flex items-center gap-3 sm:gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="px-3 py-1 bg-red-600 group-hover:bg-red-500 font-black text-white text-base tracking-wider rounded-lg transition-colors shadow-xs">
            BLOGHUB
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Crown className="w-3 h-3 text-purple-400" />
            Admin Portal
          </span>
        </Link>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-medium text-slate-300">System Live</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Switch to Creator Studio */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
          title="Go to Creator Studio"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Creator Studio</span>
        </Link>

        {/* Switch to Public Site */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
          title="Go to Public Explore Feed"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">View Public Site</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>

        {/* Notification Bell (Dark Mode wrapper) */}
        <div className="text-slate-300 hover:text-white">
          <NotificationBell />
        </div>

        {/* Admin Profile Pill */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-xs">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              {user?.name || 'Administrator'}
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Super Admin</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Sign Out of Admin"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
