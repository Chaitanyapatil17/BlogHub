import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, Crown, User, ShieldCheck, AlertCircle } from 'lucide-react';
import CloudflareTurnstile from '../components/CloudflareTurnstile';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'admin' || searchParams.get('redirect') === '/admin' ? 'admin' : 'user';
  const [activeTab, setActiveTab] = useState(initialTab); // 'user' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password, turnstileToken);
      const redirectUrl = searchParams.get('redirect');
      if (data.user.role === 'admin') {
        navigate(redirectUrl || '/admin');
      } else {
        navigate(redirectUrl && !redirectUrl.startsWith('/admin') ? redirectUrl : '/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type) => {
    setError(null);
    if (type === 'admin') {
      setActiveTab('admin');
      setEmail('admin@bloghub.com');
      setPassword('admin123');
    } else if (type === 'verified') {
      setActiveTab('user');
      setEmail('verified@bloghub.com');
      setPassword('user123');
    } else if (type === 'unverified') {
      setActiveTab('user');
      setEmail('unverified@bloghub.com');
      setPassword('user123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to BlogHub
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to manage your blogs or review requests
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'user'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              User Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>

          {/* Quick Demo Autofill Helper */}
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Quick Demo Accounts (Click to fill)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors text-center cursor-pointer"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('verified')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors text-center cursor-pointer"
              >
                ✅ Verified
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('unverified')}
                className="px-2 py-1.5 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors text-center cursor-pointer"
              >
                ⏳ Unverified
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            {/* Cloudflare Turnstile CAPTCHA Protection */}
            <CloudflareTurnstile
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              theme="light"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 font-bold text-sm rounded-xl text-white shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {activeTab === 'admin' ? 'Log In as Admin' : 'Log In to Account'}
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-bold">
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
