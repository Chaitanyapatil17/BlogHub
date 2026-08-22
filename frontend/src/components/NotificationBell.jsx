import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Clock, 
  X, 
  Sparkles,
  MessageSquare,
  Heart,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIcon = (title = '') => {
    if (title.includes('Like')) return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
    if (title.includes('Comment')) return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
    if (title.includes('Approved') || title.includes('Verified')) return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
    if (title.includes('Request')) return <FileCheck className="w-3.5 h-3.5 text-amber-600" />;
    return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/95 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  {unreadCount} New
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[10px] text-slate-400">Real-time alerts will appear here!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    notif.is_read ? 'bg-white hover:bg-slate-50/60' : 'bg-indigo-50/40 hover:bg-indigo-50/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                      {getNotificationIcon(notif.title)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-1.5">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <Link
                          to={notif.link}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View Details
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
