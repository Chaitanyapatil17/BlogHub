import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBlogCover, getEmbedUrl, getYouTubeId, stripHtml, getBlogUrl } from '../components/ContentBlockRenderer';
import SpeedLoader from '../components/SpeedLoader';
import { useNotifications } from '../context/NotificationContext';
import { API_BASE_URL } from '../config';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Heart, 
  MessageSquare, 
  X, 
  Flame, 
  Eye, 
  Sparkles, 
  Play,
  Layers,
  Cpu,
  Code2,
  Bot,
  Palette,
  Landmark,
  Coins,
  TrendingUp,
  Atom,
  CheckSquare,
  Zap,
  Check,
  Megaphone,
  ExternalLink,
  Star,
  ShieldCheck,
  Rocket,
  Video,
  Tv,
  Users,
  Award,
  Crown,
  Copy,
  Terminal,
  Bookmark,
  Volume2,
  VolumeX,
  Maximize2,
  Trophy,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Share2,
  Mail,
  Send
} from 'lucide-react';
import { STUDIO_CATEGORY_OPTIONS } from '../utils/categories';

const CATEGORIES = ['All', ...STUDIO_CATEGORY_OPTIONS];

// Curated Fallback Video Blogs if database has fewer than 5 video posts
const DEFAULT_VIDEO_BLOGS = [
  {
    id: 'v-1',
    title: 'Git and GitHub Commands Every Beginner Should Know',
    category: 'Technology',
    author_name: 'Chaitanya Patil',
    author_is_verified: true,
    views: '4.2k',
    duration: '11:20',
    videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    thumbnail: 'https://img.youtube.com/vi/RGOj5yH7evk/hqdefault.jpg',
    description: 'Learn essential Git branching, merge conflicts, pull requests, and remote repositories.',
    slug: 'git-and-github-commands-every-beginner-should-know'
  },
  {
    id: 'v-2',
    title: 'Getting Started with React.js in 2026',
    category: 'Web Development',
    author_name: 'Admin User',
    author_is_verified: true,
    views: '8.9k',
    duration: '18:45',
    videoUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
    thumbnail: 'https://img.youtube.com/vi/d56mG7DezGs/hqdefault.jpg',
    description: 'Master React 19 Server Actions, compiler optimizations, and modern hooks.',
    slug: 'getting-started-with-reactjs-in-2026'
  },
  {
    id: 'v-3',
    title: 'Building Autonomous AI Agents with Python & LLMs',
    category: 'AI',
    author_name: 'Alex Vance',
    author_is_verified: true,
    views: '15.4k',
    duration: '24:10',
    videoUrl: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    thumbnail: 'https://img.youtube.com/vi/sal78ACtGTc/hqdefault.jpg',
    description: 'Deep dive into tool-calling agents, memory persistence, and multi-agent coordination.',
    slug: 'the-rise-of-ai-in-pair-programming-and-development'
  },
  {
    id: 'v-4',
    title: 'Full-Stack Web Development Roadmap: PostgreSQL to React',
    category: 'Technology',
    author_name: 'Sarah Connor',
    author_is_verified: true,
    views: '12.1k',
    duration: '32:00',
    videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
    thumbnail: 'https://img.youtube.com/vi/nu_pCVPKzTk/hqdefault.jpg',
    description: 'End-to-end architecture guide for building resilient web applications.',
    slug: 'getting-started-with-full-stack-development-in-2026'
  },
  {
    id: 'v-5',
    title: 'Mastering Modern Tailwind CSS & Responsive UI',
    category: 'Design',
    author_name: 'Elena Rostova',
    author_is_verified: true,
    views: '6.8k',
    duration: '14:15',
    videoUrl: 'https://www.youtube.com/watch?v=ft30zcMlFao',
    thumbnail: 'https://img.youtube.com/vi/ft30zcMlFao/hqdefault.jpg',
    description: 'Techniques for building state-of-the-art interactive dark and light UI layouts.',
    slug: 'mastering-tailwind-css-for-modern-web-ui'
  }
];

// Fallback Featured Creators if database has fewer authors
const DEFAULT_CREATORS = [
  {
    id: 1,
    name: 'Chaitanya Patil',
    role: 'Creator & Lead Engineer',
    is_verified: true,
    bio: 'Building full-stack web applications, PostgreSQL architectures, and developer tools.',
    blog_count: 8,
    total_views: '24.5k',
    total_likes: 182,
    avatar_color: 'from-indigo-600 to-violet-500'
  },
  {
    id: 2,
    name: 'Admin User',
    role: 'Editorial Lead',
    is_verified: true,
    bio: 'Writing on AI pair programming, React 19 innovations, and system design patterns.',
    blog_count: 6,
    total_views: '18.2k',
    total_likes: 145,
    avatar_color: 'from-purple-600 to-pink-500'
  },
  {
    id: 3,
    name: 'Alex Vance',
    role: 'AI Researcher',
    is_verified: true,
    bio: 'Specialist in Autonomous Agent Workflows, PyTorch model fine-tuning, and LLM evaluations.',
    blog_count: 5,
    total_views: '15.4k',
    total_likes: 98,
    avatar_color: 'from-blue-600 to-cyan-500'
  },
  {
    id: 4,
    name: 'Sarah Connor',
    role: 'Full-Stack Developer',
    is_verified: true,
    bio: 'Crafting responsive UI design systems, Tailwind CSS components, and Node.js microservices.',
    blog_count: 4,
    total_views: '12.8k',
    total_likes: 76,
    avatar_color: 'from-emerald-600 to-teal-500'
  }
];

// 3-Minute Quick Reads & Byte-Sized Blogs Data (Strictly 3 Min Reads)
const BYTE_SIZED_TIPS = [
  {
    id: 'tip-1',
    category: 'Git & CLI',
    badge_color: 'bg-orange-50 text-orange-700 border-orange-200',
    title: 'Git Branching & Undoing Commits Safely',
    read_time: '3 min read',
    description: 'Learn how to uncommit faulty changes while keeping your modified files staged in your working tree without any data loss.',
    takeaway: '💡 Pro Tip: Use "git reset --soft HEAD~1" to keep all changes staged.',
    author_name: 'Chaitanya Patil',
    tag: 'Git',
    likes: 142,
    slug: 'git-and-github-commands-every-beginner-should-know'
  },
  {
    id: 'tip-2',
    category: 'React 19',
    badge_color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    title: 'Streamline Form State with useActionState',
    read_time: '3 min read',
    description: 'Master React 19 Actions to eliminate manual useState boilerplate for loading states, form payloads, and error handlers.',
    takeaway: '💡 Pro Tip: useActionState handles loading states and resets form errors automatically.',
    author_name: 'Admin User',
    tag: 'React',
    likes: 238,
    slug: 'getting-started-with-reactjs-in-2026'
  },
  {
    id: 'tip-3',
    category: 'PostgreSQL',
    badge_color: 'bg-blue-50 text-blue-700 border-blue-200',
    title: 'Analyze Query Execution Plans & Buffer Hits',
    read_time: '3 min read',
    description: 'Deep dive into EXPLAIN ANALYZE to detect slow sequential table scans, index misses, and memory buffer allocations in PostgreSQL.',
    takeaway: '💡 Pro Tip: Aim for >98% "Buffers: shared hit" ratio to avoid expensive disk I/O.',
    author_name: 'Sarah Connor',
    tag: 'PostgreSQL',
    likes: 195,
    slug: 'getting-started-with-full-stack-development-in-2026'
  },
  {
    id: 'tip-4',
    category: 'Modern CSS',
    badge_color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Style Parent Wrappers Using CSS :has()',
    read_time: '3 min read',
    description: 'Create responsive container rules and style cards based on nested input states without writing heavy JavaScript event listeners.',
    takeaway: '💡 Pro Tip: Combine "card:has(input:checked)" to build pure CSS selection states.',
    author_name: 'Elena Rostova',
    tag: 'CSS',
    likes: 174,
    slug: 'mastering-tailwind-css-for-modern-web-ui'
  }
];

// 60-Second Tech Shorts & Reels Data
const TECH_REELS = [
  {
    id: 'reel-1',
    title: 'Git Rebase vs Merge in 30 Seconds ⚡',
    subtitle: 'Interactive rebase demo & branch tips',
    category: 'Git & CLI',
    badge_color: 'bg-orange-600 text-white',
    author_name: 'Chaitanya Patil',
    views: '24.8k',
    likes: '1.4k',
    videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    duration: '0:45',
    slug: 'git-and-github-commands-every-beginner-should-know'
  },
  {
    id: 'reel-2',
    title: 'React 19 Compiler Auto-Memoization 🔥',
    subtitle: 'Zero useCallback boilerplate & memoization',
    category: 'React 19',
    badge_color: 'bg-cyan-600 text-white',
    author_name: 'Admin User',
    views: '42.1k',
    likes: '3.2k',
    videoUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
    duration: '0:58',
    slug: 'getting-started-with-reactjs-in-2026'
  },
  {
    id: 'reel-3',
    title: 'PostgreSQL Indexing: Stop Full Table Scans 🚀',
    subtitle: 'Composite indexes & query plan optimization',
    category: 'PostgreSQL',
    badge_color: 'bg-blue-600 text-white',
    author_name: 'Sarah Connor',
    views: '18.9k',
    likes: '980',
    videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
    duration: '0:50',
    slug: 'getting-started-with-full-stack-development-in-2026'
  },
  {
    id: 'reel-4',
    title: 'Building Multi-Agent Python Systems 🤖',
    subtitle: 'MCP protocols, tools & autonomous loops',
    category: 'AI Agents',
    badge_color: 'bg-purple-600 text-white',
    author_name: 'Alex Vance',
    views: '55.3k',
    likes: '4.8k',
    videoUrl: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    duration: '0:59',
    slug: 'the-rise-of-ai-in-pair-programming-and-development'
  },
  {
    id: 'reel-5',
    title: 'Modern CSS :has() Magic in Action 🎨',
    subtitle: 'Parent-selector UI patterns & form states',
    category: 'CSS UI',
    badge_color: 'bg-emerald-600 text-white',
    author_name: 'Elena Rostova',
    views: '31.2k',
    likes: '2.1k',
    videoUrl: 'https://www.youtube.com/watch?v=ft30zcMlFao',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    duration: '0:42',
    slug: 'mastering-tailwind-css-for-modern-web-ui'
  }
];

// BlogHub Explained Curated Data
const BLOGHUB_EXPLAINED = {
  featured: {
    id: 'exp-main',
    title: "Why is Next-Gen Full-Stack Architecture Shifting to Event-Driven Systems? | Explained ✦",
    excerpt: "Monolithic web architectures struggle with bursty WebSocket connections and high-throughput SQL writes. Engineering teams are decoupling ingestion pipelines and deploying edge-cached read replicas to achieve sub-50ms latency globally.",
    keyTakeaway: "Decoupled message brokers and automated failover pipelines are replacing traditional synchronous database write locks across modern production workloads.",
    author_name: "Chaitanya Patil",
    author_id: 1,
    cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    slug: "getting-started-with-full-stack-development-in-2026",
    read_time: "7 min read"
  },
  sideStories: [
    {
      id: 'exp-side-1',
      title: "How PostgreSQL 17 handles buffer hits & query plan caching? | Explained ✦",
      description: "Analyzing shared memory buffer hit ratios, query plan reusability, and index scan optimizations in high-traffic applications.",
      thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=300&q=80",
      slug: "getting-started-with-full-stack-development-in-2026"
    },
    {
      id: 'exp-side-2',
      title: "Inside React 19 Compiler: Automatic memoization vs manual useCallback | Explained ✦",
      description: "How React 19's ahead-of-time compiler analyzes dependency graphs to eliminate manual useMemo hooks and render cascades.",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=300&q=80",
      slug: "getting-started-with-reactjs-in-2026"
    },
    {
      id: 'exp-side-3',
      title: "Autonomous AI Agents: Memory management, tool calling & MCP protocol | Explained ✦",
      description: "A breakdown of Model Context Protocol (MCP), tool-call sandboxing, and long-term vector memory in coding agents.",
      thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300&q=80",
      slug: "the-rise-of-ai-in-pair-programming-and-development"
    }
  ]
};

// Sports Hub Curated Data (News Stories + Live Scoreboard + Upcoming Matches)
const SPORTS_SECTION_DATA = {
  stories: [
    {
      id: 'sport-1',
      category: 'CRICKET',
      icon: null,
      title: 'Bookies, players, owners of state T20 leagues under anti-corruption scanner',
      description: 'Central anti-corruption unit summons multiple franchise officials and bookmakers following irregular betting spikes across domestic state leagues.',
      keyStat: '✦ 14 bookmakers and team owners summoned for formal forensic questioning',
      author: 'Sports Bureau',
      timeAgo: '15m ago',
      thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80',
      slug: 'bookies-players-owners-of-state-t20-leagues-under-anti-corruption-scanner'
    },
    {
      id: 'sport-2',
      category: 'FOOTBALL',
      icon: '👑',
      title: 'In his hour of grief, Messi turns to football as a tribute to his dad',
      description: 'The Inter Miami captain returned to the pitch with an emotional performance, dedicating a decisive stoppage-time free-kick to his family.',
      keyStat: '✦ 94th minute curling free-kick winner seals historic victory',
      author: 'Football Correspondent',
      timeAgo: '42m ago',
      thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
      slug: 'messi-tribute-inter-miami-freekick-winner'
    },
    {
      id: 'sport-3',
      category: 'HOCKEY',
      icon: null,
      title: 'World Cup, India vs England: Style, needle and hockey\'s most underrated rivalry',
      description: 'Tactical midfield battles, counter-attack pace, and intense physical duels set the stage for an explosive World Cup clash in front of 20,000 fans.',
      keyStat: '✦ 18 matches head-to-head record with 7 draws across international tournaments',
      author: 'Hockey Desk',
      timeAgo: '2h ago',
      thumbnail: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=600&q=80',
      slug: 'india-vs-england-hockey-world-cup-rivalry'
    },
    {
      id: 'sport-4',
      category: 'CRICKET',
      icon: null,
      title: 'How Bangladesh\'s historic win has dented India\'s WTC Final chances',
      description: 'World Test Championship qualification math gets tighter as team India faces must-win conditions across remaining overseas test tours.',
      keyStat: '✦ India requires minimum 4 wins from next 6 tests to qualify for Lord\'s final',
      author: 'Cricket Analyst',
      timeAgo: '3h ago',
      thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
      slug: 'how-bangladesh-historic-win-dented-india-wtc-final-chances'
    }
  ],
  liveMatch: {
    team1: { code: 'SL', name: 'Sri Lanka', flag: '🇱🇰', score: '284', overs: '(79.4 ov)' },
    team2: { code: 'IND', name: 'India', flag: '🇮🇳', score: '462', overs: '(116.4 ov)' },
    status: 'Sri Lanka trail by 178 runs',
    session: 'Day 3 • Session 2 • R. Premadasa Stadium',
    batsman: 'K. Mendis 84* (112) • D. de Silva 32* (48)',
    bowler: 'J. Bumrah 4/52 (21.4 ov)',
    badge: 'LIVE'
  },
  upcomingMatch: {
    team1: { code: 'SL', name: 'Sri Lanka', flag: '🇱🇰' },
    team2: { code: 'IND', name: 'India', flag: '🇮🇳' },
    title: '2nd Test • ICC World Test Championship',
    date: '23 Aug, 10:00 AM IST • SSC Colombo Ground',
    series: 'India tour of Sri Lanka 2026'
  }
};

// 4-Column Category News Hubs Data (BBC News Style Layout)
const CATEGORY_NEWS_HUBS = [
  {
    id: 'hub-1',
    categoryName: 'US & CANADA NEWS',
    categorySlug: 'Technology',
    lead: {
      title: 'Tributes paid to Heroes actress Hayden Panettiere who has died aged 36',
      excerpt: 'She starred in the TV shows Heroes and Nashville, plus films Remember the Titans and Raising Helen.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      slug: 'getting-started-with-reactjs-in-2026'
    },
    subStories: [
      { id: 'sub-1-1', title: 'Teen suspect in Virginia campus shooting found hiding in closet', slug: 'getting-started-with-full-stack-development-in-2026' },
      { id: 'sub-1-2', title: 'Flooding destroys a road in Indiana after heavy rainfall', slug: 'git-and-github-commands-every-beginner-should-know', isMedia: true },
      { id: 'sub-1-3', title: 'BBC seeks to subpoena family members in Panorama lawsuit', slug: 'mastering-tailwind-css-for-modern-web-ui' }
    ]
  },
  {
    id: 'hub-2',
    categoryName: 'MORE WORLD NEWS',
    categorySlug: 'History',
    lead: {
      title: 'Post-mortems to take place after five boys killed in crash on wrong side of motorway',
      excerpt: 'Three women and a child who were in a second car are being treated in hospital for serious injuries.',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80',
      slug: 'git-and-github-commands-every-beginner-should-know'
    },
    subStories: [
      { id: 'sub-2-1', title: 'Reform UK benefits ban for foreign nationals would include EU citizens', slug: 'getting-started-with-reactjs-in-2026' },
      { id: 'sub-2-2', title: 'Top Zambian opposition figures arrested days after presidential vote', slug: 'the-rise-of-ai-in-pair-programming-and-development' },
      { id: 'sub-2-3', title: 'Aid shortages and fears of starvation as Indonesia reels from deadly earthquake', slug: 'mastering-tailwind-css-for-modern-web-ui' }
    ]
  },
  {
    id: 'hub-3',
    categoryName: 'BUSINESS',
    categorySlug: 'Business',
    lead: {
      title: "Protein or pickled garlic? What's new in ice cream",
      excerpt: "There's a constant battle in ice cream to come up with new flavours and to keep costs down.",
      image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
      slug: 'getting-started-with-full-stack-development-in-2026'
    },
    subStories: [
      { id: 'sub-3-1', title: 'Selena Gomez sued for alleged fraud over mental health company', slug: 'getting-started-with-reactjs-in-2026' },
      { id: 'sub-3-2', title: 'US says dozens of countries helped China dodge Trump\'s tariffs', slug: 'git-and-github-commands-every-beginner-should-know' },
      { id: 'sub-3-3', title: "'I lost $14,000 in a month': Investors hit by Korean stock market's wild swings", slug: 'the-rise-of-ai-in-pair-programming-and-development' }
    ]
  },
  {
    id: 'hub-4',
    categoryName: 'TECHNOLOGY',
    categorySlug: 'Technology',
    lead: {
      title: 'UK-made drones strike targets inside Russia',
      excerpt: 'The drones have been used for the first time in mainland Russia to hit military and industrial targets.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      slug: 'the-rise-of-ai-in-pair-programming-and-development'
    },
    subStories: [
      { id: 'sub-4-1', title: 'Secondhand book sales are booming. Is it because of AI?', slug: 'getting-started-with-reactjs-in-2026' },
      { id: 'sub-4-2', title: 'Why tech bosses keep sharing their manifestos about AI', slug: 'the-rise-of-ai-in-pair-programming-and-development' },
      { id: 'sub-4-3', title: "Bumble divides users by ditching its signature 'women-first' chat rule", slug: 'mastering-tailwind-css-for-modern-web-ui' }
    ]
  }
];

