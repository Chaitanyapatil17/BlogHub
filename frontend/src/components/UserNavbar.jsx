import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  PenTool, 
  Globe, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  Sparkles,
  Crown
} from 'lucide-react';

export default function UserNavbar() {
  const { user, isVerified, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 text-slate-900 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs w-full max-w-full overflow-x-clip shrink-0">
      {/* Left: Branding & Creator Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="px-3 py-1 bg-red-600 group-hover:bg-red-500 font-black text-white text-base tracking-wider rounded-lg transition-colors shadow-xs">
            BLOGHUB
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            Creator Studio
          </span>
        </Link>

        {/* Admin Dashboard Quick Link for Admins */}
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer border border-purple-400/30 shrink-0"
            title="Switch to Administrator Dashboard"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>
        )}

        {/* Back to Explore Feed */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/70 shrink-0"
          title="Back to Explore feed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Feed</span>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Verification Status Pill */}
        <div className="hidden md:flex items-center">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Creator
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Creator (Under Review)
            </span>
          )}
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
              {user?.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
              {user?.email}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
