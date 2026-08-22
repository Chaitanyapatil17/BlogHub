import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ContentBlockRenderer, { getBlogCover, getEmbedUrl, getBlogUrl } from '../components/ContentBlockRenderer';
import SpeedLoader from '../components/SpeedLoader';
import { API_BASE_URL } from '../config';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Send, 
  Trash2, 
  Eye, 
  Tag as TagIcon,
  Sparkles,
  ExternalLink,
  BookOpen,
  Flame,
  Zap,
  Play,
  Check,
  Mail,
  TrendingUp,
  Layers,
  Award,
  Users,
  Compass,
  ChevronRight,
  X,
  Vote,
  Radio,
  Copy,
  Smartphone
} from 'lucide-react';
import { logAnalyticsEvent, createReadingTimeTracker } from '../utils/analyticsTracker';

// Social Platform Branded Icons
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.531 1.771.785 2.791.786 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.772-5.77-5.772zm3.374 8.211c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.879-.443-1.464-.606-2.42-2.073-2.493-2.17-.073-.099-.604-.805-.604-1.537 0-.733.383-1.094.52-1.241.144-.153.314-.191.419-.191.104 0 .209.001.3.006.096.005.225-.037.351.268.131.317.447 1.09.486 1.17.039.079.065.172.013.277-.052.106-.078.172-.157.264-.079.092-.167.206-.239.277-.079.079-.161.164-.069.322.092.158.409.675.877 1.092.603.537 1.111.704 1.269.782.158.078.25.069.342-.036.093-.105.397-.462.502-.62.105-.158.21-.132.353-.079.144.053.914.431 1.071.51.157.079.262.118.3.184.039.066.039.384-.105.789z" />
      <path d="M12.012 2c-5.508 0-9.988 4.478-9.99 9.984 0 1.764.46 3.486 1.333 5.003l-1.417 5.179 5.305-1.391c1.461.797 3.111 1.217 4.769 1.218 5.51 0 9.988-4.478 9.99-9.984 0-5.508-4.48-9.99-9.99-9.99zm0 18.315c-1.493 0-2.955-.401-4.232-1.158l-.304-.18-3.146.825.84-3.067-.198-.315c-.833-1.325-1.273-2.868-1.273-4.441.002-4.593 3.74-8.329 8.334-8.329 4.592 0 8.33 3.738 8.33 8.333-.002 4.594-3.74 8.332-8.351 8.332z" />
    </svg>
  );
}

function TwitterXIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverError, setCoverError] = useState(false);

  // Social states
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reading scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Trending recommendations
  const [trending, setTrending] = useState([]);

  // Sidebar Reader Poll state
  const [pollVoted, setPollVoted] = useState(null);

  // Video Modal Player State
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress(Number((totalScroll / windowHeight).toFixed(2)) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch blog data, all blogs, and trending
  useEffect(() => {
    const fetchBlogData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/blogs/${slug}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setBlog(data.blog);
          setLikeCount(parseInt(data.blog.like_count || 0, 10));

          // Increment view count
          fetch(`${API_BASE_URL}/api/blogs/${data.blog.id}/view`, { method: 'POST' }).catch(() => {});

          // Fetch social state if logged in
          if (token) {
            fetchSocialStatus(data.blog.id);
          }

          // Fetch comments
          fetchComments(data.blog.id);
        } else {
          setError(data.message || 'Blog not found');
        }
      } catch (err) {
        setError('Failed to connect to backend server');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogData();
    fetchTrending();
    fetchAllBlogs();
  }, [slug, token]);

  // Track active article reading time & article view event
  useEffect(() => {
    if (!blog?.id) return;
    const tracker = createReadingTimeTracker(blog.id, blog.category, window.location.pathname);
    return () => {
      tracker.stop();
    };
  }, [blog?.id]);

  const { socket } = useNotifications();

  // Socket room joining and real-time interaction listeners
  useEffect(() => {
    if (!socket || !blog) return;

    socket.emit('join_blog', blog.id);
    if (slug) socket.emit('join_blog', slug);

    const handleCommentAdded = ({ blogId, comment }) => {
      if ((blogId && (blogId === blog.id || parseInt(blogId, 10) === blog.id)) || (comment && comment.blog_id === blog.id)) {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleCommentDeleted = ({ blogId, commentId }) => {
      if (blogId && (blogId === blog.id || parseInt(blogId, 10) === blog.id)) {
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.id !== parseInt(commentId, 10)));
      }
    };

    const handleBlogLiked = ({ blogId, likeCount: newCount, userId, isLiked }) => {
      if (blogId && (blogId === blog.id || parseInt(blogId, 10) === blog.id)) {
        setLikeCount(newCount);
        if (user && userId === user.id) {
          setLiked(isLiked);
        }
      }
    };

    socket.on('comment_added', handleCommentAdded);
    socket.on('comment_deleted', handleCommentDeleted);
    socket.on('blog_liked', handleBlogLiked);

    return () => {
      socket.emit('leave_blog', blog.id);
      if (slug) socket.emit('leave_blog', slug);
      socket.off('comment_added', handleCommentAdded);
      socket.off('comment_deleted', handleCommentDeleted);
      socket.off('blog_liked', handleBlogLiked);
    };
  }, [socket, blog, slug, user]);

  const fetchTrending = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/trending`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrending(data.trending || []);
      }
    } catch (err) {}
  };

  const fetchAllBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.blogs)) {
        setAllBlogs(data.blogs);
      }
    } catch (err) {}
  };

  const fetchSocialStatus = async (blogId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/social-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLiked(data.liked);
        setBookmarked(data.bookmarked);
      }
    } catch (err) {}
  };

  const fetchComments = async (blogId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blogId}/comments`);
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.comments);
      }
    } catch (err) {}
  };

  // Toggle Like
  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like this blog!');
      return;
    }
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blog.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        if (data.liked) {
          logAnalyticsEvent({ blogId: blog.id, category: blog.category, eventType: 'like' });
        }
      } else {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  // Toggle Bookmark
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      alert('Please log in to save this article!');
      return;
    }
    const prevBookmarked = bookmarked;
    setBookmarked(!prevBookmarked);

    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blog.id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookmarked(data.bookmarked);
        if (data.bookmarked) {
          logAnalyticsEvent({ blogId: blog.id, category: blog.category, eventType: 'bookmark' });
        }
      } else {
        setBookmarked(prevBookmarked);
      }
    } catch (err) {
      setBookmarked(prevBookmarked);
    }
  };

  // Share Modal & Platform Handlers
  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyPageUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    logAnalyticsEvent({ blogId: blog?.id, category: blog?.category, eventType: 'share' });
    setTimeout(() => setShareCopied(false), 2500);
  };

  const shareToPlatform = (platform) => {
    logAnalyticsEvent({ blogId: blog?.id, category: blog?.category, eventType: 'share' });
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog ? `${blog.title} | BlogHub Newsroom` : 'BlogHub');

    let targetUrl = '';
    switch (platform) {
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${title}%20-%20${url}`;
        break;
      case 'twitter':
        targetUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'linkedin':
        targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
      case 'email':
        targetUrl = `mailto:?subject=${title}&body=I%20thought%20you%20might%20find%20this%20interesting:%20${url}`;
        break;
      default:
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer,width=640,height=560');
    }
  };

  const handleNativeShare = async () => {
    logAnalyticsEvent({ blogId: blog?.id, category: blog?.category, eventType: 'share' });
    if (navigator.share && blog) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.lead_summary || blog.title,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      copyPageUrl();
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to post a comment!');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${blog.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        logAnalyticsEvent({ blogId: blog.id, category: blog.category, eventType: 'comment' });
      } else {
        alert(data.message || 'Failed to post comment');
      }
    } catch (err) {
      alert('Error posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateDetailed = (dateStr) => {
    if (!dateStr) return 'August 18, 2026 11:07 am IST';
    const d = new Date(dateStr);
    const formattedDate = d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formattedDate} ${formattedTime} IST`;
  };

  const stripHtml = (html = '') => {
    if (!html) return '';
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/p>|<br\s*\/?>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  };

  const calculateReadTime = (content) => {
    if (!content) return '2 min read';
    const clean = stripHtml(content);
    const words = clean.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    return url;
  };

  const CURATED_MOST_POPULAR = [
    {
      id: 'mp-1',
      title: 'Vessel struck by unknown projectile in Strait of Hormuz, crew casualty reported, UKMTO says',
      category: 'World News',
      cover_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
      to: '/?search=Strait%20of%20Hormuz'
    },
    {
      id: 'mp-2',
      title: 'With four months left for deadline, only 50% of work on T3 Terminal completed',
      category: 'Infrastructure',
      cover_image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
      to: '/?search=Terminal%20Project'
    },
    {
      id: 'mp-3',
      title: 'Ram Temple donations theft: SC says ball is in SIT court, suggestions directed to Solicitor',
      category: 'National',
      cover_image: 'https://images.unsplash.com/photo-1590059390046-54a8e29a98ef?auto=format&fit=crop&w=400&q=80',
      to: '/?search=Ram%20Temple'
    },
    {
      id: 'mp-4',
      title: 'Rupee falls 17 paise to 95.59 against U.S. dollar in early morning currency trade',
      category: 'Economy',
      cover_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
      to: '/?search=Rupee%20Dollar'
    },
    {
      id: 'mp-5',
      title: 'Auto-rickshaw driver from Vizag wins accolades for offering free transport service to pregnant women',
      category: 'Human Interest',
      cover_image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80',
      to: '/?search=Vizag%20Story'
    }
  ];

  // Video Stories Data
  const VIDEO_STORIES = [
    {
      id: 'vs-1',
      title: 'Inside DeepMind’s Quantum AI Supercluster: Next-Gen Compute Architecture',
      author_name: 'Dr. Elena Rostova',
      duration: '8:45',
      views: '142k',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'vs-2',
      title: 'How High-Frequency Trading Systems Process 10 Million Orders Per Second',
      author_name: 'Marcus Vance',
      duration: '12:20',
      views: '98k',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'vs-3',
      title: 'Building Resilient Global Distributed Systems with PostgreSQL & Raft',
      author_name: 'Chaitanya Sharma',
      duration: '15:10',
      views: '230k',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'vs-4',
      title: 'Microservices vs Modular Monolith: Real Production Benchmarks 2026',
      author_name: 'Dev Insights',
      duration: '6:50',
      views: '76k',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpeedLoader text="Preparing story..." />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-none p-8 shadow-xs">
          <h2 className="text-xl font-bold text-rose-800 mb-2">Article Not Found</h2>
          <p className="text-sm text-rose-600 mb-6">{error || "This article may be pending review or deleted."}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-none shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore Feed
          </Link>
        </div>
      </div>
    );
  }

  // Determine photo caption, photo credit, and photo date
  const photoCaption = blog.photo_caption || (
    blog.category === 'Sports'
      ? 'A view of stadium players, officials and state tournament facilities'
      : blog.category === 'Entertainment'
      ? 'A view of feature film sets and director interview session'
      : blog.category === 'Recipes & Food'
      ? 'A view of freshly harvested whole spices and culinary kitchen preparations'
      : `A view representing editorial coverage of ${blog.title}`
  );

  const photoCredit = blog.photo_credit || (
    blog.category === 'Sports' ? 'ANI / Sports Bureau'
    : blog.category === 'Entertainment' ? 'PTI / Entertainment Desk'
    : blog.category === 'World News' ? 'Reuters / International Press'
    : 'PTI / BlogHub Newsroom Archive'
  );

  const photoDate = formatDate(blog.created_at || new Date().toISOString());

  // Lead summary extraction with robust HTML tag stripping
  const rawLeadSource = blog.lead_summary || (
    blog.blocks && blog.blocks.find((b) => b.type === 'paragraph' && b.content && b.content.length > 20)?.content
  ) || (blog.content || '');

  const cleanLeadText = stripHtml(rawLeadSource);
  const firstLeadPara = cleanLeadText.split('\n\n')[0] || cleanLeadText;
  const leadSummary = firstLeadPara.length > 280 ? firstLeadPara.slice(0, 280).trim() + '...' : firstLeadPara;

  // Popular list merging backend trending blogs with curated items
  const popularList = trending && trending.length > 0
    ? [
        ...trending.filter((t) => t.id !== blog.id).map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category || 'Trending',
          cover_image: t.cover_image,
          slug: t.slug,
          views: t.views
        })),
        ...CURATED_MOST_POPULAR
      ].slice(0, 5)
    : CURATED_MOST_POPULAR;

  // 1. Related Blogs (same category or general, excluding current blog)
  const categoryMatched = allBlogs.filter((b) => b.id !== blog.id && b.category === blog.category);
  const generalFallback = allBlogs.filter((b) => b.id !== blog.id);
  const relatedBlogsList = (categoryMatched.length >= 4 ? categoryMatched : [...categoryMatched, ...generalFallback.filter(f => !categoryMatched.some(c => c.id === f.id))]).slice(0, 4);

  // 2. Next and Previous Stories Switcher
  const currentIndex = allBlogs.findIndex((b) => b.id === blog.id);
  const prevBlog = currentIndex > 0 ? allBlogs[currentIndex - 1] : (allBlogs.length > 1 ? allBlogs[allBlogs.length - 1] : null);
  const nextBlog = currentIndex >= 0 && currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : (allBlogs.length > 0 ? allBlogs[0] : null);

  // 3. More from this author
  const moreAuthorBlogs = allBlogs
    .filter((b) => b.author_id === blog.author_id && b.id !== blog.id)
    .slice(0, 3);

  // 4. Editor's Picks (Ranked 01, 02, 03)
  const editorsPicks = allBlogs
    .filter((b) => b.id !== blog.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900 pb-20 w-full max-w-full overflow-x-hidden">
      {/* Scroll Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-red-600 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      {/* BROADSHEET ARTICLE CONTAINER */}
      <div className="max-w-[1360px] mx-auto px-3 sm:px-5 lg:px-8 pt-5 sm:pt-7">
        
        {/* 1. TOP BREADCRUMB NAVIGATION */}
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 select-none">
          <Link to="/" className="hover:text-red-600 transition-colors">HOME</Link>
          <span className="text-slate-300">/</span>
          <Link to={`/?category=${encodeURIComponent(blog.category || 'News')}`} className="hover:text-red-600 transition-colors">
            {(blog.category || 'News').toUpperCase()}
          </Link>
          {(blog.sub_category || blog.subcategory) && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-bold">
                {(blog.sub_category || blog.subcategory).toUpperCase()}
              </span>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-red-600 font-black truncate max-w-[280px] sm:max-w-md">
            {blog.title.toUpperCase()}
          </span>
        </nav>

        {/* 2. MAIN HEADLINE TITLE */}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-[40px] font-bold text-slate-900 leading-[1.18] tracking-tight mb-3">
          {blog.title}
        </h1>

        {/* 3. LEAD EXECUTIVE SUMMARY SUBHEADING */}
        {leadSummary && (
          <p className="font-sans text-sm sm:text-base lg:text-lg text-slate-700 font-semibold leading-relaxed mb-4 border-l-4 border-red-600 pl-3.5 sm:pl-4 bg-slate-100/70 py-2">
            {leadSummary}
          </p>
        )}

        {/* 4. METADATA TIMESTAMP, AUTHOR & QUICK ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-y border-slate-200/90 text-xs text-slate-600 mb-6 bg-white px-3">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="font-bold text-red-600 uppercase text-[11px] tracking-wider">Updated</span>
            <span className="text-slate-300">—</span>
            <span className="text-slate-700">{formatDateDetailed(blog.created_at)}</span>
            <span className="text-slate-300">—</span>
            <span className="font-bold text-slate-800">{blog.location || 'New Delhi / Bureau'}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-slate-900">{photoCredit.split('/')[0].trim()}</span>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <a
              href="#comments-section"
              className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 transition-colors"
              title="Jump to reader discussion"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>{comments.length}</span>
            </a>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                bookmarked ? 'text-red-600 font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
              title={bookmarked ? 'Saved in reading list' : 'Save for later reading'}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-red-600 text-red-600' : ''}`} />
              <span className="uppercase text-[11px] font-bold">{bookmarked ? 'SAVED' : 'READ LATER'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Copy link to clipboard"
            >
              <Share2 className="w-4 h-4" />
              <span className="uppercase text-[11px] font-bold">{shareCopied ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>
        </div>

        {/* 5. MAIN 2-COLUMN BROADSHEET LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT: MAIN ARTICLE CONTENT COLUMN (col-span-8) */}
          <article className="lg:col-span-8 space-y-6">
            
            {/* FEATURED COVER IMAGE WITH PHOTO CAPTION, DATE & CREDIT */}
            {blog.cover_image && !coverError && (
              <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
                <div className="aspect-[16/10] sm:aspect-[16/9] w-full max-h-[500px] overflow-hidden bg-slate-100">
                  <img
                    src={blog.cover_image}
                    alt={blog.title}
                    onError={() => setCoverError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                {/* Photo Caption, Date, and Photo Credit Bar */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-normal text-slate-700">
                    {photoCaption}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0 text-[11px]">
                    Photo Credit: {photoCredit} | Date: {photoDate}
                  </span>
                </div>
              </div>
            )}

            {/* EXECUTIVE KEY TAKEAWAYS CALLOUT BOX */}
            <div className="p-4 sm:p-5 bg-stone-50 border-l-4 border-stone-800 border-y border-r border-stone-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Key Editorial Takeaways</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200">
                  {calculateReadTime(blog.content)}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold leading-none mt-0.5">•</span>
                  <span>Comprehensive analysis on <strong>{blog.category || 'current trends'}</strong> and strategic implications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold leading-none mt-0.5">•</span>
                  <span>Primary reporting filed directly by verified correspondent <strong>{blog.author_name}</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold leading-none mt-0.5">•</span>
                  <span>Real-time discussion and reader perspectives open in the live community wire below.</span>
                </li>
              </ul>
            </div>

            {/* ARTICLE BODY CONTENT (Blocks & Markdown) */}
            <div className="bg-white border border-slate-200 p-5 sm:p-8 lg:p-10 shadow-xs">
              <div className="prose prose-slate max-w-none text-slate-800 text-base sm:text-lg leading-relaxed">
                <ContentBlockRenderer blocks={blog.blocks} fallbackContent={blog.content} />
              </div>

              {/* INLINE MID-ARTICLE BANNER ADVERTISEMENT */}
              <div className="my-8 p-3 bg-slate-50 border border-slate-200 select-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  ADVERTISEMENT
                </div>
                <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-amber-50/80 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="px-3 py-1.5 bg-blue-700 text-white font-black text-xs rounded-none shadow-xs shrink-0">
                      INDEL MONEY
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight">
                        PUBLIC ISSUE OF SECURED, RATED, LISTED, REDEEMABLE NON-CONVERTIBLE DEBENTURES
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Credit Rating: <strong className="text-amber-800 font-bold">IND A-/Stable</strong> • IndiaRatings & Research
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Effective yield of</div>
                      <div className="text-xl sm:text-2xl font-black text-blue-800">12.25%*</div>
                    </div>
                    <button
                      onClick={() => alert('Advertisement campaign: Indel Money Secured Debentures issue open until August 31, 2026.')}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      Apply Online
                    </button>
                  </div>
                </div>
              </div>

              {/* TAGS LIST */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <TagIcon className="w-3.5 h-3.5" /> Tags:
                  </span>
                  {blog.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/?tag=${encodeURIComponent(t)}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold border border-slate-200 transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* INLINE SOCIAL SHARE BAR */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Share this report:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => shareToPlatform('whatsapp')}
                    className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-transform hover:scale-102 cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyPageUrl}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-transform hover:scale-102 cursor-pointer"
                    title="Copy link to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{shareCopied ? 'Copied! ✓' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => shareToPlatform('twitter')}
                    className="px-2.5 py-1 bg-black hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-transform hover:scale-102 cursor-pointer"
                    title="Share on X (Twitter)"
                  >
                    <TwitterXIcon className="w-3.5 h-3.5 fill-white" />
                    <span>X</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => shareToPlatform('linkedin')}
                    className="px-2.5 py-1 bg-[#0A66C2] hover:bg-[#095196] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-transform hover:scale-102 cursor-pointer"
                    title="Share on LinkedIn"
                  >
                    <LinkedInIcon className="w-3.5 h-3.5 fill-white" />
                    <span>LinkedIn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors cursor-pointer"
                    title="More sharing options"
                  >
                    All Options →
                  </button>
                </div>
              </div>

            </div>

            {/* PREVIOUS & NEXT STORY BROADSHEET SWITCHER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevBlog && (
                <Link
                  to={getBlogUrl(prevBlog)}
                  className="bg-white border border-slate-200 p-4 hover:border-red-400 transition-colors group flex items-start gap-3 shadow-2xs"
                >
                  <ArrowLeft className="w-5 h-5 text-red-600 shrink-0 mt-1 group-hover:-translate-x-1 transition-transform" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Previous Story</span>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {prevBlog.title}
                    </h5>
                  </div>
                </Link>
              )}

              {nextBlog && (
                <Link
                  to={getBlogUrl(nextBlog)}
                  className="bg-white border border-slate-200 p-4 hover:border-red-400 transition-colors group flex items-start justify-between gap-3 shadow-2xs text-right sm:col-start-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Next Story</span>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {nextBlog.title}
                    </h5>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-600 shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* 6. READER SUBSCRIPTION / ENGAGEMENT CALLOUT BOX */}
            <div className="p-6 sm:p-8 bg-white border border-slate-200 text-center space-y-3 shadow-xs">
              <p className="text-xs sm:text-sm text-slate-500 italic">
                Get a taste of our premium journalism.
              </p>
              <p className="text-sm sm:text-base text-slate-900">
                <Link to="/register" className="font-bold text-red-600 hover:underline">
                  Register for free
                </Link>{' '}
                to continue reading this article and discover more of what we offer.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 max-w-lg mx-auto text-left text-xs font-semibold text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Premium & Archive Access</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Weekly Curated Newsletters</span>
                </div>
              </div>
            </div>

            {/* 7. WHO POSTED THIS BLOG (ONLY BLOGGER NAME - CLICKABLE TO PROFILE) */}
            <div className="bg-white border border-slate-200/90 p-4 sm:p-5 shadow-xs flex items-center gap-3.5 group">
              <Link
                to={`/author/${blog.author_id}`}
                className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-base flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title={`View ${blog.author_name}'s Profile`}
              >
                {blog.author_name ? blog.author_name.charAt(0).toUpperCase() : 'B'}
              </Link>
              <div className="min-w-0">
                <span className="text-[10.5px] font-black text-red-600 uppercase tracking-wider block mb-0.5">
                  Posted By
                </span>
                <h4 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                  <Link
                    to={`/author/${blog.author_id}`}
                    className="hover:text-red-600 hover:underline transition-colors"
                  >
                    {blog.author_name || 'Anonymous Blogger'}
                  </Link>
                </h4>
              </div>
            </div>

            {/* 8. COMMENTS & LIVE DISCUSSION SECTION */}
            <section id="comments-section" className="bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
                <h3 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  <span>Reader Discussion ({comments.length})</span>
                </h3>
                <span className="text-xs text-slate-500">Live verified comments</span>
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      isAuthenticated
                        ? 'Share your perspective, question, or analysis on this story...'
                        : 'Log in to join the conversation and post a comment...'
                    }
                    disabled={!isAuthenticated}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all disabled:opacity-60"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    {!isAuthenticated ? (
                      <span className="text-xs text-slate-500">
                        <Link to="/login" className="text-red-600 font-bold hover:underline">
                          Log in
                        </Link>{' '}
                        to leave a comment.
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Live Socket.io push enabled</span>
                    )}

                    <button
                      type="submit"
                      disabled={!isAuthenticated || submittingComment || !newComment.trim()}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4 divide-y divide-slate-100">
                {comments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-semibold">No comments yet</p>
                    <p className="text-[11px]">Be the first to share your analysis on this report!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="pt-4 first:pt-0 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                          {c.user_name ? c.user_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-slate-900">{c.user_name}</span>
                            {c.user_is_verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {c.user_role === 'admin' && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Admin
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">• {formatDate(c.created_at)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {c.content}
                          </p>
                        </div>
                      </div>

                      {user && (user.id === c.user_id || user.id === blog.author_id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

          </article>

          {/* RIGHT: SIDEBAR ADVERTISEMENT & MOST POPULAR (col-span-4) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20">
            
            {/* 1. TOP SIDEBAR DISPLAY ADVERTISEMENT */}
            <div className="bg-white border border-slate-200 p-4 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center select-none">
                ADVERTISEMENT
              </div>
              <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-50/80 to-indigo-50/50 border border-indigo-100 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-700">INDEL MONEY</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200">IND A-/Stable</span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-snug">
                  PUBLIC ISSUE OF SECURED, RATED, LISTED, REDEEMABLE DEBENTURES
                </div>
                <div className="p-3 bg-white border border-indigo-200 rounded-none shadow-2xs">
                  <div className="text-[11px] text-slate-500 font-bold uppercase">Effective yield of</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-800 my-0.5">12.25%*</div>
                  <div className="text-[10px] text-slate-400">Tenure of 72 months • Monthly payout</div>
                </div>
                <button
                  onClick={() => alert('Campaign: Indel Money Secured Debentures. Apply through certified broker or online.')}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  View Issue Details & Apply
                </button>
              </div>
            </div>

            {/* 2. "MOST POPULAR" BROADSHEET WIDGET */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="border-b-2 border-slate-900 pb-2 mb-4 flex items-center justify-between">
                <h3 className="font-serif font-black text-base tracking-tight text-red-600 flex items-center gap-1.5">
                  <span className="text-slate-400 tracking-tighter">≡</span>
                  <span>Most Popular</span>
                  <span className="text-slate-400 tracking-tighter">≡</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">24H Trending</span>
              </div>

              {/* List of 5 Most Popular Articles */}
              <div className="divide-y divide-slate-100">
                {popularList.map((item, idx) => (
                  <Link
                    key={item.id || idx}
                    to={item.slug ? getBlogUrl(item) : (item.to || '/')}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3 group transition-colors block"
                  >
                    {item.cover_image && (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-16 h-14 aspect-[16/10] object-cover object-center rounded-none bg-slate-100 shrink-0 border border-slate-200 group-hover:opacity-90"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-3">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                        {item.category || 'News'} • {item.views ? `${item.views} reads` : 'Trending'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. EDITOR'S CHOICE / MUST-READS (RANKED 01, 02, 03) */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="border-b border-slate-900 pb-2 mb-3 flex items-center justify-between">
                <h3 className="font-serif font-black text-sm tracking-tight text-slate-900 flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Editor's Picks</span>
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-700">Curated</span>
              </div>
              <div className="divide-y divide-slate-100">
                {editorsPicks.map((pick, pIdx) => (
                  <Link
                    key={pick.id || pIdx}
                    to={getBlogUrl(pick)}
                    className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 group block"
                  >
                    <span className="font-serif text-2xl font-black text-slate-300 group-hover:text-red-600 transition-colors leading-none shrink-0 w-6">
                      0{pIdx + 1}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                        {pick.title}
                      </h5>
                      <span className="text-[9.5px] font-semibold text-slate-400 mt-1 block">
                        {pick.author_name} • {calculateReadTime(pick.content)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 4. READER PULSE POLL (INTERACTIVE 1-CLICK WIDGET) */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                <Radio className="w-4 h-4 text-red-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Reader Opinion Poll</span>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug mb-3">
                Do you believe AI-assisted code refactoring will replace traditional dev sprints by 2027?
              </p>
              <div className="space-y-2">
                {[
                  { id: 'yes', label: 'Yes, full autonomous pipeline', pct: '68%' },
                  { id: 'mixed', label: 'Hybrid pair-programming only', pct: '24%' },
                  { id: 'no', label: 'No, human review is essential', pct: '8%' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPollVoted(opt.id)}
                    className={`w-full p-2.5 text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      pollVoted === opt.id
                        ? 'bg-red-50 border-red-500 text-red-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {pollVoted && (
                      <span className="font-mono font-bold text-red-600">{opt.pct}</span>
                    )}
                  </button>
                ))}
              </div>
              {pollVoted && (
                <p className="text-[10px] text-emerald-600 font-bold mt-2 text-center">
                  ✓ Your vote has been recorded! (1,842 total responses)
                </p>
              )}
            </div>

            {/* 5. BREAKING NEWS TICKER / QUICK DIGEST IN SIDEBAR */}
            <div className="p-4 bg-slate-900 text-white shadow-xs">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Editorial Desk</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Get real-time updates and breaking investigations delivered straight to your notifications.
              </p>
              <Link
                to="/"
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Back to Explore Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </aside>

        </div>

        {/* ========================================================================= */}
        {/* FULL-WIDTH BOTTOM NEWSROOM MODULES (ZERO BLANK SPACE)                      */}
        {/* ========================================================================= */}

        {/* SECTION 1: RELATED STORIES & DEEP DIVES */}
        <section className="mt-12 pt-8 border-t-2 border-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-serif text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              <span>Related Stories & In-Depth Analysis</span>
            </h3>
            <Link to={`/?category=${encodeURIComponent(blog.category || 'Technology')}`} className="text-xs font-bold text-red-600 hover:underline">
              View All {blog.category || 'Stories'} →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {relatedBlogsList.map((rel) => (
              <article
                key={rel.id}
                className="bg-white border border-slate-200 hover:border-red-400 transition-all p-3 flex flex-col justify-between group shadow-2xs hover:shadow-xs"
              >
                <div>
                  <Link to={getBlogUrl(rel)} className="block aspect-[16/10] w-full bg-slate-100 overflow-hidden mb-2.5 relative border border-slate-200/80">
                    <img
                      src={rel.cover_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold bg-black/75 text-white">
                      {rel.category || 'Tech'}
                    </span>
                  </Link>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>{rel.author_name}</span>
                    <span>{calculateReadTime(rel.content)}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-1.5">
                    <Link to={getBlogUrl(rel)}>{rel.title}</Link>
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {stripHtml(rel.content || '')}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-slate-400" /> {rel.views || 0}</span>
                  <Link to={getBlogUrl(rel)} className="text-red-600 font-bold hover:underline">
                    Read Story →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 2: MORE FROM THIS AUTHOR & EDITORIAL COLUMNISTS */}
        {moreAuthorBlogs.length > 0 && (
          <section className="mt-10 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-serif text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <span>More From {blog.author_name}</span>
              </h3>
              <Link to={`/author/${blog.author_id}`} className="text-xs font-bold text-slate-700 hover:text-red-600">
                Author Archive →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {moreAuthorBlogs.map((ab) => (
                <article
                  key={ab.id}
                  className="bg-white border border-slate-200 p-3.5 hover:border-slate-400 transition-colors flex items-start gap-3 group shadow-2xs"
                >
                  <Link to={getBlogUrl(ab)} className="w-20 h-16 shrink-0 bg-slate-100 overflow-hidden border border-slate-200/80">
                    <img
                      src={ab.cover_image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80'}
                      alt={ab.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] font-bold uppercase text-red-600 block mb-0.5">{ab.category || 'Report'}</span>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                      <Link to={getBlogUrl(ab)}>{ab.title}</Link>
                    </h5>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      {formatDate(ab.created_at)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: 3-MINUTE QUICK READS & INSIGHTS */}
        <section className="mt-10 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-serif text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>3-Minute Quick Reads & Insights</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">Speed summaries</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'qr-1',
                title: '5 PostgreSQL indexing strategies that cut query times by 90%',
                category: 'Database',
                tip: 'Use partial BRIN indexes for time-series append logs.'
              },
              {
                id: 'qr-2',
                title: 'Docker multi-stage builds: Shaving 1.2GB off Node.js images',
                category: 'DevOps',
                tip: 'Run npm prune --production before the final Alpine layer.'
              },
              {
                id: 'qr-3',
                title: 'Why CSS subgrid is the biggest responsive layout upgrade',
                category: 'Design',
                tip: 'Inherit track definitions from parent grids without extra wrappers.'
              },
              {
                id: 'qr-4',
                title: 'Understanding WebSockets heartbeat and auto-reconnect backoff',
                category: 'Architecture',
                tip: 'Implement exponential jitter to prevent thundering herd crashes.'
              }
            ].map((qr) => (
              <div
                key={qr.id}
                className="bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-2xs hover:border-amber-400 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 mb-2 inline-block">
                    {qr.category}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 leading-snug mb-2">
                    {qr.title}
                  </h5>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 border border-slate-100 italic leading-relaxed">
                    💡 <strong>Pro Tip:</strong> {qr.tip}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 font-bold"><Clock className="w-3 h-3 text-amber-600" /> 3 min read</span>
                  <Link to="/" className="text-amber-700 font-bold hover:underline">
                    Explore →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: TRENDING VIDEO STORIES & MASTERCLASSES */}
        <section className="mt-10 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-serif text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Play className="w-5 h-5 text-red-600 fill-red-600" />
              <span>Video Stories & Masterclasses</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">Watch full analyses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VIDEO_STORIES.map((v) => (
              <article
                key={v.id}
                className="bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all group"
              >
                <div className="relative aspect-[16/10] bg-black overflow-hidden">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white font-mono font-bold text-[9px] rounded-xs">
                    {v.duration}
                  </span>
                  <button
                    onClick={() => setActiveVideoModal(v)}
                    className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </button>
                </div>
                <div className="p-3">
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-1">
                    {v.title}
                  </h5>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-2">
                    <span>{v.author_name}</span>
                    <span>{v.views} views</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 5: READERS ALSO EXPLORED ACROSS CATEGORIES */}
        <section className="mt-10 pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-serif text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-red-600" />
              <span>Readers Also Explored Across BlogHub</span>
            </h3>
            <Link to="/" className="text-xs font-bold text-red-600 hover:underline">
              Full Broadsheet Feed →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                category: 'Technology',
                lead: 'Autonomous LLM Agents Now Debug Production Distributed Systems',
                author: 'Tech Desk',
                stories: ['Rust 1.82 memory safety benchmarks', 'Cloudflare edge serverless routing update']
              },
              {
                category: 'World News',
                lead: 'Global Energy Transition Accord Finalized at Geneva Summit',
                author: 'Diplomatic Bureau',
                stories: ['North Sea offshore wind grid expansion', 'Pacific Rim microgrid resilience fund']
              },
              {
                category: 'Business & Finance',
                lead: 'Central Banks Hold Rates Steady as Semiconductor Output Surges',
                author: 'Markets Desk',
                stories: ['Treasury yields stabilize at 4.12%', 'Venture investments rebound in Q3']
              },
              {
                category: 'AI & Code',
                lead: 'WebAssembly GC Revolution: High-Performance Languages in Browser',
                author: 'Software Architecture',
                stories: ['Compiling C++ games directly to canvas', 'Zero-overhead multithreading in web workers']
              }
            ].map((hub, hIdx) => (
              <div key={hIdx} className="bg-white border border-slate-200 p-3.5 space-y-2 shadow-2xs">
                <div className="border-b border-slate-900 pb-1 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-red-600">{hub.category}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h5 className="text-xs font-bold text-slate-900 hover:text-red-600 transition-colors leading-snug cursor-pointer">
                  {hub.lead}
                </h5>
                <span className="text-[10px] text-slate-400 font-semibold block">{hub.author}</span>
                <ul className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  {hub.stories.map((st, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-1.5 hover:text-red-600 cursor-pointer">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="line-clamp-1">{st}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: THE DAILY BROADSHEET DISPATCH NEWSLETTER BOX */}
        <section className="mt-12 p-6 sm:p-8 bg-slate-950 text-white border border-slate-800 shadow-lg space-y-4">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-widest">
              <Mail className="w-3 h-3" />
              The Daily Broadsheet Dispatch
            </div>
            <h4 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
              Get hand-curated engineering & investigative reports in your inbox
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No spam. Delivered every morning at 7:00 AM IST with zero fluff. Unsubscribe anytime in 1 click.
            </p>

            {newsletterSubscribed ? (
              <div className="p-3 bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 mt-4">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Thank you! You are subscribed to The Daily Broadsheet Dispatch.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setNewsletterSubscribed(true);
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-3"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your work or personal email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-red-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Subscribe Free
                </button>
              </form>
            )}
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* 🎬 ACTIVE VIDEO MODAL PLAYER                                              */}
      {/* ========================================================================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-none overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  {activeVideoModal.author_name || 'BlogHub Masterclass Video'}
                </span>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-7 h-7 bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={getVideoEmbedUrl(activeVideoModal.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                title={activeVideoModal.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold truncate max-w-xl">
                {activeVideoModal.title}
              </h4>
              <span className="text-[11px] font-mono text-amber-400 font-bold shrink-0">
                {activeVideoModal.duration || 'HD'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📤 INTERACTIVE SHARE STORY MODAL                                          */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShareModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-white border border-slate-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-red-500" />
                <h3 className="font-serif font-black text-sm uppercase tracking-wider">
                  Share This Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-6 h-6 bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Article Mini Snippet */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
              {blog.cover_image && !coverError && (
                <img
                  src={blog.cover_image}
                  alt={blog.title}
                  className="w-16 h-12 object-cover object-center bg-slate-200 border border-slate-300 shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest block">
                  {blog.category || 'Investigation'}
                </span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                  {blog.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">By {blog.author_name}</span>
              </div>
            </div>

            {/* Social Sharing Grid */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* 1. WhatsApp */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('whatsapp')}
                  className="p-3 bg-[#25D366]/10 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>

                {/* 2. Twitter / X */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('twitter')}
                  className="p-3 bg-black/5 hover:bg-black text-slate-900 hover:text-white border border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <TwitterXIcon className="w-5 h-5 text-slate-900 group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">X (Twitter)</span>
                </button>

                {/* 3. LinkedIn */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('linkedin')}
                  className="p-3 bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border border-[#0A66C2]/30 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <LinkedInIcon className="w-5 h-5 text-[#0A66C2] group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">LinkedIn</span>
                </button>

                {/* 4. Facebook */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('facebook')}
                  className="p-3 bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/30 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <FacebookIcon className="w-5 h-5 text-[#1877F2] group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">Facebook</span>
                </button>

                {/* 5. Telegram */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('telegram')}
                  className="p-3 bg-[#229ED9]/10 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/30 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <TelegramIcon className="w-5 h-5 text-[#229ED9] group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">Telegram</span>
                </button>

                {/* 6. Email */}
                <button
                  type="button"
                  onClick={() => shareToPlatform('email')}
                  className="p-3 bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer shadow-2xs"
                >
                  <Mail className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold">Email</span>
                </button>

              </div>

              {/* Copy Link Input Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Or copy story link
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyPageUrl}
                    className={`px-4 py-2 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      shareCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Native Device Share (Mobile support) */}
              {navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Open System Share Sheet</span>
                </button>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
