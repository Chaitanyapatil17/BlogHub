const express = require('express');
const router = express.Router();
const db = require('../db');

// Max URLs per sub-sitemap (Google standard allows up to 50,000 URLs / 50MB)
const POSTS_PER_SITEMAP = 10000;

// Simple in-memory cache with 15-minute TTL
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Clear cache helper (called whenever articles are updated/published)
function clearSitemapCache() {
  cache.clear();
}

/**
 * Get canonical base domain from SITE_URL environment variable
 */
function getBaseUrl() {
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
  return siteUrl.trim().replace(/\/+$/, '');
}

/**
 * Escape XML special characters to maintain strict XML validity
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format timestamp into standard W3C ISO 8601 Datetime (e.g. 2026-08-18T10:00:00.000Z)
 */
function formatW3CDate(dateVal) {
  if (!dateVal) return new Date().toISOString();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * 1. ROOT SITEMAP INDEX (/sitemap.xml or /sitemap-index.xml)
 * Outputs a standard <sitemapindex> referencing sub-sitemaps for static, categories, authors, and paginated posts.
 */
router.get(['/sitemap.xml', '/sitemap-index.xml'], async (req, res) => {
  const cacheKey = 'sitemap-index';
  const cachedXml = getCached(cacheKey);
  if (cachedXml) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedXml);
  }

  try {
    const baseUrl = getBaseUrl();

    // Query total published articles count & latest updated_at
    const countRes = await db.query(`
      SELECT 
        COUNT(*) as total_posts,
        MAX(updated_at) as latest_post_update
      FROM blogs 
      WHERE status = 'published'
    `);

    const totalPosts = parseInt(countRes.rows[0]?.total_posts || 0, 10);
    const latestPostUpdate = formatW3CDate(countRes.rows[0]?.latest_post_update);
    const totalPostSitemaps = Math.max(1, Math.ceil(totalPosts / POSTS_PER_SITEMAP));

    // Query latest category update
    const categoryRes = await db.query(`
      SELECT MAX(updated_at) as latest_cat_update 
      FROM blogs 
      WHERE status = 'published' AND category IS NOT NULL
    `);
    const latestCatUpdate = formatW3CDate(categoryRes.rows[0]?.latest_cat_update);

    // Query latest author update
    const authorRes = await db.query(`
      SELECT MAX(created_at) as latest_author_update 
      FROM users 
      WHERE is_verified = true
    `);
    const latestAuthorUpdate = formatW3CDate(authorRes.rows[0]?.latest_author_update);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static Pages Sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}/sitemap-static.xml`)}</loc>\n`;
    xml += `    <lastmod>${latestPostUpdate}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Categories Sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}/sitemap-categories.xml`)}</loc>\n`;
    xml += `    <lastmod>${latestCatUpdate}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Authors Sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}/sitemap-authors.xml`)}</loc>\n`;
    xml += `    <lastmod>${latestAuthorUpdate}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Paginated Post Sitemaps (/sitemap-posts-1.xml, /sitemap-posts-2.xml, ...)
    for (let p = 1; p <= totalPostSitemaps; p++) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${escapeXml(`${baseUrl}/sitemap-posts-${p}.xml`)}</loc>\n`;
      xml += `    <lastmod>${latestPostUpdate}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += `</sitemapindex>`;

    setCache(cacheKey, xml);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating sitemap index');
  }
});

/**
 * 2. STATIC PAGES SITEMAP (/sitemap-static.xml)
 * Contains homepage and core public entry points.
 */
router.get('/sitemap-static.xml', async (req, res) => {
  const cacheKey = 'sitemap-static';
  const cachedXml = getCached(cacheKey);
  if (cachedXml) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedXml);
  }

  try {
    const baseUrl = getBaseUrl();
    const latestRes = await db.query(`SELECT MAX(updated_at) as latest FROM blogs WHERE status = 'published'`);
    const latestDate = formatW3CDate(latestRes.rows[0]?.latest);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${baseUrl}/`)}</loc>\n`;
    xml += `    <lastmod>${latestDate}</lastmod>\n`;
    xml += `  </url>\n`;

    xml += `</urlset>`;

    setCache(cacheKey, xml);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error) {
    console.error('Error generating static sitemap:', error);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating static sitemap');
  }
});

/**
 * 3. CATEGORIES SITEMAP (/sitemap-categories.xml)
 * Contains all distinct published category feeds.
 */
router.get('/sitemap-categories.xml', async (req, res) => {
  const cacheKey = 'sitemap-categories';
  const cachedXml = getCached(cacheKey);
  if (cachedXml) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedXml);
  }

  try {
    const baseUrl = getBaseUrl();
    const result = await db.query(`
      SELECT 
        category,
        MAX(updated_at) as last_updated
      FROM blogs 
      WHERE status = 'published' AND category IS NOT NULL AND TRIM(category) != ''
      GROUP BY category
      ORDER BY category ASC
    `);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const row of result.rows) {
      const categoryUrl = `${baseUrl}/?category=${encodeURIComponent(row.category)}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(categoryUrl)}</loc>\n`;
      xml += `    <lastmod>${formatW3CDate(row.last_updated)}</lastmod>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    setCache(cacheKey, xml);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating categories sitemap');
  }
});

