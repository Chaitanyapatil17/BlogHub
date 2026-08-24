import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Heart, 
  ArrowUp, 
  Send, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Cpu,
  Database,
  Radio
} from 'lucide-react';

const TOPICS_DIRECTORY_COLUMNS = [
  // Column 1: Markets, Finance & Sports
  [
    { title: 'Stock Analysis', to: '/?search=Stock%20Analysis' },
    { title: 'Markets & Economy', to: '/?category=Business' },
    { title: 'Live Cricket Score', to: '/?category=Sports' },
    { title: 'Sports Highlights', to: '/?category=Sports' },
    { title: 'Business & Finance', to: '/?category=Business' }
  ],
  // Column 2: Tech, AI & Programming
  [
    { title: 'Technology & Gadgets', to: '/?category=Technology' },
    { title: 'Artificial Intelligence', to: '/?category=AI' },
    { title: 'Web Development & Code', to: '/?tag=React' },
    { title: 'Cloud & System Design', to: '/?category=Architecture' },
    { title: 'Science & Environment', to: '/?category=Science' }
  ],
  // Column 3: Media, Video & Entertainment
  [
    { title: 'Screen Videos', to: '/?category=Entertainment' },
    { title: 'International Videos', to: '/?category=World%20News' },
    { title: 'Cinema & Entertainment', to: '/?category=Entertainment' },
    { title: 'Food & Recipes', to: '/?category=Recipes%20%26%20Food' },
    { title: 'Culture & Lifestyle', to: '/?category=Culture' }
  ],
  // Column 4: News, Weather & Editorial
  [
    { title: 'World News Dispatch', to: '/?category=World%20News' },
    { title: 'National & Global Weather', to: '/?search=Weather' },
    { title: 'Astrology & Horoscopes', to: '/?category=Astrology' },
    { title: 'Editorial & Opinion', to: '/?category=All' },
    { title: 'Creator Studio & Publishing', to: '/dashboard' }
  ]
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 mt-auto">
      {/* 1. TOP NEWSLETTER SECTION */}
      <div className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Join the Developer & Writer Network</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
                Stay updated with weekly engineering insights
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Get hand-picked articles on system design, full-stack architecture, AI developments, and open-source tutorials delivered directly to your inbox.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-none flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in-50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Thanks for subscribing! You're all set for the next digest.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your work or personal email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-none text-white placeholder-slate-500 text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-none shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero spam. Unsubscribe anytime with 1-click.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN DIRECTORY: TOPICS & NAVIGATION (Dedicated Background Color) */}
      <div className="bg-slate-900/80 border-b border-slate-800/90 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-5 pb-2.5 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>EXPLORE TOPICS & DIRECTORY</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Quick Navigation
            </span>
          </div>

          {/* 4-Column Grid with Circular Bullet Items - Titles Only (Exactly 5 Rows Max) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3">
            {TOPICS_DIRECTORY_COLUMNS.map((column, colIdx) => (
              <div key={colIdx} className="space-y-2.5">
                {column.map((item, itemIdx) => (
                  <div key={itemIdx} className="group flex items-center text-xs">
                    <span className="text-red-500 mr-2 text-[8px] select-none shrink-0 transition-colors">
                      ●
                    </span>
                    <Link
                      to={item.to}
                      className="text-slate-300 hover:text-white transition-colors duration-150 group-hover:underline font-medium truncate block"
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Back to top row */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-red-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                Blog<span className="text-red-500">Hub</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• Multimedia Publishing Platform</span>

              <a
                href="https://t.me/BlogHubNewsBot"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold transition-colors ml-2"
                title="Get Instant Telegram Alerts"
              >
                <Send className="w-3 h-3" />
                <span>@BlogHubNewsBot</span>
              </a>
            </div>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-800 shadow-2xs"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT & LEGAL BAR */}
      <div className="bg-slate-900 border-t border-slate-800/80 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5">
            © {new Date().getFullYear()} <strong className="text-white font-bold">BlogHub</strong>. Crafted with{' '}
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for multimedia publishing.
          </p>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">API Docs</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
