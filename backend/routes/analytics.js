const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Country ISO-2 to Full Name mapping dictionary
const COUNTRY_NAMES = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  AU: 'Australia',
  JP: 'Japan',
  SG: 'Singapore',
  FR: 'France',
  BR: 'Brazil',
  NL: 'Netherlands',
  AE: 'United Arab Emirates',
  IT: 'Italy',
  ES: 'Spain',
  ID: 'Indonesia',
  ZA: 'South Africa',
  MX: 'Mexico',
  KR: 'South Korea',
  SE: 'Sweden',
  CH: 'Switzerland',
  NZ: 'New Zealand',
  IE: 'Ireland',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  PT: 'Portugal',
  GR: 'Greece',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  TH: 'Thailand',
  MY: 'Malaysia',
  PH: 'Philippines',
  VN: 'Vietnam',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  IL: 'Israel',
  RU: 'Russia',
  UA: 'Ukraine'
};

/**
 * Resolve client geolocation without ever storing raw IP
 */
function resolveGeoFromReq(req) {
  let rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || req.ip || '';
  if (rawIp.includes(',')) {
    rawIp = rawIp.split(',')[0].trim();
  }

  // Remove IPv6 prefix
  const cleanedIp = rawIp.replace(/^::ffff:/, '').trim();

  // Check for localhost / private IPv4
  const isLocal = !cleanedIp || 
    cleanedIp === '127.0.0.1' || 
    cleanedIp === '::1' || 
    cleanedIp === 'localhost' ||
    cleanedIp.startsWith('192.168.') || 
    cleanedIp.startsWith('10.') || 
    cleanedIp.startsWith('172.16.');

  if (isLocal) {
    // Graceful fallback for local development
    return {
      country: 'India',
      country_code: 'IN',
      region: 'Maharashtra',
      city: 'Mumbai',
      latitude: 19.076,
      longitude: 72.8777
    };
  }

  const geo = geoip.lookup(cleanedIp);
  if (geo) {
    const code = (geo.country || 'XX').toUpperCase();
    const countryName = COUNTRY_NAMES[code] || geo.country || 'Unknown';
    return {
      country: countryName,
      country_code: code,
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null
    };
  }

  return {
    country: 'Unknown',
    country_code: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    latitude: null,
    longitude: null
  };
}

/**
 * Parse clean device type & browser from User-Agent
 */
