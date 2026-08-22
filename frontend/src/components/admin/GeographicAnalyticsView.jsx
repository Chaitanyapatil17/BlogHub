import { useState, useEffect } from 'react';
import { getBlogUrl } from '../../utils/urlHelper';
import { API_BASE_URL } from '../../config';
import { 
  Globe, 
  MapPin, 
  Clock, 
  Eye, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Smartphone, 
  Monitor, 
  Tablet, 
  TrendingUp, 
  Compass, 
  RefreshCw, 
  ChevronRight, 
  X, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Filter,
  BarChart3
} from 'lucide-react';

// Country code to emoji flag helper
const FLAG_MAP = {
  IN: '🇮🇳',
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  DE: '🇩🇪',
  AU: '🇦🇺',
  JP: '🇯🇵',
  SG: '🇸🇬',
  FR: '🇫🇷',
  BR: '🇧🇷',
  NL: '🇳🇱',
  AE: '🇦🇪',
  IT: '🇮🇹',
  ES: '🇪🇸',
  KR: '🇰🇷',
  SE: '🇸🇪',
  CH: '🇨🇭',
  NZ: '🇳🇿',
  IE: '🇮🇪',
  ZA: '🇿🇦',
  MX: '🇲🇽',
  XX: '🌐'
};

// SVG Projection coordinates (Equirectangular 960x480 standard viewport)
const SVG_COORDS = {
  IN: { x: 678, y: 220, name: 'India' },
  US: { x: 230, y: 175, name: 'United States' },
  GB: { x: 472, y: 128, name: 'United Kingdom' },
  CA: { x: 230, y: 120, name: 'Canada' },
  DE: { x: 504, y: 136, name: 'Germany' },
  AU: { x: 825, y: 345, name: 'Australia' },
  JP: { x: 818, y: 180, name: 'Japan' },
  SG: { x: 730, y: 278, name: 'Singapore' },
  FR: { x: 485, y: 152, name: 'France' },
  BR: { x: 335, y: 310, name: 'Brazil' },
  NL: { x: 494, y: 133, name: 'Netherlands' },
  AE: { x: 610, y: 215, name: 'United Arab Emirates' },
};

