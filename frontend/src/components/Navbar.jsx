import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Crown, 
  LogOut, 
  Sun, 
  TrendingUp, 
  PenTool,
  Sparkles
} from 'lucide-react';

export const PRIMARY_NAV_CATEGORIES = [
  {
    name: 'Live Pulse',
    slug: 'Live',
    isLive: true,
    subCategories: [
      { name: 'Breaking Stories', tag: 'Breaking', desc: 'Latest real-time stories' },
      { name: 'Top Trending', tag: 'Trending', desc: 'Most engaged discussions' },
      { name: 'Creator Spotlights', tag: 'Showcase', desc: 'Top writer features' },
      { name: 'Live Discussions', tag: 'Discussions', desc: 'Interactive reader threads' },
    ]
  },
  {
    name: 'Latest',
    slug: 'All',
    isDirect: true,
    href: '/?category=All'
  },
  {
    name: 'World News',
    slug: 'World News',
    subCategories: [
      { name: 'National', tag: 'National', desc: 'India & national headlines' },
      { name: 'Maharashtra', tag: 'Maharashtra', desc: 'Mumbai, Pune & state updates' },
      { name: 'Delhi', tag: 'Delhi', desc: 'Capital region & governance' },
      { name: 'Politics & Elections', tag: 'Politics', desc: 'Parliament, parties & campaigns' },
      { name: 'World News', tag: 'World News', desc: 'Global geopolitics & diplomacy' },
      { name: 'Cities', tag: 'Cities', desc: 'Local municipal & civic news' },
      { name: 'Crime & Legal', tag: 'Crime', desc: 'Courts, trials & police reports' }
    ]
  },
  {
    name: 'Sports',
    slug: 'Sports',
    subCategories: [
      { name: 'Cricket Live & WTC', tag: 'Cricket', desc: 'Test matches, IPL, T20 & ICC' },
      { name: 'Football & Leagues', tag: 'Football', desc: 'Champions League, MLS & Premier League' },
      { name: 'Hockey & World Cups', tag: 'Hockey', desc: 'International turf tournaments' },
      { name: 'Tennis & Grand Slams', tag: 'Tennis', desc: 'ATP, Wimbledon & US Open' },
      { name: 'Badminton & BWF', tag: 'Badminton', desc: 'World tour & championships' },
      { name: 'Formula 1 & Grand Prix', tag: 'F1', desc: 'Racing grid, drivers & constructors' },
      { name: 'Chess & Esports', tag: 'Chess', desc: 'Grandmasters & competitive gaming' }
    ]
  },
  {
    name: 'Technology',
    slug: 'Technology',
    subCategories: [
      { name: 'Web Development', tag: 'Web Development', desc: 'React, Next.js, Node & CSS' },
      { name: 'Programming & Code', tag: 'Programming', desc: 'JavaScript, Python, Rust & systems' },
      { name: 'Cloud & DevOps', tag: 'Cloud', desc: 'AWS, Docker, CI/CD pipelines' },
      { name: 'Cybersecurity', tag: 'Security', desc: 'InfoSec, encryption, privacy' },
      { name: 'Mobile Apps', tag: 'Mobile', desc: 'iOS, Android, React Native' },
      { name: 'Open Source', tag: 'Open Source', desc: 'GitHub repos, tools & Linux' },
      { name: 'Hardware & Gadgets', tag: 'Gadgets', desc: 'CPUs, devices & silicon' }
    ]
  },
  {
    name: 'AI & Code',
    slug: 'AI',
    subCategories: [
      { name: 'Generative AI & LLMs', tag: 'LLM', desc: 'GPT-4, Claude, Gemini & OSS' },
      { name: 'Autonomous Agents', tag: 'Agents', desc: 'Agentic workflows & coding copilots' },
      { name: 'Machine Learning Models', tag: 'Machine Learning', desc: 'PyTorch, training & evals' },
      { name: 'Prompt Engineering', tag: 'Prompting', desc: 'Techniques & best practices' },
      { name: 'Computer Vision & NLP', tag: 'AI', desc: 'Multimodal vision & speech' }
    ]
  },
  {
    name: 'Business',
    slug: 'Business',
    subCategories: [
      { name: 'Markets & Stocks', tag: 'Markets', desc: 'Global market analysis & indices' },
      { name: 'Economy & Trade', tag: 'Economy', desc: 'Macro trends & monetary policy' },
      { name: 'Startups & VC', tag: 'Startups', desc: 'Funding rounds & founder guides' },
      { name: 'Personal Finance & Tax', tag: 'Finance', desc: 'Portfolio management & wealth' },
      { name: 'Banking & FinTech', tag: 'Banking', desc: 'Digital payments & banking' },
      { name: 'Crypto & Web3', tag: 'Crypto', desc: 'Blockchains & digital assets' },
      { name: 'Real Estate', tag: 'Real Estate', desc: 'Property trends & commercial hubs' }
    ]
  }
];