// High-Resolution Mobile Smartphone Advertisement Creatives (Only Image)
const MOBILE_SPONSORED_ADS = [
  {
    id: 'mob-ad-1',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85',
    title: 'Next-Gen 5G Ultra Smartphone',
    link: '/explore?category=Technology'
  },
  {
    id: 'mob-ad-2',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=85',
    title: 'Titanium Pro Edition 2026',
    link: '/explore?category=Technology'
  }
];

// Broadsheet Editorial Newsroom Data (Hero Story + 9 Text-Only Stories + Latest News Wire)
const BROADSHEET_NEWSROOM_DATA = {
  heroStory: {
    id: 'bs-hero',
    category: 'MUMBAI',
    title: "‘Society needs some shocks’: Mumbai civic chief lauds food safety crackdown",
    byline: "By Express News Service • Mumbai",
    updated: "Updated: Aug 17, 2026 5:30 PM IST",
    excerpt: "Asserting that public health cannot be compromised, the civic administration has initiated inspections across 450 eateries, issuing notices to unhygienic commercial kitchens.",
    keyPoint: "✦ Key Action: 120 establishments served immediate stop-work notices over water purity violations.",
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    slug: 'mumbai-civic-administration-lauds-food-safety-crackdown'
  },
  gridStories: [
    {
      id: 'grid-1',
      category: 'EDUCATION',
      icon: '👑',
      title: 'IITs are now teaching working professionals, a space long held by IIMs',
      excerpt: 'Top tech institutes launch specialized weekend micro-degrees in AI and system architecture.',
      slug: 'iits-expand-executive-micro-degrees-for-working-professionals'
    },
    {
      id: 'grid-2',
      category: 'HEALTH AND WELLNESS',
      title: 'E. coli in railway station water: Doctor explains what it means for you',
      excerpt: 'Medical experts warn against untreated tap water and outline mandatory filtration steps.',
      slug: 'the-rise-of-ai-in-pair-programming-and-development'
    },
    {
      id: 'grid-3',
      category: 'COLUMNS',
      title: 'PM Modi’s advisors: Bring back E10 for older vehicles, don’t rush blending',
      excerpt: 'Energy council cautions against rapid ethanol transitions without legacy engine audits.',
      slug: 'getting-started-with-reactjs-in-2026'
    },
    {
      id: 'grid-4',
      category: 'WEB SERIES',
      title: 'What happened to Pervez Musharraf after Operation Safed Sagar?',
      excerpt: 'A deep dive into military diplomacy and strategic aftermath post-Kargil conflict.',
      slug: 'git-and-github-commands-every-beginner-should-know'
    },
    {
      id: 'grid-5',
      category: 'COLUMNS',
      icon: '👑',
      title: 'India’s sweet revolution depends on this: Safeguard the bee, and sustainability is key',
      excerpt: 'Apiculture initiatives gain momentum as sustainable organic farming drives exports.',
      slug: 'mastering-tailwind-css-for-modern-web-ui'
    },
    {
      id: 'grid-6',
      category: 'FOOTBALL',
      icon: '👑',
      title: 'In his hour of grief, Messi turns to football as a tribute to his dad',
      excerpt: 'Inter Miami captain dedicated his dramatic 94th-minute free-kick winner to his family.',
      slug: 'messi-tribute-inter-miami-freekick-winner'
    },
    {
      id: 'grid-7',
      category: 'COLUMNS',
      title: 'Five years on, the world’s Taliban dilemma continues',
      excerpt: 'Diplomatic recognition hurdles remain unaddressed amid global humanitarian concerns.',
      slug: 'getting-started-with-reactjs-in-2026'
    },
    {
      id: 'grid-8',
      category: 'TECH REVIEWS',
      title: 'HP OmniBook 3 (14-inch) review: The student laptop with long battery life',
      excerpt: 'Snapdragon X Elite chipset delivers 18-hour battery longevity and quiet thermal efficiency.',
      slug: 'mastering-tailwind-css-for-modern-web-ui'
    },
    {
      id: 'grid-9',
      category: 'SPONSORED',
      title: 'This Independence Day, Every Working Woman Can Financially Protect the Future She’s Built',
      excerpt: 'Guaranteed savings plans and comprehensive term insurance tailored for career professionals.',
      slug: 'getting-started-with-full-stack-development-in-2026'
    }
  ],
  latestNews: [
    {
      id: 'ln-1',
      time: '6 MINUTES',
      tag: 'AHMEDABAD',
      title: 'They stole Rs 43-lakh diamonds in 15 mins; cops seized more from them in hours',
      snippet: 'Diamond merchant recovered 95% of stolen inventory within 6 hours of filing complaint.',
      slug: 'git-and-github-commands-every-beginner-should-know'
    },
    {
      id: 'ln-2',
      time: '8 MINUTES',
      tag: 'CRICKET',
      title: 'After early success, India made to toil by Sri Lanka for big 1st-innings lead',
      snippet: 'Mendis and De Silva put up a stubborn 120-run partnership in Colombo Test match.',
      slug: 'bookies-players-owners-of-state-t20-leagues-under-anti-corruption-scanner'
    },
    {
      id: 'ln-3',
      time: '9 MINUTES',
      tag: 'LEGAL',
      title: 'Is ‘Arthashastra’ economics? Gujarat High Court relief for job aspirant who missed cut-off',
      snippet: 'Court rules ancient statecraft treatise falls squarely within economic literature syllabus.',
      slug: 'mastering-tailwind-css-for-modern-web-ui'
    },
    {
      id: 'ln-4',
      time: '9 MINUTES',
      tag: 'TECH',
      title: 'Trump crypto firm backs venture offering AI from restricted Chinese companies',
      snippet: 'Partnership aims to leverage distributed compute clusters across Asian server farms.',
      slug: 'the-rise-of-ai-in-pair-programming-and-development'
    },
    {
      id: 'ln-5',
      time: '15 MINUTES',
      tag: 'MALAYALAM',
      title: 'Prithviraj unleashes high-octane action in Khalifa trailer, but last 5 seconds steal the show',
      snippet: 'Action sequences choreographed by international stunt coordinators receive acclaim.',
      slug: 'avengers-doomsday-teaser-breakdown-timeline-secrets'
    },
    {
      id: 'ln-6',
      time: '17 MINUTES',
      tag: 'EDUCATION',
      title: 'UGC-NET retest: Education Ministry seeks complete overhaul of confidential operations',
      snippet: 'Computerized testing protocol and secure biometric access to replace traditional centres.',
      slug: 'mastering-tailwind-css-for-modern-web-ui'
    }
  ]
};

// Entertainment & Hollywood Videos Section Data (Bulky, Multi-Column Newsroom Grid)
const ENTERTAINMENT_SECTION_DATA = {
  featuredHero: {
    id: 'ent-hero-1',
    title: "Rhea speaks candidly on resilience, family support, and artistic reinvention",
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    slug: 'rhea-speaks-on-career-journey-and-cinema'
  },
  photoGrid: [
    {
      id: 'ent-grid-1',
      title: 'Ramayana designers address backlash over Kaikeyi, Sita costumes',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      slug: 'ramayana-costume-designers-address-epic-visual-aesthetic'
    },
    {
      id: 'ent-grid-2',
      title: 'Why Shah Rukh Khan, Ajay Devgn and Tiger Shroff received FDA notice',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      slug: 'rhea-speaks-on-career-journey-and-cinema'
    },
    {
      id: 'ent-grid-3',
      title: 'Avengers: Doomsday - Official Teaser Breakdown & Multiverse Timeline Secrets',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
      isVideo: true,
      slug: 'avengers-doomsday-teaser-breakdown-timeline-secrets'
    },
    {
      id: 'ent-grid-4',
      title: 'Bigg Boss contestants who experienced paranormal activities on set',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      isGallery: true,
      slug: 'git-and-github-commands-every-beginner-should-know'
    }
  ],
  bulletFeed: [
    { id: 'b-1', text: 'Priyanka shares family moments: Malti Marie embraces Indian traditions with joy', slug: 'rhea-speaks-on-career-journey-and-cinema' },
    { id: 'b-2', text: 'RK Menon says Shahid might NOT DO Dingko Singh biopic next year due to dates', slug: 'ramayana-costume-designers-address-epic-visual-aesthetic' },
    { id: 'b-3', text: 'Malavika left visibly annoyed after being asked "Difficult Questions" in interview', slug: 'rhea-speaks-on-career-journey-and-cinema' },
    { id: 'b-4', text: 'Quote of the day from Antonio Banderas on artistic reinvention and persistence', slug: 'the-rise-of-ai-in-pair-programming-and-development' },
    { id: 'b-5', text: 'Kiran Rao mourns pet cat Miri’s death with heartfelt note and candid photos', slug: 'git-and-github-commands-every-beginner-should-know' },
    { id: 'b-6', text: 'About Hayden Panettiere and her daughter Kaya: Relationship, custody & tribute', slug: 'rhea-speaks-on-career-journey-and-cinema' },
    { id: 'b-7', text: 'After 25 years at Adobe, engineer laid off; now builds open-source developer tool', slug: 'the-rise-of-ai-in-pair-programming-and-development' },
    { id: 'b-8', text: 'Netherlands town requires residents to grow food in rooftop gardens by law', slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them' },
    { id: 'b-9', text: 'Lung cancer can stay silent for years: Who should get low-dose CT screening?', slug: 'mastering-tailwind-css-for-modern-web-ui' },
    { id: 'b-10', text: 'Maera Announces Pregnancy: TV actress expecting first child with husband', slug: 'git-and-github-commands-every-beginner-should-know' },
    { id: 'b-11', text: 'Parth Buys Dream Home: TV actor credits mother for lifelong financial wisdom', slug: 'getting-started-with-reactjs-in-2026' },
    { id: 'b-12', text: 'Mini Defends Alliance Gameplay: says Gauahar was target of unfair house votes', slug: 'ramayana-costume-designers-address-epic-visual-aesthetic' },
    { id: 'b-13', text: 'AICWA pays tribute to Ananya Raj: ‘Her memories and cinema will inspire forever’', slug: 'the-rise-of-ai-in-pair-programming-and-development' },
    { id: 'b-14', text: 'Amid FDA notice row, here’s recalling when Ajay Devgn addressed surrogate ads', slug: 'getting-started-with-full-stack-development-in-2026' }
  ],
  hollywoodVideos: [
    {
      id: 'hw-v1',
      title: "Avengers: Doomsday - Official Teaser Trailer Breakdown & Timeline Secrets",
      duration: '02:10',
      thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
      slug: 'avengers-doomsday-teaser-breakdown-timeline-secrets'
    },
    {
      id: 'hw-v2',
      title: "Hayden Panettiere ‘Mystery Exit’ One Month Before Death: What Really Happened",
      duration: '07:19',
      thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
      slug: 'rhea-speaks-on-career-journey-and-cinema'
    },
    {
      id: 'hw-v3',
      title: "Building Multi-Agent AI Systems with Python & LLMs Masterclass",
      duration: '05:40',
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=sal78ACtGTc',
      slug: 'the-rise-of-ai-in-pair-programming-and-development'
    },
    {
      id: 'hw-v4',
      title: "Live TV NIGHTMARE: Sports Analyst Analyzes Game Shockers",
      duration: '06:13',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      slug: 'bookies-players-owners-of-state-t20-leagues-under-anti-corruption-scanner'
    },
    {
      id: 'hw-v5',
      title: "Cindy Crawford’s Daughter Kaia Gerber Details Her Bizarre Met Gala Experience",
      duration: '06:34',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=ft30zcMlFao',
      slug: 'ramayana-costume-designers-address-epic-visual-aesthetic'
    },
    {
      id: 'hw-v6',
      title: "Full-Stack Web Development: Architecture Deep Dive",
      duration: '08:14',
      thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      slug: 'getting-started-with-full-stack-development-in-2026'
    }
  ]
};

// Zodiac Signs & Horoscope Forecasts
const ZODIAC_SIGNS = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: '♈',
    dateRange: 'Mar 21 - Apr 19',
    element: 'Fire',
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    forecast: {
      daily: "With the Moon in Libra today, expect harmony in your personal relationships and collaborative efforts. However, beware of potential misunderstandings due to combust Mercury, which calls for clear communication. Aries natives should clarify any joint plans with others. This phase favors negotiations, but it's essential to double-check financial transactions and career commitments.",
      weekly: "Focus on strategic networking and long-term project planning. Mid-week brings promising news regarding investments.",
      monthly: "A transformative month for personal growth and career transitions. Mars provides dynamic energy.",
      yearly: "2026 brings expansion in professional ventures and stability in personal relationships.",
      characteristics: "Courageous, determined, confident, enthusiastic, optimistic, honest, and passionate."
    }
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    dateRange: 'Apr 20 - May 20',
    element: 'Earth',
    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    forecast: {
      daily: "Venus aligns favorably in your second house, creating opportunities for financial gains and family harmony. Avoid workplace confrontations during morning hours. A creative idea discussed with peers will gain immediate traction.",
      weekly: "Steady progress at work with solid financial returns. Keep weekend open for relaxation.",
      monthly: "Focus on real estate, wealth preservation, and strengthening domestic ties.",
      yearly: "Jupiter blesses financial growth and long-pending property decisions.",
      characteristics: "Reliable, patient, practical, devoted, responsible, and stable."
    }
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    dateRange: 'May 21 - Jun 20',
    element: 'Air',
    iconBg: 'bg-purple-50 border-purple-200 text-purple-900',
    forecast: {
      daily: "Your analytical acumen is at its peak. Express ideas in team meetings with confidence. Planetary transits advise double-checking email communications and travel itineraries today.",
      weekly: "Brisk communication and intellectual breakthroughs dominate this week.",
      monthly: "New partnerships and collaborative creative projects flourish.",
      yearly: "A powerhouse year for communication, publishing, and digital ventures.",
      characteristics: "Gentle, affectionate, curious, adaptable, ability to learn quickly and exchange ideas."
    }
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    dateRange: 'Jun 21 - Jul 22',
    element: 'Water',
    iconBg: 'bg-sky-50 border-sky-200 text-sky-900',
    forecast: {
      daily: "Intuition guides your decisions today. Spend quality time with family. Favorable cosmic alignment supports home improvements and creative writing endeavors.",
      weekly: "Emotional balance returns. Career recognition is on the horizon.",
      monthly: "High focus on domestic harmony and upgrading personal living spaces.",
      yearly: "Deep emotional fulfillment and rewarding investments take center stage.",
      characteristics: "Tenacious, highly imaginative, loyal, emotional, sympathetic, persuasive."
    }
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '♌',
    dateRange: 'Jul 23 - Aug 22',
    element: 'Fire',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-900',
    forecast: {
      daily: "The Sun radiates positive energy across your leadership sector. Excellent day for presentations, interviews, and public speaking. Maintain humility during financial negotiations.",
      weekly: "Your charisma opens doors in business and creative ventures.",
      monthly: "Recognition from mentors and leadership opportunities arrive mid-month.",
      yearly: "A golden period for public standing, authority, and creative acclaim.",
      characteristics: "Creative, passionate, generous, warm-hearted, cheerful, humorous."
    }
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    dateRange: 'Aug 23 - Sep 22',
    element: 'Earth',
    iconBg: 'bg-teal-50 border-teal-200 text-teal-900',
    forecast: {
      daily: "Meticulous attention to detail helps you uncover critical efficiencies in ongoing workflows. Health and fitness routines started today yield long-lasting vitality.",
      weekly: "Organizational overhauls and technical tasks proceed smoothly.",
      monthly: "Career restructuring and skill enhancements bring lucrative promotions.",
      yearly: "Steady accumulation of wealth and mastery over complex engineering skills.",
      characteristics: "Loyal, analytical, kind, hardworking, practical."
    }
  }
];

