import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Users, 
  Radio, 
  Clock, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function TelegramAdminWidget({ token }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_subscribers: 0, active_subscribers: 0, registered_subscribers: 0 });
  const [testSending, setTestSending] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [testCat, setTestCat] = useState('Technology');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || {});
      } else {
        setError(data.message || 'Failed to fetch Telegram logs.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Telegram logs API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  const handleSendTest = async (e) => {
    e.preventDefault();
    setTestSending(true);
    setFeedback(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/test-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_text: testMsg.trim() || undefined,
          category: testCat,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || 'Test broadcast sent!');
        setTestMsg('');
        await fetchLogs();
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setError(data.message || 'Failed to send test broadcast.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send test broadcast.');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-xs">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>Telegram Notification Dispatcher</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                @BlogHubNewsBot
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated category-targeted notification broadcast engine linked with PostgreSQL and Telegram Bot API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="https://t.me/BlogHubNewsBot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Open Bot</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl">
          <span className="text-[11px] font-bold text-sky-700 block uppercase tracking-wider">Total Subscribers</span>
          <span className="text-xl font-black text-sky-950 mt-1 block">{stats.total_subscribers || 0}</span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">Active Channel Listeners</span>
          <span className="text-xl font-black text-emerald-950 mt-1 block">{stats.active_subscribers || 0}</span>
        </div>

        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
          <span className="text-[11px] font-bold text-indigo-700 block uppercase tracking-wider">Linked BlogHub Accounts</span>
          <span className="text-xl font-black text-indigo-950 mt-1 block">{stats.registered_subscribers || 0}</span>
        </div>
      </div>

      {/* Feedback / Error Alerts */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Test Broadcast Panel */}
      <form onSubmit={handleSendTest} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Send Test Telegram Broadcast
          </span>
          <span className="text-[11px] text-slate-500">Target Category Filter</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <select
              value={testCat}
              onChange={(e) => setTestCat(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="Technology">Technology</option>
              <option value="AI & Code">AI & Code</option>
              <option value="World News">World News</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Custom notification message (optional)..."
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={testSending}
              className="w-full h-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{testSending ? 'Sending...' : 'Broadcast'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Recent Notification Dispatches Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <span>Recent Dispatch History</span>
          <span className="text-slate-400 text-[11px] lowercase">latest {logs.length} dispatches</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            No broadcast logs yet. Published blogs will automatically dispatch here.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Article / Event</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Delivered</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[220px] truncate">
                      {log.blog_title || log.details?.title || 'System Broadcast'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.category || 'General'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600">
                      {log.recipients_count || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'sent' ? '✓ Sent' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