export const MORE_NAV_CATEGORIES = [
  {
    name: 'Entertainment',
    slug: 'Entertainment',
    subCategories: [
      { name: 'Bollywood & Cinema', tag: 'Cinema', desc: 'Film reviews, box office & trailers' },
      { name: 'Hollywood & Streaming', tag: 'Hollywood', desc: 'Series, MCU, Oscars & interviews' },
      { name: 'OTT & Web Series', tag: 'OTT', desc: 'Netflix, Prime & weekly releases' },
      { name: 'Music & Concerts', tag: 'Music', desc: 'Albums, artists & charts' },
      { name: 'Celebrity Spotlights', tag: 'Celebrity', desc: 'Exclusive interviews & features' }
    ]
  },
  {
    name: 'Lifestyle & Health',
    slug: 'Lifestyle',
    subCategories: [
      { name: 'Recipes & Food', tag: 'Recipes', desc: 'Quick meals, traditional & baking' },
      { name: 'Health & Fitness', tag: 'Health', desc: 'Workouts, nutrition & wellness' },
      { name: 'Travel & Destinations', tag: 'Travel', desc: 'Itineraries & explorer guides' },
      { name: 'Fashion & Beauty', tag: 'Fashion', desc: 'Trends, styling & skincare' }
    ]
  },
  {
    name: 'Education & Career',
    slug: 'Education',
    subCategories: [
      { name: 'Higher Education', tag: 'Education', desc: 'Universities & colleges' },
      { name: 'IITs & Engineering', tag: 'IIT', desc: 'Tech campuses & research' },
      { name: 'Competitive Exams', tag: 'Exams', desc: 'UPSC, JEE, NEET & banking' },
      { name: 'Jobs & Hiring', tag: 'Career', desc: 'Tech recruitment & workplace' }
    ]
  },
  {
    name: 'Explained & Opinions',
    slug: 'Explained',
    subCategories: [
      { name: 'BlogHub Explained', tag: 'Explained', desc: 'Concept breakdowns & guides' },
      { name: 'Editorials & Columns', tag: 'Editorial', desc: 'Opinion pieces & analysis' },
      { name: 'Fact Checks', tag: 'FactCheck', desc: 'Verified investigations' }
    ]
  },
  {
    name: 'Astrology & Horoscope',
    slug: 'Astrology',
    subCategories: [
      { name: 'Daily Horoscopes', tag: 'Horoscope', desc: 'Zodiac guidance & transits' },
      { name: 'Vedic Astrology', tag: 'Astrology', desc: 'Kundli, nakshatras & remedies' },
      { name: 'Numerology & Palmistry', tag: 'Numerology', desc: 'Lucky numbers & signs' }
    ]
  },
  {
    name: 'Science & Space',
    slug: 'Science',
    subCategories: [
      { name: 'Space & Astronomy', tag: 'Space', desc: 'ISRO, NASA & cosmic discoveries' },
      { name: 'Climate & Environment', tag: 'Environment', desc: 'Sustainability & earth science' }
    ]
  },
  {
    name: 'UI / UX Design',
    slug: 'Design',
    subCategories: [
      { name: 'UI / UX Design', tag: 'UI/UX', desc: 'Interfaces, Figma & user flows' },
      { name: 'Design Systems', tag: 'Design Systems', desc: 'Component libraries & tokens' }
    ]
  }
];

export const ALL_NAV_CATEGORIES = [...PRIMARY_NAV_CATEGORIES, ...MORE_NAV_CATEGORIES];