/**
 * 4. AUTHORS SITEMAP (/sitemap-authors.xml)
 * Contains all verified editorial columnists and authors with published articles.
 */
router.get('/sitemap-authors.xml', async (req, res) => {
  const cacheKey = 'sitemap-authors';
  const cachedXml = getCached(cacheKey);
  if (cachedXml) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedXml);
  }

  try {
    const baseUrl = getBaseUrl();
    const result = await db.query(`
      SELECT 
        u.id,
        MAX(b.updated_at) as last_published
      FROM users u
      JOIN blogs b ON b.author_id = u.id
      WHERE b.status = 'published'
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const row of result.rows) {
      const authorUrl = `${baseUrl}/author/${row.id}`;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(authorUrl)}</loc>\n`;
      xml += `    <lastmod>${formatW3CDate(row.last_published)}</lastmod>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    setCache(cacheKey, xml);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error) {
    console.error('Error generating authors sitemap:', error);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating authors sitemap');
  }
});

/**
 * 5. PAGINATED POSTS SITEMAP (/sitemap-posts-:page.xml)
 * Efficiently streams published articles in batches of 10,000 URLs per sub-sitemap.
 */
router.get('/sitemap-posts-:page.xml', async (req, res) => {
  const page = parseInt(req.params.page, 10);
  if (isNaN(page) || page < 1) {
    return res.status(404).setHeader('Content-Type', 'text/plain').send('Invalid sitemap page');
  }

  const cacheKey = `sitemap-posts-${page}`;
  const cachedXml = getCached(cacheKey);
  if (cachedXml) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedXml);
  }

  try {
    const baseUrl = getBaseUrl();
    const offset = (page - 1) * POSTS_PER_SITEMAP;

    const result = await db.query(
      `SELECT slug, category, sub_category, updated_at, created_at
       FROM blogs
       WHERE status = 'published' AND slug IS NOT NULL AND TRIM(slug) != ''
       ORDER BY updated_at DESC
       LIMIT $1 OFFSET $2`,
      [POSTS_PER_SITEMAP, offset]
    );

    if (result.rows.length === 0 && page > 1) {
      return res.status(404).setHeader('Content-Type', 'text/plain').send('Sitemap page not found');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const slugify = (str) => {
      if (!str) return '';
      return String(str).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    };

    for (const row of result.rows) {
      const catSlug = slugify(row.category);
      const subCatSlug = slugify(row.sub_category);
      let path = `/blog/${row.slug}`;
      if (catSlug && subCatSlug) {
        path = `/blog/${catSlug}/${subCatSlug}/${row.slug}`;
      } else if (catSlug) {
        path = `/blog/${catSlug}/${row.slug}`;
      }
      const articleUrl = `${baseUrl}${path}`;
      const lastModDate = formatW3CDate(row.updated_at || row.created_at);

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(articleUrl)}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    setCache(cacheKey, xml);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (error) {
    console.error(`Error generating posts sitemap page ${page}:`, error);
    res.status(500).setHeader('Content-Type', 'text/plain').send('Error generating posts sitemap');
  }
});

/**
 * 6. DYNAMIC ROBOTS.TXT (/robots.txt)
 * Serves canonical crawl rules and points to the sitemap index.
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl();
  const robotsTxt = `# BlogHub News Portal - Robots Policy
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /login
Disallow: /register
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(robotsTxt);
});

module.exports = {
  router,
  clearSitemapCache
};
