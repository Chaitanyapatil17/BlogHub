import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getBlogUrl } from '../utils/urlHelper';
import ContentBlockRenderer, { stripHtml, getBlogCover } from '../components/ContentBlockRenderer';
import { API_BASE_URL } from '../config';
import { 
  Crown, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Search,
  LayoutDashboard,
  Globe,
  LogOut,
  ChevronRight,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
  Plus,
  Edit3,
  Image as ImageIcon,
  Video as VideoIcon,
  UploadCloud,
  Play,
  Zap,
  Check,
  Eye,
  MousePointerClick,
  Sparkles,
  MapPin,
  Tag as TagIcon,
  Calendar,
  BookOpen,
  X,
  Filter,
  UserCheck,
  ShieldCheck,
  Layers,
  FileCheck
} from 'lucide-react';
import GeographicAnalyticsView from '../components/admin/GeographicAnalyticsView';

export default function AdminDashboard() {
  const { token, user: currentAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'geo_analytics', 'requests', 'blogs', 'users', 'ads'
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    publishedBlogs: 0,
    pendingRequests: 0,
    totalComments: 0,
    totalLikes: 0,
  });

  // Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [requestSearch, setRequestSearch] = useState('');
  const [previewModalReq, setPreviewModalReq] = useState(null);

  // Blogs State
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [blogSearch, setBlogSearch] = useState('');

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Advertisements State
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  // Ad Form Fields
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adMediaType, setAdMediaType] = useState('image'); // 'image' | 'video' | 'graphic'
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adBadgeText, setAdBadgeText] = useState('Sponsored');
  const [adButtonText, setAdButtonText] = useState('Get Started Free');
  const [adTargetUrl, setAdTargetUrl] = useState('/register');
  const [adFeatures, setAdFeatures] = useState([
    'Instant 1-Click Publishing',
    'Real-time Reader Analytics',
    'Verified Creator Profile Badge'
  ]);
  const [adNewFeature, setAdNewFeature] = useState('');
  const [adIsActive, setAdIsActive] = useState(true);
  const [savingAd, setSavingAd] = useState(false);
  const [adFeedback, setAdFeedback] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blog-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Blogs
  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Advertisements
  const fetchAds = async () => {
    setLoadingAds(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.advertisements || []);
      }
    } catch (err) {
      console.error('Error fetching advertisements:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  const { socket } = useNotifications();

  const refreshAll = () => {
    fetchStats();
    fetchRequests();
    fetchBlogs();
    fetchUsers();
    fetchAds();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Real-time socket event subscription for admin dashboard
  useEffect(() => {
    if (!socket) return;

    const handleRequestsUpdated = () => {
      fetchRequests();
      fetchStats();
    };

    const handleBlogPublished = () => {
      fetchBlogs();
      fetchStats();
    };

    const handleBlogDeleted = () => {
      fetchBlogs();
      fetchStats();
    };

    const handleAdUpdated = () => {
      fetchAds();
    };

    const handleStatsUpdated = () => {
      fetchStats();
    };

    socket.on('blog_requests_updated', handleRequestsUpdated);
    socket.on('blog_published', handleBlogPublished);
    socket.on('blog_deleted', handleBlogDeleted);
    socket.on('advertisement_updated', handleAdUpdated);
    socket.on('stats_updated', handleStatsUpdated);

    return () => {
      socket.off('blog_requests_updated', handleRequestsUpdated);
      socket.off('blog_published', handleBlogPublished);
      socket.off('blog_deleted', handleBlogDeleted);
      socket.off('advertisement_updated', handleAdUpdated);
      socket.off('stats_updated', handleStatsUpdated);
    };
  }, [socket]);

  // Approve Request Handler
  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this blog post and publish it immediately?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blog-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review_note: 'Approved by admin.' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchRequests();
        fetchStats();
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (err) {
      alert('Error approving request');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Request Handler
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blog-requests/${rejectModal.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review_note: reviewNote }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRejectModal(null);
        setReviewNote('');
        fetchRequests();
        fetchStats();
      } else {
        alert(data.message || 'Failed to reject request');
      }
    } catch (err) {
      alert('Error rejecting request');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Verification Handler
  const handleToggleVerify = async (userId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_verified: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_verified: !currentStatus } : u)));
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating user');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? Their blogs will also be deleted.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter((u) => u.id !== userId));
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  // Delete Blog Handler (Admin)
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs(blogs.filter((b) => b.id !== blogId));
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete blog');
      }
    } catch (err) {
      alert('Error deleting blog');
    }
  };

  // --- Advertisement Helpers ---
  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }
    return url;
  };

  const openCreateAdModal = () => {
    setEditingAd(null);
    setAdTitle('Level Up with BlogHub Creator Studio');
    setAdDescription('Write markdown, embed HD videos, add code blocks, and reach thousands of passionate readers every week.');
    setAdMediaType('image');
    setAdMediaUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
    setAdBadgeText('Sponsored');
    setAdButtonText('Get Started Free');
    setAdTargetUrl('/register');
    setAdFeatures([
      'Instant 1-Click Publishing',
      'Real-time Reader Analytics',
      'Verified Creator Profile Badge'
    ]);
    setAdNewFeature('');
    setAdIsActive(true);
    setAdFeedback(null);
    setAdModalOpen(true);
  };

  const openEditAdModal = (ad) => {
    setEditingAd(ad);
    setAdTitle(ad.title || '');
    setAdDescription(ad.description || '');
    setAdMediaType(ad.media_type || 'image');
    setAdMediaUrl(ad.media_url || '');
    setAdBadgeText(ad.badge_text || 'Sponsored');
    setAdButtonText(ad.button_text || 'Learn More');
    setAdTargetUrl(ad.target_url || '/register');
    let feats = [];
    try {
      feats = typeof ad.features === 'string' ? JSON.parse(ad.features) : (Array.isArray(ad.features) ? ad.features : []);
    } catch (e) {
      feats = [];
    }
    setAdFeatures(feats.length > 0 ? feats : ['Instant 1-Click Publishing']);
    setAdNewFeature('');
    setAdIsActive(Boolean(ad.is_active));
    setAdFeedback(null);
    setAdModalOpen(true);
  };

  const handleAdImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAdFeedback({ type: 'error', message: 'Please upload an image file (PNG, JPG, WEBP, GIF).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAdMediaUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeature = () => {
    if (!adNewFeature.trim()) return;
    setAdFeatures([...adFeatures, adNewFeature.trim()]);
    setAdNewFeature('');
  };

  const handleRemoveFeature = (index) => {
    setAdFeatures(adFeatures.filter((_, i) => i !== index));
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    if (!adTitle.trim()) {
      setAdFeedback({ type: 'error', message: 'Advertisement title is required.' });
      return;
    }
    setSavingAd(true);
    setAdFeedback(null);

    try {
      const payload = {
        title: adTitle.trim(),
        description: adDescription.trim(),
        media_type: adMediaType,
        media_url: adMediaUrl ? adMediaUrl.trim() : null,
        badge_text: adBadgeText ? adBadgeText.trim() : 'Sponsored',
        button_text: adButtonText ? adButtonText.trim() : 'Learn More',
        target_url: adTargetUrl ? adTargetUrl.trim() : '/register',
        features: adFeatures,
        is_active: adIsActive,
      };

      const url = editingAd
        ? `${API_BASE_URL}/api/advertisements/admin/${editingAd.id}`
        : `${API_BASE_URL}/api/advertisements/admin/create`;
      const method = editingAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdFeedback({ type: 'success', message: data.message });
        fetchAds();
        setTimeout(() => {
          setAdModalOpen(false);
        }, 600);
      } else {
        setAdFeedback({ type: 'error', message: data.message || 'Failed to save advertisement.' });
      }
    } catch (err) {
      setAdFeedback({ type: 'error', message: 'Error saving advertisement.' });
    } finally {
      setSavingAd(false);
    }
  };

  const handleToggleAd = async (adId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements/admin/${adId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchAds();
      } else {
        alert(data.message || 'Failed to toggle ad');
      }
    } catch (err) {
      alert('Error toggling advertisement');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Delete this advertisement permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements/admin/${adId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(ads.filter((a) => a.id !== adId));
      } else {
        alert(data.message || 'Failed to delete advertisement');
      }
    } catch (err) {
      alert('Error deleting advertisement');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(blogSearch.toLowerCase()) ||
      b.author_name.toLowerCase().includes(blogSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 relative w-full max-w-full overflow-x-hidden">
      {/* FIXED PINNED ADMIN SIDEBAR (DOES NOT SCROLL AWAY WITH PAGE & SUPPORTS MINIMIZE/MAXIMIZE) */}
      <aside
        className={`bg-white border-r border-slate-200/90 flex flex-col shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-full md:w-20' : 'w-full md:w-64 lg:w-72'
        }`}
      >
        {/* Admin Branding in Sidebar with Minimize/Maximize Button */}
        <div className={`p-4 border-b border-slate-200/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.2 rounded-full">
                    Admin Portal
                  </span>
                </div>
                <h2 className="text-xs font-bold text-slate-900 truncate mt-0.5">{currentAdmin?.name}</h2>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0"
              title={`Admin Portal: ${currentAdmin?.name}`}
            >
              <Crown className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Desktop Minimize/Maximize Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Minimize Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Admin Management
            </div>
          )}

          <button
            onClick={() => setActiveTab('overview')}
            title="Overview & Stats"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-50 text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Overview & Stats</span>}
            </div>
            {!isCollapsed && <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'overview' ? 'text-purple-700' : ''}`} />}
          </button>

          <button
            onClick={() => setActiveTab('geo_analytics')}
            title="Geographic Engagement"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'geo_analytics'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              {!isCollapsed && <span>Geo Engagement</span>}
            </div>
            {isCollapsed ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                LIVE
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            title="Manage Requests"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-purple-50 text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span>Manage Requests</span>}
            </div>
            {isCollapsed ? (
              stats.pendingRequests > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                stats.pendingRequests > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('blogs')}
            title="Manage Blogs"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'blogs'
                ? 'bg-purple-50 text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              {!isCollapsed && <span>Manage Blogs</span>}
            </div>
            {isCollapsed ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'blogs' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {blogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            title="Manage Users"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-50 text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-purple-600 shrink-0" />
              {!isCollapsed && <span>Manage Users</span>}
            </div>
            {isCollapsed ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-600"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {users.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            title="Manage Advertisements"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ads'
                ? 'bg-purple-50 text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-pink-600 shrink-0" />
              {!isCollapsed && <span>Manage Ads</span>}
            </div>
            {isCollapsed ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-600"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'ads' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {ads.length}
              </span>
            )}
          </button>

          <div className="pt-4 mt-4 border-t border-slate-200/80">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Quick Shortcuts
              </div>
            )}
            <button
              onClick={refreshAll}
              title="Sync & Refresh Data"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3.5 py-2'} rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer`}
            >
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Sync Data</span>}
            </button>
            <Link
              to="/"
              title="Public Feed"
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3.5 py-2'} rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors`}
            >
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Public Feed</span>}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-3 border-t border-slate-200/80">
          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2 px-3.5 py-2.5'} rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (INDEPENDENTLY SCROLLS SMOOTHLY) */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
        {/* Top bar info */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'System Overview & Metrics'}
              {activeTab === 'geo_analytics' && 'Geographic Engagement & Telemetry'}
              {activeTab === 'requests' && 'Blog Approval Queue'}
              {activeTab === 'blogs' && 'All Published & Draft Blogs'}
              {activeTab === 'users' && 'User Accounts & Verification Directory'}
              {activeTab === 'ads' && 'Explore Cover Advertisements'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'overview' && 'Real-time database performance, engagement counters, and submission queues.'}
              {activeTab === 'geo_analytics' && 'Worldwide reader distribution, interactive map, country rankings, and reading depth.'}
              {activeTab === 'requests' && 'Review unverified author submissions and approve or reject with feedback.'}
              {activeTab === 'blogs' && 'Read, inspect, or delete any article on the platform.'}
              {activeTab === 'users' && 'Manage registered authors, grant 1-click verification, or remove accounts.'}
              {activeTab === 'ads' && 'Manage high-visibility promotional banners on the explore discovery page.'}
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="self-start sm:self-center px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* TAB: Geographic Analytics */}
        {activeTab === 'geo_analytics' && (
          <GeographicAnalyticsView token={token} />
        )}

        {/* TAB 0: Overview & Stats */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div 
                onClick={() => setActiveTab('requests')}
                className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-2xl p-4 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600">{stats.pendingRequests}</div>
              </div>

              <div 
                onClick={() => setActiveTab('blogs')}
                className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Published</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600">{stats.publishedBlogs}</div>
              </div>

              <div 
                onClick={() => setActiveTab('blogs')}
                className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-4 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Articles</span>
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{stats.totalBlogs}</div>
              </div>

              <div 
                onClick={() => setActiveTab('users')}
                className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-4 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Users</span>
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-700">{stats.totalUsers}</div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Likes</span>
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600">{stats.totalLikes || 0}</div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Comments</span>
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-600">{stats.totalComments || 0}</div>
              </div>
            </div>

            {/* Quick Pending Summary */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Recent Submissions Requiring Attention
                </h3>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                >
                  View all ({stats.pendingRequests})
                </button>
              </div>

              {requests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  🎉 No pending requests right now! Everything is reviewed.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.filter(r => r.status === 'pending').slice(0, 3).map(req => (
                    <div key={req.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{req.blog_title}</div>
                        <div className="text-[11px] text-slate-500">By {req.user_name} • {formatDate(req.created_at)}</div>
                      </div>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer shrink-0"
                      >
                        Quick Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: Manage Requests */}
        {activeTab === 'requests' && (() => {
          const pendingCount = requests.filter((r) => r.status === 'pending').length;
          const approvedCount = requests.filter((r) => r.status === 'approved').length;
          const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

          const filteredRequests = requests.filter((req) => {
            if (requestFilter !== 'all' && req.status !== requestFilter) return false;
            if (requestSearch.trim()) {
              const q = requestSearch.toLowerCase().trim();
              const matchTitle = (req.blog_title || '').toLowerCase().includes(q);
              const matchUser = (req.user_name || '').toLowerCase().includes(q) || (req.user_email || '').toLowerCase().includes(q);
              const matchCat = (req.blog_category || '').toLowerCase().includes(q) || (req.blog_sub_category || '').toLowerCase().includes(q);
              const matchContent = (req.blog_content || '').toLowerCase().includes(q);
              return matchTitle || matchUser || matchCat || matchContent;
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Queue Controls: Filter Tabs & Search Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setRequestFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      requestFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>All Submissions</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      requestFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {requests.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestFilter('pending')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      requestFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Pending Review</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      requestFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-900'
                    }`}>
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestFilter('approved')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      requestFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Approved</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      requestFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'
                    }`}>
                      {approvedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestFilter('rejected')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      requestFilter === 'rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Rejected</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      requestFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-200/80 text-rose-900'
                    }`}>
                      {rejectedCount}
                    </span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search title, author, category..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  {requestSearch && (
                    <button
                      type="button"
                      onClick={() => setRequestSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Requests List Area */}
              {loadingRequests ? (
                <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold">Loading submission queue...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <FileCheck className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {requestSearch ? 'No matching submissions found' : 'No requests in this view'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {requestSearch
                      ? `No articles match "${requestSearch}". Try searching for another keyword or author.`
                      : 'There are currently no article requests matching this filter criteria.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((req) => {
                    const cleanText = stripHtml(req.blog_content || '');
                    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
                    const readTimeMins = Math.max(1, Math.ceil(wordCount / 180));
                    const coverUrl = req.blog_cover_image || null;

                    return (
                      <div
                        key={req.id}
                        className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200 ${
                          req.status === 'pending'
                            ? 'border-amber-300 ring-2 ring-amber-100/80 bg-gradient-to-br from-white via-white to-amber-50/20'
                            : req.status === 'approved'
                            ? 'border-emerald-200/90'
                            : 'border-slate-200 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row gap-5 items-start justify-between">
                          {/* Main Article Details */}
                          <div className="flex-1 min-w-0 space-y-2.5">
                            {/* Top Meta Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Badge */}
                              {req.status === 'pending' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                                  Pending Review
                                </span>
                              )}
                              {req.status === 'approved' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Approved & Published
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Rejected
                                </span>
                              )}

                              {/* Category & Subcategory Pills */}
                              {req.blog_category && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {req.blog_category}
                                </span>
                              )}
                              {req.blog_sub_category && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {req.blog_sub_category}
                                </span>
                              )}

                              {/* Word Count / Read Time */}
                              <span className="text-[11px] text-slate-400">
                                • {readTimeMins} min read ({wordCount} words)
                              </span>
                            </div>

                            {/* Author & Timestamp */}
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {req.user_name ? req.user_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="font-semibold text-slate-900">{req.user_name}</span>
                              <span className="text-slate-400">({req.user_email})</span>
                              {req.user_is_verified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Verified
                                </span>
                              )}
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">{formatDate(req.created_at)}</span>
                            </div>

                            {/* Blog Title */}
                            <h3
                              onClick={() => setPreviewModalReq(req)}
                              className="text-base sm:text-lg font-bold text-slate-950 hover:text-indigo-600 transition-colors cursor-pointer leading-snug tracking-tight"
                            >
                              {req.blog_title}
                            </h3>

                            {/* Clean, Stripped Content Preview (NO HTML TAGS!) */}
                            <div className="relative bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                              <p className="line-clamp-3 font-sans">
                                {cleanText || 'No text content available in this submission.'}
                              </p>
                            </div>

                            {/* Tags preview if any */}
                            {Array.isArray(req.blog_tags) && req.blog_tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <TagIcon className="w-3 h-3 text-slate-400" />
                                {req.blog_tags.slice(0, 5).map((t, idx) => (
                                  <span key={idx} className="text-[10.5px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Review Note Callout if reviewed */}
                            {req.review_note && (
                              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                                req.status === 'rejected'
                                  ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                              }`}>
                                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                                <div>
                                  <strong className="font-bold">
                                    {req.reviewer_name ? `Review Note by ${req.reviewer_name}` : 'Admin Review Note'}:
                                  </strong>{' '}
                                  <span className="italic">"{req.review_note}"</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Cover Thumbnail Preview & Action Buttons Column */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 w-full lg:w-48">
                            {/* Optional Cover Image Thumbnail */}
                            {coverUrl && (
                              <div
                                onClick={() => setPreviewModalReq(req)}
                                className="w-full lg:w-44 aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs relative group cursor-pointer"
                              >
                                <img
                                  src={coverUrl}
                                  alt={req.blog_title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Preview
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => setPreviewModalReq(req)}
                                className="w-full px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Preview Article</span>
                              </button>

                              {req.status === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={actionLoading}
                                    className="w-full px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Publish</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectModal(req);
                                      setReviewNote('');
                                    }}
                                    disabled={actionLoading}
                                    className="w-full px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Reject...</span>
                                  </button>
                                </>
                              ) : req.status === 'approved' && req.blog_slug ? (
                                <Link
                                  to={getBlogUrl({
                                    slug: req.blog_slug,
                                    category: req.blog_category,
                                    sub_category: req.blog_sub_category,
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View Live Page</span>
                                </Link>
                              ) : (
                                <span className="text-[11px] text-center text-slate-400 font-semibold py-1">
                                  {req.status === 'rejected' ? 'Rejected with feedback' : 'Reviewed'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 2: Manage Blogs */}
        {activeTab === 'blogs' && (
          <div>
            <div className="mb-6 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter blogs by title or author..."
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            {loadingBlogs ? (
              <div className="py-12 text-center text-slate-500">Loading all blogs...</div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Title</th>
                        <th className="py-3.5 px-4 font-bold">Author</th>
                        <th className="py-3.5 px-4 font-bold">Status</th>
                        <th className="py-3.5 px-4 font-bold">Date</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBlogs.map((blog) => (
                        <tr key={blog.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                            {blog.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-semibold">{blog.author_name}</div>
                            <div className="text-[11px] text-slate-500">{blog.author_email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {blog.status === 'published' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Published
                              </span>
                            )}
                            {blog.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Pending
                              </span>
                            )}
                            {blog.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{formatDate(blog.created_at)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {blog.status === 'published' && (
                                <Link
                                  to={getBlogUrl(blog)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                                  title="View Public Blog"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              <button
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Delete Blog"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Manage Users */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
              />
            </div>

            {loadingUsers ? (
              <div className="py-12 text-center text-slate-500">Loading users...</div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">User</th>
                        <th className="py-3.5 px-4 font-bold">Role</th>
                        <th className="py-3.5 px-4 font-bold">Verification Status</th>
                        <th className="py-3.5 px-4 font-bold">Blogs Written</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-slate-500 text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                User
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {u.is_verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{u.blog_count} posts</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleToggleVerify(u.id, u.is_verified)}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                    u.is_verified
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.is_verified ? 'Revoke Verify' : 'Verify User'}
                                </button>
                              )}

                              {u.id !== currentAdmin?.id && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Manage Advertisements (Cover Page Spotlight & Banners) */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            {/* Header with Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Megaphone className="w-3 h-3 text-pink-600" />
                  Explore Cover Spotlight
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Manage Cover Advertisements & Videos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure sponsor spotlight banners, embedded video lessons, and promotional cards on the Explore page.
                </p>
              </div>

              <button
                onClick={openCreateAdModal}
                className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Advertisement</span>
              </button>
            </div>

            {/* Ads List */}
            {loadingAds ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading advertisements...</div>
            ) : ads.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-3">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Advertisements Configured</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Create your first cover advertisement to promote sponsors, courses, video tutorials, or platform features.
                </p>
                <button
                  onClick={openCreateAdModal}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Create First Advertisement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ads.map((ad) => {
                  let feats = [];
                  try {
                    feats = typeof ad.features === 'string' ? JSON.parse(ad.features) : (Array.isArray(ad.features) ? ad.features : []);
                  } catch (e) {
                    feats = [];
                  }

                  return (
                    <div
                      key={ad.id}
                      className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                        ad.is_active
                          ? 'border-pink-300 ring-2 ring-pink-100/70'
                          : 'border-slate-200/90 opacity-80'
                      }`}
                    >
                      <div>
                        {/* Status Bar */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 uppercase tracking-wider">
                              {ad.badge_text || 'Sponsored'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {ad.media_type === 'video' ? '🎥 Video' : ad.media_type === 'image' ? '🖼️ Image' : '✨ Graphic'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              ad.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ad.is_active ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                              {ad.is_active ? 'Active on Cover' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Media Preview Box */}
                        {ad.media_type === 'image' && ad.media_url && (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-4 relative">
                            <img
                              src={ad.media_url}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {ad.media_type === 'video' && ad.media_url && (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mb-4 relative">
                            {ad.media_url.includes('youtube.com') || ad.media_url.includes('youtu.be') || ad.media_url.includes('vimeo.com') ? (
                              <iframe
                                src={getVideoEmbedUrl(ad.media_url)}
                                title={ad.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={ad.media_url}
                                controls
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}

                        {ad.media_type === 'graphic' && (
                          <div className="h-28 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-4 border border-slate-800 mb-4 flex items-center justify-between text-white">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Graphic Spotlight</div>
                              <div className="text-sm font-black truncate max-w-xs">{ad.title}</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                              <Sparkles className="w-5 h-5" />
                            </div>
                          </div>
                        )}

                        {/* Title & Copy */}
                        <h3 className="text-base font-bold text-slate-900 mb-1">
                          {ad.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                          {ad.description}
                        </p>

                        {/* Feature Points */}
                        {feats && feats.length > 0 && (
                          <div className="space-y-1 mb-4">
                            {feats.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Target URL & Button */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between mb-4">
                          <div className="truncate max-w-[200px]">
                            <span className="text-slate-400 text-[10px] block uppercase font-bold">Target Link:</span>
                            <span className="text-indigo-600 font-semibold truncate block">{ad.target_url || '/register'}</span>
                          </div>
                          <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs">
                            "{ad.button_text || 'Learn More'}"
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ad.click_count || 0} clicks</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAd(ad.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                              ad.is_active
                                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {ad.is_active ? 'Deactivate' : 'Set as Active'}
                          </button>

                          <button
                            onClick={() => openEditAdModal(ad)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Advertisement"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Advertisement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE / EDIT ADVERTISEMENT MODAL (With Image & Video Support) */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-pink-600" />
                  {editingAd ? 'Edit Cover Advertisement' : 'Create New Cover Advertisement'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add promotional banners, images, or video spotlights to the Explore cover section.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {adFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  adFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {adFeedback.message}
                </div>
              )}

              <form id="adFormElement" onSubmit={handleSaveAd} className="space-y-4">
                {/* Ad Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Advertisement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Level Up with BlogHub Creator Studio"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none font-semibold"
                  />
                </div>

                {/* Ad Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description / Marketing Copy
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write a compelling 1-2 sentence subtitle or summary..."
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none leading-relaxed"
                  />
                </div>

                {/* Media Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cover Media Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdMediaType('image')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        adMediaType === 'image'
                          ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
                      <span>Image Cover</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdMediaType('video')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        adMediaType === 'video'
                          ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <VideoIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Video Cover</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdMediaType('graphic')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        adMediaType === 'graphic'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Glassmorphic</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Media Input */}
                {adMediaType === 'image' && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Image Source</label>
                      <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs">
                        <UploadCloud className="w-3 h-3 text-pink-600" />
                        Upload from Computer
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAdImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://...)"
                      value={adMediaUrl}
                      onChange={(e) => setAdMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-pink-500 outline-none"
                    />
                    {adMediaUrl && (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-white border border-slate-200 max-h-40">
                        <img src={adMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {adMediaType === 'video' && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Video URL (YouTube, Vimeo, or MP4)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={adMediaUrl}
                      onChange={(e) => setAdMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-purple-500 outline-none"
                    />
                    {adMediaUrl && (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-200 max-h-48">
                        {adMediaUrl.includes('youtube.com') || adMediaUrl.includes('youtu.be') || adMediaUrl.includes('vimeo.com') ? (
                          <iframe
                            src={getVideoEmbedUrl(adMediaUrl)}
                            title="Video Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : (
                          <video src={adMediaUrl} controls className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Badges & Button Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="Sponsored / Featured"
                      value={adBadgeText}
                      onChange={(e) => setAdBadgeText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-pink-500 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="Get Started Free"
                      value={adButtonText}
                      onChange={(e) => setAdButtonText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-pink-500 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target URL
                    </label>
                    <input
                      type="text"
                      placeholder="/register or https://..."
                      value={adTargetUrl}
                      onChange={(e) => setAdTargetUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-pink-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Key Bullet Highlights */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bullet Points / Features
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {adFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a new feature bullet (e.g. 24/7 Verified Support)..."
                      value={adNewFeature}
                      onChange={(e) => setAdNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-pink-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Set Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="adIsActiveCheckbox"
                    checked={adIsActive}
                    onChange={(e) => setAdIsActive(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
                  />
                  <label htmlFor="adIsActiveCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Activate immediately on the Explore Cover Page
                  </label>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setAdModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="adFormElement"
                disabled={savingAd}
                className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {savingAd ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingAd ? 'Save Changes' : 'Create Advertisement'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Article Review Preview Modal */}
      {previewModalReq && (() => {
        let parsedBlocks = [];
        if (Array.isArray(previewModalReq.blog_blocks)) {
          parsedBlocks = previewModalReq.blog_blocks;
        } else if (typeof previewModalReq.blog_blocks === 'string') {
          try {
            parsedBlocks = JSON.parse(previewModalReq.blog_blocks);
          } catch (e) {
            parsedBlocks = [];
          }
        }

        const cleanText = stripHtml(previewModalReq.blog_content || '');
        const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
        const readTimeMins = Math.max(1, Math.ceil(wordCount / 180));
        const coverUrl = previewModalReq.blog_cover_image || null;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Top Header Bar */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {previewModalReq.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Pending Approval
                    </span>
                  )}
                  {previewModalReq.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Approved
                    </span>
                  )}
                  {previewModalReq.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      Rejected
                    </span>
                  )}
                  {previewModalReq.blog_category && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-200/80 text-slate-800">
                      {previewModalReq.blog_category}
                    </span>
                  )}
                  {previewModalReq.blog_sub_category && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800">
                      {previewModalReq.blog_sub_category}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalReq(null)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Article Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 font-serif leading-tight">
                  {previewModalReq.blog_title}
                </h1>

                {/* Author Info Bar */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {previewModalReq.user_name ? previewModalReq.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <span>{previewModalReq.user_name}</span>
                        {previewModalReq.user_is_verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs">{previewModalReq.user_email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(previewModalReq.created_at)}</span>
                    <span>•</span>
                    <span>{readTimeMins} min read ({wordCount} words)</span>
                  </div>
                </div>

                {/* Cover Image if present */}
                {coverUrl && (
                  <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-xs">
                    <img
                      src={coverUrl}
                      alt={previewModalReq.blog_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Main Article Content */}
                <div className="prose prose-slate max-w-none text-slate-800 font-sans text-sm sm:text-base leading-relaxed space-y-4">
                  {parsedBlocks.length > 0 ? (
                    <ContentBlockRenderer blocks={parsedBlocks} />
                  ) : (
                    cleanText.split(/\n\n+/).map((para, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {para}
                      </p>
                    ))
                  )}
                </div>

                {/* Tags */}
                {Array.isArray(previewModalReq.blog_tags) && previewModalReq.blog_tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tagged Keywords:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {previewModalReq.blog_tags.map((t, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewModalReq(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Preview
                </button>

                <div className="flex items-center gap-2">
                  {previewModalReq.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const reqToReject = previewModalReq;
                          setPreviewModalReq(null);
                          setRejectModal(reqToReject);
                          setReviewNote('');
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                        Reject with Feedback
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const reqId = previewModalReq.id;
                          setPreviewModalReq(null);
                          await handleApprove(reqId);
                        }}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        Approve & Publish Now
                      </button>
                    </>
                  ) : previewModalReq.status === 'approved' && previewModalReq.blog_slug ? (
                    <Link
                      to={getBlogUrl({
                        slug: previewModalReq.blog_slug,
                        category: previewModalReq.blog_category,
                        sub_category: previewModalReq.blog_sub_category,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live Article
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Reject Blog Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide an optional note to explain to <strong>{rejectModal.user_name}</strong> why this post was rejected.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Review Note / Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please add more technical details or format your references properly."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