export default function GeographicAnalyticsView({ token }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Filter States
  const [timeRange, setTimeRange] = useState('30d'); // '24h', '7d', '30d', 'all'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState(null); // For deep dive modal/drawer
  const [hoveredCountry, setHoveredCountry] = useState(null);

  const fetchGeoAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedDevice && selectedDevice !== 'All') params.append('deviceType', selectedDevice);

      const res = await fetch(`${API_BASE_URL}/api/admin/analytics/geographic?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.message || 'Failed to fetch geographic analytics');
      }
    } catch (err) {
      setError('Error connecting to analytics server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoAnalytics();
  }, [timeRange, selectedCategory, selectedDevice]);

  // Format seconds to mm:ss or minutes
  const formatDuration = (secs = 0) => {
    const s = Math.round(secs);
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins}m ${remainder > 0 ? remainder + 's' : ''}`;
  };

  const kpis = data?.kpis || {};
  const countries = data?.countries || [];
  const topCities = data?.topCities || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const browserBreakdown = data?.browserBreakdown || [];
  const referrerBreakdown = data?.referrerBreakdown || [];
  const topArticles = data?.topArticlesByCountry || [];

  // Filtered articles for selected country deep dive
  const countryArticles = selectedCountry
    ? topArticles.filter((a) => a.country_code === selectedCountry.country_code)
    : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Banner with Privacy Badge & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-PII • Privacy-Preserving IP Telemetry</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Geographic Engagement Analytics</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                Live Feed
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Understand where your worldwide readership originates, analyze country-wise reading depth, and inspect regional engagement patterns.
            </p>
          </div>

          {/* Quick Global Highlights Pill */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xs text-slate-400 font-medium">Active Countries</div>
              <div className="text-lg font-black text-white">{kpis.activeCountriesCount || 0}</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-xs text-slate-400 font-medium">Top Reader Base</div>
              <div className="text-lg font-black text-amber-300 flex items-center justify-center gap-1">
                <span>{FLAG_MAP[kpis.topCountryCode] || '🌐'}</span>
                <span>{kpis.topCountry || 'None'}</span>
              </div>
            </div>
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-medium">Engagement Rate</div>
              <div className="text-lg font-black text-emerald-400">{kpis.engagementRate || 0}%</div>
            </div>
          </div>
        </div>

        {/* Interactive Filter Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 relative z-10">
          {/* Time Range Tabs */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10">
            {[
              { id: '24h', label: 'Last 24h' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category & Device Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-white">All Categories</option>
                <option value="Technology" className="bg-slate-900 text-white">Technology</option>
                <option value="World News" className="bg-slate-900 text-white">World News</option>
                <option value="Sports" className="bg-slate-900 text-white">Sports</option>
                <option value="Entertainment" className="bg-slate-900 text-white">Entertainment</option>
                <option value="Money & Finance" className="bg-slate-900 text-white">Money & Finance</option>
                <option value="Astrology" className="bg-slate-900 text-white">Astrology</option>
                <option value="Career" className="bg-slate-900 text-white">Career</option>
                <option value="Science" className="bg-slate-900 text-white">Science</option>
              </select>
            </div>

            {/* Device Dropdown */}
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-white">All Devices</option>
                <option value="mobile" className="bg-slate-900 text-white">Mobile</option>
                <option value="desktop" className="bg-slate-900 text-white">Desktop</option>
                <option value="tablet" className="bg-slate-900 text-white">Tablet</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchGeoAnalytics}
              disabled={loading}
              title="Refresh Geographic Metrics"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Visitors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global Readers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {kpis.totalVisitors?.toLocaleString() || 0}
          </div>
          <div className="mt-2 text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>{kpis.topCountryShare || 0}% from {kpis.topCountry}</span>
          </div>
        </div>

        {/* Metric 2: Avg Reading Time */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Read Duration</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {formatDuration(kpis.avgReadingTimeSecs || 0)}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <span>Across all {kpis.totalArticleViews || 0} article reads</span>
          </div>
        </div>

        {/* Metric 3: Page & Article Views */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page & Article Views</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {kpis.totalPageViews?.toLocaleString() || 0}
          </div>
          <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <span>{kpis.totalArticleViews || 0} full news article opens</span>
          </div>
        </div>

        {/* Metric 4: Total Engagements */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interactions & Shares</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">
            {kpis.totalEngagements?.toLocaleString() || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
            <span>❤️ {kpis.totalLikes || 0}</span>
            <span>•</span>
            <span>🔖 {kpis.totalBookmarks || 0}</span>
            <span>•</span>
            <span>🔗 {kpis.totalShares || 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive World Vector Choropleth & Density Map */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 lg:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>Interactive World Traffic & Density Map</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hover over country nodes to inspect regional volume or click to open full country breakdown.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              <span>High Traffic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-200"></span>
              <span>Emerging</span>
            </div>
          </div>
        </div>

        {/* World Vector SVG Canvas */}
        <div className="w-full bg-slate-900 rounded-2xl p-4 md:p-6 relative overflow-hidden border border-slate-800 shadow-inner">
          {/* Subtle background world map wireframe */}
          <svg
            viewBox="0 0 960 480"
            className="w-full h-auto max-h-[420px] select-none"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* World Continents Rough Geometry */}
            <g fill="#1e293b" stroke="#334155" strokeWidth="0.75" opacity="0.6">
              {/* North America */}
              <path d="M 120,60 Q 180,50 280,70 Q 320,110 300,180 Q 240,240 180,220 Q 130,170 120,60 Z" />
              {/* South America */}
              <path d="M 280,260 Q 350,270 360,340 Q 330,440 290,450 Q 260,360 280,260 Z" />
              {/* Europe */}
              <path d="M 460,80 Q 560,70 560,150 Q 480,180 450,140 Q 440,90 460,80 Z" />
              {/* Africa */}
              <path d="M 460,180 Q 570,190 560,300 Q 520,390 480,390 Q 440,290 460,180 Z" />
              {/* Asia */}
              <path d="M 570,70 Q 820,60 840,200 Q 720,280 620,240 Q 570,160 570,70 Z" />
              {/* Australia */}
              <path d="M 760,310 Q 860,310 870,380 Q 800,420 750,380 Q 740,330 760,310 Z" />
            </g>

            {/* Latitude / Longitude Subtle Grid */}
            <g stroke="#334155" strokeWidth="0.4" strokeDasharray="3,3" opacity="0.4">
              <line x1="0" y1="120" x2="960" y2="120" />
              <line x1="0" y1="240" x2="960" y2="240" />
              <line x1="0" y1="360" x2="960" y2="360" />
              <line x1="240" y1="0" x2="240" y2="480" />
              <line x1="480" y1="0" x2="480" y2="480" />
              <line x1="720" y1="0" x2="720" y2="480" />
            </g>

            {/* Country Interactive Hotspot Nodes */}
            {countries.map((c) => {
              const coord = SVG_COORDS[c.country_code] || { x: 480, y: 240, name: c.country };
              const radius = Math.max(6, Math.min(22, (c.visitors / (kpis.totalVisitors || 1)) * 36));
              const isHovered = hoveredCountry?.country_code === c.country_code;
              const isSelected = selectedCountry?.country_code === c.country_code;

              return (
                <g
                  key={c.country_code}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedCountry(c)}
                  onMouseEnter={() => setHoveredCountry(c)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Radar Ripple Animation for Top Country */}
                  {c.country_code === kpis.topCountryCode && (
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={radius * 2}
                      fill="url(#radarGlow)"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Outer Glow Halo */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={radius + 4}
                    fill={isSelected || isHovered ? '#818cf8' : '#6366f1'}
                    opacity={isSelected || isHovered ? 0.6 : 0.25}
                    filter="url(#glow)"
                  />

                  {/* Main Node Circle */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={radius}
                    fill={isSelected ? '#38bdf8' : isHovered ? '#a5b4fc' : '#6366f1'}
                    stroke="#ffffff"
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                  />

                  {/* Country Code Label */}
                  <text
                    x={coord.x}
                    y={coord.y - radius - 5}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {FLAG_MAP[c.country_code] || ''} {c.country_code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip Box */}
          {hoveredCountry && (
            <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-700 text-white rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{FLAG_MAP[hoveredCountry.country_code] || '🌐'}</span>
                <span className="text-sm font-bold text-white">{hoveredCountry.country}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                  {hoveredCountry.share_pct}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
                <div>Readers: <strong className="text-white">{hoveredCountry.visitors}</strong></div>
                <div>Avg Read: <strong className="text-amber-300">{formatDuration(hoveredCountry.avg_reading_time_secs)}</strong></div>
                <div>Article Views: <strong className="text-emerald-300">{hoveredCountry.article_views}</strong></div>
                <div>Interactions: <strong className="text-rose-300">{hoveredCountry.likes + hoveredCountry.shares + hoveredCountry.bookmarks}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Dual Section: Ranked Countries Engagement Table & Regional Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 Cols): Ranked Countries Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Country-Wise Readership & Engagement Rankings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any country to inspect top articles read, device preferences, and regional stats.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {countries.length} Ranked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-2">Rank</th>
                    <th className="pb-3 px-3">Country</th>
                    <th className="pb-3 px-3">Readers</th>
                    <th className="pb-3 px-3">% Share</th>
                    <th className="pb-3 px-3">Avg Read Time</th>
                    <th className="pb-3 px-3 text-center">Interactions</th>
                    <th className="pb-3 px-2 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {countries.map((c, idx) => (
                    <tr
                      key={c.country_code}
                      onClick={() => setSelectedCountry(c)}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-2 text-slate-400 font-bold">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{FLAG_MAP[c.country_code] || '🌐'}</span>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {c.country}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">({c.country_code})</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.visitors.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                              style={{ width: `${Math.min(100, c.share_pct)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-10 text-right">
                            {c.share_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[11px]">
                          <Clock className="w-3 h-3" />
                          {formatDuration(c.avg_reading_time_secs)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <span title="Likes">❤️ {c.likes}</span>
                          <span title="Shares">🔗 {c.shares}</span>
                          <span title="Bookmarks">🔖 {c.bookmarks}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-100 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Top Cities & Platform Telemetry */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top 6 Global Metros / Cities */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>Top Regional Metro Areas</span>
            </h3>

            <div className="space-y-3">
              {topCities.slice(0, 6).map((ct, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {ct.city}, <span className="text-slate-500 font-normal">{ct.region}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {FLAG_MAP[ct.country_code] || '🌐'} {ct.country}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">{ct.visitors} readers</div>
                    <div className="text-[10px] text-amber-600 font-medium">⏱️ {formatDuration(ct.avg_reading_time_secs)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device & Browser Telemetry Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>Device & Acquisition Telemetry</span>
            </h3>

            {/* Device Progress Bars */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Device Form Factors</div>
              {deviceBreakdown.map((d) => (
                <div key={d.device_type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 capitalize">
                    <span className="flex items-center gap-1.5">
                      {d.device_type === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-indigo-600" />}
                      {d.device_type === 'desktop' && <Monitor className="w-3.5 h-3.5 text-purple-600" />}
                      {d.device_type === 'tablet' && <Tablet className="w-3.5 h-3.5 text-pink-600" />}
                      <span>{d.device_type}</span>
                    </span>
                    <span>{d.count} ({d.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.device_type === 'mobile' ? 'bg-indigo-600' : d.device_type === 'desktop' ? 'bg-purple-600' : 'bg-pink-500'
                      }`}
                      style={{ width: `${Math.min(100, d.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Traffic Sources / Referrers */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Inbound Channels</div>
              <div className="flex flex-wrap gap-1.5">
                {referrerBreakdown.map((r) => (
                  <span
                    key={r.referrer}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200"
                  >
                    {r.referrer}: <strong className="text-slate-900">{r.pct}%</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Country Deep-Dive Modal / Flyout Drawer */}
      {selectedCountry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{FLAG_MAP[selectedCountry.country_code] || '🌐'}</span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>{selectedCountry.country}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                      ISO: {selectedCountry.country_code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contributes {selectedCountry.share_pct}% of total global traffic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCountry(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Country Specific Metrics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Readers</div>
                <div className="text-xl font-black text-slate-900">{selectedCountry.visitors}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Article Views</div>
                <div className="text-xl font-black text-emerald-600">{selectedCountry.article_views}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Read Time</div>
                <div className="text-xl font-black text-amber-600">{formatDuration(selectedCountry.avg_reading_time_secs)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Shares</div>
                <div className="text-xl font-black text-indigo-600">{selectedCountry.shares}</div>
              </div>
            </div>

            {/* Top Articles Read in this Country */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Top Stories Read in {selectedCountry.country}</span>
              </h4>

              {countryArticles.length > 0 ? (
                <div className="space-y-2.5">
                  {countryArticles.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">
                          {art.category}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate mt-1">{art.title}</h5>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>👥 {art.readers_count} Readers</span>
                          <span>⏱️ {formatDuration(art.avg_reading_time_secs)} avg</span>
                          <span>🔗 {art.shares} shares</span>
                        </div>
                      </div>
                      <a
                        href={getBlogUrl(art)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-white text-slate-600 hover:text-indigo-600 border border-slate-200 shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Articles read by visitors in {selectedCountry.country} will populate automatically as more reads occur.
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCountry(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
