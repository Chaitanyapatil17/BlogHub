import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { UNIFIED_CATEGORIES } from '../utils/categories';

const CATEGORIES = UNIFIED_CATEGORIES.map(c => ({
  name: c.name,
  query: c.query === 'All' ? '' : c.query,
  icon: c.icon
}));

// Duplicate items list for infinite seamless loop
const MARQUEE_ITEMS = [...CATEGORIES, ...CATEGORIES];

export default function RunningNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ONLY show on Explore / Home page ('/')
  if (location.pathname !== '/') {
    return null;
  }

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';

  const handleCategoryClick = (query) => {
    if (!query) {
      navigate('/');
    } else {
      navigate(`/?category=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs h-8 sm:h-9 flex items-center overflow-hidden select-none w-full max-w-full">
      <div className="w-full max-w-[1440px] mx-auto flex items-center overflow-hidden min-w-0">
        {/* Left Fixed Ticker Badge */}
        <div className="z-10 flex items-center gap-1.5 px-3 py-1 bg-white border-r border-slate-200/80 shadow-xs text-indigo-700 text-[11px] font-bold shrink-0 h-full">
          <Flame className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px] font-extrabold">TRENDING</span>
        </div>

        {/* Automatic Running Ticker Wrapper with Edge Gradients */}
        <div className="relative flex-1 overflow-hidden min-w-0 flex items-center">
          {/* Subtle Left & Right Fade Gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none"></div>

          {/* Continuous Automatic Animated Marquee */}
          <div className="animate-marquee flex items-center gap-3">
            {MARQUEE_ITEMS.map((cat, index) => {
              const Icon = cat.icon;
              const isSelected = 
                (cat.query === '' && !currentCategory) || 
                (cat.query !== '' && currentCategory.toLowerCase() === cat.query.toLowerCase());

              return (
                <button
                  key={`${cat.name}-${index}`}
                  onClick={() => handleCategoryClick(cat.query)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/70 hover:border-indigo-200'
                  }`}
                  title={`Filter by ${cat.name}`}
                >
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