export const TRENDING_LINKS = [
  { label: 'AI Agents 2026', query: 'AI' },
  { label: 'React 19 & Next.js', query: 'React' },
  { label: 'Cloud Architecture', query: 'Cloud' },
  { label: 'Cyber Defense', query: 'Security' },
  { label: 'SaaS Bootstrapping', query: 'SaaS' },
  { label: 'Full-Stack Dev', query: 'Web Development' },
  { label: 'DevOps Pipelines', query: 'DevOps' },
  { label: 'PostgreSQL Mastery', query: 'Database' }
];

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live clock state
  const [currentTime, setCurrentTime] = useState('');

  const dropdownRef = useRef(null);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(`${datePart} ${timePart} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setSearchOverlayOpen(false);
  }, [location.pathname, location.search]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOverlayOpen(false);
      setSearchQuery('');
    }
  };

  const handleSubCategoryClick = (categorySlug, tag) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    navigate(`/?category=${encodeURIComponent(categorySlug)}&tag=${encodeURIComponent(tag)}`);
  };

  const handleTrendingClick = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#111418] text-white shadow-md border-b border-slate-800/90 select-none w-full max-w-full overflow-x-clip">
      {/* 1. TOP PRIMARY NETWORK BAR */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* ZONE 1 (LEFT): Signature Red Logo + Search Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pr-1">
            <Link 
              to="/" 
              className="flex items-center bg-[#e01e1e] hover:bg-[#c91818] text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-sm font-black tracking-tight text-lg sm:text-xl shadow-xs transition-colors group shrink-0"
            >
              <span className="tracking-tight uppercase">BLOGHUB</span>
            </Link>

            <button
              onClick={() => setSearchOverlayOpen(!searchOverlayOpen)}
              title="Search stories"
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* ZONE 2 (CENTER): Main Categories with 'More' Overflow (Desktop) */}
          <nav ref={dropdownRef} className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-2 xl:px-4 gap-0.5 xl:gap-1 text-xs font-semibold text-slate-200">
            {PRIMARY_NAV_CATEGORIES.map((cat) => {
              const isDropdownOpen = activeDropdown === cat.name;

              if (cat.isDirect) {
                return (
                  <Link
                    key={cat.name}
                    to={cat.href || `/?category=${encodeURIComponent(cat.slug)}`}
                    className="px-1.5 xl:px-2 py-1.5 hover:text-white hover:bg-slate-800/60 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    {cat.name}
                  </Link>
                );
              }

              return (
                <div key={cat.name} className="relative shrink-0">
                  <button
                    onClick={() => setActiveDropdown(isDropdownOpen ? null : cat.name)}
                    onMouseEnter={() => setActiveDropdown(cat.name)}
                    className={`px-1.5 xl:px-2 py-1.5 rounded flex items-center gap-0.5 xl:gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                      isDropdownOpen 
                        ? 'bg-slate-800 text-white font-bold' 
                        : 'hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {cat.isLive && (
                      <span className="relative flex h-2 w-2 mr-0.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <span className="whitespace-nowrap">{cat.name}</span>
                    <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-red-400' : 'text-slate-400'}`} />
                  </button>

                  {/* Subcategories Dropdown Card */}
                  {isDropdownOpen && (
                    <div 
                      onMouseLeave={() => setActiveDropdown(null)}
                      className="absolute top-full left-0 mt-1.5 w-64 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>

                      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                        {cat.subCategories.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSubCategoryClick(cat.slug, sub.tag)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-medium text-slate-800 hover:text-red-600 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">{sub.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* MORE CATEGORIES DROPDOWN (Includes Entertainment, Lifestyle, Education, Explained, Astrology, etc.) */}
            <div className="relative shrink-0">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'More' ? null : 'More')}
                onMouseEnter={() => setActiveDropdown('More')}
                className={`px-1.5 xl:px-2 py-1.5 rounded flex items-center gap-0.5 xl:gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  activeDropdown === 'More'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${activeDropdown === 'More' ? 'rotate-180 text-red-400' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'More' && (
                <div
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="absolute top-full right-0 mt-1.5 w-72 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 pb-1.5 border-b border-slate-100">
                    Additional Topics & Coverage
                  </div>
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                    {MORE_NAV_CATEGORIES.map((moreCat) => (
                      <div key={moreCat.name} className="p-2.5">
                        <Link
                          to={`/?category=${encodeURIComponent(moreCat.slug)}`}
                          onClick={() => setActiveDropdown(null)}
                          className="font-bold text-xs text-slate-900 hover:text-red-600 block mb-1"
                        >
                          {moreCat.name}
                        </Link>
                        {moreCat.subCategories && (
                          <div className="grid grid-cols-2 gap-1 pl-1">
                            {moreCat.subCategories.map((sub, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleSubCategoryClick(moreCat.slug, sub.tag)}
                                className="text-left text-[11px] text-slate-600 hover:text-red-600 truncate py-0.5 hover:underline cursor-pointer"
                              >
                                • {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ZONE 3 (RIGHT): Market & Time Tickers + Profile / Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto pl-2 xl:pl-4">
            {/* Live Gold / Market Ticker Widget */}
            <div className="hidden 2xl:flex flex-col items-end border-r border-slate-800/90 pr-3 sm:pr-4 text-right shrink-0">
              <span className="text-[10px] font-black text-[#f59e0b] tracking-wider uppercase flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> Gold
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                ₹15,260/g
              </span>
            </div>

            {/* Date / Time & Weather Ticker */}
            <div className="hidden 2xl:flex flex-col items-end text-right border-r border-slate-800/90 pr-3 sm:pr-4 shrink-0">
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                {currentTime || 'Aug 18, 2026 03:14 PM IST'}
              </span>
              <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>Global</span>
                <Sun className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>34° C</span>
              </span>
            </div>

            {/* User Profile / Auth Action Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 shrink-0">
                {/* Single Clean Circular Button */}
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-md hover:scale-105 transition-all border-2 border-purple-400/80 relative shrink-0"
                    title="👑 Administrator Dashboard Portal"
                  >
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center shadow-xs">
                      <Crown className="w-2 h-2 text-slate-950 stroke-[3]" />
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-md hover:scale-105 transition-all border-2 border-slate-700 relative shrink-0"
                    title="Creator Studio & Dashboard"
                  >
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  </Link>
                )}

                {/* Logout Icon */}
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle (<1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* 2. SEARCH OVERLAY BAR (Expandable) */}
      {searchOverlayOpen && (
        <div className="bg-[#181d24] border-t border-slate-800 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories, articles, tags, authors, or technology trends..."
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOverlayOpen(false)}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* 3. SECONDARY NEWS TICKER: "TRENDING LINKS >" */}
      <div className="bg-[#181d24] border-t border-slate-800/80 w-full max-w-full overflow-x-auto scrollbar-none py-1.5 sm:py-2">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 w-full flex items-center gap-4 text-xs min-w-0">
          
          {/* Bold Red "TRENDING LINKS >" Badge */}
          <div className="flex items-center gap-1 font-black text-red-500 uppercase tracking-wider shrink-0 text-[11px] sm:text-xs">
            <span>TRENDING LINKS</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </div>

          {/* Horizontal scroll of quick topics */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 overflow-x-auto whitespace-nowrap min-w-0">
            {TRENDING_LINKS.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleTrendingClick(link.query)}
                className="text-slate-300 hover:text-white font-semibold text-[11px] sm:text-xs transition-colors hover:underline cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER (<1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#14181d] border-t border-slate-800 px-4 py-4 space-y-3 max-h-[85vh] overflow-y-auto">
          {/* Search box in mobile drawer */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles & topics..."
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2"
            />
          </form>

          {/* Categories Accordion List */}
          <div className="space-y-1 pt-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pb-1">
              Explore Categories
            </div>

            {ALL_NAV_CATEGORIES.map((cat) => {
              const isExpanded = mobileExpandedCat === cat.name;

              if (cat.isDirect) {
                return (
                  <Link
                    key={cat.name}
                    to={cat.href || `/?category=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded"
                  >
                    {cat.name}
                  </Link>
                );
              }

              return (
                <div key={cat.name} className="border-b border-slate-800/60 pb-1">
                  <button
                    onClick={() => setMobileExpandedCat(isExpanded ? null : cat.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded text-left"
                  >
                    <span className="flex items-center gap-2">
                      {cat.isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                      {cat.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-red-500' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-900/60 rounded-md my-1">
                      {cat.subCategories.map((sub, subIdx) => (
                        <button
                          key={subIdx}
                          onClick={() => handleSubCategoryClick(cat.slug, sub.tag)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-red-400 flex items-center justify-between"
                        >
                          <span>{sub.name}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Auth links in mobile drawer */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 bg-red-600 text-white font-bold text-xs rounded text-center flex items-center justify-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Write New Story
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 bg-slate-800 text-slate-200 font-bold text-xs rounded text-center"
                >
                  User Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 px-3 bg-purple-900/50 border border-purple-700 text-purple-200 font-bold text-xs rounded text-center"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 bg-rose-950/40 border border-rose-800 text-rose-300 font-bold text-xs rounded text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold bg-slate-800 text-slate-200 rounded"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-xs font-bold bg-red-600 text-white rounded"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