function parseDeviceAndBrowser(userAgent = '') {
  const ua = userAgent.toLowerCase();
  
  // Device Type
  let deviceType = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Browser
  let browser = 'Other';
  if (ua.includes('edg/') || ua.includes('edge/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('edg/')) {
    browser = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  return { deviceType, browser };
}

/**
 * 1. PUBLIC: POST /api/analytics/event
 * Ingests client interaction/view events asynchronously with privacy-safe geolocation
 */
router.post('/event', async (req, res) => {
  try {
    const {
      session_id,
      path = '/',
      blog_id = null,
      category = 'General',
      referrer = 'Direct',
      event_type = 'page_view',
      reading_time = 0
    } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    const geo = resolveGeoFromReq(req);
    const { deviceType, browser } = parseDeviceAndBrowser(req.headers['user-agent'] || '');

    // Clean sanitize referrer
    let cleanReferrer = 'Direct';
    if (referrer && referrer !== 'Direct') {
      if (referrer.includes('google')) cleanReferrer = 'Google';
      else if (referrer.includes('twitter') || referrer.includes('t.co') || referrer.includes('x.com')) cleanReferrer = 'Twitter';
      else if (referrer.includes('linkedin')) cleanReferrer = 'LinkedIn';
      else if (referrer.includes('facebook') || referrer.includes('fb.com')) cleanReferrer = 'Facebook';
      else if (referrer.includes('whatsapp')) cleanReferrer = 'WhatsApp';
      else if (referrer.includes('reddit')) cleanReferrer = 'Reddit';
      else cleanReferrer = 'Referral';
    }

    // Insert event
    await db.query(
      `INSERT INTO geo_analytics_events 
       (session_id, country, country_code, region, city, latitude, longitude, path, blog_id, category, device_type, browser, referrer, event_type, reading_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        session_id,
        geo.country,
        geo.country_code,
        geo.region,
        geo.city,
        geo.latitude,
        geo.longitude,
        path.slice(0, 255),
        blog_id ? parseInt(blog_id, 10) : null,
        category || 'General',
        deviceType,
        browser,
        cleanReferrer,
        event_type,
        parseInt(reading_time || 0, 10)
      ]
    );

    res.json({ success: true, recorded: true });
  } catch (error) {
    console.error('Error logging analytics event:', error);
    // Never crash or block client on analytics error
    res.status(200).json({ success: false, error: 'Event buffered' });
  }
});

/**
 * 2. ADMIN: GET /api/admin/analytics/geographic
 * Returns comprehensive aggregated geographic engagement statistics
 */
router.get('/geographic', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { timeRange = '30d', category, deviceType, countryCode } = req.query;

    // Dynamic filtering helper
    const buildFilter = (prefix = '') => {
      const p = prefix ? `${prefix}.` : '';
      let timeClause = `${p}created_at >= NOW() - INTERVAL '30 days'`;
      if (timeRange === '24h') {
        timeClause = `${p}created_at >= NOW() - INTERVAL '24 hours'`;
      } else if (timeRange === '7d') {
        timeClause = `${p}created_at >= NOW() - INTERVAL '7 days'`;
      } else if (timeRange === '30d') {
        timeClause = `${p}created_at >= NOW() - INTERVAL '30 days'`;
      } else if (timeRange === 'all') {
        timeClause = '1=1';
      }

      const clauses = [timeClause];
      const sqlParams = [];

      if (category && category !== 'All') {
        sqlParams.push(category);
        clauses.push(`${p}category = $${sqlParams.length}`);
      }

      if (deviceType && deviceType !== 'All') {
        sqlParams.push(deviceType.toLowerCase());
        clauses.push(`${p}device_type = $${sqlParams.length}`);
      }

      if (countryCode && countryCode !== 'All') {
        sqlParams.push(countryCode.toUpperCase());
        clauses.push(`${p}country_code = $${sqlParams.length}`);
      }

      return { whereSql: clauses.join(' AND '), params: sqlParams };
    };

    const { whereSql, params } = buildFilter();
    const { whereSql: joinedWhereSql, params: joinedParams } = buildFilter('g');

    // 1. Overall KPI Aggregations
    const kpiRes = await db.query(
      `SELECT 
        COUNT(DISTINCT session_id) as total_visitors,
        COUNT(CASE WHEN event_type IN ('page_view', 'article_view') THEN 1 END) as total_page_views,
        COUNT(CASE WHEN event_type = 'article_view' THEN 1 END) as total_article_views,
        COALESCE(AVG(CASE WHEN event_type = 'article_view' AND reading_time > 0 THEN reading_time END), 0) as avg_reading_time_secs,
        COUNT(CASE WHEN event_type = 'like' THEN 1 END) as total_likes,
        COUNT(CASE WHEN event_type = 'comment' THEN 1 END) as total_comments,
        COUNT(CASE WHEN event_type = 'bookmark' THEN 1 END) as total_bookmarks,
        COUNT(CASE WHEN event_type = 'share' THEN 1 END) as total_shares,
        COUNT(DISTINCT country_code) as active_countries_count
       FROM geo_analytics_events
       WHERE ${whereSql}`,
      params
    );

    const kpi = kpiRes.rows[0];
    const totalVisitors = parseInt(kpi.total_visitors || 0, 10);
    const totalLikes = parseInt(kpi.total_likes || 0, 10);
    const totalComments = parseInt(kpi.total_comments || 0, 10);
    const totalBookmarks = parseInt(kpi.total_bookmarks || 0, 10);
    const totalShares = parseInt(kpi.total_shares || 0, 10);
    const totalEngagements = totalLikes + totalComments + totalBookmarks + totalShares;
    const engagementRate = totalVisitors > 0 ? Number(((totalEngagements / totalVisitors) * 100).toFixed(1)) : 0;

    // 2. Country-wise Breakdown & Ranking
    const countryRes = await db.query(
      `SELECT 
        country,
        country_code,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(CASE WHEN event_type IN ('page_view', 'article_view') THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'article_view' THEN 1 END) as article_views,
        COALESCE(AVG(CASE WHEN event_type = 'article_view' AND reading_time > 0 THEN reading_time END), 0) as avg_reading_time_secs,
        COUNT(CASE WHEN event_type = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN event_type = 'comment' THEN 1 END) as comments,
        COUNT(CASE WHEN event_type = 'bookmark' THEN 1 END) as bookmarks,
        COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares,
        MAX(latitude) as latitude,
        MAX(longitude) as longitude
       FROM geo_analytics_events
       WHERE ${whereSql} AND country_code IS NOT NULL AND country_code != 'XX'
       GROUP BY country, country_code
       ORDER BY visitors DESC`,
      params
    );

    const countries = countryRes.rows.map((c) => {
      const v = parseInt(c.visitors || 0, 10);
      const sharePct = totalVisitors > 0 ? Number(((v / totalVisitors) * 100).toFixed(1)) : 0;
      return {
        country: c.country,
        country_code: c.country_code,
        visitors: v,
        page_views: parseInt(c.page_views || 0, 10),
        article_views: parseInt(c.article_views || 0, 10),
        avg_reading_time_secs: Math.round(parseFloat(c.avg_reading_time_secs || 0)),
        likes: parseInt(c.likes || 0, 10),
        comments: parseInt(c.comments || 0, 10),
        bookmarks: parseInt(c.bookmarks || 0, 10),
        shares: parseInt(c.shares || 0, 10),
        share_pct: sharePct,
        latitude: c.latitude ? parseFloat(c.latitude) : null,
        longitude: c.longitude ? parseFloat(c.longitude) : null,
      };
    });

    // 3. Top Cities Ranking
    const cityRes = await db.query(
      `SELECT 
        city,
        region,
        country,
        country_code,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(CASE WHEN event_type IN ('page_view', 'article_view') THEN 1 END) as page_views,
        COALESCE(AVG(CASE WHEN event_type = 'article_view' AND reading_time > 0 THEN reading_time END), 0) as avg_reading_time_secs
       FROM geo_analytics_events
       WHERE ${whereSql} AND city IS NOT NULL AND city != 'Unknown'
       GROUP BY city, region, country, country_code
       ORDER BY visitors DESC
       LIMIT 12`,
      params
    );

    const topCities = cityRes.rows.map((ct) => ({
      city: ct.city,
      region: ct.region,
      country: ct.country,
      country_code: ct.country_code,
      visitors: parseInt(ct.visitors || 0, 10),
      page_views: parseInt(ct.page_views || 0, 10),
      avg_reading_time_secs: Math.round(parseFloat(ct.avg_reading_time_secs || 0)),
    }));

    // 4. Device Type Distribution
    const deviceRes = await db.query(
      `SELECT 
        device_type,
        COUNT(DISTINCT session_id) as count
       FROM geo_analytics_events
       WHERE ${whereSql}
       GROUP BY device_type
       ORDER BY count DESC`,
      params
    );

    const deviceBreakdown = deviceRes.rows.map((d) => {
      const cnt = parseInt(d.count || 0, 10);
      return {
        device_type: d.device_type,
        count: cnt,
        pct: totalVisitors > 0 ? Number(((cnt / totalVisitors) * 100).toFixed(1)) : 0
      };
    });

    // 5. Browser Distribution
    const browserRes = await db.query(
      `SELECT 
        browser,
        COUNT(DISTINCT session_id) as count
       FROM geo_analytics_events
       WHERE ${whereSql}
       GROUP BY browser
       ORDER BY count DESC
       LIMIT 6`,
      params
    );

    const browserBreakdown = browserRes.rows.map((b) => {
      const cnt = parseInt(b.count || 0, 10);
      return {
        browser: b.browser,
        count: cnt,
        pct: totalVisitors > 0 ? Number(((cnt / totalVisitors) * 100).toFixed(1)) : 0
      };
    });

    // 6. Referrer Traffic Sources
    const referrerRes = await db.query(
      `SELECT 
        referrer,
        COUNT(DISTINCT session_id) as count
       FROM geo_analytics_events
       WHERE ${whereSql}
       GROUP BY referrer
       ORDER BY count DESC
       LIMIT 8`,
      params
    );

    const referrerBreakdown = referrerRes.rows.map((r) => {
      const cnt = parseInt(r.count || 0, 10);
      return {
        referrer: r.referrer,
        count: cnt,
        pct: totalVisitors > 0 ? Number(((cnt / totalVisitors) * 100).toFixed(1)) : 0
      };
    });

    // 7. Top Read Articles by Location
    const articleGeoRes = await db.query(
      `SELECT 
        b.id,
        b.title,
        b.slug,
        b.category,
        b.cover_image,
        g.country_code,
        g.country,
        COUNT(DISTINCT g.session_id) as readers_count,
        COUNT(CASE WHEN g.event_type = 'article_view' THEN 1 END) as view_count,
        COALESCE(AVG(CASE WHEN g.event_type = 'article_view' AND g.reading_time > 0 THEN g.reading_time END), 0) as avg_reading_time,
        COUNT(CASE WHEN g.event_type = 'share' THEN 1 END) as shares_count,
        COUNT(CASE WHEN g.event_type = 'bookmark' THEN 1 END) as bookmarks_count
       FROM geo_analytics_events g
       JOIN blogs b ON g.blog_id = b.id
       WHERE ${joinedWhereSql} AND g.blog_id IS NOT NULL
       GROUP BY b.id, b.title, b.slug, b.category, b.cover_image, g.country_code, g.country
       ORDER BY readers_count DESC
       LIMIT 20`,
      joinedParams
    );

    const topArticlesByCountry = articleGeoRes.rows.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      cover_image: a.cover_image,
      country_code: a.country_code,
      country: a.country,
      readers_count: parseInt(a.readers_count || 0, 10),
      view_count: parseInt(a.view_count || 0, 10),
      avg_reading_time_secs: Math.round(parseFloat(a.avg_reading_time || 0)),
      shares: parseInt(a.shares_count || 0, 10),
      bookmarks: parseInt(a.bookmarks_count || 0, 10),
    }));

    // 8. Time-series Day-by-Day Activity
    const timeSeriesRes = await db.query(
      `SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date_key,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(CASE WHEN event_type IN ('page_view', 'article_view') THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type IN ('like', 'comment', 'bookmark', 'share') THEN 1 END) as engagements
       FROM geo_analytics_events
       WHERE ${whereSql}
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
       ORDER BY date_key ASC
       LIMIT 30`,
      params
    );

    const timeSeries = timeSeriesRes.rows.map((t) => ({
      date: t.date_key,
      visitors: parseInt(t.visitors || 0, 10),
      page_views: parseInt(t.page_views || 0, 10),
      engagements: parseInt(t.engagements || 0, 10),
    }));

    res.json({
      success: true,
      timeRange,
      kpis: {
        totalVisitors,
        totalPageViews: parseInt(kpi.total_page_views || 0, 10),
        totalArticleViews: parseInt(kpi.total_article_views || 0, 10),
        avgReadingTimeSecs: Math.round(parseFloat(kpi.avg_reading_time_secs || 0)),
        totalLikes,
        totalComments,
        totalBookmarks,
        totalShares,
        totalEngagements,
        engagementRate,
        activeCountriesCount: parseInt(kpi.active_countries_count || 0, 10),
        topCountry: countries.length > 0 ? countries[0].country : 'None',
        topCountryCode: countries.length > 0 ? countries[0].country_code : 'XX',
        topCountryShare: countries.length > 0 ? countries[0].share_pct : 0
      },
      countries,
      topCities,
      deviceBreakdown,
      browserBreakdown,
      referrerBreakdown,
      topArticlesByCountry,
      timeSeries
    });
  } catch (error) {
    console.error('Error calculating geographic analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to aggregate geographic analytics' });
  }
});

module.exports = router;
