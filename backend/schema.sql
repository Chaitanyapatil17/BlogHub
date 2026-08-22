-- BlogHub Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified BOOLEAN DEFAULT false,
    bio TEXT DEFAULT 'Writer & Developer on BlogHub',
    avatar_url TEXT,
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),
    website_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Blogs Table (Enhanced with Multimedia & Metadata)
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT, -- supports URLs and Base64 uploaded images
    category VARCHAR(100) DEFAULT 'Technology',
    sub_category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    blocks JSONB DEFAULT '[]',
    views INTEGER DEFAULT 0,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('published', 'pending', 'rejected', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Blog Requests Table (for unverified user submissions)
CREATE TABLE IF NOT EXISTS blog_requests (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Blog Likes Table
CREATE TABLE IF NOT EXISTS blog_likes (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (blog_id, user_id)
);

-- 6. Blog Bookmarks / Saved Table
CREATE TABLE IF NOT EXISTS blog_bookmarks (
    id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (blog_id, user_id)
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Advertisements Table (Admin Managed with Image & Video support)
CREATE TABLE IF NOT EXISTS advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(50) DEFAULT 'image', -- 'image', 'video', 'graphic'
    media_url TEXT,
    badge_text VARCHAR(100) DEFAULT 'Sponsored',
    button_text VARCHAR(100) DEFAULT 'Get Started Free',
    target_url TEXT DEFAULT '/register',
    features JSONB DEFAULT '["Instant 1-Click Publishing", "Real-time Reader Analytics", "Verified Creator Profile Badge"]',
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Geographic & Engagement Analytics Events Table
CREATE TABLE IF NOT EXISTS geo_analytics_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Unknown',
    country_code VARCHAR(10) DEFAULT 'XX',
    region VARCHAR(100) DEFAULT 'Unknown',
    city VARCHAR(100) DEFAULT 'Unknown',
    latitude FLOAT,
    longitude FLOAT,
    path VARCHAR(255) DEFAULT '/',
    blog_id INTEGER REFERENCES blogs(id) ON DELETE SET NULL,
    category VARCHAR(100) DEFAULT 'General',
    device_type VARCHAR(50) DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50) DEFAULT 'Chrome',     -- 'Chrome', 'Safari', 'Firefox', 'Edge', 'Other'
    referrer VARCHAR(255) DEFAULT 'Direct',   -- 'Direct', 'Google', 'Twitter', 'LinkedIn', 'Facebook', 'Other'
    event_type VARCHAR(50) NOT NULL,          -- 'page_view', 'article_view', 'reading_time', 'like', 'comment', 'bookmark', 'share'
    reading_time INTEGER DEFAULT 0,          -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_sub_category ON blogs(sub_category);
CREATE INDEX IF NOT EXISTS idx_blogs_views ON blogs(views);
CREATE INDEX IF NOT EXISTS idx_blog_requests_status ON blog_requests(status);
CREATE INDEX IF NOT EXISTS idx_blog_requests_user ON blog_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_blog ON comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog ON blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_user ON blog_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_geo_analytics_created ON geo_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_geo_analytics_country ON geo_analytics_events(country_code, created_at);
CREATE INDEX IF NOT EXISTS idx_geo_analytics_blog_event ON geo_analytics_events(blog_id, event_type);
CREATE INDEX IF NOT EXISTS idx_geo_analytics_session ON geo_analytics_events(session_id);

