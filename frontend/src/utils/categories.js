import { 
  Cpu, 
  Code2, 
  Rocket, 
  Bot, 
  Trophy, 
  Tv, 
  Sparkles, 
  TrendingUp, 
  Atom, 
  Star, 
  Globe2, 
  Landmark, 
  Palette, 
  CheckSquare, 
  Briefcase,
  BookOpen,
  Newspaper,
  HeartPulse,
  GraduationCap
} from 'lucide-react';

export const CATEGORIES_TAXONOMY = [
  {
    id: 'news',
    name: 'World News',
    slug: 'World News',
    icon: Globe2,
    color: 'text-red-600',
    subCategories: [
      'National',
      'Maharashtra',
      'Delhi',
      'Politics & Elections',
      'World News',
      'Cities',
      'Crime & Legal',
      'Defense & Security'
    ]
  },
  {
    id: 'tech',
    name: 'Technology',
    slug: 'Technology',
    icon: Cpu,
    color: 'text-blue-600',
    subCategories: [
      'Web Development',
      'Programming & Code',
      'Cloud & DevOps',
      'Cybersecurity',
      'Mobile Apps',
      'Gadgets & Hardware',
      'Open Source',
      'Tech Policy & Big Tech'
    ]
  },
  {
    id: 'ai',
    name: 'AI & Machine Learning',
    slug: 'AI',
    icon: Bot,
    color: 'text-purple-600',
    subCategories: [
      'Generative AI & LLMs',
      'Autonomous Agents',
      'Computer Vision & NLP',
      'Machine Learning Models',
      'Prompt Engineering',
      'AI Ethics & Safety'
    ]
  },
  {
    id: 'programming',
    name: 'Programming',
    slug: 'Programming',
    icon: Code2,
    color: 'text-emerald-600',
    subCategories: [
      'JavaScript & TypeScript',
      'React & Next.js',
      'Python & Backend',
      'PostgreSQL & Databases',
      'System Architecture',
      'Algorithms & Data Structures'
    ]
  },
  {
    id: 'webdev',
    name: 'Web Development',
    slug: 'Web Development',
    icon: Rocket,
    color: 'text-cyan-600',
    subCategories: [
      'Frontend Architecture',
      'Backend & APIs',
      'Tailwind CSS & Styling',
      'Performance Optimization',
      'Full-Stack Frameworks'
    ]
  },
  {
    id: 'business',
    name: 'Business & Finance',
    slug: 'Business',
    icon: TrendingUp,
    color: 'text-emerald-700',
    subCategories: [
      'Markets & Stocks',
      'Economy & Trade',
      'Startups & VC',
      'Personal Finance & Tax',
      'Banking & FinTech',
      'Real Estate',
      'Crypto & Web3',
      'Auto & EV'
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    slug: 'Sports',
    icon: Trophy,
    color: 'text-rose-600',
    subCategories: [
      'Cricket',
      'Football',
      'Tennis',
      'Badminton',
      'Hockey',
      'Formula 1',
      'Chess & Esports',
      'Olympics & Athletics'
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    slug: 'Entertainment',
    icon: Tv,
    color: 'text-pink-600',
    subCategories: [
      'Bollywood & Cinema',
      'Hollywood & Global',
      'OTT & Web Series',
      'Music & Concerts',
      'Movie Reviews & Box Office',
      'Celebrity Spotlights'
    ]
  },
  {
    id: 'food',
    name: 'Recipes & Food',
    slug: 'Recipes & Food',
    icon: Sparkles,
    color: 'text-amber-600',
    subCategories: [
      'Quick & Easy Recipes',
      'Traditional & Indian Cuisine',
      'Healthy Gastronomy & Diets',
      'Kitchen Science & Hacks',
      'Baking & Desserts',
      'Restaurant Reviews'
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Health',
    slug: 'Lifestyle',
    icon: HeartPulse,
    color: 'text-rose-500',
    subCategories: [
      'Health & Fitness',
      'Mental Wellbeing',
      'Travel & Destinations',
      'Fashion & Beauty',
      'Parenting & Family',
      'Home & Living'
    ]
  },
  {
    id: 'education',
    name: 'Education & Career',
    slug: 'Education',
    icon: GraduationCap,
    color: 'text-indigo-600',
    subCategories: [
      'Higher Education & Universities',
      'IITs & Engineering',
      'Competitive Exams & Coaching',
      'Study Abroad',
      'Jobs & Hiring',
      'Professional Skills'
    ]
  },
  {
    id: 'explained',
    name: 'Explained & Opinions',
    slug: 'Explained',
    icon: Newspaper,
    color: 'text-red-700',
    subCategories: [
      'BlogHub Explained',
      'Editorials & Columns',
      'Analysis & Deep Dives',
      'Fact Checks',
      'Interviews & Insights'
    ]
  },
  {
    id: 'science',
    name: 'Science & Space',
    slug: 'Science',
    icon: Atom,
    color: 'text-teal-600',
    subCategories: [
      'Space & Astronomy',
      'Climate Change & Environment',
      'Wildlife & Biodiversity',
      'Physics & Chemistry',
      'Biotechnology & Medicine'
    ]
  },
  {
    id: 'astrology',
    name: 'Astrology & Horoscope',
    slug: 'Astrology',
    icon: Star,
    color: 'text-amber-500',
    subCategories: [
      'Daily Horoscopes',
      'Vedic Astrology & Transits',
      'Zodiac Signs Compatibility',
      'Numerology & Palmistry',
      'Tarot & Spiritual Guidance'
    ]
  },
  {
    id: 'history',
    name: 'History & Culture',
    slug: 'History',
    icon: Landmark,
    color: 'text-yellow-700',
    subCategories: [
      'Indian History',
      'World Civilizations',
      'Art & Cultural Heritage',
      'Books & Literature',
      'Archaeology & Monuments'
    ]
  },
  {
    id: 'design',
    name: 'UI / UX Design',
    slug: 'Design',
    icon: Palette,
    color: 'text-violet-600',
    subCategories: [
      'UI / UX Design',
      'Design Systems & Tokens',
      'Graphic Design & 3D',
      'Typography & Layouts',
      'Figma & Prototyping'
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity',
    slug: 'Productivity',
    icon: CheckSquare,
    color: 'text-sky-600',
    subCategories: [
      'Time Management',
      'Developer Productivity',
      'Workflows & Automations',
      'Tools & Apps',
      'Remote Work'
    ]
  },
  {
    id: 'career',
    name: 'Career & Growth',
    slug: 'Career',
    icon: Briefcase,
    color: 'text-slate-600',
    subCategories: [
      'Career Growth & Promotions',
      'Resume & Portfolio Tips',
      'Interview Preparation',
      'Tech Leadership & Management',
      'Freelancing & Consulting'
    ]
  }
];

export const SUBCATEGORIES_MAP = CATEGORIES_TAXONOMY.reduce((acc, cat) => {
  acc[cat.slug] = cat.subCategories;
  acc[cat.name] = cat.subCategories;
  return acc;
}, {});

export const STUDIO_CATEGORY_OPTIONS = CATEGORIES_TAXONOMY.map(c => c.slug);
export const CATEGORY_NAMES = STUDIO_CATEGORY_OPTIONS;

export const UNIFIED_CATEGORIES = [
  { id: 'all', name: 'All Topics', query: 'All', icon: Sparkles, color: 'text-indigo-600' },
  ...CATEGORIES_TAXONOMY.map(c => ({
    id: c.id,
    name: c.name,
    query: c.slug,
    icon: c.icon,
    color: c.color
  }))
];

