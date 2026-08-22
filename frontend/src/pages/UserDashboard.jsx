import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import BlockEditor from '../components/BlockEditor';
import { stripHtml, getBlogUrl } from '../components/ContentBlockRenderer';
import { API_BASE_URL } from '../config';
import { 
  PenTool, 
  BookOpen, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  MessageSquare, 
  LogOut, 
  Globe, 
  ChevronRight, 
  ChevronLeft,
  Bookmark, 
  Heart, 
  Eye,
  Crown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function UserDashboard() {
  const { user, token, isVerified, isAdmin, logout, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('submit'); // 'submit', 'my-blogs', 'my-requests', 'saved'
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Submit Blog State - Initialized Cleanly
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('Technology');
  const [subCategory, setSubCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [blocks, setBlocks] = useState([
    { id: 'b-1', type: 'paragraph', content: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // My Blogs State
  const [myBlogs, setMyBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  // My Requests State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Saved Articles State
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Profile Settings State
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [twitterUrl, setTwitterUrl] = useState(user?.twitter_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Edit Blog State
  const [editingBlog, setEditingBlog] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editCategory, setEditCategory] = useState('Technology');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editBlocks, setEditBlocks] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Fetch My Blogs
  const fetchMyBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Failed to fetch my blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Fetch My Requests
  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/my/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Saved Bookmarks
  const fetchSavedBlogs = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedBlogs(data.bookmarks);
      }
    } catch (err) {
      console.error('Failed to fetch saved blogs:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const { socket } = useNotifications();

  useEffect(() => {
    fetchMyBlogs();
    fetchMyRequests();
    fetchSavedBlogs();
  }, []);

  // Real-time socket event subscription for author dashboard
  useEffect(() => {
    if (!socket) return;

    const handleBlogPublished = () => {
      fetchMyBlogs();
      fetchMyRequests();
    };

    const handleRequestsUpdated = () => {
      fetchMyBlogs();
      fetchMyRequests();
    };

    const handleBlogDeleted = () => {
      fetchMyBlogs();
      fetchMyRequests();
      fetchSavedBlogs();
    };

    socket.on('blog_published', handleBlogPublished);
    socket.on('blog_requests_updated', handleRequestsUpdated);
    socket.on('blog_deleted', handleBlogDeleted);

    return () => {
      socket.off('blog_published', handleBlogPublished);
      socket.off('blog_requests_updated', handleRequestsUpdated);
      socket.off('blog_deleted', handleBlogDeleted);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Remove Bookmark
  const handleRemoveBookmark = async (blogId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedBlogs(savedBlogs.filter((b) => b.id !== blogId));
      }
    } catch (err) {
      alert('Error removing bookmark');
    }
  };

  // Handle Blog Submission with Multimedia Blocks
  const handleSubmitBlog = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide an article title.');
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          cover_image: coverImage.trim() || null,
          category,
          sub_category: subCategory ? subCategory.trim() : null,
          tags,
          blocks,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitMessage(data.message);
        setTitle('');
        setCoverImage('');
        setSubCategory('');
        setTags([]);
        setBlocks([{ id: 'b-1', type: 'paragraph', content: '' }]);
        fetchMyBlogs();
        fetchMyRequests();
      } else {
        setSubmitError(data.message || 'Failed to submit blog');
      }
    } catch (err) {
      setSubmitError('Connection to server failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Blog
  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyBlogs(myBlogs.filter((b) => b.id !== id));
      } else {
        alert('Failed to delete blog');
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  // Handle Edit Blog
  const startEditBlog = (blog) => {
    setEditingBlog(blog);
    setEditTitle(blog.title);
    setEditCoverImage(blog.cover_image || '');
    setEditCategory(blog.category || 'Technology');
    setEditSubCategory(blog.sub_category || '');
    setEditTags(blog.tags || []);
    let parsedBlocks = [];
    if (Array.isArray(blog.blocks) && blog.blocks.length > 0) {
      parsedBlocks = blog.blocks;
    } else {
      parsedBlocks = [{ id: 'b-1', type: 'paragraph', content: blog.content }];
    }
    setEditBlocks(parsedBlocks);
  };

  // Save Edited Blog
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${editingBlog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          cover_image: editCoverImage.trim() || null,
          category: editCategory,
          sub_category: editSubCategory ? editSubCategory.trim() : null,
          tags: editTags,
          blocks: editBlocks,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyBlogs(myBlogs.map((b) => (b.id === editingBlog.id ? data.blog : b)));
        setEditingBlog(null);
      } else {
        alert(data.message || 'Failed to update');
      }
    } catch (err) {
      alert('Error updating blog');
    } finally {
      setSavingEdit(false);
    }
  };

  // Save Author Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: authorName,
          bio,
          avatar_url: avatarUrl,
          github_url: githubUrl,
          twitter_url: twitterUrl,
          website_url: websiteUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMessage('Your creator profile was updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setSavingProfile(false);
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

  const handleQuickAdminLogin = async () => {
    try {
      await login('admin@bloghub.com', 'admin123');
      navigate('/admin');
    } catch (err) {
      navigate('/login?tab=admin');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50 relative w-full max-w-full overflow-x-hidden">
      {/* FIXED PINNED SIDEBAR (DOES NOT SCROLL WITH PAGE & SUPPORTS MINIMIZE/MAXIMIZE) */}
      <aside
        className={`bg-white border-r border-slate-200/90 flex flex-col shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-full md:w-20' : 'w-full md:w-64 lg:w-72'
        }`}
      >
        {/* Sidebar Header with Collapse/Expand Toggle */}
        <div className={`p-4 border-b border-slate-200/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900 truncate">{user?.name}</h2>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-xs shrink-0"
              title={`${user?.name} (${user?.email})`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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

        {/* Verification Status Banner */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100">
            {isVerified ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Verified Author</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Unverified (Under Review)</span>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Nav Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Author Menu
            </div>
          )}

          {/* Admin Dashboard Option for Admins or Quick Switch */}
          {isAdmin ? (
            <div className="pb-1">
              <Link
                to="/admin"
                title="Open Administrator Management Dashboard"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition-all`}
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                  {!isCollapsed && <span>Admin Dashboard</span>}
                </div>
                {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            </div>
          ) : (
            <div className="pb-1">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                title="Switch to Administrator Dashboard"
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-purple-600 shrink-0" />
                  {!isCollapsed && <span>Admin Dashboard (Login)</span>}
                </div>
                {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab('submit')}
            title="Multimedia Studio"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PenTool className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Multimedia Studio</span>}
            </div>
            {!isCollapsed && <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'submit' ? 'text-indigo-600' : ''}`} />}
          </button>

          <button
            onClick={() => setActiveTab('my-blogs')}
            title="My Publications"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-blogs'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>My Publications</span>}
            </div>
            {isCollapsed ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'my-blogs' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {myBlogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('my-requests')}
            title="My Requests"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-requests'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>My Requests</span>}
            </div>
            {isCollapsed ? (
              myRequests.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'my-requests' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {myRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('saved');
              fetchSavedBlogs();
            }}
            title="Saved Articles"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Saved Articles</span>}
            </div>
            {isCollapsed ? (
              savedBlogs.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600"></span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'saved' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {savedBlogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            title="Profile & Bio"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Edit3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Profile & Bio</span>}
            </div>
            {!isCollapsed && <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'profile' ? 'text-indigo-600' : ''}`} />}
          </button>

          <div className="pt-4 mt-4 border-t border-slate-200/80">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Public Shortcuts
              </div>
            )}
            <Link
              to={`/author/${user?.id}`}
              title="My Public Profile"
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3.5 py-2'} rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors`}
            >
              <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
              {!isCollapsed && <span>My Public Profile</span>}
            </Link>

            <Link
              to="/"
              title="Explore Feed"
              className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-3.5 py-2'} rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors`}
            >
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Explore Feed</span>}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer (Logout & Toggle) */}
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
        {/* Admin Access Denied Banner */}
        {searchParams.get('adminDenied') && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-900 shadow-xs animate-in fade-in-50">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-purple-900">Administrator Access Restricted</h4>
                <p className="text-[11px] sm:text-xs text-purple-700 mt-0.5">
                  You are signed in as <strong>{user?.name}</strong> ({user?.email}) with standard <em>Creator</em> permissions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleQuickAdminLogin}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Switch to Admin Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Header info */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'submit' && 'Multimedia Publishing Studio'}
              {activeTab === 'my-blogs' && 'My Blog Publications'}
              {activeTab === 'my-requests' && 'Submission History & Approvals'}
              {activeTab === 'saved' && 'Saved Articles & Bookmarks'}
              {activeTab === 'profile' && 'Creator Profile & Bio Settings'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'submit' && 'Compose articles with code blocks, image galleries, video embeds, and live preview.'}
              {activeTab === 'my-blogs' && 'Manage, edit, or delete multimedia articles you have written.'}
              {activeTab === 'my-requests' && 'Track the status and review notes from administrators.'}
              {activeTab === 'saved' && 'Quick access to reading list and favorite posts.'}
              {activeTab === 'profile' && 'Customize your public author page, bio, and social links.'}
            </p>
          </div>
        </div>

        {/* TAB 1: Multimedia Studio / Submit */}
        {activeTab === 'submit' && (
          <div className="max-w-4xl">
            {submitMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{submitMessage}</span>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBlog} className="space-y-6">
              <BlockEditor
                title={title}
                setTitle={setTitle}
                coverImage={coverImage}
                setCoverImage={setCoverImage}
                category={category}
                setCategory={setCategory}
                subCategory={subCategory}
                setSubCategory={setSubCategory}
                tags={tags}
                setTags={setTags}
                blocks={blocks}
                setBlocks={setBlocks}
              />

              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="text-xs text-slate-500">
                  Publishing Pipeline:{' '}
                  <strong className={isVerified ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}>
                    {isVerified ? 'Direct 1-Click Publish' : 'Goes to Admin Review Queue'}
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4" />
                      {isVerified ? 'Publish Story Now' : 'Submit for Review'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: My Blogs */}
        {activeTab === 'my-blogs' && (
          <div>
            {loadingBlogs ? (
              <div className="py-12 text-center text-slate-500">Loading your blogs...</div>
            ) : myBlogs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No blogs written yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Select "Multimedia Studio" from the sidebar to publish your first post!
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Create a Blog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Cover Preview */}
                      {blog.cover_image && (
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {blog.category || 'Tech'}
                          </span>

                          <span className="text-[11px] text-slate-500">
                            {formatDate(blog.created_at)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {stripHtml(blog.content)}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            {blog.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                            {blog.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                            {blog.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      {blog.status === 'published' ? (
                        <Link
                          to={getBlogUrl(blog)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          View Live
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold">{blog.status}</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditBlog(blog)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Blog"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Blog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: My Requests */}
        {activeTab === 'my-requests' && (
          <div>
            {loadingRequests ? (
              <div className="py-12 text-center text-slate-500">Loading requests...</div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
                <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No requests submitted</h3>
                <p className="text-sm text-slate-500">
                  Any blog submission requiring admin review will show its status here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {myRequests.map((req) => (
                  <div
                    key={req.request_id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {req.request_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                        {req.request_status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved & Published
                          </span>
                        )}
                        {req.request_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          Submitted on {formatDate(req.requested_at)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{req.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{req.content}</p>

                      {/* Admin Review Note */}
                      {req.review_note && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-indigo-900">Admin Note:</strong> {req.review_note}
                          </div>
                        </div>
                      )}
                    </div>

                    {req.request_status === 'approved' && (
                      <Link
                        to={getBlogUrl(req)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 self-start md:self-center shrink-0 shadow-xs"
                      >
                        Read Live Post
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Saved Articles */}
        {activeTab === 'saved' && (
          <div>
            {loadingSaved ? (
              <div className="py-12 text-center text-slate-500">Loading saved articles...</div>
            ) : savedBlogs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
                <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">No saved articles yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Browse the Explore feed and save articles you want to read later!
                </p>
                <Link
                  to="/"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
                >
                  Explore Feed
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div>
                      {blog.cover_image && (
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">{blog.author_name}</span>
                          <button
                            onClick={() => handleRemoveBookmark(blog.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">
                          <Link to={getBlogUrl(blog)} className="hover:text-indigo-600">
                            {blog.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {stripHtml(blog.content)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          {blog.like_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                          {blog.comment_count || 0}
                        </span>
                      </div>

                      <Link
                        to={getBlogUrl(blog)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Read Article
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Profile & Bio Settings */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            {profileMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{authorName}</h3>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <Link
                  to={`/author/${user?.id}`}
                  target="_blank"
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors"
                >
                  <span>Preview Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Author Bio / Tagline
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell readers about yourself, your technical interests, and what you write about..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs leading-relaxed focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      GitHub URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Twitter / X URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://twitter.com/username"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Personal Portfolio / Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Edit Blog Modal with Multimedia BlockEditor */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Edit Multimedia Article
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <BlockEditor
                title={editTitle}
                setTitle={setEditTitle}
                coverImage={editCoverImage}
                setCoverImage={setEditCoverImage}
                category={editCategory}
                setCategory={setEditCategory}
                subCategory={editSubCategory}
                setSubCategory={setEditSubCategory}
                tags={editTags}
                setTags={setEditTags}
                blocks={editBlocks}
                setBlocks={setEditBlocks}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBlog(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
