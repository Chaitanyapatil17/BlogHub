import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import Navbar from './components/Navbar';
import RunningNavbar from './components/RunningNavbar';
import AdminNavbar from './components/AdminNavbar';
import UserNavbar from './components/UserNavbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import BlogDetail from './pages/BlogDetail';
import AuthorProfile from './pages/AuthorProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Bell, X, ExternalLink } from 'lucide-react';
import { logAnalyticsEvent } from './utils/analyticsTracker';

// Lightweight, accessible smooth scroll & page analytics tracking
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollMode = prefersReducedMotion ? 'auto' : 'smooth';

    if (hash) {
      // Smooth scroll to anchor target (e.g. #comments-section, #discussion)
      const elementId = hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: scrollMode, block: 'start' });
        return;
      }
    }

    // Scroll to page top on route navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: scrollMode
    });

    // Log page view event for non-admin public pages
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/dashboard')) {
      logAnalyticsEvent({ path: pathname, eventType: 'page_view' });
    }
  }, [pathname, hash]);

  return null;
}

// In-app real-time toast banner
function LiveToastBanner() {
  const { latestToast, setLatestToast } = useNotifications();

  if (!latestToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-indigo-200 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-0.5">{latestToast.title}</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{latestToast.message}</p>
            {latestToast.link && (
              <Link
                to={latestToast.link}
                onClick={() => setLatestToast(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                View Now
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={() => setLatestToast(null)}
          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isCustomDashboard = isAdminPath || isDashboardPath;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f5] text-slate-800 selection:bg-rose-500 selection:text-white font-sans antialiased w-full max-w-full overflow-x-hidden">
      {/* Route-Specific Navbars */}
      {isAdminPath ? (
        <AdminNavbar />
      ) : isDashboardPath ? (
        <UserNavbar />
      ) : (
        <>
          <Navbar />
          <RunningNavbar />
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/blog/:category/:slug" element={<BlogDetail />} />
            <Route path="/blog/:category/:subcategory/:slug" element={<BlogDetail />} />
            <Route path="/author/:id" element={<AuthorProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected User Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Show Public Footer only on non-dashboard pages */}
      {!isCustomDashboard && <Footer />}

      {/* Floating Scroll To Top Action */}
      <ScrollToTopButton />

      {/* Real-time Toast Notifications */}
      <LiveToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <AppLayout />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
