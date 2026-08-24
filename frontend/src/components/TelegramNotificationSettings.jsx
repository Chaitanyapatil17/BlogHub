import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Bell, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Trash2, 
  Sparkles,
  Check
} from 'lucide-react';

const CATEGORY_LIST = [
  { id: 'All', label: 'All Breaking Stories & Top News', desc: 'Receive instant alerts for every published article across all sections.' },
  { id: 'Technology', label: 'Technology', desc: 'Software engineering, developer tools, gadgets, systems.' },
  { id: 'AI & Code', label: 'AI & Machine Learning', desc: 'Autonomous agents, LLM architectures, research breakthroughs.' },
  { id: 'World News', label: 'World & National Affairs', desc: 'Global headlines, geopolitics, and investigative reports.' },
  { id: 'Business', label: 'Business & Economy', desc: 'Markets, startups, VC funding, macroeconomic policy.' },
  { id: 'Sports', label: 'Sports & Athletics', desc: 'Cricket, football championships, Olympic tournament recaps.' },
  { id: 'Science', label: 'Science & Space', desc: 'Astronomy, climate research, biotechnology, physics.' },
  { id: 'Lifestyle', label: 'Lifestyle & Health', desc: 'Productivity, wellness, modern living.' },
  { id: 'Food & Cooking', label: 'Food & Culinary', desc: 'Recipes, kitchen science, restaurant guides.' },
  { id: 'Entertainment', label: 'Culture & Entertainment', desc: 'Cinema, streaming reviews, digital storytelling.' },
];

export default function TelegramNotificationSettings() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(['All']);
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStatusData(data);
        if (data.connection) {
          setSelectedCategories(data.connection.categories || ['All']);
          setIsActive(data.connection.is_active ?? true);
        }
      } else {
        setError(data.message || 'Failed to load Telegram status.');
      }
    } catch (err) {
      setError(err.message || 'Failed to contact Telegram API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  const handleCategoryToggle = (catId) => {
    setMessage(null);
    let updated;
    if (catId === 'All') {
      if (selectedCategories.includes('All')) {
        updated = ['Technology']; // Fallback when deselecting All
      } else {
        updated = ['All'];
      }
    } else {
      let filtered = selectedCategories.filter((c) => c !== 'All');
      if (filtered.includes(catId)) {
        filtered = filtered.filter((c) => c !== catId);
        if (filtered.length === 0) filtered = ['All'];
      } else {
        filtered.push(catId);
      }
      updated = filtered;
    }
    setSelectedCategories(updated);
  };

  const handleSavePreferences = async (newActive = isActive, newCats = selectedCategories) => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categories: newCats,
          is_active: newActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Preferences saved! Your Telegram notifications are updated.');
        setIsActive(data.preferences.is_active);
        setSelectedCategories(data.preferences.categories);
        setTimeout(() => setMessage(null), 4000);
      } else {
        setError(data.message || 'Failed to save preferences.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    handleSavePreferences(nextState, selectedCategories);
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to disconnect Telegram notifications? You can reconnect anytime.')) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/unlink`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Telegram account unlinked.');
        await fetchStatus();
      } else {
        setError(data.message || 'Failed to unlink.');
      }
    } catch (err) {
      setError(err.message || 'Error unlinking account.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Checking Telegram notification status...</span>
      </div>
    );
  }

  const isConnected = statusData?.connection?.is_connected;
  const botUsername = statusData?.bot?.username || 'BlogHubNewsBot';
  const deepLink = statusData?.connection?.deep_link || `https://t.me/${botUsername}`;

  return (
    <div className="space-y-6">
      {/* 1. STATUS BANNER & CONNECTION CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-[#131b2e] to-[#0f172a] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Official Telegram Channel
              </span>
              {isConnected && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isActive ? 'Live Alerts Active' : 'Alerts Paused'}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Instant Telegram Story Alerts</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Get verified news stories, in-depth technical breakdowns, and breaking investigations delivered directly to your Telegram messenger in real-time.
            </p>

            {isConnected && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Connected Account:</span>
                  <span className="font-bold text-white">
                    {statusData.connection.username ? `@${statusData.connection.username}` : (statusData.connection.first_name || user?.name)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10.5px]">Telegram Chat ID:</span>
                  <span className="font-mono text-indigo-300 font-bold">{statusData.connection.chat_id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {!isConnected ? (
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 text-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Connect with Telegram Bot</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    isActive
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isActive ? '⏸ Pause All Notifications' : '▶️ Resume Notifications'}
                </button>

                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-rose-600/30 text-rose-300 hover:text-rose-100 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Disconnect Telegram</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={fetchStatus}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Check Connection Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. CATEGORY PREFERENCE SELECTOR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Topic & Category Subscriptions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select which news beats you want to receive on Telegram. Filter out topics you don't follow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSavePreferences(isActive, selectedCategories)}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategories.includes('All') || selectedCategories.includes(cat.id);
            return (
              <label
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {cat.label}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-snug mt-0.5 block">
                    {cat.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* How It Works Notice */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800 font-bold">Privacy & Security: </strong>
            Your Telegram Chat ID is encrypted and strictly used to dispatch notification digests. We never send advertising spam or share your handle with third parties. You can send <code>/stop</code> in Telegram anytime to pause alerts immediately.
          </div>
        </div>
      </div>
    </div>
  );
}
