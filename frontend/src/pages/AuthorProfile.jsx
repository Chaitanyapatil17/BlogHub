import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogCover, stripHtml, getBlogUrl } from '../components/ContentBlockRenderer';
import SpeedLoader from '../components/SpeedLoader';
import { useNotifications } from '../context/NotificationContext';
import { API_BASE_URL } from '../config';
import { 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  Eye, 
  Heart, 
  MessageSquare, 
  Globe, 
  Share2, 
  ArrowLeft, 
  Clock, 
  Search, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react';

export default function AuthorProfile() {
  const { id } = useParams();
  const { socket } = useNotifications();
  const [author, setAuthor] = useState(null);
  const [stats, setStats] = useState({ totalBlogs: 0, totalViews: 0, totalLikes: 0, totalComments: 0 });
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(() => {
    try {
      return localStorage.getItem(`following_author_${id}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`following_author_${id}`, String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    fetchAuthorProfile();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchAuthorProfile();
    };
    socket.on('blog_published', handleUpdate);
    socket.on('blog_deleted', handleUpdate);
    socket.on('blog_liked', handleUpdate);
    return () => {
      socket.off('blog_published', handleUpdate);
      socket.off('blog_deleted', handleUpdate);
      socket.off('blog_liked', handleUpdate);
    };
  }, [socket, id]);

  const fetchAuthorProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}/profile`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthor(data.author);
        setStats(data.stats);
        setBlogs(data.blogs);
      } else {
        setError(data.message || 'Author not found.');
      }
    } catch (err) {
      setError('Could not load author profile. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateReadTime = (content) => {
    if (!content) return '1 min read';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 180);
    return `${minutes} min read`;
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const totalPages = Math.ceil(filteredBlogs.length / PAGE_SIZE);
  const paginatedBlogs = filteredBlogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const leadBlog = blogs.length > 0 ? blogs[0] : null;
  const subBlogs = blogs.length > 1 ? blogs.slice(1, 3) : [];
  const authorCategories = [...new Set(blogs.map((b) => b.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpeedLoader text="Loading Creator Profile..." />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-xs">
          <h2 className="text-xl font-bold text-rose-800 mb-2">Creator Not Found</h2>
          <p className="text-sm text-rose-600 mb-6">{error || 'This creator profile could not be found.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 w-full max-w-full overflow-x-hidden">
      {/* Top Breadcrumb Nav */}
      <div className="max-w-6xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Explore
        </Link>
      </div>

      {/* 2-COLUMN ENHANCED HERO LAYOUT: [LEFT: PROFILE CARD MATCHING REFERENCE] | [RIGHT: TOP STORIES & STATS] */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* LEFT SIDE (5 COLS): SPECIALIST / DOCTOR STYLE PROFILE CARD (EXACT MATCH TO REFERENCE) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative">
            <div>
              {/* Top Section: Avatar + Name + Experience Badge + Subtitle + Rating */}
              <div className="flex items-start gap-4">
                {/* Round Avatar with Warm Amber Background */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-300 p-0.5 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-amber-500 text-white font-black text-2xl flex items-center justify-center">
                      {author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Name + Experience Pill Badge */}
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
                      {author.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/90 shrink-0">
                      {stats.totalBlogs > 5 ? '5+ Years on BlogHub' : 'Verified Author'}
                    </span>
                  </div>

                  {/* Subtitle / Role */}
                  <p className="text-xs text-slate-600 font-medium leading-snug line-clamp-1 mb-1.5">
                    {author.role === 'admin' ? 'Staff Editor & Lead Tech Author' : 'Editorial Writer — Tech, AI & Systems'}
                  </p>

                  {/* Rating Stars & Testimonials (Matching Reference) */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">4.9</span>
                    <span className="text-slate-500 text-[11px]">({stats.totalComments * 4 + 23} reader ratings)</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-3.5"></div>

              {/* Detail Rows */}
              <div className="space-y-2.5 text-xs">
                {/* Speaks / Languages */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Speaks:</span>
                  <span className="font-bold text-slate-900">Hindi, English</span>
                </div>

                {/* Followers & Follow Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Community:</span>
                    <span className="font-bold text-slate-900">
                      {isFollowing ? (stats.totalLikes * 12 + 1401).toLocaleString() : (stats.totalLikes * 12 + 1400).toLocaleString()} Followers
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">240 Following</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                      isFollowing
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-[#fef3eb] hover:bg-[#fde6d2] text-[#c2410c] border border-[#fed7aa]'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold leading-none">+</span>
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expertise Pill Tags (Matching Reference Pastel Peach/Amber Pills) */}
                <div>
                  <span className="font-semibold text-slate-600 block mb-1.5">Expertise:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(authorCategories.length > 0 ? authorCategories : ['System Design', 'AI & Code', 'Architecture', 'WebDev', 'DevOps']).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fef3eb] text-[#b45309] border border-[#fed7aa]/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Links Bar */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    {author.github_url && (
                      <a
                        href={author.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                        title="GitHub"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {author.twitter_url && (
                      <a
                        href={author.twitter_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                        title="Twitter / X"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {author.website_url && (
                      <a
                        href={author.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-red-600 border border-slate-200 transition-colors flex items-center"
                        title="Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={handleShare}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded border border-slate-200 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3 h-3 text-red-600" />
                    <span>{copied ? 'Copied!' : 'Share Profile'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section (Matching Reference: Next Available Slot & Orange CTA Button) */}
            <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-medium text-slate-500 block">Latest Status:</span>
                <span className="text-xs font-bold text-[#c2410c] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#ea580c]" />
                  Active on Wire Today
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('publications-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>View Publications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE (7 COLS): LATEST STORIES DISPATCH & METRICS */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-600">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  <span>Top Stories by {author.name}</span>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  Latest Wire
                </span>
              </div>

              {leadBlog ? (
                <div className="space-y-3">
                  {/* Lead Story (Compact Horizontal/Landscape Card) */}
                  <article className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 hover:border-red-300 transition-all group flex flex-col sm:flex-row gap-3.5">
                    <Link
                      to={getBlogUrl(leadBlog)}
                      className="w-full sm:w-44 h-28 sm:h-24 rounded-lg overflow-hidden bg-slate-200 relative shrink-0 block"
                    >
                      {getBlogCover(leadBlog)?.url ? (
                        <img
                          src={getBlogCover(leadBlog).url}
                          alt={leadBlog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white text-xs font-bold p-2 text-center">
                          {leadBlog.title}
                        </div>
                      )}
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow-xs">
                        {leadBlog.category || 'News'}
                      </span>
                    </Link>

                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-medium mb-1">
                          <span>{new Date(leadBlog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span>{calculateReadTime(leadBlog.content)}</span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-1">
                          <Link to={getBlogUrl(leadBlog)}>{leadBlog.title}</Link>
                        </h3>

                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                          {stripHtml(leadBlog.content)}
                        </p>
                      </div>

                      <div className="pt-1.5 mt-1 border-t border-slate-200/60 flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-400" />
                          {leadBlog.views || 0} reads
                        </span>
                        <Link to={getBlogUrl(leadBlog)} className="text-red-600 font-bold hover:underline">
                          Read Story →
                        </Link>
                      </div>
                    </div>
                  </article>

                  {/* Sub-Stories Grid (2 Mini Cards Side by Side) */}
                  {subBlogs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {subBlogs.map((sb) => (
                        <article
                          key={sb.id}
                          className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 hover:border-red-300 transition-all group flex items-start gap-2.5"
                        >
                          <Link
                            to={getBlogUrl(sb)}
                            className="w-16 h-14 rounded-lg overflow-hidden bg-slate-200 relative shrink-0 block"
                          >
                            {getBlogCover(sb)?.url ? (
                              <img
                                src={getBlogCover(sb).url}
                                alt={sb.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-800 text-white text-[9px] flex items-center justify-center p-1 text-center font-bold">
                                {sb.title}
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-red-600 uppercase block mb-0.5">
                              {sb.category || 'Report'}
                            </span>
                            <h4 className="text-[11.5px] font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                              <Link to={getBlogUrl(sb)}>{sb.title}</Link>
                            </h4>
                            <span className="text-[9.5px] text-slate-400 font-medium mt-1 block">
                              {calculateReadTime(sb.content)} • {sb.views || 0} reads
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <BookOpen className="w-8 h-8 text-slate-300 mb-1" />
                  <p className="text-xs text-slate-500">No stories published yet.</p>
                </div>
              )}
            </div>

            {/* 4 AGGREGATED METRIC TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <BookOpen className="w-3 h-3 text-red-600" />
                  <span className="font-semibold">Articles</span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">{stats.totalBlogs}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <Eye className="w-3 h-3 text-slate-600" />
                  <span className="font-semibold">Total Reads</span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900">{stats.totalViews}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span className="font-semibold">Likes</span>
                </div>
                <div className="text-base sm:text-lg font-black text-rose-600">{stats.totalLikes}</div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                  <MessageSquare className="w-3 h-3 text-indigo-600" />
                  <span className="font-semibold">Comments</span>
                </div>
                <div className="text-base sm:text-lg font-black text-indigo-600">{stats.totalComments}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* AUTHOR'S PUBLISHED ARTICLES FEED */}
      <div id="publications-feed" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Publications by {author.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore all multimedia articles and guides written by this creator ({filteredBlogs.length} total).
            </p>
          </div>

          {/* Search bar within creator's posts */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in publications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-2xs"
            />
          </div>
        </div>

        {paginatedBlogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No articles found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'No publications match your filter.' : 'This creator has not published any articles yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBlogs.map((blog) => {
              const cover = getBlogCover(blog);

              return (
                <article
                  key={blog.id}
                  className="bg-white hover:border-red-300 border border-slate-200/90 rounded-none overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md group"
                >
                  <div>
                    {/* Thumbnail */}
                    <Link to={getBlogUrl(blog)} className="block aspect-[16/10] w-full bg-slate-100 overflow-hidden relative rounded-none">
                      {cover && cover.url ? (
                        <img
                          src={cover.url}
                          alt={blog.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-slate-900 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
                          {blog.title}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs border border-white/40">
                          {blog.category || 'Technology'}
                        </span>
                      </div>
                    </Link>

                    {/* Card Content */}
                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {calculateReadTime(blog.content)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-2 leading-snug">
                        <Link to={getBlogUrl(blog)}>{blog.title}</Link>
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {stripHtml(blog.content)}
                      </p>

                      {/* Tag Chips */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {blog.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Reactions Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1" title="Views">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {blog.views || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Likes">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                        {blog.like_count || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Comments">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        {blog.comment_count || 0}
                      </span>
                    </div>

                    <Link
                      to={getBlogUrl(blog)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Read
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS (AFTER 6 BLOGS) */}
        {totalPages > 1 && (
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * PAGE_SIZE, filteredBlogs.length)}</span> of{' '}
              <span className="font-bold text-slate-900">{filteredBlogs.length}</span> publications
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  const el = document.getElementById('publications-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      const el = document.getElementById('publications-feed');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  const el = document.getElementById('publications-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
