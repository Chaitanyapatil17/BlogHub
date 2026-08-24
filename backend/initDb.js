const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function initDb() {
  try {
    console.log('📦 Initializing PostgreSQL database tables & schema...');

    // 1. Run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);

    // 2. Apply incremental column migrations
    try {
      await db.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Writer & Developer on BlogHub';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_auth_token VARCHAR(64);
        CREATE INDEX IF NOT EXISTS idx_users_telegram_auth ON users(telegram_auth_token);

        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS cover_image TEXT;
        ALTER TABLE blogs ALTER COLUMN cover_image TYPE TEXT;
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Technology';
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]';
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
        ALTER TABLE blogs ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_blogs_sub_category ON blogs(sub_category);
        CREATE INDEX IF NOT EXISTS idx_blogs_ai_generated ON blogs(is_ai_generated);

        CREATE TABLE IF NOT EXISTS ai_generation_logs (
            id SERIAL PRIMARY KEY,
            trigger_type VARCHAR(50) DEFAULT 'cron',
            status VARCHAR(50) DEFAULT 'success',
            topics_discovered JSONB DEFAULT '[]',
            blogs_generated INTEGER DEFAULT 0,
            model_used VARCHAR(100) DEFAULT 'gemini-1.5-flash',
            details JSONB DEFAULT '{}',
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_generation_logs(created_at);

        -- Telegram Notification System Tables
        CREATE TABLE IF NOT EXISTS telegram_subscribers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            chat_id VARCHAR(100) UNIQUE NOT NULL,
            username VARCHAR(100),
            first_name VARCHAR(100),
            categories TEXT[] DEFAULT '{"All"}',
            is_active BOOLEAN DEFAULT true,
            auth_token VARCHAR(64),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_tg_subscribers_user ON telegram_subscribers(user_id);
        CREATE INDEX IF NOT EXISTS idx_tg_subscribers_chat ON telegram_subscribers(chat_id);
        CREATE INDEX IF NOT EXISTS idx_tg_subscribers_auth ON telegram_subscribers(auth_token);

        CREATE TABLE IF NOT EXISTS telegram_notification_logs (
            id SERIAL PRIMARY KEY,
            blog_id INTEGER REFERENCES blogs(id) ON DELETE SET NULL,
            category VARCHAR(100),
            recipients_count INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'sent',
            error_message TEXT,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_tg_logs_created ON telegram_notification_logs(created_at);
      `);
    } catch (e) {
      console.warn('Migration note:', e.message);
    }

    // 3. Seed Default Verified Authors
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('admin123', salt);

    const defaultUsers = [
      {
        email: 'admin@bloghub.com',
        name: 'Admin User',
        role: 'admin',
        is_verified: true,
        bio: 'Editorial Lead & System Architect at BlogHub. Writing on React 19, systems engineering, and web performance.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'chaitanya@bloghub.com',
        name: 'Chaitanya Patil',
        role: 'admin',
        is_verified: true,
        bio: 'Creator & Lead Full-Stack Engineer. Passionate about PostgreSQL architecture, developer tools, and React.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'sports@bloghub.com',
        name: 'Sports Bureau',
        role: 'user',
        is_verified: true,
        bio: 'Comprehensive coverage of international cricket, football, hockey, tennis, and championship analytics.',
        avatar_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'alex@bloghub.com',
        name: 'Alex Vance',
        role: 'user',
        is_verified: true,
        bio: 'Specialist in Autonomous Agent Workflows, PyTorch model fine-tuning, and LLM evaluations.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'sarah@bloghub.com',
        name: 'Sarah Connor',
        role: 'user',
        is_verified: true,
        bio: 'Crafting responsive UI design systems, Tailwind CSS components, and Node.js microservices.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'marcus@bloghub.com',
        name: 'Chef Marcus',
        role: 'user',
        is_verified: true,
        bio: 'Culinary explorer, food science enthusiast, and masterclass instructor for modern gastronomy.',
        avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80'
      }
    ];

    const authorMap = {};
    for (const u of defaultUsers) {
      const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [u.email]);
      if (existing.rows.length === 0) {
        const created = await db.query(
          `INSERT INTO users (name, email, password_hash, role, is_verified, bio, avatar_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [u.name, u.email, defaultPasswordHash, u.role, u.is_verified, u.bio, u.avatar_url]
        );
        authorMap[u.email] = created.rows[0].id;
      } else {
        authorMap[u.email] = existing.rows[0].id;
      }
    }

    const adminId = authorMap['admin@bloghub.com'] || 1;
    const chaitanyaId = authorMap['chaitanya@bloghub.com'] || adminId;
    const sportsId = authorMap['sports@bloghub.com'] || adminId;
    const alexId = authorMap['alex@bloghub.com'] || adminId;
    const sarahId = authorMap['sarah@bloghub.com'] || adminId;
    const marcusId = authorMap['marcus@bloghub.com'] || adminId;

    // 4. Seed Advertisements if table is empty
    const adCount = await db.query('SELECT COUNT(*) FROM advertisements');
    if (parseInt(adCount.rows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO advertisements (title, description, media_type, media_url, badge_text, button_text, target_url, features, is_active)
        VALUES 
        (
          'Level Up with BlogHub Creator Studio',
          'Write markdown, embed HD videos, add code blocks, and reach thousands of passionate readers every week.',
          'graphic',
          NULL,
          'Sponsored',
          'Get Started Free',
          '/register',
          '["Instant 1-Click Publishing", "Real-time Reader Analytics", "Verified Creator Profile Badge"]',
          true
        ),
        (
          'Next-Gen 5G Ultra Smartphone 2026',
          'Featuring Qualcomm Snapdragon 8 Gen 4, 200MP Leica optics, and 120Hz LTPO OLED display.',
          'image',
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85',
          'Partner',
          'Explore Devices',
          '/register',
          '["18-Hour Battery Life", "Titanium Aerospace Frame", "Zero Latency 5G"]',
          true
        )
      `);
    }

    // 5. Seed Comprehensive Multi-Category Blogs (ensure every category has working articles)
    console.log('🌱 Checking and seeding multi-category articles (Sports, Tech, Entertainment, Food, Business, AI, News, Astrology)...');

    const SEED_BLOGS = [
        // ================= SPORTS SECTION BLOGS =================
        {
          title: 'Bookies, players, owners of state T20 leagues under anti-corruption scanner',
          slug: 'bookies-players-owners-of-state-t20-leagues-under-anti-corruption-scanner',
          author_id: sportsId,
          category: 'Sports',
          tags: ['Cricket', 'T20', 'Sports', 'Investigation'],
          cover_image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
          views: 1420,
          content: `Central anti-corruption authorities have summoned multiple franchise officials and bookmakers following irregular betting spikes across domestic state T20 cricket leagues.

### High-Frequency Irregularities Detected
The specialized sports integrity monitoring unit detected suspicious betting patterns during death overs in regional championship fixtures. Over 14 individuals, including team owners and registered agents, have received formal questioning notices.

> "Ensuring sporting integrity is paramount. We will take decisive legal and administrative action against any individual attempting to compromise fair play." — Anti-Corruption Unit Director

### Key Forensic Audit Points:
- **14 Bookmakers and Officials Summoned**: Financial records and encrypted communication channels are under forensic audit.
- **Spot-Betting Spikes**: Irregular volume spikes during specific no-ball and wide deliveries alerted automated fraud detection algorithms.
- **Strict Compliance Protocols**: Enhanced background verification and real-time locker room monitoring will be mandatory for upcoming domestic seasons.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Central anti-corruption authorities have summoned multiple franchise officials and bookmakers following irregular betting spikes across domestic state T20 cricket leagues.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'High-Frequency Irregularities Detected' },
            { id: 'b-3', type: 'paragraph', content: 'The specialized sports integrity monitoring unit detected suspicious betting patterns during death overs in regional championship fixtures. Over 14 individuals, including team owners and registered agents, have received formal questioning notices.' },
            { id: 'b-4', type: 'quote', content: 'Ensuring sporting integrity is paramount. We will take decisive legal and administrative action against any individual attempting to compromise fair play.', author: 'Anti-Corruption Unit Director' },
            { id: 'b-5', type: 'heading', level: 2, content: 'Key Forensic Audit Points' },
            { id: 'b-6', type: 'paragraph', content: '1. 14 bookmakers and franchise owners summoned for formal forensic questioning.\n2. Spot-betting irregularities flagged in death-over delivery sequences.\n3. Digital communications and bank transfers undergoing multi-agency financial scrutiny.' }
          ]
        },
        {
          title: 'In his hour of grief, Messi turns to football as a tribute to his dad',
          slug: 'messi-tribute-inter-miami-freekick-winner',
          author_id: sportsId,
          category: 'Sports',
          tags: ['Football', 'Messi', 'InterMiami', 'MLS'],
          cover_image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
          views: 3890,
          content: `The Inter Miami captain returned to the pitch with an emotional performance, dedicating a decisive stoppage-time free-kick to his family in front of a sold-out stadium.

### The 94th Minute Magic
With the score tied at 2-2 in the 94th minute, Lionel Messi stepped up to take a 28-yard direct free-kick. Curling the ball with pinpoint precision into the top-right corner, he sealed a dramatic 3-2 victory.

The stadium erupted in cheers as the Argentine legend pointed both hands to the sky in an emotional tribute.

### Match Highlights & Statistics:
- **Possession**: Inter Miami 62% - 38% Opponent
- **Shots on Target**: 9 on target, 3 goals
- **Decisive Moment**: 94th-minute direct free-kick curling over the 5-man defensive wall.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'The Inter Miami captain returned to the pitch with an emotional performance, dedicating a decisive stoppage-time free-kick to his family in front of a sold-out stadium.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'The 94th-Minute Masterclass' },
            { id: 'b-3', type: 'paragraph', content: 'With the score tied at 2-2 in the dying seconds, Messi curled a 28-yard direct free kick over the wall into the top-right postage stamp corner, cementing an unforgettable night in Major League Soccer.' },
            { id: 'b-4', type: 'image', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', caption: 'Lionel Messi celebrating decisive stoppage-time winner.' },
            { id: 'b-5', type: 'paragraph', content: 'Teammates embraced the captain as fans chanted his name for over fifteen minutes after the final whistle sounded.' }
          ]
        },
        {
          title: 'World Cup, India vs England: Style, needle and hockey\'s most underrated rivalry',
          slug: 'india-vs-england-hockey-world-cup-rivalry',
          author_id: sportsId,
          category: 'Sports',
          tags: ['Hockey', 'WorldCup', 'India', 'England'],
          cover_image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80',
          views: 980,
          content: `Tactical midfield battles, counter-attack pace, and intense physical duels set the stage for an explosive Hockey World Cup clash in front of 20,000 roaring fans.

### Head-to-Head History
Across 18 previous international tournament matches, India and England have shared 7 wins each alongside 4 thrilling draws. This fixture has consistently delivered some of the fastest transitions and penalty-corner innovations in modern turf hockey.

### Tactical Keys to the Match:
1. **Midfield Pressing**: High-intensity pressing in the second quarter to disrupt England's aerial distribution.
2. **Penalty Corner Conversion**: Exploiting drag-flick variations against England's rushers.
3. **Goalkeeping Reflexes**: Crucial saves during counter-attacking transition phases.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Tactical midfield battles, counter-attack pace, and intense physical duels set the stage for an explosive World Cup clash in front of 20,000 roaring fans.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'Tactical Showdown on the Turf' },
            { id: 'b-3', type: 'paragraph', content: 'Both teams enter the fixture with undefeated pool records, making this match a direct decider for automatic quarter-final qualification.' }
          ]
        },
        {
          title: 'How Bangladesh\'s historic win has dented India\'s WTC Final chances',
          slug: 'how-bangladesh-historic-win-dented-india-wtc-final-chances',
          author_id: sportsId,
          category: 'Sports',
          tags: ['Cricket', 'WTC', 'TestCricket', 'ICC'],
          cover_image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
          views: 2150,
          content: `World Test Championship qualification math gets tighter as Team India faces must-win conditions across remaining overseas test tours following recent upset results.

### The Qualification Scenario
India now requires a minimum of 4 wins from their next 6 test matches to secure a top-two spot on the points table without relying on foreign series results.

### Key Points Table Snapshot:
- **Australia**: 68.5% Points Percentage
- **India**: 62.0% Points Percentage
- **South Africa**: 59.2% Points Percentage
- **New Zealand**: 50.0% Points Percentage`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'World Test Championship qualification math gets tighter as Team India faces must-win conditions across remaining overseas test tours.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'The Mathematics of Lord\'s Qualification' },
            { id: 'b-3', type: 'paragraph', content: 'With overseas series in Australia and England approaching, every single session and bonus over rate penalty will directly impact points percentages.' }
          ]
        },

        // ================= TECHNOLOGY & PROGRAMMING BLOGS =================
        {
          title: 'Full-Stack Web Development Roadmap: PostgreSQL to React 19',
          slug: 'getting-started-with-full-stack-development-in-2026',
          author_id: chaitanyaId,
          category: 'Technology',
          tags: ['FullStack', 'PostgreSQL', 'React19', 'NodeJS', 'WebDev'],
          cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          views: 4520,
          content: `Building high-throughput, real-time web applications in 2026 requires understanding modern PostgreSQL indexing, WebSocket rooms, and React 19 compiler optimizations.

### 1. Database Architecture with PostgreSQL
PostgreSQL remains the foundation for reliable transaction management, JSONB querying, and real-time triggers.

\`\`\`sql
-- High performance index on blog slug and category
CREATE INDEX idx_blogs_lookup ON blogs(category, status) WHERE status = 'published';
\`\`\`

### 2. React 19 State and Actions
React 19 eliminates boilerplate with \`useActionState\` and compiler-driven memoization:
- Zero manual \`useMemo\` and \`useCallback\` calls.
- Built-in asynchronous form submission transitions.
- Native optimistic UI updates.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Building high-throughput, real-time web applications in 2026 requires understanding modern PostgreSQL indexing, WebSocket rooms, and React 19 compiler optimizations.' },
            { id: 'b-2', type: 'heading', level: 2, content: '1. Database Architecture with PostgreSQL' },
            { id: 'b-3', type: 'code', code: 'CREATE INDEX idx_blogs_lookup ON blogs(category, status) WHERE status = \'published\';', language: 'sql' },
            { id: 'b-4', type: 'heading', level: 2, content: '2. React 19 Actions & Compiler' },
            { id: 'b-5', type: 'paragraph', content: 'React 19 revolutionizes form management by treating form actions as first-class asynchronous primitives with automatic pending states.' }
          ]
        },
        {
          title: 'Getting Started with React.js in 2026: Compiler, Actions & Server Components',
          slug: 'getting-started-with-reactjs-in-2026',
          author_id: adminId,
          category: 'Web Development',
          tags: ['React', 'JavaScript', 'Frontend', 'WebDev'],
          cover_image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
          views: 3100,
          content: `React 19 introduces automatic memoization through its ahead-of-time compiler, native action hooks, and seamless asset preloading.

### What's New in React 19
- **React Compiler**: Analyzes JavaScript code to memoize rendered UI elements automatically.
- **useActionState**: Simplifies async form handling and error boundaries.
- **Direct Ref Passing**: Ref is now a standard prop without \`forwardRef\` boilerplate.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'React 19 introduces automatic memoization through its ahead-of-time compiler, native action hooks, and seamless asset preloading.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'The React 19 Architecture' },
            { id: 'b-3', type: 'paragraph', content: 'Eliminate thousands of lines of manual dependency arrays and boilerplate with the new compiler pipeline.' }
          ]
        },
        {
          title: 'Git and GitHub Commands Every Developer Should Know by Heart',
          slug: 'git-and-github-commands-every-beginner-should-know',
          author_id: chaitanyaId,
          category: 'Programming',
          tags: ['Git', 'GitHub', 'CLI', 'DevOps'],
          cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
          views: 2890,
          content: `Master essential Git commands for branching, interactive rebasing, safe rollbacks, and multi-remote collaboration.

### Essential Commands:
1. **Interactive Rebase**: \`git rebase -i HEAD~3\`
2. **Soft Reset Staging**: \`git reset --soft HEAD~1\`
3. **Stash Workflows**: \`git stash push -m "WIP feature"\`
4. **Log Graph View**: \`git log --oneline --graph --decorate --all\``,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Master essential Git commands for branching, interactive rebasing, safe rollbacks, and multi-remote collaboration.' },
            { id: 'b-2', type: 'code', code: 'git reset --soft HEAD~1\ngit stash push -m "experimental feature"\ngit log --oneline --graph', language: 'bash' }
          ]
        },
        {
          title: 'The Rise of AI in Pair Programming and Development Workflows',
          slug: 'the-rise-of-ai-in-pair-programming-and-development',
          author_id: alexId,
          category: 'AI',
          tags: ['AI', 'LLM', 'Agents', 'Python', 'DevTools'],
          cover_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
          views: 5120,
          content: `Autonomous coding agents with Model Context Protocol (MCP) and multi-agent coordination are transforming software engineering into architectural orchestration.

### The Agentic Loop
Agents execute tool calling, run linting checks, inspect diffs, and self-correct syntax errors autonomously in isolated sandboxes.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Autonomous coding agents with Model Context Protocol (MCP) and multi-agent coordination are transforming software engineering.' },
            { id: 'b-2', type: 'heading', level: 2, content: 'Multi-Agent Coordination' },
            { id: 'b-3', type: 'paragraph', content: 'Decoupling research agents from execution subagents allows complex multi-file refactoring without context fragmentation.' }
          ]
        },
        {
          title: 'Mastering Modern Tailwind CSS & Responsive UI Design Systems',
          slug: 'mastering-tailwind-css-for-modern-web-ui',
          author_id: sarahId,
          category: 'Design',
          tags: ['CSS', 'Tailwind', 'UI/UX', 'Design'],
          cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
          views: 1840,
          content: `Techniques for crafting bespoke typography hierarchies, container queries, CSS :has() selectors, and dark/light adaptive themes.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Techniques for crafting bespoke typography hierarchies, container queries, CSS :has() selectors, and dark/light adaptive themes.' }
          ]
        },

        // ================= ENTERTAINMENT BLOGS =================
        {
          title: 'Rhea speaks candidly on resilience, family support, and artistic reinvention',
          slug: 'rhea-speaks-on-career-journey-and-cinema',
          author_id: adminId,
          category: 'Entertainment',
          tags: ['Entertainment', 'Cinema', 'Interviews', 'Culture'],
          cover_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
          views: 2430,
          content: `In an intimate retrospective, Rhea shared reflections on overcoming media controversies, building creative independence, and producing original storytelling formats.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'In an intimate retrospective, Rhea shared reflections on overcoming media controversies, building creative independence, and producing original storytelling formats.' }
          ]
        },
        {
          title: 'Ramayana costume designers address epic visual aesthetic and mythological research',
          slug: 'ramayana-costume-designers-address-epic-visual-aesthetic',
          author_id: adminId,
          category: 'Entertainment',
          tags: ['Cinema', 'Bollywood', 'CostumeDesign', 'Art'],
          cover_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
          views: 1980,
          content: `The lead production designers behind the upcoming cinematic epic discuss handloom textures, historical accuracy, and digital VFX cloth simulations.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'The lead production designers behind the upcoming cinematic epic discuss handloom textures, historical accuracy, and digital VFX cloth simulations.' }
          ]
        },
        {
          title: 'Avengers: Doomsday - Official Teaser Breakdown & Multiverse Timeline Secrets',
          slug: 'avengers-doomsday-teaser-breakdown-timeline-secrets',
          author_id: adminId,
          category: 'Entertainment',
          tags: ['Hollywood', 'Marvel', 'Cinema', 'Trailers'],
          cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
          views: 6720,
          content: `Analyzing easter eggs, Doom variants, and timeline convergence theories revealed in the international teaser trailer.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Analyzing easter eggs, Doom variants, and timeline convergence theories revealed in the international teaser trailer.' }
          ]
        },

        // ================= RECIPES & FOOD BLOGS =================
        {
          title: '6 signs your spices have lost their freshness and how to revive them',
          slug: 'six-signs-your-spices-lost-freshness-how-to-revive-them',
          author_id: marcusId,
          category: 'Recipes & Food',
          tags: ['Cooking', 'Food', 'Spices', 'Kitchen'],
          cover_image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
          views: 3410,
          content: `Learn how volatile essential oils dissipate in whole and ground spices, and how dry-toasting restores aroma and pungency.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Learn how volatile essential oils dissipate in whole and ground spices, and how dry-toasting restores aroma and pungency.' }
          ]
        },
        {
          title: 'Authentic Creamy Lebanese Garlic Toum Recipe: The Ultimate Dip',
          slug: 'authentic-creamy-lebanese-garlic-toum-recipe',
          author_id: marcusId,
          category: 'Recipes & Food',
          tags: ['Recipes', 'Food', 'Lebanese', 'Sauces'],
          cover_image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
          views: 1820,
          content: `Master the emulsion of fresh garlic cloves, lemon juice, ice water, and neutral oil to make fluffy restaurant-quality toum.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Master the emulsion of fresh garlic cloves, lemon juice, ice water, and neutral oil to make fluffy restaurant-quality toum.' }
          ]
        },

        // ================= ASTROLOGY & LIFESTYLE BLOGS =================
        {
          title: 'Daily Vedic Astrology: Planetary Transits & Career Forecast for All Signs',
          slug: 'daily-vedic-astrology-planetary-transits-and-career-horoscope',
          author_id: adminId,
          category: 'Astrology',
          tags: ['Astrology', 'Horoscope', 'Vedic', 'Lifestyle'],
          cover_image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=1200&q=80',
          views: 1650,
          content: `Comprehensive analysis of Moon in Libra, Mercury transits, and auspicious timings for enterprise decision-making.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Comprehensive analysis of Moon in Libra, Mercury transits, and auspicious timings for enterprise decision-making.' }
          ]
        },

        // ================= WORLD NEWS & EDITORIAL BLOGS =================
        {
          title: '‘Society needs some shocks’: Mumbai civic chief lauds food safety crackdown',
          slug: 'mumbai-civic-administration-lauds-food-safety-crackdown',
          author_id: adminId,
          category: 'World News',
          tags: ['News', 'Mumbai', 'PublicHealth', 'Civic'],
          cover_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
          views: 2980,
          content: `Inspections across 450 commercial kitchens led to strict purity notices and hygiene standard enforcement across the metropolitan region.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Inspections across 450 commercial kitchens led to strict purity notices and hygiene standard enforcement across the metropolitan region.' }
          ]
        },
        {
          title: 'IITs expand executive micro-degrees for working professionals in AI and Systems',
          slug: 'iits-expand-executive-micro-degrees-for-working-professionals',
          author_id: chaitanyaId,
          category: 'World News',
          tags: ['Education', 'Tech', 'IIT', 'Career'],
          cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
          views: 1840,
          content: `Premier technology institutes launch weekend cohort programs combining distributed systems architecture and applied machine learning.`,
          blocks: [
            { id: 'b-1', type: 'paragraph', content: 'Premier technology institutes launch weekend cohort programs combining distributed systems architecture and applied machine learning.' }
          ]
        }
      ];

      for (const blog of SEED_BLOGS) {
        const existing = await db.query('SELECT id FROM blogs WHERE slug = $1', [blog.slug]);
        if (existing.rows.length === 0) {
          const inserted = await db.query(
            `INSERT INTO blogs (title, slug, content, cover_image, category, sub_category, tags, blocks, views, author_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published')
             RETURNING id`,
            [
              blog.title,
              blog.slug,
              blog.content,
              blog.cover_image,
              blog.category,
              blog.sub_category || null,
              blog.tags,
              JSON.stringify(blog.blocks),
              blog.views,
              blog.author_id
            ]
          );

          const blogId = inserted.rows[0].id;

          // Add default like & comments
          await db.query(`INSERT INTO blog_likes (blog_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [blogId, adminId]);
          await db.query(
            `INSERT INTO comments (blog_id, user_id, content)
             VALUES ($1, $2, 'Excellent article! Very informative breakdown.')
             ON CONFLICT DO NOTHING`,
            [blogId, chaitanyaId]
          );
        }
      }
      console.log('✅ Seed articles verified/inserted successfully.');

      // 5. Seed Geographic Analytics Events if empty
      const existingGeoCount = await db.query('SELECT COUNT(*) as count FROM geo_analytics_events');
      if (parseInt(existingGeoCount.rows[0].count, 10) < 50) {
        console.log('🌍 Seeding realistic geographic analytics engagement events...');
        const publishedBlogs = await db.query("SELECT id, title, slug, category FROM blogs WHERE status = 'published' LIMIT 15");
        const blogList = publishedBlogs.rows;

        const GEO_POOLS = [
          { country: 'India', country_code: 'IN', region: 'Maharashtra', city: 'Mumbai', lat: 19.076, lng: 72.8777, weight: 45 },
          { country: 'India', country_code: 'IN', region: 'Karnataka', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, weight: 35 },
          { country: 'India', country_code: 'IN', region: 'Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.209, weight: 25 },
          { country: 'United States', country_code: 'US', region: 'California', city: 'San Francisco', lat: 37.7749, lng: -122.4194, weight: 30 },
          { country: 'United States', country_code: 'US', region: 'New York', city: 'New York', lat: 40.7128, lng: -74.006, weight: 25 },
          { country: 'United States', country_code: 'US', region: 'Washington', city: 'Seattle', lat: 47.6062, lng: -122.3321, weight: 15 },
          { country: 'United Kingdom', country_code: 'GB', region: 'England', city: 'London', lat: 51.5074, lng: -0.1278, weight: 25 },
          { country: 'United Kingdom', country_code: 'GB', region: 'England', city: 'Manchester', lat: 53.4808, lng: -2.2426, weight: 10 },
          { country: 'Canada', country_code: 'CA', region: 'Ontario', city: 'Toronto', lat: 43.6532, lng: -79.3832, weight: 18 },
          { country: 'Canada', country_code: 'CA', region: 'British Columbia', city: 'Vancouver', lat: 49.2827, lng: -123.1207, weight: 12 },
          { country: 'Germany', country_code: 'DE', region: 'Berlin', city: 'Berlin', lat: 52.52, lng: 13.405, weight: 18 },
          { country: 'Germany', country_code: 'DE', region: 'Bavaria', city: 'Munich', lat: 48.1351, lng: 11.582, weight: 10 },
          { country: 'Australia', country_code: 'AU', region: 'New South Wales', city: 'Sydney', lat: -33.8688, lng: 151.2093, weight: 16 },
          { country: 'Australia', country_code: 'AU', region: 'Victoria', city: 'Melbourne', lat: -37.8136, lng: 144.9631, weight: 12 },
          { country: 'Japan', country_code: 'JP', region: 'Tokyo', city: 'Tokyo', lat: 35.6762, lng: 139.6503, weight: 14 },
          { country: 'Singapore', country_code: 'SG', region: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198, weight: 14 },
          { country: 'France', country_code: 'FR', region: 'Île-de-France', city: 'Paris', lat: 48.8566, lng: 2.3522, weight: 12 },
          { country: 'Brazil', country_code: 'BR', region: 'São Paulo', city: 'São Paulo', lat: -23.5505, lng: -46.6333, weight: 12 },
          { country: 'Netherlands', country_code: 'NL', region: 'North Holland', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, weight: 10 },
          { country: 'United Arab Emirates', country_code: 'AE', region: 'Dubai', city: 'Dubai', lat: 25.2048, lng: 55.2708, weight: 10 },
        ];

        const DEVICES = ['desktop', 'desktop', 'mobile', 'mobile', 'mobile', 'tablet'];
        const BROWSERS = ['Chrome', 'Chrome', 'Safari', 'Safari', 'Firefox', 'Edge'];
        const REFERRERS = ['Google', 'Google', 'Direct', 'Direct', 'Twitter', 'LinkedIn', 'Facebook', 'Newsletter'];
        const EVENTS = ['page_view', 'article_view', 'article_view', 'reading_time', 'reading_time', 'like', 'comment', 'bookmark', 'share'];

        const now = Date.now();

        for (const loc of GEO_POOLS) {
          const sessionsCount = Math.floor(loc.weight * 1.5);
          for (let s = 0; s < sessionsCount; s++) {
            const sessionId = `sess_${loc.country_code.toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
            const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
            const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
            const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
            const targetBlog = blogList.length > 0 ? blogList[Math.floor(Math.random() * blogList.length)] : null;
            const category = targetBlog ? targetBlog.category : 'Technology';
            const path = targetBlog ? `/blog/${targetBlog.slug}` : '/';
            const blogId = targetBlog ? targetBlog.id : null;

            // Generate event timestamp in past 30 days
            const daysAgo = Math.random() * 28;
            const eventTime = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000);

            // 1. Initial page view
            await db.query(
              `INSERT INTO geo_analytics_events 
               (session_id, country, country_code, region, city, latitude, longitude, path, blog_id, category, device_type, browser, referrer, event_type, reading_time, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'page_view', 0, $14)`,
              [sessionId, loc.country, loc.country_code, loc.region, loc.city, loc.lat, loc.lng, path, blogId, category, device, browser, referrer, eventTime]
            );

            // 2. Article view & reading time if viewing an article
            if (blogId) {
              const readingSecs = Math.floor(60 + Math.random() * 320); // 1 to 6 minutes
              await db.query(
                `INSERT INTO geo_analytics_events 
                 (session_id, country, country_code, region, city, latitude, longitude, path, blog_id, category, device_type, browser, referrer, event_type, reading_time, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'article_view', $14, $15)`,
                [sessionId, loc.country, loc.country_code, loc.region, loc.city, loc.lat, loc.lng, path, blogId, category, device, browser, referrer, readingSecs, new Date(eventTime.getTime() + 15000)]
              );

              // 3. Probabilistic interaction event
              const randInter = Math.random();
              if (randInter > 0.4) {
                const interEvent = randInter > 0.85 ? 'share' : randInter > 0.7 ? 'bookmark' : randInter > 0.55 ? 'like' : 'comment';
                await db.query(
                  `INSERT INTO geo_analytics_events 
                   (session_id, country, country_code, region, city, latitude, longitude, path, blog_id, category, device_type, browser, referrer, event_type, reading_time, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, $15)`,
                  [sessionId, loc.country, loc.country_code, loc.region, loc.city, loc.lat, loc.lng, path, blogId, category, device, browser, referrer, interEvent, new Date(eventTime.getTime() + 45000)]
                );
              }
            }
          }
        }
        console.log('✅ Seed geographic analytics events populated.');
      }

    console.log('✅ Database schema, migrations, and seed data verified.');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
  }
}

module.exports = initDb;