// Astrology News Stories & Wire Data
const ASTROLOGY_SECTION_DATA = {
  featuredCard: {
    id: 'astro-hero',
    title: 'Daily Vedic Astrology: Planetary Transits & Career Forecast for All Signs',
    image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=800&q=80',
    slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
  },
  bulletList: [
    { id: 'ab-1', text: 'Surya Ketu Conjunction in Leo: What is the astrological impact on your career?', isMedia: false, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' },
    { id: 'ab-2', text: 'Chant these powerful Surya mantras based on your birth lagna chart', isMedia: true, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' },
    { id: 'ab-3', text: 'Nag Panchami 2026: Rare combination of Nakshatras promises spiritual growth', isMedia: false, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' },
    { id: 'ab-4', text: 'August 17 2026 Forecast: Numerology predicts lucky numbers for entrepreneurs', isMedia: false, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' },
    { id: 'ab-5', text: 'August 17, 2026 Love Horoscope: Daily celestial guidance for all zodiac signs', isMedia: false, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' },
    { id: 'ab-6', text: 'Saturn Retrograde in Pisces: Key planetary remedies and transit timelines', isMedia: false, slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope' }
  ],
  bottomWires: [
    {
      id: 'wire-1',
      title: 'Aries Horoscope 18th August 2026',
      description: 'Communicate with clarity during corporate meetings to avoid misunderstandings.',
      slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
    },
    {
      id: 'wire-2',
      title: 'Daily Nadi Horoscope: Mercury combust',
      description: 'Combust Mercury tests dialogue; review legal contracts before signing.',
      slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
    },
    {
      id: 'wire-3',
      title: 'Palm Signs And Hidden Luck',
      description: 'Article explains palmistry lines that indicate sudden financial prosperity.',
      slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
    },
    {
      id: 'wire-4',
      title: 'Vastu Tips For Money Plant',
      description: 'Place in south-east or north direction; avoid negative energy corners.',
      slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
    }
  ]
};

// Recipes & Food News Section Data
const RECIPES_FOOD_SECTION_DATA = {
  featuredHero: {
    id: 'food-hero',
    title: '6 signs your spices have lost their freshness and how to revive them',
    photoCount: 7,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
  },
  bulletList: [
    { id: 'fb-1', text: 'How did samosa become an Indian favourite despite originating in Central Asia?', isMedia: true, slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them' },
    { id: 'fb-2', text: '8 foods that attract insects in your kitchen without you realising it', isMedia: true, slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them' },
    { id: 'fb-3', text: 'Safe Air-Fryer Utensils: Stainless steel, foil, glass and silicone cooking rules', isMedia: false, slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them' },
    { id: 'fb-4', text: 'Why do instant noodles cook so quickly? The clever food chemistry explained', isMedia: true, slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them' },
    { id: 'fb-5', text: 'Authentic Creamy Lebanese Garlic Toum Recipe: The Ultimate Dip', isMedia: true, slug: 'authentic-creamy-lebanese-garlic-toum-recipe' }
  ],
  videoRecipes: [
    {
      id: 'vr-1',
      title: 'Watch: 6 signs your spices have lost their freshness',
      duration: '02:14',
      thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    },
    {
      id: 'vr-2',
      title: 'Watch: Authentic Creamy Lebanese Garlic Toum Recipe',
      duration: '03:56',
      thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=d56mG7DezGs',
      slug: 'authentic-creamy-lebanese-garlic-toum-recipe'
    },
    {
      id: 'vr-3',
      title: 'Watch: Modern Gastronomy & Flavor Balancing Masterclass',
      duration: '02:38',
      thumbnail: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    },
    {
      id: 'vr-4',
      title: 'Watch: Full-Stack React 19 Development Walkthrough',
      duration: '01:29',
      thumbnail: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=sal78ACtGTc',
      slug: 'getting-started-with-reactjs-in-2026'
    }
  ],
  sidebarRecipes: [
    {
      id: 'sr-1',
      title: 'Authentic Creamy Lebanese Garlic Toum',
      description: 'Authentic creamy toum made with fresh garlic, sea salt, and extra virgin olive oil.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
      category: 'Featured',
      slug: 'authentic-creamy-lebanese-garlic-toum-recipe'
    },
    {
      id: 'sr-2',
      title: '6 Signs Spices Lost Freshness',
      description: 'Techniques for reviving dried spices and restoring their volatile oils.',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
      category: 'Recipes',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    },
    {
      id: 'sr-3',
      title: 'Chamomile Herbal Latte',
      description: 'A soothing herbal bedtime latte infused with dried chamomile petals and raw honey.',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80',
      category: 'Featured',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    },
    {
      id: 'sr-4',
      title: 'Traditional Cardamom & Saffron Treats',
      description: 'Traditional festive dessert delicately flavored with cardamom, saffron, and pistachios.',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=300&q=80',
      category: 'Recipes',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    },
    {
      id: 'sr-5',
      title: 'Dark Chocolate Cake Pops',
      description: 'Decadent dark chocolate cake pops dipped in ruby chocolate and sprinkled with almonds.',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80',
      category: 'Featured',
      slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
    }
  ]
};

// "ONLY IN BLOGHUB" 4-Column 2-Row Exclusive News Data
const ONLY_IN_BLOGHUB_DATA = [
  {
    id: 'oib-1',
    num: 1,
    title: 'IITs are now teaching working professionals, a space long held by IIMs',
    category: 'World News',
    slug: 'iits-expand-executive-micro-degrees-for-working-professionals'
  },
  {
    id: 'oib-2',
    num: 2,
    title: "PM Modi's advisors: Bring back E10 for older vehicles, don't rush blending",
    category: 'News',
    slug: 'our-action-was-correct-tukaram-munde-on-rs-5-lakh-fine-on-pune-sweet-shop-mszo1kvf'
  },
  {
    id: 'oib-3',
    num: 3,
    title: 'Jobs to exam coaching help: How CMs are responding to youth discontent',
    category: 'Explained',
    slug: 'distributed-consensus-and-raft-protocols-in-high-throughput-cloud-architectures'
  },
  {
    id: 'oib-4',
    num: 4,
    title: 'Leopard skins seized, top Delhi wildlife NGO accused of nexus with poachers',
    category: 'Investigation',
    slug: 'our-action-was-correct-tukaram-munde-on-rs-5-lakh-fine-on-pune-sweet-shop-mszo1kvf'
  },
  {
    id: 'oib-5',
    num: 5,
    title: "Expert Explains | How a naval mutiny hastened India's independence",
    category: 'History',
    slug: 'mastering-tailwind-css-for-modern-web-ui'
  },
  {
    id: 'oib-6',
    num: 6,
    title: "‘Felt like tiny pinprick’: Delhi schools push to win parents’ trust on cervical cancer vaccine",
    category: 'Health',
    slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them'
  },
  {
    id: 'oib-7',
    num: 7,
    title: "EXCLUSIVE: Shah Rukh, Ajay Devgn, Tiger Shroff get FDA notices over 'Vimal' ad",
    category: 'Entertainment',
    slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope'
  },
  {
    id: 'oib-8',
    num: 8,
    title: 'How Pak handlers are recruiting Indian teens',
    category: 'National',
    slug: 'the-rise-of-ai-in-pair-programming-and-development'
  }
];

// Helper to render Category Gradient Cover if no image or video is present
function DynamicBlogThumbnail({ blog, isFeatured = false, compact = false }) {
  const cover = getBlogCover(blog);

  if (cover && cover.url) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-950">
        <img
          src={cover.url}
          alt={blog.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {cover.type === 'video' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white translate-x-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHistory = blog.category === 'History';
  const isMoney = blog.category === 'Money & Finance' || blog.category === 'Business';
  const isScience = blog.category === 'Science';
  const isAI = blog.category === 'AI';
  const isDesign = blog.category === 'Design';

  const gradientClass = isHistory
    ? 'bg-gradient-to-br from-amber-700 via-yellow-800 to-slate-950 text-amber-50'
    : isMoney
    ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 text-emerald-50'
    : isScience
    ? 'bg-gradient-to-br from-cyan-700 via-blue-800 to-slate-950 text-cyan-50'
    : isAI
    ? 'bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 text-white'
    : isDesign
    ? 'bg-gradient-to-br from-pink-600 via-rose-700 to-slate-900 text-white'
    : 'bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 text-white';

  if (compact) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${gradientClass}`}>
        {isHistory ? (
          <Landmark className="w-4 h-4 opacity-90" />
        ) : isMoney ? (
          <Coins className="w-4 h-4 opacity-90" />
        ) : isScience ? (
          <Atom className="w-4 h-4 opacity-90" />
        ) : isAI ? (
          <Bot className="w-4 h-4 opacity-90" />
        ) : isDesign ? (
          <Palette className="w-4 h-4 opacity-90" />
        ) : (
          <Code2 className="w-4 h-4 opacity-90" />
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col justify-between p-3.5 sm:p-4 ${gradientClass}`}>
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-none bg-white/10 backdrop-blur-md flex items-center justify-center">
          {isHistory ? (
            <Landmark className="w-3.5 h-3.5" />
          ) : isMoney ? (
            <Coins className="w-3.5 h-3.5" />
          ) : isScience ? (
            <Atom className="w-3.5 h-3.5" />
          ) : isAI ? (
            <Bot className="w-3.5 h-3.5" />
          ) : isDesign ? (
            <Palette className="w-3.5 h-3.5" />
          ) : (
            <Code2 className="w-3.5 h-3.5" />
          )}
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-none backdrop-blur-xs">
          {blog.category || 'Article'}
        </span>
      </div>

      <div>
        <h4 className={`font-bold line-clamp-2 leading-tight ${isFeatured ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>{blog.title}</h4>
      </div>
    </div>
  );
}

// 1. Bottom row 2x2 sub-lead card (Under Hero Story matching Aaj Tak layout)
function BottomRelatedCard({ blog }) {
  if (!blog) return null;

  return (
    <article className="bg-white border border-slate-200/90 hover:border-red-400 p-2 sm:p-2.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-start gap-2.5 group h-full">
      <div className="w-20 sm:w-24 aspect-[4/3] rounded-none overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/70">
        <Link to={getBlogUrl(blog)} className="block w-full h-full">
          <DynamicBlogThumbnail blog={blog} compact={true} />
        </Link>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <h3 className="text-xs sm:text-[12.5px] font-bold text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug transition-colors">
          <Link to={getBlogUrl(blog)}>{blog.title}</Link>
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
          <span className="font-semibold text-red-600 uppercase tracking-wider text-[9px]">
            {blog.category || 'Tech'}
          </span>
          <span>•</span>
          <span className="truncate">{blog.author_name}</span>
        </div>
      </div>
    </article>
  );
}

// Curated Default Wire Stories for Fallbacks to ensure full density
const DEFAULT_WIRE_BLOGS = [
  {
    id: 'wire-1',
    title: 'Distributed Consensus & Raft Protocols in High-Throughput Cloud Architectures',
    category: 'Architecture',
    author_name: 'Elena Rostova',
    author_is_verified: true,
    tag: '#CloudScale',
    content: 'An architectural deep dive into quorum configurations, raft state machines, and append log replication across global edge clusters with sub-millisecond failover.',
    slug: 'getting-started-with-full-stack-development-in-2026',
    views: 1420
  },
  {
    id: 'wire-2',
    title: 'Zero-Copy Serialization & Memory Models in Ultra Low-Latency Systems',
    category: 'AI & Code',
    author_name: 'Marcus Vance',
    author_is_verified: true,
    tag: '#Performance',
    content: 'Comparing Cap’n Proto, FlatBuffers, and Protobuf v3 under high throughput microservice workloads with zero garbage collection pause penalties.',
    slug: 'git-and-github-commands-every-beginner-should-know',
    views: 980
  },
  {
    id: 'wire-3',
    title: 'Why Modern Engineering Teams Are Moving to Event-Driven Microservices',
    category: 'Backend',
    author_name: 'Sarah Connor',
    author_is_verified: false,
    tag: '#EventDriven',
    content: 'Benchmarking asynchronous Kafka and RabbitMQ pipelines for mission-critical e-commerce operations under massive multi-region throughput.',
    slug: 'the-rise-of-ai-in-pair-programming-and-development',
    views: 1850
  },
  {
    id: 'wire-4',
    title: 'Editorial Typography: Optical Sizing & Variable Serif Fonts on the Web',
    category: 'Design',
    author_name: 'David K.',
    author_is_verified: true,
    tag: '#UIUX',
    content: 'How modern broadsheet publications leverage optical sizing for maximum legibility, balanced tracking, and responsive dynamic line heights.',
    slug: 'mastering-tailwind-css-for-modern-web-ui',
    views: 740
  },
  {
    id: 'wire-5',
    title: 'Automated CI/CD Delivery Pipelines for Containerized Cloud Workloads',
    category: 'DevOps',
    author_name: 'Staff Editorial',
    author_is_verified: true,
    tag: '#Kubernetes',
    content: 'Zero-downtime rolling upgrades using Kubernetes ingress controllers, canary deployments, and automated telemetry health check rollback hooks.',
    slug: 'getting-started-with-full-stack-development-in-2026',
    views: 1120
  },
  {
    id: 'wire-6',
    title: 'PostgreSQL 17 B-Tree Index Deduplication & Memory Buffer Allocations',
    category: 'Database',
    author_name: 'Alex Vance',
    author_is_verified: true,
    tag: '#Postgres',
    content: 'Deep inspection into PostgreSQL memory layout, shared buffer cache hits, and write-ahead log flush throughput under high concurrency.',
    slug: 'getting-started-with-full-stack-development-in-2026',
    views: 2130
  },
  {
    id: 'wire-7',
    title: 'React 19 Server Actions & Optimistic State UI Mutation Patterns',
    category: 'WebDev',
    author_name: 'Admin User',
    author_is_verified: true,
    tag: '#React19',
    content: 'Eliminating manual loading booleans with useActionState, useOptimistic, and concurrent transitions in modern React applications.',
    slug: 'getting-started-with-reactjs-in-2026',
    views: 3410
  },
  {
    id: 'wire-8',
    title: 'Autonomous Coding Agents: Tool Sandboxing & Context Window Compaction',
    category: 'AI',
    author_name: 'Chaitanya Patil',
    author_is_verified: true,
    tag: '#Agents',
    content: 'Designing reliable multi-turn feedback loops, token budget optimizers, and automated test runners for autonomous software engineering.',
    slug: 'the-rise-of-ai-in-pair-programming-and-development',
    views: 4890
  },
  {
    id: 'wire-9',
    title: 'WebAssembly GC & High-Performance Canvas Rendering in 2026',
    category: 'Engineering',
    author_name: 'David Chen',
    author_is_verified: true,
    tag: '#Wasm',
    content: 'Compiling Rust and Kotlin multiplatform bytecode directly to WasmGC with DOM integration and hardware acceleration.',
    slug: 'the-rise-of-ai-in-pair-programming-and-development',
    views: 1240
  },
  {
    id: 'wire-10',
    title: 'Edge AI Inference: Quantized LLMs Running in Local Browser Memory',
    category: 'AI Tech',
    author_name: 'Priya Sharma',
    author_is_verified: true,
    tag: '#EdgeAI',
    content: 'Running 3B parameter models locally on WebGPU with zero latency and 100% data privacy guarantees.',
    slug: 'getting-started-with-full-stack-development-in-2026',
    views: 3190
  },
  {
    id: 'wire-11',
    title: 'Micro-Frontends at Scale: Module Federation & Shared State Stores',
    category: 'Architecture',
    author_name: 'Admin User',
    author_is_verified: true,
    tag: '#Frontend',
    content: 'How enterprise platforms decouple frontend deployments across 40+ engineering teams without version collisions.',
    slug: 'mastering-tailwind-css-for-modern-web-ui',
    views: 2280
  },
  {
    id: 'wire-12',
    title: 'Next-Gen Cybersecurity: Post-Quantum Cryptography in Modern TLS 1.3',
    category: 'Security',
    author_name: 'Elena Rostova',
    author_is_verified: true,
    tag: '#Security',
    content: 'Implementing lattice-based key exchange mechanisms across cloud load balancers and zero-trust mesh networks.',
    slug: 'git-and-github-commands-every-beginner-should-know',
    views: 1760
  }
];

// 2. Middle Column: Top Featured Wire Card (Highlighted with 'More Stories ▶' link)
function SuperfastFeaturedCard({ blog }) {
  if (!blog) return null;
  return (
    <article className="bg-slate-50 border border-slate-200/90 hover:border-red-400 p-2.5 shadow-2xs transition-all group">
      <div className="flex items-start gap-2.5">
        <div className="w-20 sm:w-24 aspect-[4/3] rounded-none overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
          <Link to={getBlogUrl(blog)} className="block w-full h-full">
            <DynamicBlogThumbnail blog={blog} compact={true} />
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-[12.5px] font-bold text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug transition-colors mb-1.5">
            <Link to={getBlogUrl(blog)}>{blog.title}</Link>
          </h3>
          <div className="flex justify-end">
            <Link
              to={getBlogUrl(blog)}
              className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-0.5 transition-colors group-hover:translate-x-0.5"
            >
              <span>More Stories</span>
              <span className="text-xs">▶</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// 3. Middle Column: Speedy News Wire Item
function SuperfastWireItem({ blog }) {
  if (!blog) return null;
  return (
    <article className="py-2 flex items-start gap-2.5 group hover:bg-slate-50/70 transition-colors">
      <div className="w-18 sm:w-20 aspect-[4/3] rounded-none overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
        <Link to={getBlogUrl(blog)} className="block w-full h-full">
          <DynamicBlogThumbnail blog={blog} compact={true} />
        </Link>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[11.5px] sm:text-xs font-bold text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug transition-colors">
          <Link to={getBlogUrl(blog)}>{blog.title}</Link>
        </h4>
        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.5">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">{blog.category || 'Tech'}</span>
          <span>•</span>
          <span className="truncate">{blog.author_name}</span>
        </div>
      </div>
    </article>
  );
}

// 4. Right Column: Top Tech Picks Mini Wire Component
function RightTrendingPicksList({ blogs = [] }) {
  if (!blogs || blogs.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200/90 p-2.5 shadow-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-900 pb-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-red-600" />
          <span>Top Tech Picks</span>
        </span>
        <span className="text-[9px] font-bold text-red-600 uppercase">Must Read</span>
      </div>
      <div className="divide-y divide-slate-100">
        {blogs.map((b) => (
          <article key={b.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center gap-2 group">
            <div className="w-12 h-10 shrink-0 overflow-hidden bg-slate-100 border border-slate-200/70">
              <Link to={getBlogUrl(b)} className="block w-full h-full">
                <DynamicBlogThumbnail blog={b} compact={true} />
              </Link>
            </div>
            <h5 className="text-[11px] font-bold text-slate-900 group-hover:text-red-600 line-clamp-2 leading-snug flex-1 transition-colors">
              <Link to={getBlogUrl(b)}>{b.title}</Link>
            </h5>
          </article>
        ))}
      </div>
    </div>
  );
}

// Backward compatibility alias
function MiddleStackedCard({ blog, badgeText = 'other blog' }) {
  return <SuperfastWireItem blog={blog} />;
}

// 5. Right Column: Tabbed Live Video Widget (Aaj Tak Live TV Box style)
function TabbedLiveVideoWidget({ video, onPlayVideo }) {
  const [activeTab, setActiveTab] = useState('tv');
  if (!video) return null;

  return (
    <div className="bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Dual Tab Bar */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('tv')}
          className={`flex-1 py-1.5 px-3 text-center uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'tv'
              ? 'bg-[#e01e1e] text-white font-black shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          BLOGHUB TV
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pulse')}
          className={`flex-1 py-1.5 px-3 text-center uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'pulse'
              ? 'bg-[#e01e1e] text-white font-black shadow-xs'
              : 'text-slate-700 hover:bg-slate-200'
          }`}
        >
          LIVE PULSE
        </button>
      </div>

      {/* Video Player Box */}
      <div
        onClick={() => onPlayVideo(video)}
        className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer group"
      >
        <img
          src={video.thumbnail || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80`}
          alt={video.title}
          className="w-full h-full object-cover opacity-85 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
        />

        {/* Center Glowing Play Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-[#e01e1e] text-slate-900 group-hover:text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all border-2 border-white/40">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>
        </div>

        {/* Live Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            LIVE
          </span>
        </div>

        {/* Bottom Breaking Overlay Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-black/90 text-white p-2 border-t border-red-600 backdrop-blur-xs flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {video.title}
          </span>
          <span className="text-[10px] text-amber-400 font-mono shrink-0">
            {video.duration || 'Watch'}
          </span>
        </div>
      </div>
    </div>
  );
}

// 6. Right Column: Secondary Promotional Broadsheet Banner
function SecondaryPromoBanner() {
  return (
    <div className="bg-white border border-slate-200/90 p-3 text-center shadow-2xs">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
        EDITORIAL SPECIAL
      </div>
      <div className="text-xs font-black text-slate-900 leading-snug mb-1">
        Ahead of Print, Ahead of News: Verified Tech Dispatches
      </div>
      <p className="text-[10.5px] text-slate-500 mb-2">
        Stay updated with real-time editorial wire and creator blogs.
      </p>
      <Link
        to="/register"
        className="inline-block px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10.5px] uppercase tracking-wider transition-colors shadow-xs"
      >
        Join Creator Hub →
      </Link>
    </div>
  );
}

// 6. Right Column: Follow Us Channels Bar
function SocialFollowBar() {
  return (
    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/90 p-2 shadow-2xs">
      <span className="text-slate-400 uppercase tracking-wider text-[9px]">Follow Us:</span>
      <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 hover:text-red-600 cursor-pointer">
        Google News
      </span>
      <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 hover:text-red-600 cursor-pointer">
        RSS Feed
      </span>
      <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 hover:text-red-600 cursor-pointer">
        Community
      </span>
    </div>
  );
}

// 7. Compact Advertisement Card Component (Warm Light Yellow & Eye-Catching)
function CompactAdvertisementCard({ ad, slotNumber = 1, onAdClick, getVideoEmbedUrl }) {
  const defaultAds = [
    {
      id: 101,
      title: 'Parul University',
      description: 'Shape Your Future. Start Your Journey with NAAC A++ Education.',
      media_type: 'image',
      media_url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80',
      badge_text: 'Sponsored',
      button_text: 'Apply Now →',
      target_url: 'https://paruluniversity.ac.in',
      features: ['NAAC A++ Accredited', '100% Placement Support', 'Global Faculty & Labs'],
    },
    {
      id: 102,
      title: 'Partner with BlogHub',
      description: 'Reach thousands of software developers & creators daily.',
      media_type: 'graphic',
      media_url: null,
      badge_text: 'Partner Spotlight',
      button_text: 'Advertise Here →',
      target_url: '/register',
      features: ['Targeted Tech Audience', 'Custom Banner Placements', 'Real-Time ROI Analytics'],
    }
  ];

  const currentAd = ad || defaultAds[slotNumber === 1 ? 0 : 1];

  let feats = [];
  try {
    feats = typeof currentAd.features === 'string' ? JSON.parse(currentAd.features) : (Array.isArray(currentAd.features) ? currentAd.features : []);
  } catch (e) {
    feats = [];
  }

  const isExternal = currentAd.target_url && (currentAd.target_url.startsWith('http://') || currentAd.target_url.startsWith('https://'));

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#fffef0] via-[#fefce8] to-[#fef9c3]/70 border border-amber-300 hover:border-amber-400 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between group p-3.5 sm:p-4 text-slate-900">
      {/* Top Gold-Amber Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500"></div>

      <div>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black tracking-wider uppercase bg-amber-100/90 text-amber-950 border border-amber-300/90 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
            {currentAd.badge_text || (slotNumber === 1 ? 'Sponsored' : 'Partner')}
          </span>
          <span className="text-[8.5px] font-bold text-amber-800/80 uppercase tracking-widest bg-amber-100/60 px-2 py-0.5 rounded-md border border-amber-200/80">
            Advertisement
          </span>
        </div>

        {/* Media / Thumbnail Box */}
        {currentAd.media_type === 'image' && currentAd.media_url ? (
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-amber-50 border border-amber-200/90 mb-3 shadow-2xs group">
            <img
              src={currentAd.media_url}
              alt={currentAd.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Top Floating Badge on Image */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/95 text-slate-900 border border-amber-200 shadow-xs flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                Featured
              </span>
            </div>

            {/* Bottom Floating Pill on Image */}
            <div className="absolute bottom-2 left-2">
              <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider shadow-xs">
                Admissions 2026-27
              </span>
            </div>
          </div>
        ) : currentAd.media_type === 'video' && currentAd.media_url ? (
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 border border-amber-200 mb-3 shadow-2xs">
            {currentAd.media_url.includes('youtube.com') || currentAd.media_url.includes('youtu.be') || currentAd.media_url.includes('vimeo.com') ? (
              <iframe
                src={getVideoEmbedUrl(currentAd.media_url)}
                title={currentAd.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            ) : (
              <video src={currentAd.media_url} controls className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-3 shadow-2xs">
            {slotNumber === 1 ? (
              <Rocket className="w-5 h-5 text-amber-700" />
            ) : (
              <Megaphone className="w-5 h-5 text-amber-700" />
            )}
          </div>
        )}

        {/* Brand / Sponsor Name */}
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-900 mb-1">
          <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">{currentAd.title}</span>
        </div>

        {/* Catchy Headline */}
        <h3 className="text-sm sm:text-[14.5px] font-black text-slate-950 leading-snug tracking-tight font-serif mb-1.5 group-hover:text-amber-900 transition-colors">
          {currentAd.description || currentAd.title}
        </h3>

        {/* Feature Highlights / Bullet Pills */}
        {feats && feats.length > 0 ? (
          <div className="space-y-1 my-2.5 pt-2 border-t border-amber-200/70">
            {feats.slice(0, 3).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] text-slate-800 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 my-2.5 pt-2 border-t border-amber-200/70">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-amber-900 border border-amber-200">
              ⭐ Top Ranked
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 border border-amber-200">
              ✓ Verified Partner
            </span>
          </div>
        )}
      </div>

      {/* Vibrant Light-Yellow Gradient CTA Button */}
      <div className="pt-2">
        {isExternal ? (
          <a
            href={currentAd.target_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onAdClick(currentAd.id)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/25 hover:shadow-amber-500/35 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02] cursor-pointer"
          >
            <span>{currentAd.button_text || 'Apply Now'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        ) : (
          <Link
            to={currentAd.target_url || '/register'}
            onClick={() => onAdClick(currentAd.id)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/25 hover:shadow-amber-500/35 transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02] cursor-pointer"
          >
            <span>{currentAd.button_text || (slotNumber === 1 ? 'Start Free' : 'Get Started')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}

// 4. Video Card Component for Left & Right Stacks in Video Section
function VideoCardItem({ video, onPlayVideo }) {
  if (!video) return null;

  return (
    <article className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-none p-2.5 shadow-sm transition-all group flex flex-col justify-between h-full">
      <div>
        <div 
          onClick={() => onPlayVideo(video)}
          className="h-24 w-full rounded-none overflow-hidden bg-slate-950 mb-2 relative border border-slate-800 cursor-pointer group-hover:shadow-md transition-all"
        >
          <img
            src={video.thumbnail || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-rose-600 transition-all">
              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
            </div>
          </div>
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-none bg-black/80 text-[9px] font-mono font-bold text-white backdrop-blur-xs">
            {video.duration || 'Video'}
          </span>
        </div>

        <h4 
          onClick={() => onPlayVideo(video)}
          className="text-xs font-bold text-slate-100 group-hover:text-rose-400 line-clamp-2 leading-snug mb-1 cursor-pointer transition-colors"
        >
          {video.title}
        </h4>
      </div>

      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 mt-1">
        <span className="truncate max-w-[90px] text-slate-300 font-medium">{video.author_name}</span>
        <span className="flex items-center gap-0.5 text-slate-400">
          <Eye className="w-2.5 h-2.5" />
          {video.views || '0'}
        </span>
      </div>
    </article>
  );
}

// Helper to generate autoplay embed URLs (muted for browser policy compliance, with interactive audio toggle)
function getAutoplayEmbedUrl(url = '', isMuted = true) {
  if (!url) return null;
  const cleanUrl = url.trim();

  const ytId = getYouTubeId(cleanUrl);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&enablejsapi=1&controls=1&rel=0&playsinline=1&modestbranding=1`;
  }

  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=${isMuted ? 1 : 0}&controls=1`;
  }

  return cleanUrl;
}

// 5. Featured Center Video Card Component with Live Auto-Run on Scroll
function FeaturedCenterVideoCard({ video, onPlayVideo }) {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.35, // triggers when 35% of the video card is visible on screen
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  if (!video) return null;

  const embedUrl = isInView ? getAutoplayEmbedUrl(video.videoUrl, isMuted) : null;
  const isDirectVideo = video.videoUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(video.videoUrl.trim());

  return (
    <article 
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 hover:border-rose-500/60 rounded-none p-3.5 sm:p-4 shadow-md transition-all group flex flex-col justify-between h-full relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        <div className="h-56 sm:h-64 md:h-72 w-full rounded-none overflow-hidden bg-slate-950 mb-3 relative border border-slate-800 shadow-inner group/thumb">
          {isInView && embedUrl ? (
            <div className="w-full h-full relative bg-black">
              {isDirectVideo ? (
                <video
                  src={video.videoUrl}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={embedUrl}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* Sound & Expand Controls Floating Overlay */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="px-2 py-1 bg-black/85 hover:bg-black text-white rounded-none border border-white/20 backdrop-blur-xs transition-colors cursor-pointer shadow-md flex items-center gap-1 text-[10px] font-bold"
                  title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Unmute</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sound On</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onPlayVideo(video)}
                  className="p-1 bg-black/85 hover:bg-black text-white rounded-none border border-white/20 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  title="Open Fullscreen HD Modal"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
                </button>
              </div>

              {/* Top Live Auto-Playing Badge */}
              <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded-none text-[9px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Auto-Playing
                </span>
                <span className="px-2 py-0.5 rounded-none text-[9px] font-bold bg-black/70 text-slate-200 border border-white/10 backdrop-blur-xs">
                  {video.category || 'Tutorial'}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onPlayVideo(video)}
              className="w-full h-full relative cursor-pointer"
            >
              <img
                src={video.thumbnail || `https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80`}
                alt={video.title}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90 group-hover/thumb:opacity-100"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover/thumb:bg-black/15 transition-colors">
                <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl group-hover/thumb:scale-115 group-hover/thumb:bg-rose-500 transition-all border-2 border-white/20">
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-none text-[10px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <Tv className="w-3 h-3" />
                  Featured Video
                </span>
                <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-black/70 text-slate-200 border border-white/10 backdrop-blur-xs">
                  {video.category || 'Tutorial'}
                </span>
              </div>

              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-none bg-black/85 text-[10px] font-mono font-bold text-white backdrop-blur-xs border border-white/10">
                {video.duration || '15:00'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <Play className="w-3 h-3 fill-rose-400" />
            Video Tutorial
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            {video.views} views
          </span>
        </div>

        <h3 
          onClick={() => onPlayVideo(video)}
          className="text-base sm:text-lg font-black text-white group-hover:text-rose-400 transition-colors leading-snug mb-1.5 cursor-pointer"
        >
          {video.title}
        </h3>

        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
          {video.description}
        </p>
      </div>

      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-none bg-rose-600 text-white font-bold flex items-center justify-center text-[10px]">
            {video.author_name ? video.author_name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              {video.author_name}
              {video.author_is_verified && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onPlayVideo(video)}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-none shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <span>Watch Now</span>
          <Play className="w-3 h-3 fill-white" />
        </button>
      </div>
    </article>
  );
}

// 6. Byte-Sized Tip Card Component (Strictly 3-Minute Quick Blogs)
// 6. Byte-Sized Quick Blog Card Component (Strictly 3-Minute Quick Blogs)
function ByteSizedTipCard({ tip }) {
  return (
    <article className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-none p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full">
      <div>
        {/* Tip Header: Category Badge + Read Time */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold border ${tip.badge_color || 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {tip.category}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200/80">
            <Clock className="w-2.5 h-2.5" />
            {tip.read_time}
          </span>
        </div>

        {/* Tip Title linked to Blog */}
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug mb-1.5">
          {tip.slug ? (
            <Link to={getBlogUrl(tip)}>{tip.title}</Link>
          ) : (
            tip.title
          )}
        </h4>

        {/* Tip Description */}
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
          {tip.description}
        </p>

        {/* Pro Tip / Quick Takeaway Box to fill blank space */}
        {tip.takeaway && (
          <div className="p-2 bg-amber-50/70 border-l-2 border-amber-500 text-[10.5px] text-amber-950 font-medium leading-snug mb-3">
            {tip.takeaway}
          </div>
        )}
      </div>

      {/* Footer info & Read Story CTA with Author Byline */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 truncate max-w-[110px]">
          <div className="w-4 h-4 rounded-none bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-[8.5px]">
            {tip.author_name ? tip.author_name.charAt(0) : 'A'}
          </div>
          <span className="text-[10px] font-semibold text-slate-600 truncate">{tip.author_name}</span>
        </div>

        {tip.slug ? (
          <Link
            to={getBlogUrl(tip)}
            className="text-amber-700 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
          >
            <span>Read Story</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-amber-600 font-bold text-[11px]">3 min read</span>
        )}
      </div>
    </article>
  );
}

// 7. Tech Shorts & Reels Card Component
function TechReelCard({ reel, onPlay }) {
  if (!reel) return null;

  return (
    <article
      onClick={() => onPlay(reel)}
      className="group relative h-80 sm:h-96 w-full rounded-none overflow-hidden bg-slate-950 border border-slate-800 hover:border-rose-500 cursor-pointer shadow-md transition-all duration-300 flex flex-col justify-between"
    >
      {/* Background Image */}
      <img
        src={reel.thumbnail}
        alt={reel.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80";
        }}
      />

      {/* Dark Vignette Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/70 pointer-events-none"></div>

      {/* Top Bar: Category Pill + Duration */}
      <div className="relative z-10 p-3 flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider ${reel.badge_color || 'bg-rose-600 text-white'} shadow-xs`}>
          {reel.category}
        </span>
        <span className="px-1.5 py-0.5 rounded-none bg-black/80 text-[9px] font-mono font-bold text-white backdrop-blur-xs border border-white/10">
          {reel.duration}
        </span>
      </div>

      {/* Center Glowing Play Button with Teaser Pill */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-1.5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-rose-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-rose-500 transition-all border border-white/20">
          <Play className="w-5 h-5 fill-white translate-x-0.5" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/90 bg-black/50 px-2 py-0.5 backdrop-blur-xs border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          Watch 60s Reel
        </span>
      </div>

      {/* Bottom Content: Title, Subtitle, Author, Views & Likes */}
      <div className="relative z-10 p-3">
        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug mb-1">
          {reel.title}
        </h4>

        {reel.subtitle && (
          <p className="text-[10px] text-slate-300 line-clamp-1 leading-normal mb-2">
            {reel.subtitle}
          </p>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1.5 border-t border-white/10">
          <div className="flex items-center gap-1.5 truncate max-w-[100px]">
            <div className="w-4 h-4 rounded-none bg-rose-600 text-white flex items-center justify-center font-bold text-[8px]">
              {reel.author_name ? reel.author_name.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="truncate font-medium">{reel.author_name}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 shrink-0">
            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{reel.views}</span>
            <span className="flex items-center gap-0.5 text-rose-400"><Heart className="w-2.5 h-2.5 fill-rose-500" />{reel.likes}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// 8. Editorial "For You" Card Component
function ForYouCard({ blog }) {
  if (!blog) return null;

  return (
    <article className="flex flex-col justify-between group h-full">
      <div>
        {/* Landscape Image with Sharp Edges */}
        <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden mb-2.5 relative border border-slate-200/80 shadow-2xs">
          <Link to={getBlogUrl(blog)} className="block w-full h-full">
            <DynamicBlogThumbnail blog={blog} />
          </Link>
        </div>

        {/* Story Headline */}
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-900 transition-colors leading-snug mb-1.5 line-clamp-2">
          <Link to={getBlogUrl(blog)}>{blog.title}</Link>
        </h4>
      </div>

      {/* Underlined Editorial Author Byline */}
      <div className="pt-0.5 mt-auto">
        <Link
          to={`/author/${blog.author_id || 1}`}
          className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-800 hover:text-rose-900 underline decoration-slate-400 hover:decoration-rose-900 transition-colors inline-block"
        >
          {blog.author_name || 'STAFF WRITER'}
        </Link>
      </div>
    </article>
  );
}

// 9. Creator Spotlight Card Component
function CreatorSpotlightCard({ creator }) {
  if (!creator) return null;

  return (
    <article className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-none p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link to={`/author/${creator.id}`} className="relative shrink-0 group/av">
            <div className={`w-12 h-12 rounded-none bg-gradient-to-tr ${creator.avatar_color || 'from-indigo-600 to-indigo-400'} text-white font-bold flex items-center justify-center text-base shadow-sm group-hover/av:scale-105 transition-transform`}>
              {creator.name ? creator.name.charAt(0).toUpperCase() : 'C'}
            </div>
            {creator.is_verified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
              </span>
            )}
          </Link>

          <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
            {creator.role === 'admin' ? 'Admin Creator' : 'Verified Author'}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1">
          <Link to={`/author/${creator.id}`} className="flex items-center gap-1">
            <span>{creator.name}</span>
          </Link>
        </h4>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3.5">
          {creator.bio || 'Writer, developer, and open-source contributor on BlogHub.'}
        </p>

        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50/80 rounded-none border border-slate-100 mb-3 text-center">
          <div>
            <div className="text-xs font-black text-slate-900">{creator.blog_count || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">Stories</div>
          </div>
          <div className="border-x border-slate-200/70">
            <div className="text-xs font-black text-slate-900">{creator.total_views || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">Views</div>
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">{creator.total_likes || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">Likes</div>
          </div>
        </div>
      </div>

      <Link
        to={`/author/${creator.id}`}
        className="w-full py-2 px-3 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold rounded-none transition-all text-center flex items-center justify-center gap-1.5 group-hover:shadow-sm"
      >
        <span>View Profile & Stories</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </article>
  );
}

// 10. Official Instagram Gradient SVG Icon
function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="ig-grad-meta" r="150%" cx="30%" cy="107%">
          <stop stopColor="#fdf497" offset="0%" />
          <stop stopColor="#fdf497" offset="5%" />
          <stop stopColor="#fd5949" offset="45%" />
          <stop stopColor="#d6249f" offset="60%" />
          <stop stopColor="#285AEB" offset="90%" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad-meta)" />
      <path
        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="17.5"
        y1="6.5"
        x2="17.51"
        y2="6.5"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Default Fallback Hype Reels Dataset
const DEFAULT_HYPE_REELS = [
  {
    id: 'reel_hype_1',
    category: 'Supercars',
    category_badge: '🏎️ Supercars',
    username: 'supercars_daily',
    creator_name: 'Monaco Exotic Motors',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    caption: '1,800 HP Bugatti Tourbillon V16 quad-electric cold start in Monaco tunnel. The acoustic symphony is unreal 🔥🔊 #bugatti #hypercar #v16',
    thumbnail: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 245000,
    likes_formatted: '245k',
    comments_formatted: '8.9k',
    views_formatted: '1.8M',
    posted_ago_formatted: '2h ago'
  },
  {
    id: 'reel_hype_2',
    category: 'Cinema',
    category_badge: '🎬 Cinema',
    username: 'cinematic_frames',
    creator_name: 'Filmcraft Masterclass',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    caption: 'How 70mm IMAX cameras capture zero-gravity sequences without CGI wires. Hollywood filmmaking masterclass 🎥✨ #cinema #imax #hollywood',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 189000,
    likes_formatted: '189k',
    comments_formatted: '6.4k',
    views_formatted: '1.4M',
    posted_ago_formatted: '4h ago'
  },
  {
    id: 'reel_hype_3',
    category: 'Travel',
    category_badge: '✈️ Travel',
    username: 'earth_unreal',
    creator_name: 'Wanderlust Horizons',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    caption: 'High-speed FPV drone dive through morning fog across the Italian Dolomites peaks at sunrise 🏔️🦅 #travel #dolomites #drone',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 312000,
    likes_formatted: '312k',
    comments_formatted: '9.7k',
    views_formatted: '2.6M',
    posted_ago_formatted: '3h ago'
  },
  {
    id: 'reel_hype_4',
    category: 'Food',
    category_badge: '🍔 Street Food',
    username: 'foodie_cravings',
    creator_name: 'Gourmet Street Explorer',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80',
    caption: 'A5 Miyazaki Wagyu ribeye smoked over binchotan charcoal with dripping molten raclette cheese 🥩🧀🤤 #foodie #wagyu #streetfood',
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 198000,
    likes_formatted: '198k',
    comments_formatted: '7.2k',
    views_formatted: '1.6M',
    posted_ago_formatted: '5h ago'
  },
  {
    id: 'reel_hype_5',
    category: 'Sports',
    category_badge: '⚡ Sports',
    username: 'clutch_moments',
    creator_name: 'Global Sports Pulse',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    caption: '90+4 minute stoppage time overhead bicycle kick into the top corner in Champions League quarter finals ⚽🔥 #football #goals #ucl',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 420000,
    likes_formatted: '420k',
    comments_formatted: '15.3k',
    views_formatted: '3.8M',
    posted_ago_formatted: '1h ago'
  },
  {
    id: 'reel_hype_6',
    category: 'Fitness',
    category_badge: '💪 Fitness',
    username: 'beast_calisthenics',
    creator_name: 'Athlete Beast Mode',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    caption: 'Defying gravity: Strict full maltese planche hold with zero body momentum. The grip strength is insane 🦍💥 #calisthenics #fitness #workout',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    instagram_url: 'https://www.instagram.com/reels/',
    likes: 164000,
    likes_formatted: '164k',
    comments_formatted: '4.8k',
    views_formatted: '1.2M',
    posted_ago_formatted: '6h ago'
  }
];

// 11. Trending Instagram Reel Card Component (Compact, Professional Edition)
function TrendingInstagramReelCard({ reel, onPlayReel }) {
  if (!reel) return null;

  return (
    <article className="group relative aspect-[9/13] w-42 sm:w-46 md:w-48 max-h-[295px] shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between select-none">
      {/* Background Image Thumbnail with Subtle Zoom on Hover */}
      <img
        src={reel.thumbnail}
        alt={reel.caption}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-95"
        loading="lazy"
      />

      {/* Top & Bottom Gradient Vignettes for Crisp Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

      {/* TOP BAR: Creator Avatar + Username + Category Badge + Instagram Icon */}
      <div className="relative z-10 p-2.5 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="relative w-6 h-6 rounded-full p-0.5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0 shadow-xs">
            <img
              src={reel.avatar}
              alt={reel.username}
              className="w-full h-full rounded-full object-cover border border-black"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-white truncate leading-tight drop-shadow-sm">
              @{reel.username}
            </div>
            <div className="text-[8.5px] text-slate-300 font-medium leading-tight">
              {reel.posted_ago_formatted || 'Trending'}
            </div>
          </div>
        </div>

        {/* Small Instagram Badge */}
        <div className="w-5 h-5 rounded-md bg-black/40 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
          <InstagramIcon className="w-3 h-3" />
        </div>
      </div>

      {/* CENTER: Minimalist Frosted Play Action */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onPlayReel && onPlayReel({
            title: `@${reel.username}: ${reel.caption}`,
            videoUrl: reel.instagram_url,
            author_name: reel.creator_name || `@${reel.username}`,
            views: reel.views_formatted || `${reel.views}`,
            description: reel.caption,
            slug: null
          })}
          className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/35 text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-all opacity-85 group-hover:opacity-100 cursor-pointer"
          title="Watch Reel"
        >
          <Play className="w-4 h-4 fill-white translate-x-0.5" />
        </button>
      </div>

      {/* BOTTOM INFO: Caption + Engagement Stats + Action */}
      <div className="relative z-10 p-2.5 space-y-1.5">
        {/* Category Pill + Caption */}
        <div>
          {reel.category_badge && (
            <span className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-bold bg-white/20 backdrop-blur-xs text-white border border-white/20 shadow-2xs mb-1">
              {reel.category_badge}
            </span>
          )}
          <p className="text-[10px] text-white/95 line-clamp-2 leading-snug font-medium drop-shadow-sm">
            {reel.caption}
          </p>
        </div>

        {/* Engagement Stats Bar */}
        <div className="flex items-center justify-between text-[9px] text-slate-200 font-semibold pt-1 border-t border-white/15">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              {reel.likes_formatted}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="w-2.5 h-2.5 text-slate-300" />
              {reel.comments_formatted}
            </span>
          </div>

          <span className="flex items-center gap-0.5 text-[9px] text-amber-300 font-mono font-bold">
            <Eye className="w-2.5 h-2.5" />
            {reel.views_formatted}
          </span>
        </div>

        {/* Action Button: View on Instagram */}
        <a
          href={reel.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-1 px-2 bg-white/15 hover:bg-gradient-to-r hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] backdrop-blur-md border border-white/25 hover:border-transparent text-white font-bold text-[9.5px] rounded-md shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          <InstagramIcon className="w-2.5 h-2.5" />
          <span>View on Instagram</span>
          <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-80" />
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const subCategoryParam = searchParams.get('sub_category') || searchParams.get('subCategory') || '';
  const tagParam = searchParams.get('tag') || '';

  const { socket } = useNotifications();
  const [blogs, setBlogs] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [search, setSearch] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedTipCategory, setSelectedTipCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Video Modal State
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Astrology Widget State
  const [selectedZodiac, setSelectedZodiac] = useState('aries');
  const [astroTab, setAstroTab] = useState('daily');
  const [pinnedZodiac, setPinnedZodiac] = useState(false);
  const [zodiacStartIndex, setZodiacStartIndex] = useState(0);

  // Recipes & Food News State
  const [selectedFoodTab, setSelectedFoodTab] = useState('Featured');

  // Trending Instagram Reels State
  const [trendingReels, setTrendingReels] = useState(DEFAULT_HYPE_REELS);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelsError, setReelsError] = useState(null);
  const [selectedReelsHypeCategory, setSelectedReelsHypeCategory] = useState('All Hype');
  const reelsScrollContainerRef = useRef(null);

  // 1-Time Subscribe Modal State (Blinks/pops up first on open)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  // 3-4 Second Blinking Interstitial Ad State (appears 10s after subscribe modal or on open)
  const [showBlinkingAd, setShowBlinkingAd] = useState(false);
  const [adSecondsRemaining, setAdSecondsRemaining] = useState(4);

  // Trigger 1-time Subscribe Popup on site open, then schedule ad 10s after
  useEffect(() => {
    let adDelayTimer = null;
    const hasSeenSubscribePopup = localStorage.getItem('bloghub_subscribe_popup_seen');

    if (!hasSeenSubscribePopup) {
      // First visit: Pop up / blink subscribe form after 600ms (appears ONLY one time)
      const subTimer = setTimeout(() => {
        setShowSubscribeModal(true);
        localStorage.setItem('bloghub_subscribe_popup_seen', 'true');
      }, 600);

      return () => {
        clearTimeout(subTimer);
        if (adDelayTimer) clearTimeout(adDelayTimer);
      };
    } else {
      // Returning visit: Subscribe popup already shown, display ad after 10 seconds
      adDelayTimer = setTimeout(() => {
        setShowBlinkingAd(true);
        setAdSecondsRemaining(4);
      }, 10000);

      return () => {
        if (adDelayTimer) clearTimeout(adDelayTimer);
      };
    }
  }, []);

  // Recurring advertisement every 5 minutes
  useEffect(() => {
    const repeatInterval = setInterval(() => {
      setShowBlinkingAd(true);
      setAdSecondsRemaining(4);
    }, 5 * 60 * 1000);

    return () => clearInterval(repeatInterval);
  }, []);

  // Dismiss subscribe popup and schedule the advertisement to appear in 10 seconds
  const handleCloseSubscribeModal = () => {
    setShowSubscribeModal(false);
    setTimeout(() => {
      setShowBlinkingAd(true);
      setAdSecondsRemaining(4);
    }, 10000);
  };

  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribeSuccess(true);
      setTimeout(() => {
        handleCloseSubscribeModal();
      }, 1800);
    }
  };

  // Countdown and auto-dismiss for the 3-4s blinking advertisement
  useEffect(() => {
    if (!showBlinkingAd) return;

    if (adSecondsRemaining <= 0) {
      setShowBlinkingAd(false);
      return;
    }

    const countdownTimer = setInterval(() => {
      setAdSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setShowBlinkingAd(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [showBlinkingAd, adSecondsRemaining]);

  // Sync state when URL query params change
  useEffect(() => {
    setSearch(queryParam);
    setSelectedCategory(categoryParam);
    fetchBlogs(queryParam, categoryParam, tagParam, subCategoryParam);
  }, [queryParam, categoryParam, tagParam, subCategoryParam]);

  useEffect(() => {
    fetchTrendingBlogs();
    fetchActiveAds();
    fetchTopAuthors();
    fetchTrendingReels();
  }, []);

  const fetchTrendingReels = async () => {
    setReelsLoading(true);
    setReelsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reels/trending`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.reels)) {
        setTrendingReels(data.reels);
      } else {
        setReelsError(data.message || 'Unable to load Instagram Reels');
      }
    } catch (err) {
      console.warn('Error fetching Instagram Reels:', err);
      setReelsError('Could not reach Reels API server');
    } finally {
      setReelsLoading(false);
    }
  };

  const scrollReels = (direction) => {
    if (reelsScrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      reelsScrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Real-time socket event subscription
  useEffect(() => {
    if (!socket) return;

    const handleBlogPublished = (publishedBlog) => {
      console.log('⚡ Real-time blog published:', publishedBlog?.title);
      fetchBlogs(queryParam, selectedCategory, tagParam, subCategoryParam);
      fetchTrendingBlogs();
      fetchTopAuthors();
    };

    const handleBlogDeleted = ({ blogId }) => {
      setBlogs((prev) => prev.filter((b) => b.id !== parseInt(blogId, 10) && b.id !== blogId));
      fetchTrendingBlogs();
      fetchTopAuthors();
    };

    const handleBlogLiked = ({ blogId, likeCount }) => {
      setBlogs((prev) =>
        prev.map((b) => (b.id === parseInt(blogId, 10) || b.id === blogId ? { ...b, like_count: likeCount } : b))
      );
    };

    const handleAdUpdated = () => {
      fetchActiveAds();
    };

    socket.on('blog_published', handleBlogPublished);
    socket.on('blog_deleted', handleBlogDeleted);
    socket.on('blog_liked', handleBlogLiked);
    socket.on('advertisement_updated', handleAdUpdated);

    return () => {
      socket.off('blog_published', handleBlogPublished);
      socket.off('blog_deleted', handleBlogDeleted);
      socket.off('blog_liked', handleBlogLiked);
      socket.off('advertisement_updated', handleAdUpdated);
    };
  }, [socket, queryParam, selectedCategory, tagParam, subCategoryParam]);

  const fetchActiveAds = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/advertisements/active`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.advertisements) && data.advertisements.length > 0) {
          setActiveAds(data.advertisements);
        } else if (data.advertisement) {
          setActiveAds([data.advertisement]);
        } else {
          setActiveAds([]);
        }
      }
    } catch (err) {
      console.error('Error fetching active ads:', err);
    }
  };

  const fetchTopAuthors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/top-authors`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.authors) && data.authors.length > 0) {
        setTopAuthors(data.authors);
      } else {
        setTopAuthors([]);
      }
    } catch (err) {
      console.error('Error fetching top authors:', err);
    }
  };

  const handleAdClick = (adId) => {
    if (!adId) return;
    try {
      fetch(`${API_BASE_URL}/api/advertisements/${adId}/click`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

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

  const fetchBlogs = async (query = '', cat = 'All', tag = '', subCat = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (cat && cat !== 'All') params.append('category', cat);
      if (subCat) params.append('sub_category', subCat);
      if (tag) params.append('tag', tag);

      const res = await fetch(`${API_BASE_URL}/api/blogs?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs(data.blogs);
      } else {
        setError(data.message || 'Failed to load blogs');
      }
    } catch (err) {
      setError('Cannot connect to backend server. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingBlogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/blogs/trending`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrendingBlogs(data.trending || []);
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSearchParams({});
  };

  const calculateReadTime = (content) => {
    if (!content) return '1 min read';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 180);
    return `${minutes} min read`;
  };

  // Wireframe Data Partitioning for Newsroom Layout:
  const isDefaultView = !queryParam && selectedCategory === 'All' && !tagParam;
  const latestBlog = blogs.length > 0 ? blogs[0] : DEFAULT_WIRE_BLOGS[0];

  // Helper to deduplicate blogs list
  const dedupeBlogs = (list) =>
    list.filter((b, idx, arr) => arr.findIndex((x) => (x.id === b.id || (x.slug && x.slug === b.slug))) === idx);

  // 2. Left Row of 4 Sub-leads in 2x2 Grid (underneath hero story)
  const leftRelatedBlogs = dedupeBlogs([
    ...blogs.slice(1, 5),
    ...DEFAULT_WIRE_BLOGS,
  ]).slice(0, 4);

  // Left breaking bullet news items
  const leftBreakingBullets = dedupeBlogs([
    ...blogs.slice(5, 8),
    ...blogs.slice(1, 4),
    ...DEFAULT_WIRE_BLOGS,
  ]).slice(0, 3);

  // 3. Middle Column (1 Top Featured Wire + 10 Stacked Speedy News)
  const middleRelatedBlog = blogs.length > 5
    ? blogs[5]
    : blogs.length > 1
    ? blogs[1]
    : blogs.length > 0
    ? blogs[0]
    : DEFAULT_WIRE_BLOGS[0];

  const middleOtherBlogs = dedupeBlogs([
    ...blogs.slice(1),
    ...DEFAULT_WIRE_BLOGS,
  ]).slice(0, 10);

  // 4. Right Column Top Tech Picks (4 items to match height)
  const rightTechPicks = dedupeBlogs([
    ...blogs.filter((b) => b.category && (b.category.toLowerCase().includes('tech') || b.category.toLowerCase().includes('ai'))),
    ...blogs.slice(2),
    ...DEFAULT_WIRE_BLOGS,
  ]).slice(0, 4);

  // 5. Remaining blogs for the feed below
  const feedBlogs = isDefaultView
    ? (blogs.length > 0 ? blogs : DEFAULT_WIRE_BLOGS)
    : blogs;

  const displayedFeedBlogs = feedBlogs.slice(0, 8);

  // 5. Video Section Data Assembly
  const dbVideoBlogs = blogs
    .filter((b) => {
      const cover = getBlogCover(b);
      return cover && cover.type === 'video' && cover.videoUrl;
    })
    .map((b) => {
      const cover = getBlogCover(b);
      return {
        id: b.id,
        title: b.title,
        category: b.category,
        author_name: b.author_name,
        author_is_verified: b.author_is_verified,
        views: `${b.views || 0}`,
        duration: calculateReadTime(b.content),
        videoUrl: cover.videoUrl,
        thumbnail: cover.url,
        description: b.content ? stripHtml(b.content).slice(0, 100) + '...' : '',
        slug: b.slug
      };
    });

  const combinedVideos = [...dbVideoBlogs, ...DEFAULT_VIDEO_BLOGS].slice(0, 5);

  const videoLeft = [combinedVideos[0], combinedVideos[1]];
  const featuredVideo = combinedVideos[2] || combinedVideos[0];
  const videoRight = [combinedVideos[3] || combinedVideos[1], combinedVideos[4] || combinedVideos[0]];

  // 6. Creator Spotlight Data Assembly
  const combinedCreators = [...topAuthors, ...DEFAULT_CREATORS]
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .slice(0, 4);

  // 7. Filtered Byte Sized Tips
  const displayedTips = selectedTipCategory === 'All'
    ? BYTE_SIZED_TIPS
    : BYTE_SIZED_TIPS.filter(t => t.category.toLowerCase().includes(selectedTipCategory.toLowerCase()) || t.tag.toLowerCase().includes(selectedTipCategory.toLowerCase()));

  // 8. "For you" Editorial Section Data (4 curated / personalized articles)
  const defaultForYou = [
    {
      id: 'fy-1',
      title: 'Full-Stack PostgreSQL to React: Architecture & Performance Rules',
      author_name: 'CHAITANYA PATIL',
      author_id: 1,
      slug: 'getting-started-with-full-stack-development-in-2026',
      category: 'Technology',
    },
    {
      id: 'fy-2',
      title: 'Git and GitHub Commands Every Developer Should Know by Heart',
      author_name: 'ADMIN USER',
      author_id: 2,
      slug: 'git-and-github-commands-every-beginner-should-know',
      category: 'Technology',
    },
    {
      id: 'fy-3',
      title: 'The Rise of AI in Pair Programming and Development Workflows',
      author_name: 'ALEX VANCE',
      author_id: 3,
      slug: 'the-rise-of-ai-in-pair-programming-and-development',
      category: 'AI',
    },
    {
      id: 'fy-4',
      title: 'Mastering Tailwind CSS & Modern UI Layouts in 2026',
      author_name: 'SARAH CONNOR',
      author_id: 4,
      slug: 'mastering-tailwind-css-for-modern-web-ui',
      category: 'Design',
    },
  ];

  const forYouBlogs = blogs.length >= 4 
    ? blogs.slice(0, 4) 
    : [...blogs, ...defaultForYou].slice(0, 4);

  // 9. "Only in BlogHub" Curated 8 items
  const onlyInBlogHubItems = ONLY_IN_BLOGHUB_DATA;

  // Dynamic Category Filters
  const sportsBlogs = blogs.filter((b) => b.category && b.category.toLowerCase().includes('sport'));
  const entertainmentBlogs = blogs.filter((b) => b.category && (b.category.toLowerCase().includes('entertain') || b.category.toLowerCase().includes('cinema') || b.category.toLowerCase().includes('movie')));
  const foodBlogs = blogs.filter((b) => b.category && (b.category.toLowerCase().includes('food') || b.category.toLowerCase().includes('recipe') || b.category.toLowerCase().includes('cook')));
  const astrologyBlogs = blogs.filter((b) => b.category && (b.category.toLowerCase().includes('astro') || b.category.toLowerCase().includes('horoscope')));
  const newsBlogs = blogs.filter((b) => b.category && (b.category.toLowerCase().includes('news') || b.category.toLowerCase().includes('world')));
  const techBlogs = blogs.filter((b) => b.category && (b.category.toLowerCase().includes('tech') || b.category.toLowerCase().includes('program') || b.category.toLowerCase().includes('web')));

  // Rendered dynamic Sports stories
  const dynamicSportsStories = sportsBlogs.length > 0
    ? [
        ...sportsBlogs.map((b, idx) => ({
          id: `sport-db-${b.id}`,
          category: b.tags && b.tags.length > 0 ? b.tags[0].toUpperCase() : 'SPORTS',
          icon: null,
          title: b.title,
          description: b.content ? stripHtml(b.content).slice(0, 130).trim() + '...' : '',
          keyStat: b.tags && b.tags.length > 1 ? `✦ In-depth #${b.tags[0]} analysis & match insights` : '✦ Verified Sports Bureau Report',
          author: b.author_name || 'Sports Bureau',
          timeAgo: 'Latest',
          thumbnail: getBlogCover(b)?.url || (SPORTS_SECTION_DATA.stories[idx % SPORTS_SECTION_DATA.stories.length]?.thumbnail),
          slug: b.slug
        })),
        ...SPORTS_SECTION_DATA.stories
      ].slice(0, 4)
    : SPORTS_SECTION_DATA.stories;

  // Rendered dynamic Entertainment stories
  const dynamicEntHero = entertainmentBlogs.length > 0 ? {
    id: `ent-hero-${entertainmentBlogs[0].id}`,
    title: entertainmentBlogs[0].title,
    image: getBlogCover(entertainmentBlogs[0])?.url || ENTERTAINMENT_SECTION_DATA.featuredHero.image,
    slug: entertainmentBlogs[0].slug
  } : ENTERTAINMENT_SECTION_DATA.featuredHero;

  const dynamicEntPhotoGrid = entertainmentBlogs.length > 1
    ? [
        ...entertainmentBlogs.slice(1, 5).map((b) => ({
          id: `ent-grid-${b.id}`,
          title: b.title,
          image: getBlogCover(b)?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          slug: b.slug,
          isVideo: false,
          isGallery: false
        })),
        ...ENTERTAINMENT_SECTION_DATA.photoGrid
      ].slice(0, 4)
    : ENTERTAINMENT_SECTION_DATA.photoGrid;

  // Rendered dynamic Food stories
  const dynamicFoodHero = foodBlogs.length > 0 ? {
    id: `food-hero-${foodBlogs[0].id}`,
    title: foodBlogs[0].title,
    photoCount: 7,
    image: getBlogCover(foodBlogs[0])?.url || RECIPES_FOOD_SECTION_DATA.featuredHero.image,
    slug: foodBlogs[0].slug
  } : RECIPES_FOOD_SECTION_DATA.featuredHero;

  const dynamicFoodSidebar = foodBlogs.length > 1
    ? [
        ...foodBlogs.slice(1, 6).map((b) => ({
          id: `sr-${b.id}`,
          title: b.title,
          description: b.content ? stripHtml(b.content).slice(0, 80).trim() + '...' : '',
          image: getBlogCover(b)?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
          category: b.category || 'Recipes',
          slug: b.slug
        })),
        ...RECIPES_FOOD_SECTION_DATA.sidebarRecipes
      ].slice(0, 5)
    : RECIPES_FOOD_SECTION_DATA.sidebarRecipes;

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Main Explore Content (Blurred when advertisement is active) */}
      <div className={`py-3 sm:py-4 px-3 sm:px-5 lg:px-6 max-w-[1440px] w-full mx-auto space-y-6 transition-all duration-500 overflow-x-hidden ${showBlinkingAd ? 'filter blur-md pointer-events-none select-none' : ''}`}>
        {/* Active Filter Indicator Bar */}
        {(queryParam || tagParam || (selectedCategory && selectedCategory !== 'All')) && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200/90 rounded-none px-3.5 py-2 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filtered By:</span>
              {selectedCategory && selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-red-50 text-red-700 border border-red-200/80 font-bold text-xs">
                  <span>Category: {selectedCategory}</span>
                </span>
              )}
              {tagParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-xs">
                  <span>Tag: #{tagParam}</span>
                </span>
              )}
              {queryParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs">
                  <span>Search: "{queryParam}"</span>
                </span>
              )}
            </div>

            <button
              onClick={clearAllFilters}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}

      {/* ========================================================================= */}
      {/* 3-COLUMN NEWSROOM SPOTLIGHT (AAJ TAK BROADCAST & EDITORIAL LAYOUT)        */}
      {/* [Hero Lead & 4 Sub-leads + Flash] | [Superfast News Wire] | [Live TV & Tech Picks] */}
      {/* ========================================================================= */}
      {latestBlog && !queryParam && selectedCategory === 'All' && !tagParam && (
        <section className="bg-white border border-slate-200/90 rounded-none p-3 sm:p-3.5 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
            
            {/* COLUMN 1 (LEFT - 6 SPAN / 50% WIDTH): HERO LEAD, 2x2 SUB-LEADS & LIVE FLASH */}
            <div className="lg:col-span-6 space-y-2.5">
              <div>
                {/* 1. Main Lead Headline on TOP of Photo */}
                <h1 className="text-lg sm:text-xl md:text-2xl font-black font-serif text-slate-950 hover:text-red-600 transition-colors leading-tight mb-2">
                  <Link to={getBlogUrl(latestBlog)} className="hover:underline">
                    <span className="text-red-600 mr-2 font-black uppercase tracking-tight">LIVE:</span>
                    {latestBlog.title}
                  </Link>
                </h1>

                {/* 2. Hero Landscape Photo */}
                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 mb-2 relative border border-slate-200/90 shadow-2xs group">
                  <Link to={getBlogUrl(latestBlog)} className="block w-full h-full">
                    <DynamicBlogThumbnail blog={latestBlog} isFeatured={true} />
                  </Link>
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-2.5 py-0.5 text-[9.5px] font-black bg-red-600 text-white uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      Top Story
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-bold bg-black/75 backdrop-blur-xs text-white border border-white/20">
                      {latestBlog.category || 'Tech'}
                    </span>
                  </div>
                </div>

                {/* 3. Hero Lead Excerpt / Caption Bar */}
                <div className="p-2.5 bg-slate-100/90 border-l-4 border-red-600 mb-2.5 text-xs text-slate-700 leading-relaxed font-sans">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10.5px] mr-1.5">
                    {latestBlog.category?.toUpperCase() || 'TECH'} REPORT • {calculateReadTime(latestBlog.content)}:
                  </span>
                  {stripHtml(latestBlog.content || '').slice(0, 150)}...
                </div>
              </div>

              {/* 4. 2x2 Sub-Leads Grid (4 Related Stories matching Aaj Tak 2x2 cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/90">
                {leftRelatedBlogs.map((b) => (
                  <BottomRelatedCard key={b.id} blog={b} />
                ))}
              </div>

              {/* 5. Live Newsroom Dispatches Bullet Flash Strip */}
              {leftBreakingBullets && leftBreakingBullets.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/90 p-2 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <span>LIVE FLASH DISPATCHES</span>
                  </div>
                  <div className="space-y-1">
                    {leftBreakingBullets.map((b) => (
                      <div key={b.id} className="flex items-center gap-1.5 text-xs text-slate-800">
                        <span className="text-red-500 font-bold">›</span>
                        <Link to={getBlogUrl(b)} className="hover:text-red-600 font-medium truncate">
                          {b.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2 (MIDDLE - 3 SPAN / 25% WIDTH): SUPERFAST NEWS WIRE (BULKY & FULLY PACKED) */}
            <div id="superfast-wire" className="lg:col-span-3 lg:border-x lg:border-slate-200/90 lg:px-3 space-y-2">
              <div>
                {/* Stylized Superfast News Header Banner */}
                <div className="border-b-2 border-red-600 pb-1.5 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-red-600 text-white text-[10.5px] font-black px-2 py-0.5 uppercase tracking-wider italic">
                      SUPERFAST
                    </span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">NEWS</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Real-time Wire</span>
                </div>

                {/* Top Highlighted Featured Wire Card */}
                <SuperfastFeaturedCard blog={middleRelatedBlog} />

                {/* Vertical Stack of 7 Speedy News Wire Items (Full Column, Zero Gap) */}
                <div className="divide-y divide-slate-200/80 mt-1">
                  {middleOtherBlogs.map((b) => (
                    <SuperfastWireItem key={b.id} blog={b} />
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3 (RIGHT - 3 SPAN / 25% WIDTH): ADVERTISEMENT + TABBED LIVE TV + TECH PICKS + FOLLOW */}
            <div className="lg:col-span-3 space-y-2.5">
              {/* Top Banner Advertisement Slot */}
              <div>
                <div className="text-center text-[8.5px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  ADVERTISEMENT
                </div>
                <CompactAdvertisementCard
                  ad={activeAds[0] || null}
                  slotNumber={1}
                  onAdClick={handleAdClick}
                  getVideoEmbedUrl={getVideoEmbedUrl}
                />
              </div>

              {/* Tabbed Live TV / Video Player Box */}
              <TabbedLiveVideoWidget
                video={combinedVideos[0] || DEFAULT_VIDEO_BLOGS[0]}
                onPlayVideo={(v) => setActiveVideoModal(v)}
              />

              {/* Top Tech Picks Mini Wire */}
              <RightTrendingPicksList blogs={rightTechPicks} />

              {/* Social Channels Follow Bar */}
              <SocialFollowBar />
            </div>

          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MORE EXPLORE ARTICLES (DISMISSIBLE / COMPACT FEED - EXACTLY 4 CARDS IN 1 ROW) */}
      {/* ========================================================================= */}
      {displayedFeedBlogs.length > 0 && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              {queryParam || (selectedCategory !== 'All') || tagParam ? (
                <span>Filtered Results ({displayedFeedBlogs.length})</span>
              ) : (
                <span>More Explore Stories</span>
              )}
            </h3>

            <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-slate-600 rounded-none border border-slate-200 shadow-xs">
              {displayedFeedBlogs.length} {displayedFeedBlogs.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {displayedFeedBlogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-white hover:border-indigo-300 border border-slate-200/90 rounded-none overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-sm group"
              >
                <div>
                  <Link to={getBlogUrl(blog)} className="block aspect-[16/10] w-full bg-slate-100 overflow-hidden relative rounded-none">
                    <DynamicBlogThumbnail blog={blog} />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-none text-[9px] font-bold bg-white/95 backdrop-blur-xs text-slate-800 shadow-xs border border-white/40">
                        {blog.category || 'Tech'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-3">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-[11px] text-slate-800 truncate">{blog.author_name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{calculateReadTime(blog.content)}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1 leading-snug">
                      <Link to={getBlogUrl(blog)}>{blog.title}</Link>
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {stripHtml(blog.content || '')}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3 text-slate-400" />{blog.views || 0}</span>
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-rose-500" />{blog.like_count || 0}</span>
                  </div>
                  <Link to={getBlogUrl(blog)} className="text-indigo-600 font-bold hover:text-indigo-800">
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 📸 TRENDING INSTAGRAM REELS (COMPACT PROFESSIONAL CAROUSEL)               */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-3 border-t border-slate-200/90">
        
        {/* Section Header: Instagram Branding + Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-xs shrink-0">
              <InstagramIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Trending Instagram Reels</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                <Flame className="w-2.5 h-2.5 fill-rose-600" />
                Live Hype
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[10px] font-semibold text-slate-400 hidden md:inline">
              Swipe or use arrows
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollReels('left')}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="Previous Reels"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollReels('right')}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                title="Next Reels"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Refined Hype Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-0.5 text-xs">
          {[
            { label: '🔥 All Hype', value: 'All Hype' },
            { label: '🏎️ Supercars', value: 'Supercars' },
            { label: '🎬 Cinema', value: 'Cinema' },
            { label: '✈️ Travel', value: 'Travel' },
            { label: '🍔 Street Food', value: 'Food' },
            { label: '⚡ Sports', value: 'Sports' },
            { label: '💪 Fitness', value: 'Fitness' },
            { label: '🤖 Tech & AI', value: 'Tech' },
            { label: '🎵 Music', value: 'Music' },
            { label: '🌊 Nature', value: 'Nature' },
            { label: '😂 Humor', value: 'Comedy' },
            { label: '🕺 Dance', value: 'Dance' }
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedReelsHypeCategory(cat.value)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedReelsHypeCategory === cat.value
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading Skeletons */}
        {reelsLoading && (
          <div className="flex gap-3 overflow-x-hidden no-scrollbar scrollbar-none py-1">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={`reel-skel-${idx}`}
                className="aspect-[9/13] w-42 sm:w-46 md:w-48 max-h-[295px] shrink-0 rounded-xl bg-slate-200/80 animate-pulse flex flex-col justify-between p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-300"></div>
                  <div className="w-16 h-2.5 rounded bg-slate-300"></div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded bg-slate-300"></div>
                  <div className="w-2/3 h-2.5 rounded bg-slate-300"></div>
                  <div className="w-full h-5 rounded bg-slate-300"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!reelsLoading && reelsError && trendingReels.length === 0 && (
          <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <span className="font-semibold">{reelsError}</span>
            <button
              type="button"
              onClick={fetchTrendingReels}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Reels Horizontal Scroll Track (Snap Scrolling, No Visible Scrollbar) */}
        {!reelsLoading && (
          (() => {
            const displayedHypeReels = selectedReelsHypeCategory === 'All Hype' || selectedReelsHypeCategory === 'All'
              ? trendingReels
              : trendingReels.filter(r => 
                  (r.category && r.category.toLowerCase().includes(selectedReelsHypeCategory.toLowerCase())) ||
                  (r.category_badge && r.category_badge.toLowerCase().includes(selectedReelsHypeCategory.toLowerCase()))
                );

            if (displayedHypeReels.length === 0) {
              return (
                <div className="p-6 bg-white border border-slate-200/90 rounded-xl text-center text-xs text-slate-500">
                  No trending reels in this category right now.{' '}
                  <button
                    onClick={() => setSelectedReelsHypeCategory('All Hype')}
                    className="text-rose-600 font-bold hover:underline ml-1 cursor-pointer"
                  >
                    View All Hype Reels
                  </button>
                </div>
              );
            }

            return (
              <div
                ref={reelsScrollContainerRef}
                className="flex gap-3 overflow-x-auto no-scrollbar scrollbar-none py-1 scroll-smooth snap-x snap-mandatory"
              >
                {displayedHypeReels.map((reel) => (
                  <div key={reel.id} className="snap-start shrink-0">
                    <TrendingInstagramReelCard
                      reel={reel}
                      onPlayReel={(r) => setActiveVideoModal(r)}
                    />
                  </div>
                ))}
              </div>
            );
          })()
        )}

      </section>

      {/* ========================================================================= */}
      {/* 📰 4-COLUMN MULTI-TOPIC NEWS HUBS (BBC NEWS / EDITORIAL WIRE LAYOUT) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-3 border-t border-slate-200/90">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
          {CATEGORY_NEWS_HUBS.map((hub) => (
            <div key={hub.id} className="flex flex-col justify-between h-full">
              {/* Category Header with Chevron */}
              <div className="border-b border-slate-900 pb-1.5 mb-3">
                <Link
                  to={`/explore?category=${hub.categorySlug}`}
                  className="group/cat flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-900 hover:text-rose-700 transition-colors"
                >
                  <span>{hub.categoryName}</span>
                  <span className="text-rose-600 group-hover/cat:translate-x-1 transition-transform font-bold text-sm leading-none">›</span>
                </Link>
              </div>

              {/* Lead Story with Top Photo */}
              <div className="mb-3">
                <Link
                  to={getBlogUrl(hub.lead)}
                  className="block aspect-[16/10] w-full bg-slate-100 overflow-hidden mb-2 relative border border-slate-200/80 shadow-2xs group/lead"
                >
                  <img
                    src={hub.lead.image}
                    alt={hub.lead.title}
                    className="w-full h-full object-cover group-hover/lead:scale-105 transition-transform duration-300"
                  />
                </Link>

                <h4 className="text-sm font-bold text-slate-900 hover:text-rose-800 transition-colors leading-snug mb-1.5">
                  <Link to={getBlogUrl(hub.lead)}>
                    {hub.lead.title}
                  </Link>
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {hub.lead.excerpt}
                </p>
              </div>

              {/* Stacked Sub-Stories separated by thin lines */}
              <div className="space-y-2 mt-auto">
                {hub.subStories.map((sub) => (
                  <div key={sub.id} className="border-t border-slate-200/80 pt-2">
                    <h5 className="text-xs sm:text-[12.5px] font-bold text-slate-900 hover:text-rose-800 transition-colors leading-snug">
                      <Link to={getBlogUrl(sub)} className="flex items-start gap-1">
                        {sub.isMedia && (
                          <span className="text-[10px] text-rose-600 mt-0.5 shrink-0 font-black">▶</span>
                        )}
                        <span>{sub.title}</span>
                      </Link>
                    </h5>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* VIDEO SECTION (MATCHING WIREFRAME: [2 Videos Left] | [Featured Video Center] | [2 Videos Right]) */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Video Stories & Masterclasses
                <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                  Watch
                </span>
              </h3>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded-none shadow-xs">
            5 Featured Videos
          </span>
        </div>

        {/* 3-Column Video Showcase Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-none p-3 sm:p-4 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
            
            {/* 1. LEFT COLUMN (3 SPAN): 2 STACKED VIDEOS */}
            <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
              <div className="flex-1">
                <VideoCardItem
                  video={videoLeft[0]}
                  onPlayVideo={(v) => setActiveVideoModal(v)}
                />
              </div>
              <div className="flex-1">
                <VideoCardItem
                  video={videoLeft[1]}
                  onPlayVideo={(v) => setActiveVideoModal(v)}
                />
              </div>
            </div>

            {/* 2. CENTER COLUMN (6 SPAN): 1 LARGE FEATURED VIDEO */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <FeaturedCenterVideoCard
                video={featuredVideo}
                onPlayVideo={(v) => setActiveVideoModal(v)}
              />
            </div>

            {/* 3. RIGHT COLUMN (3 SPAN): 2 STACKED VIDEOS */}
            <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
              <div className="flex-1">
                <VideoCardItem
                  video={videoRight[0]}
                  onPlayVideo={(v) => setActiveVideoModal(v)}
                />
              </div>
              <div className="flex-1">
                <VideoCardItem
                  video={videoRight[1]}
                  onPlayVideo={(v) => setActiveVideoModal(v)}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🌟 ONLY IN BLOGHUB (4-COLUMN x 2-ROW EXCLUSIVE NUMBERED GRID)            */}
      {/* ========================================================================= */}
      <section className="pt-2 pb-1 border-t border-dashed border-slate-300">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-slate-900">
            ONLY IN BLOGHUB
          </h3>
        </div>

        {/* 4-Column x 2-Row Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-200 bg-white">
          {onlyInBlogHubItems.map((item, idx) => (
            <article
              key={item.id || idx}
              className={`p-3 sm:p-4 flex items-start gap-3 group hover:bg-slate-50/80 transition-colors ${
                idx % 4 !== 3 ? 'lg:border-r lg:border-slate-200' : ''
              } ${
                idx < 4 ? 'lg:border-b lg:border-slate-200' : ''
              } ${
                idx % 2 === 0 ? 'sm:border-r sm:border-slate-200' : ''
              } ${
                idx < 6 ? 'sm:border-b sm:border-slate-200' : ''
              } ${
                idx < 7 ? 'border-b border-slate-100 sm:border-b-0' : ''
              }`}
            >
              <span
                className="text-2xl sm:text-3xl font-serif font-black select-none shrink-0 leading-none pt-0.5"
                style={{
                  WebkitTextStroke: '1.2px #64748b',
                  color: 'transparent'
                }}
              >
                {item.num || idx + 1}
              </span>
              <h4 className="text-xs sm:text-[12.5px] font-bold font-serif text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-3">
                <Link to={getBlogUrl(item)}>
                  {item.title}
                </Link>
              </h4>
            </article>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📰 EDITORIAL BROADSHEET & LATEST NEWS SECTION (INDIAN EXPRESS / NEWSROOM STYLE) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-slate-200/90">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 SPAN: FEATURED TOP HERO (IMAGE + TEXT) + 3x3 TEXT GRID */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Featured Hero (Split: Left Title/Category/Excerpt, Right Landscape Photo) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center border-b border-slate-200/90 pb-6">
              <div className="sm:col-span-6 pr-2">
                {/* Category & Timestamp */}
                <div className="flex flex-wrap items-center gap-2 text-[10.5px] mb-1.5">
                  <span className="font-black uppercase tracking-wider text-rose-600">
                    {BROADSHEET_NEWSROOM_DATA.heroStory.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">{BROADSHEET_NEWSROOM_DATA.heroStory.byline}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 font-mono text-[10px]">{BROADSHEET_NEWSROOM_DATA.heroStory.updated}</span>
                </div>

                {/* Headline */}
                <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-black text-slate-900 leading-tight hover:text-rose-900 transition-colors mb-2">
                  <Link to={getBlogUrl(BROADSHEET_NEWSROOM_DATA.heroStory)} className="hover:underline decoration-slate-400">
                    {BROADSHEET_NEWSROOM_DATA.heroStory.title}
                  </Link>
                </h3>

                {/* Story Excerpt */}
                <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                  {BROADSHEET_NEWSROOM_DATA.heroStory.excerpt}
                </p>

                {/* Key Point Box */}
                <div className="text-[10.5px] text-rose-900 bg-rose-50/70 border-l-2 border-rose-500 px-2.5 py-1 font-medium">
                  {BROADSHEET_NEWSROOM_DATA.heroStory.keyPoint}
                </div>
              </div>

              <div className="sm:col-span-6">
                <Link
                  to={getBlogUrl(BROADSHEET_NEWSROOM_DATA.heroStory)}
                  className="block aspect-[16/10] w-full bg-slate-100 overflow-hidden border border-slate-200/90 shadow-2xs group"
                >
                  <img
                    src={BROADSHEET_NEWSROOM_DATA.heroStory.image}
                    alt={BROADSHEET_NEWSROOM_DATA.heroStory.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                </Link>
              </div>
            </div>

            {/* 3x3 Text-Only Editorial Stories Grid with Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              {BROADSHEET_NEWSROOM_DATA.gridStories.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between ${
                    idx >= 3 ? 'sm:border-t sm:border-dotted sm:border-slate-300 sm:pt-4' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1 text-[10.5px] font-black uppercase tracking-wider text-rose-600 mb-1">
                      {item.icon && <span className="text-amber-500">{item.icon}</span>}
                      <span>{item.category}</span>
                    </div>
                    <h4 className="text-xs sm:text-[13px] font-bold font-serif text-slate-900 hover:text-rose-800 transition-colors leading-snug mb-1">
                      <Link to={getBlogUrl(item)}>
                        {item.title}
                      </Link>
                    </h4>
                    {item.excerpt && (
                      <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT 4 SPAN: LATEST NEWS WIRE SIDEBAR */}
          <div className="lg:col-span-4 lg:border-l lg:border-slate-200/90 lg:pl-6 space-y-4">
            {/* Header with link arrow */}
            <div className="border-b border-slate-900 pb-1.5 flex items-center justify-between">
              <Link
                to="/explore"
                className="group flex items-center gap-1 text-sm font-black uppercase tracking-wider text-slate-900 hover:text-rose-700 transition-colors"
              >
                <span>LATEST NEWS</span>
                <span className="text-rose-600 group-hover:translate-x-0.5 transition-transform font-bold text-base leading-none">›</span>
              </Link>
            </div>

            {/* Stacked Live Stream Items */}
            <div className="divide-y divide-slate-200/80">
              {BROADSHEET_NEWSROOM_DATA.latestNews.map((news) => (
                <article key={news.id} className="py-2.5 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider mb-1">
                    <span className="text-slate-400 font-mono">{news.time}</span>
                    <span className="text-rose-600 font-black">{news.tag}</span>
                  </div>
                  <h5 className="text-xs sm:text-[12.5px] font-bold text-slate-900 group-hover:text-rose-800 transition-colors leading-snug">
                    <Link to={getBlogUrl(news)}>
                      {news.title}
                    </Link>
                  </h5>
                  {news.snippet && (
                    <p className="text-[10.5px] text-slate-500 line-clamp-1 leading-normal mt-0.5">
                      {news.snippet}
                    </p>
                  )}
                </article>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* ⚡ 3-MINUTE QUICK READS & BYTE-SIZED TIPS SECTION */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                3-Minute Quick Blogs
                <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  ⚡ 3 Min Reads
                </span>
              </h3>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {['All', 'Git', 'React', 'PostgreSQL', 'CSS'].map((filterCat) => (
              <button
                key={filterCat}
                type="button"
                onClick={() => setSelectedTipCategory(filterCat)}
                className={`px-2.5 py-1 rounded-none text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                  selectedTipCategory === filterCat
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
                }`}
              >
                {filterCat}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Column Grid of Micro-Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {displayedTips.map((tip) => (
            <ByteSizedTipCard key={tip.id} tip={tip} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🎬 ENTERTAINMENT & HOLLYWOOD VIDEOS SECTION (BROADSHEET EDITORIAL GRID)   */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-3 border-t border-slate-200/90">
        
        {/* Section Header: Entertainment > (Left) | Location/City (Right) */}
        <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
          <Link
            to="/explore"
            className="group flex items-center gap-1 text-xl sm:text-2xl font-serif font-black text-slate-900 hover:text-rose-700 transition-colors"
          >
            <span>Entertainment</span>
            <span className="text-rose-600 group-hover:translate-x-1 transition-transform font-bold text-xl leading-none">›</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span className="hidden sm:inline">Chhatrapati Sambhajinagar</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <button
              type="button"
              className="text-rose-600 hover:text-rose-800 flex items-center gap-0.5 font-bold cursor-pointer"
            >
              <span>Change City</span>
              <MapPin className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3-Column Main Newsroom Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* COLUMN 1 (4.5 SPAN): FEATURED LARGE PHOTO HERO + 2x2 PHOTO STORIES */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Top Large Featured Image Story with Bottom Gradient Overlay */}
            <article className="group relative aspect-[16/11] w-full bg-slate-950 overflow-hidden border border-slate-200/90 shadow-2xs">
              <img
                src={dynamicEntHero.image}
                alt={dynamicEntHero.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-3.5 sm:p-4">
                <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-rose-200 transition-colors leading-snug">
                  <Link to={getBlogUrl(dynamicEntHero)}>
                    {dynamicEntHero.title}
                  </Link>
                </h4>
              </div>
            </article>

            {/* 2x2 Photo Stories Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {dynamicEntPhotoGrid.map((item) => (
                <article key={item.id} className="group flex flex-col justify-between">
                  <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden border border-slate-200/90 shadow-2xs mb-2">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isVideo && (
                      <div className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-rose-600 text-white flex items-center justify-center shadow-xs">
                        <Play className="w-2.5 h-2.5 fill-white" />
                      </div>
                    )}
                    {item.isGallery && (
                      <div className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-rose-600 text-white flex items-center justify-center shadow-xs">
                        <Camera className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                  <h5 className="text-[11.5px] sm:text-xs font-bold text-slate-900 group-hover:text-rose-800 transition-colors line-clamp-3 leading-snug">
                    <Link to={getBlogUrl(item)}>
                      {item.title}
                    </Link>
                  </h5>
                </article>
              ))}
            </div>

          </div>

          {/* COLUMN 2 (4 SPAN): 14-ITEM BULLET NEWS FEED (DOTTED DIVIDERS) */}
          <div className="lg:col-span-4 lg:border-x lg:border-slate-200/90 lg:px-4 space-y-0 divide-y divide-dotted divide-slate-300">
            {ENTERTAINMENT_SECTION_DATA.bulletFeed.map((item) => (
              <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2 group">
                <span className="text-slate-400 font-mono text-xs select-none mt-0.5">◦</span>
                <h5 className="text-[11.5px] sm:text-[12px] font-bold text-slate-800 group-hover:text-rose-700 transition-colors leading-snug line-clamp-2">
                  <Link to={getBlogUrl(item)}>
                    {item.text}
                  </Link>
                </h5>
              </div>
            ))}
          </div>

          {/* COLUMN 3 (3.5 SPAN): HOLLYWOOD VIDEOS (2x3 GRID) */}
          <div className="lg:col-span-4 space-y-3">
            
            {/* Header: Hollywood Videos > */}
            <div className="border-b border-slate-900 pb-1 flex items-center justify-between">
              <Link
                to="/explore"
                className="group flex items-center gap-1 text-sm sm:text-base font-serif font-black text-slate-900 hover:text-rose-700 transition-colors"
              >
                <span>Hollywood Videos</span>
                <span className="text-rose-600 group-hover:translate-x-0.5 transition-transform font-bold leading-none">›</span>
              </Link>
            </div>

            {/* 2-Column Video Grid (6 Videos) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {ENTERTAINMENT_SECTION_DATA.hollywoodVideos.map((vid) => (
                <article
                  key={vid.id}
                  onClick={() => setActiveVideoModal({
                    title: vid.title,
                    videoUrl: vid.videoUrl,
                    author_name: 'Hollywood Daily',
                    views: '128k',
                    description: vid.title,
                    slug: vid.slug
                  })}
                  className="group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden border border-slate-200/90 shadow-2xs mb-1.5">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    {/* Duration Badge */}
                    <div className="absolute top-1.5 right-1.5 px-1 py-0.5 bg-black/80 text-white font-mono text-[9px] font-bold rounded-none">
                      {vid.duration}
                    </div>
                    {/* Center / Bottom Play Icon */}
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-rose-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                    </div>
                  </div>
                  
                  <h5 className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 group-hover:text-rose-800 transition-colors line-clamp-3 leading-snug">
                    {vid.title}
                  </h5>
                </article>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🔥 TECH SHORTS & REELS SECTION (VERTICAL 9:16 CARDS) */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Tech Shorts & Reels
                <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                  ⚡ 60s Tech Insights
                </span>
              </h3>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded-none shadow-xs">
            {TECH_REELS.length} Reels
          </span>
        </div>

        {/* 5-Column Grid of Vertical Reels */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {TECH_REELS.map((reel) => (
            <TechReelCard
              key={reel.id}
              reel={reel}
              onPlay={(r) => setActiveVideoModal(r)}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📰 "FOR YOU" EDITORIAL SECTION */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <h3 className="text-xl sm:text-2xl font-serif font-black text-rose-900 tracking-tight">
            For you
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-800 rounded-none border border-rose-200 shadow-2xs uppercase tracking-wider">
            Personalized Picks
          </span>
        </div>

        {/* 4-Column Clean Editorial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {forYouBlogs.map((blog) => (
            <ForYouCard key={blog.id} blog={blog} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏛️ "BLOGHUB EXPLAINED" EDITORIAL DEEP-DIVE (3-COLUMN THE HINDU STYLE) */}
      {/* ========================================================================= */}
      <section className="bg-[#fcfbf7] border border-stone-200/90 p-4 sm:p-6 lg:p-7 shadow-xs">
        {/* Double-Lined Editorial Title */}
        <div className="relative flex items-center justify-center mb-5 sm:mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-300"></div>
          </div>
          <div className="relative bg-[#fcfbf7] px-5 sm:px-6">
            <h3 className="text-xl sm:text-2xl font-serif font-black text-rose-900 tracking-tight text-center">
              BlogHub Explained
            </h3>
          </div>
        </div>

        {/* 3-Column Layout: [Left Headline + Summary] | [Center Big Image] | [Right 3 Stacked Explainers] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          
          {/* 1. LEFT COLUMN (4 SPAN): MAIN HEADLINE + EXCERPT + KEY TAKEAWAYS + BYLINE */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full py-1">
            <div>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-800 uppercase tracking-wider mb-2">
                <span className="bg-rose-100/80 px-1.5 py-0.5 border border-rose-200">✦ ARCHITECTURE EXPLAINED</span>
                <span>•</span>
                <span className="text-stone-500 font-mono">{BLOGHUB_EXPLAINED.featured.read_time}</span>
              </div>

              <h4 className="text-base sm:text-lg font-bold font-serif text-slate-900 leading-snug hover:text-rose-900 transition-colors mb-2.5">
                <Link to={getBlogUrl(BLOGHUB_EXPLAINED.featured)}>
                  {BLOGHUB_EXPLAINED.featured.title}
                </Link>
              </h4>

              <p className="text-xs sm:text-[12.5px] text-slate-600 leading-relaxed font-serif mb-2.5">
                {BLOGHUB_EXPLAINED.featured.excerpt}
              </p>

              {BLOGHUB_EXPLAINED.featured.keyTakeaway && (
                <div className="p-2.5 bg-stone-100/80 border-l-2 border-rose-600 text-[11px] sm:text-xs text-stone-700 italic leading-relaxed mb-3">
                  "{BLOGHUB_EXPLAINED.featured.keyTakeaway}"
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between">
              <Link
                to={`/author/${BLOGHUB_EXPLAINED.featured.author_id}`}
                className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-800 hover:text-rose-900 underline decoration-slate-400 hover:decoration-rose-900 transition-colors"
              >
                {BLOGHUB_EXPLAINED.featured.author_name}
              </Link>
              <Link
                to={getBlogUrl(BLOGHUB_EXPLAINED.featured)}
                className="text-[11px] font-bold text-rose-900 hover:text-rose-700 flex items-center gap-0.5"
              >
                Read Deep Dive →
              </Link>
            </div>
          </div>

          {/* 2. CENTER COLUMN (5 SPAN): FEATURED LARGE PHOTO */}
          <div className="lg:col-span-5 h-full">
            <Link to={getBlogUrl(BLOGHUB_EXPLAINED.featured)} className="block aspect-[16/10] lg:aspect-[16/11] max-h-[320px] w-full overflow-hidden bg-stone-100 border border-stone-200/80 shadow-2xs group">
              <img
                src={BLOGHUB_EXPLAINED.featured.cover_image}
                alt={BLOGHUB_EXPLAINED.featured.title}
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
              />
            </Link>
          </div>

          {/* 3. RIGHT COLUMN (3 SPAN): 3 MINI STACKED EXPLAINERS WITH DESCRIPTIONS */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-3 sm:gap-3.5 h-full py-1">
            {BLOGHUB_EXPLAINED.sideStories.map((story, idx) => (
              <article
                key={story.id}
                className={`flex items-start gap-2.5 group ${
                  idx !== BLOGHUB_EXPLAINED.sideStories.length - 1 ? 'border-b border-stone-200/80 pb-3' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-[11px] sm:text-xs font-bold font-serif text-slate-900 group-hover:text-rose-900 transition-colors leading-snug line-clamp-2 mb-1">
                    <Link to={getBlogUrl(story)}>
                      {story.title}
                    </Link>
                  </h5>
                  {story.description && (
                    <p className="text-[10px] text-stone-500 line-clamp-2 leading-normal">
                      {story.description}
                    </p>
                  )}
                </div>

                <Link to={getBlogUrl(story)} className="w-14 h-14 sm:w-16 sm:h-16 aspect-square shrink-0 bg-stone-100 overflow-hidden border border-stone-200/80 shadow-2xs group-hover:border-rose-300 transition-colors">
                  <img
                    src={story.thumbnail}
                    alt={story.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </article>
            ))}
          </div>

        </div>

        {/* Bottom Link: MORE STORIES → */}
        <div className="text-center pt-4 sm:pt-5 mt-4 border-t border-stone-200/70">
          <Link
            to="/explore?category=Technology"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-800 hover:text-rose-900 underline decoration-stone-400 hover:decoration-rose-900 transition-colors inline-flex items-center gap-1"
          >
            <span>MORE STORIES</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🏆 SPORTS SECTION (NEWS STORIES + LIVE MATCH SCOREBOARD & AD) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-3 border-t border-slate-200/90">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black text-rose-900 tracking-tight">
              Sports
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-800 rounded-none border border-rose-200 shadow-2xs uppercase tracking-wider">
            Live Matches & Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7 SPAN: 4 DOTTED-DIVIDED SPORTS NEWS STORIES */}
          <div className="lg:col-span-7 space-y-4">
            {dynamicSportsStories.map((story, idx) => (
              <article
                key={story.id}
                className={`flex items-start justify-between gap-4 group ${
                  idx !== dynamicSportsStories.length - 1 ? 'border-b border-dotted border-slate-300 pb-4' : ''
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  {/* Category, Byline & Time */}
                  <div className="flex items-center gap-1.5 text-[10.5px] mb-1">
                    <span className="font-black uppercase tracking-wider text-rose-600">
                      {story.category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{story.author}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-mono text-[10px]">{story.timeAgo}</span>
                  </div>

                  {/* Headline */}
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors leading-snug mb-1">
                    <Link to={getBlogUrl(story)}>{story.title}</Link>
                  </h4>

                  {/* Description */}
                  {story.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1.5">
                      {story.description}
                    </p>
                  )}

                  {/* Key Stat / Fact Highlight */}
                  {story.keyStat && (
                    <div className="text-[10.5px] text-rose-900 bg-rose-50/70 border-l-2 border-rose-500 px-2 py-0.5 font-medium">
                      {story.keyStat}
                    </div>
                  )}
                </div>

                <Link
                  to={getBlogUrl(story)}
                  className="w-28 sm:w-36 md:w-40 aspect-[16/10] shrink-0 bg-slate-100 overflow-hidden border border-slate-200/90 shadow-2xs group-hover:border-rose-400 transition-colors"
                >
                  <img
                    src={story.thumbnail}
                    alt={story.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </article>
            ))}
          </div>

          {/* RIGHT 5 SPAN: LIVE SCORECARD + UPCOMING MATCH + AD BANNER */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. UPCOMING / LIVE SCORECARD (DARK THEME) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  LIVE MATCH CENTER
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {SPORTS_SECTION_DATA.liveMatch.session}
                </span>
              </div>

              <div className="bg-slate-900 text-white rounded-none p-3.5 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  {/* Team 1 */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-none bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-amber-300">
                      🇱🇰
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{SPORTS_SECTION_DATA.liveMatch.team1.name} ({SPORTS_SECTION_DATA.liveMatch.team1.code})</div>
                      <div className="text-base font-black text-white">{SPORTS_SECTION_DATA.liveMatch.team1.score}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{SPORTS_SECTION_DATA.liveMatch.team1.overs}</div>
                    </div>
                  </div>

                  {/* Live Pulsing Center Badge */}
                  <div className="text-center px-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      {SPORTS_SECTION_DATA.liveMatch.badge}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <div className="text-xs font-bold text-slate-200">({SPORTS_SECTION_DATA.liveMatch.team2.code}) {SPORTS_SECTION_DATA.liveMatch.team2.name}</div>
                      <div className="text-base font-black text-white">{SPORTS_SECTION_DATA.liveMatch.team2.score}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{SPORTS_SECTION_DATA.liveMatch.team2.overs}</div>
                    </div>
                    <div className="w-8 h-8 rounded-none bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-sky-300">
                      🇮🇳
                    </div>
                  </div>
                </div>

                {/* Match Status & Live Batters / Bowler */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="text-center text-[11px] text-amber-400 font-semibold">
                    {SPORTS_SECTION_DATA.liveMatch.status}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-1">
                    <span>🏏 {SPORTS_SECTION_DATA.liveMatch.batsman}</span>
                    <span>⚡ {SPORTS_SECTION_DATA.liveMatch.bowler}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MATCHES UPCOMING SCHEDULE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-slate-900">Upcoming Fixtures</h4>
                <span className="px-2 py-0.5 rounded-none bg-black text-white text-[9px] font-black uppercase tracking-wider">
                  SCHEDULE
                </span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-none p-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇱🇰</span>
                    <span className="text-xs font-bold text-slate-800">{SPORTS_SECTION_DATA.upcomingMatch.team1.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-rose-600 uppercase">VS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{SPORTS_SECTION_DATA.upcomingMatch.team2.name}</span>
                    <span className="text-base">🇮🇳</span>
                  </div>
                </div>
                <div className="text-center pt-1 border-t border-slate-100 text-[10.5px] text-slate-500">
                  <div>{SPORTS_SECTION_DATA.upcomingMatch.title}</div>
                  <div className="text-slate-400 font-mono text-[9.5px] mt-0.5">{SPORTS_SECTION_DATA.upcomingMatch.date}</div>
                </div>
              </div>
            </div>

            {/* 3. ADVERTISEMENT BANNER CARD */}
            <div>
              <div className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                SPONSORED PARTNER
              </div>
              <div className="bg-gradient-to-br from-amber-50 via-sky-50 to-indigo-50 border border-slate-200/90 rounded-none p-3.5 shadow-2xs text-center relative overflow-hidden">
                <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  Ease of Doing Business Initiative • Global Conclave
                </div>
                <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug mb-1">
                  Top Achievers Award Ceremony & Leadership Summit 2026
                </h5>
                <p className="text-[10.5px] text-slate-600 mb-2">
                  📍 Grand Hyatt, Mumbai • 24-26 October 2026
                </p>
                <Link
                  to="/register"
                  className="inline-block px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-none shadow-xs transition-colors"
                >
                  Register Delegate Pass →
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🔮 ASTROLOGY & HOROSCOPE SECTION (DAILY FORECAST + ZODIAC CAROUSEL) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-slate-200/90">
        
        {/* Section Header: Astrology > */}
        <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
          <Link
            to="/explore"
            className="group flex items-center gap-1 text-xl sm:text-2xl font-serif font-black text-slate-900 hover:text-rose-700 transition-colors"
          >
            <span>Astrology</span>
            <span className="text-rose-600 group-hover:translate-x-1 transition-transform font-bold text-xl leading-none">›</span>
          </Link>
          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-none border border-amber-200 uppercase tracking-wider">
            Daily Forecast & Vedic Astrology
          </span>
        </div>

        {/* 2-Column Main Layout: Left 8-Span Feed | Right 4-Span Interactive Horoscope Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 SPAN: FEATURED CELESTIAL CARD + BULLET LIST + 4-COLUMN BOTTOM WIRE */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Row: Split Left Hero Card & Right Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              {/* Left Featured Celestial Photo Card */}
              <div className="sm:col-span-6">
                <article className="group relative aspect-[16/11] w-full bg-slate-950 overflow-hidden border border-slate-200/90 shadow-2xs">
                  <img
                    src={ASTROLOGY_SECTION_DATA.featuredCard.image}
                    alt={ASTROLOGY_SECTION_DATA.featuredCard.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex items-end p-4">
                    <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-amber-200 transition-colors leading-snug">
                      <Link to={getBlogUrl(ASTROLOGY_SECTION_DATA.featuredCard)}>
                        {ASTROLOGY_SECTION_DATA.featuredCard.title}
                      </Link>
                    </h4>
                  </div>
                </article>
              </div>

              {/* Right Dotted Bullet List (6 Items) */}
              <div className="sm:col-span-6 space-y-0 divide-y divide-dotted divide-slate-300">
                {ASTROLOGY_SECTION_DATA.bulletList.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2 group">
                    <span className="text-slate-400 font-mono text-xs select-none mt-0.5">◦</span>
                    <h5 className="text-[12px] font-bold text-slate-800 group-hover:text-rose-700 transition-colors leading-snug line-clamp-2 flex-1">
                      <Link to={getBlogUrl(item)} className="inline">
                        {item.text}
                      </Link>
                      {item.isMedia && (
                        <span className="inline-block ml-1 text-rose-600 align-middle">
                          <Camera className="w-3 h-3 inline" />
                        </span>
                      )}
                    </h5>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom 4-Column Text Wire (Divided by vertical lines) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200/90 pt-4">
              {ASTROLOGY_SECTION_DATA.bottomWires.map((wire, idx) => (
                <article
                  key={wire.id}
                  className={`flex flex-col justify-between ${
                    idx !== 0 ? 'sm:border-l sm:border-slate-200 sm:pl-3' : ''
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold font-serif text-slate-900 group-hover:text-rose-800 transition-colors leading-snug mb-1">
                      <Link to={getBlogUrl(wire)}>
                        {wire.title}
                      </Link>
                    </h5>
                    <p className="text-[10.5px] text-slate-500 line-clamp-3 leading-relaxed">
                      {wire.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

          </div>

          {/* RIGHT 4 SPAN: INTERACTIVE HOROSCOPE CARD */}
          <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200/90 rounded-none p-4 sm:p-5 shadow-2xs space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-base font-serif font-black text-slate-900 tracking-tight">
                Horoscope
              </h4>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Vedic Signs
              </span>
            </div>

            {/* Zodiac Sign Carousel / Tabs */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-2">
                {ZODIAC_SIGNS.slice(zodiacStartIndex, zodiacStartIndex + 3).map((sign) => {
                  const isSelected = selectedZodiac === sign.id;
                  return (
                    <button
                      key={sign.id}
                      type="button"
                      onClick={() => setSelectedZodiac(sign.id)}
                      className={`p-2.5 rounded-none border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-100/80 border-indigo-500 shadow-xs scale-102 ring-1 ring-indigo-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl select-none">{sign.symbol}</span>
                      <div className="text-xs font-bold text-slate-900">{sign.name}</div>
                      <div className="text-[9px] text-slate-500 font-medium leading-tight">{sign.dateRange}</div>
                    </button>
                  );
                })}
              </div>

              {/* Carousel Prev/Next Buttons */}
              <button
                type="button"
                onClick={() => setZodiacStartIndex((prev) => Math.max(0, prev - 3))}
                disabled={zodiacStartIndex === 0}
                className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800/80 text-white flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                title="Previous Zodiacs"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setZodiacStartIndex((prev) => Math.min(ZODIAC_SIGNS.length - 3, prev + 3))}
                disabled={zodiacStartIndex >= ZODIAC_SIGNS.length - 3}
                className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800/80 text-white flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                title="Next Zodiacs"
              >
                ›
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className={`w-2.5 h-1 rounded-full transition-all ${zodiacStartIndex === 0 ? 'bg-indigo-600 w-4' : 'bg-slate-300'}`}></span>
              <span className={`w-2.5 h-1 rounded-full transition-all ${zodiacStartIndex > 0 ? 'bg-indigo-600 w-4' : 'bg-slate-300'}`}></span>
            </div>

            {/* Timeframe Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 text-xs font-bold pt-1">
              {['daily', 'weekly', 'monthly', 'yearly', 'characteristics'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAstroTab(tab)}
                  className={`pb-1.5 capitalize transition-colors cursor-pointer ${
                    astroTab === tab
                      ? 'text-slate-900 border-b-2 border-slate-900 font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Selected Sign Forecast Content */}
            {(() => {
              const currentSign = ZODIAC_SIGNS.find((s) => s.id === selectedZodiac) || ZODIAC_SIGNS[0];
              return (
                <div className="space-y-2">
                  <h5 className="text-xs sm:text-sm font-bold font-serif text-slate-900">
                    {currentSign.name} {astroTab.charAt(0).toUpperCase() + astroTab.slice(1)} Horoscope
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentSign.forecast[astroTab] || currentSign.forecast.daily}
                  </p>
                </div>
              );
            })()}

            {/* Widget Action Footer */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setPinnedZodiac(!pinnedZodiac)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  pinnedZodiac
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>📌</span>
                <span>{pinnedZodiac ? 'Zodiac Pinned' : 'Pin this Zodiac'}</span>
              </button>

              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Astrological Calculation Details"
              >
                ⓘ
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🍲 RECIPES & FOOD NEWS SECTION (CULINARY STORIES + VIDEO RECIPES + SIDEBAR) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-slate-200/90">
        
        {/* Section Header Bar: Left Title > | Right Category Filter Tabs */}
        <div className="border-b border-slate-900 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Link
            to="/explore?category=Food"
            className="group flex items-center gap-1 text-xl sm:text-2xl font-serif font-black text-slate-900 hover:text-rose-700 transition-colors"
          >
            <span>Recipes & Food News</span>
            <span className="text-rose-600 group-hover:translate-x-1 transition-transform font-bold text-xl leading-none">›</span>
          </Link>

          {/* Right Header Navigation Filter Tabs */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold">
            {['Featured', 'Recipes', 'Food News', 'Recipes Videos'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFoodTab(tab)}
                className={`pb-1 transition-colors cursor-pointer ${
                  selectedFoodTab === tab
                    ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Main Layout: Left 8-Span Grid | Right 4-Span Vertical Recipe Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 SPAN: FEATURED SPICE STORY + BULLET LIST + 4 VIDEO RECIPES */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Top Row: Split Left Hero Card & Right Bullet List */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              {/* Left Featured Card with Gallery Badge */}
              <div className="sm:col-span-6">
                <article className="group relative aspect-[16/11] w-full bg-slate-950 overflow-hidden border border-slate-200/90 shadow-2xs">
                  <img
                    src={dynamicFoodHero.image}
                    alt={dynamicFoodHero.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 opacity-90"
                  />
                  {/* Gallery Badge on Bottom Left */}
                  <div className="absolute bottom-16 sm:bottom-18 left-3.5 px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                    <Camera className="w-3 h-3" />
                    <span>{dynamicFoodHero.photoCount || 7}</span>
                  </div>

                  {/* Gradient Headline Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex items-end p-3.5 sm:p-4">
                    <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-amber-200 transition-colors leading-snug">
                      <Link to={getBlogUrl(dynamicFoodHero)}>
                        {dynamicFoodHero.title}
                      </Link>
                    </h4>
                  </div>
                </article>
              </div>

              {/* Right Dotted Bullet List (5 Items) */}
              <div className="sm:col-span-6 space-y-0 divide-y divide-dotted divide-slate-300">
                {RECIPES_FOOD_SECTION_DATA.bulletList.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2 group">
                    <span className="text-slate-400 font-mono text-xs select-none mt-0.5">◦</span>
                    <h5 className="text-[12px] font-bold text-slate-800 group-hover:text-rose-700 transition-colors leading-snug line-clamp-2 flex-1">
                      <Link to={getBlogUrl(item)} className="inline">
                        {item.text}
                      </Link>
                      {item.isMedia && (
                        <span className="inline-block ml-1.5 text-rose-600 align-middle">
                          <Camera className="w-3 h-3 inline" />
                        </span>
                      )}
                    </h5>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom 4-Column Video Recipe Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 border-t border-slate-200/90 pt-4">
              {RECIPES_FOOD_SECTION_DATA.videoRecipes.map((vRec) => (
                <article
                  key={vRec.id}
                  onClick={() => setActiveVideoModal({
                    title: vRec.title,
                    videoUrl: vRec.videoUrl,
                    author_name: 'MasterChef Kitchen',
                    views: '84k',
                    description: vRec.title,
                    slug: vRec.slug
                  })}
                  className="group cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden border border-slate-200/90 shadow-2xs mb-2">
                    <img
                      src={vRec.thumbnail}
                      alt={vRec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    {/* Duration Badge Bottom Left */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-rose-600 text-white font-mono text-[9.5px] font-bold flex items-center gap-1 shadow-xs">
                      <Play className="w-2 h-2 fill-white" />
                      <span>{vRec.duration}</span>
                    </div>
                  </div>

                  <h5 className="text-[11px] sm:text-[11.5px] font-bold text-slate-900 group-hover:text-rose-800 transition-colors line-clamp-2 leading-snug">
                    {vRec.title}
                  </h5>
                </article>
              ))}
            </div>

          </div>

          {/* RIGHT 4 SPAN: SIDEBAR QUICK RECIPES LIST */}
          <div className="lg:col-span-4 lg:border-l lg:border-slate-200/90 lg:pl-5 space-y-3.5">
            {dynamicFoodSidebar.map((item) => (
              <article
                key={item.id}
                className="group flex items-start gap-3 p-1.5 hover:bg-white/60 transition-colors border-b border-slate-200/60 pb-3 last:border-b-0 last:pb-0"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-16 shrink-0 bg-slate-100 overflow-hidden border border-slate-200/80 shadow-2xs">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs sm:text-[12.5px] font-bold text-slate-900 group-hover:text-rose-800 transition-colors leading-snug line-clamp-1 mb-0.5">
                    <Link to={getBlogUrl(item)}>
                      {item.title}
                    </Link>
                  </h5>
                  <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* LIVE VIDEO PLAYER MODAL */}
      {/* ========================================================================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-none max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shrink-0">
                  Video Player
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeVideoModal.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-none text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                title="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed Player */}
            <div className="aspect-video w-full bg-black">
              {getEmbedUrl(activeVideoModal.videoUrl) ? (
                <iframe
                  src={`${getEmbedUrl(activeVideoModal.videoUrl)}?autoplay=1`}
                  title={activeVideoModal.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeVideoModal.videoUrl} autoPlay controls className="w-full h-full object-contain" />
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300 line-clamp-2 mb-1">{activeVideoModal.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span>Creator: <strong className="text-white">{activeVideoModal.author_name}</strong></span>
                  <span>•</span>
                  <span>Views: {activeVideoModal.views}</span>
                </div>
              </div>

              {activeVideoModal.slug && (
                <Link
                  to={getBlogUrl(activeVideoModal)}
                  onClick={() => setActiveVideoModal(null)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Read Article</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ========================================================================= */}
      {/* 🔴 FLOATING RIGHT-EDGE ACTION PILL (TOP 10 NEWS / WIRE JUMP)             */}
      {/* ========================================================================= */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('superfast-wire');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="bg-[#22272e] hover:bg-[#e01e1e] text-white p-2 sm:p-2.5 rounded-l-md shadow-2xl flex flex-col items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border-l-2 border-y-2 border-red-500 transition-all hover:pr-3.5 cursor-pointer group"
          title="Jump to Top 10 News Wire"
        >
          <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center">
            <Tv className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
          </div>
          <span className="[writing-mode:vertical-lr] text-[9px] font-extrabold tracking-widest py-0.5">TOP 10</span>
          <span className="text-[8px] text-slate-300 group-hover:text-white font-bold">NEWS</span>
        </button>
      </div>
      {showSubscribeModal && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
          <div className="relative max-w-md sm:max-w-lg w-full bg-slate-900 border-2 border-red-500/90 shadow-[0_0_50px_rgba(239,68,68,0.55)] overflow-hidden rounded-none animate-in zoom-in-95 duration-300">
            {/* Top Red Bar with Close Button */}
            <div className="bg-red-600 px-4 py-2 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                  SPECIAL INVITATION • 1-TIME OFFER
                </span>
              </div>
              <button
                onClick={handleCloseSubscribeModal}
                className="text-white/80 hover:text-white p-0.5 hover:bg-black/20 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 text-white">
              {subscribeSuccess ? (
                <div className="text-center py-6 space-y-3 animate-in fade-in-50">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-white">
                    You're On The VIP Dispatch List!
                  </h3>
                  <p className="text-xs text-slate-300">
                    Thank you for subscribing. Look out for top curated dispatches and engineering deep dives in your inbox.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                        Join 25,000+ Readers
                      </span>
                      <h3 className="text-lg sm:text-xl font-black font-serif text-white leading-tight">
                        Never Miss Breaking Tech & Broadsheet Stories
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Get hand-curated morning dispatches, system design breakdowns, and market insights delivered straight to your inbox before anyone else.
                  </p>

                  {/* Feature Bullets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 py-1">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Daily 8 AM News Digest</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>System Design Guides</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Zero Spam Guarantee</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1-Click Unsubscribe</span>
                    </div>
                  </div>

                  {/* Subscribe Form */}
                  <form onSubmit={handleSubscribeSubmit} className="space-y-2.5 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email address..."
                        value={subscribeEmail}
                        onChange={(e) => setSubscribeEmail(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Subscribe Free</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Dismiss Button */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleCloseSubscribeModal}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors underline cursor-pointer"
                    >
                      No thanks, I'll explore first
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚡ 3-4 SECOND BLINKING INTERSTITIAL AD (REPEATS EVERY 5 MINUTES) */}
      {/* ========================================================================= */}
      {showBlinkingAd && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
          <div className="relative max-w-lg sm:max-w-xl md:max-w-2xl w-full flex flex-col items-center">
            
            {/* Top Bar: Ad Timer & Dismiss Button */}
            <div className="w-full flex items-center justify-between pb-2.5 text-white text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-none shadow-xs">
                  ADVERTISEMENT
                </span>
                <span className="text-slate-300 text-xs font-mono font-medium">
                  Ad closes in {adSecondsRemaining}s...
                </span>
              </div>
              <button
                onClick={() => setShowBlinkingAd(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-white/10 rounded-none transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Skip Ad"
              >
                <span>Skip</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ONLY IMAGE AD CONTAINER WITH PULSING / BLINKING GLOW EFFECT */}
            <div className="relative w-full max-w-xl rounded-none overflow-hidden border-2 border-amber-400/90 shadow-[0_0_50px_rgba(245,158,11,0.75)] animate-pulse cursor-pointer bg-slate-950">
              <img
                src={
                  (activeAds && activeAds.length > 0 && activeAds[0]?.media_url && activeAds[0]?.media_url.startsWith('http'))
                    ? activeAds[0].media_url
                    : MOBILE_SPONSORED_ADS[0].image
                }
                alt="Smartphone Mobile Advertisement"
                className="w-full h-auto min-h-[260px] sm:min-h-[320px] max-h-[75vh] object-cover block"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85";
                }}
                onClick={() => {
                  if (activeAds && activeAds.length > 0 && activeAds[0]) {
                    handleAdClick(activeAds[0]);
                  }
                  setShowBlinkingAd(false);
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
