const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { 
  notifyAdmins, 
  broadcastBlogPublished, 
  broadcastBlogRequestsUpdated, 
  broadcastBlogDeleted 
} = require('../socket');
const { clearSitemapCache } = require('./sitemap');
const telegramService = require('../services/telegramService');

// Utility to create URL-friendly slug supporting international titles
function generateSlug(title, category = '') {
  let base = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base || base.length < 2) {
    const catBase = (category || 'article')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim() || 'story';
    base = `${catBase}-post`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Utility to clean scraped or messy inline styles and classes
function cleanHtmlText(text = '') {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\sstyle=(["']).*?\1/gi, '')
    .replace(/\sclass=(["']).*?\1/gi, '')
    .replace(/&quot;/g, '"');
}

// 1. GET /api/blogs (Public - List published blogs with search, category, sub_category, tag filtering)
router.get('/', async (req, res) => {
  try {
    const { search, category, sub_category, subCategory, tag } = req.query;
    const subCatFilter = (sub_category || subCategory || '').trim();

    let query = `
      SELECT b.id, b.title, b.slug, b.content, b.cover_image, b.category, b.sub_category, b.tags, b.blocks, b.views,
             b.status, b.is_ai_generated, b.ai_metadata, b.created_at, b.updated_at,
             u.id as author_id, u.name as author_name, u.email as author_email, u.is_verified as author_is_verified,
             (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published'
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (b.title ILIKE $${params.length} OR b.content ILIKE $${params.length} OR b.category ILIKE $${params.length} OR b.sub_category ILIKE $${params.length} OR $${params.length} = ANY(b.tags))`;
    }

    if (category && category.trim() && category !== 'All') {
      params.push(category.trim());
      query += ` AND b.category ILIKE $${params.length}`;
    }

    if (subCatFilter) {
      params.push(`%${subCatFilter}%`);
      query += ` AND (b.sub_category ILIKE $${params.length} OR $${params.length} = ANY(b.tags))`;
    }

    if (tag && tag.trim()) {
      params.push(tag.trim());
      query += ` AND $${params.length} = ANY(b.tags)`;
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      blogs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blogs.' });
  }
});

// 2. GET /api/blogs/trending (Public - Top trending published blogs)
router.get('/trending', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.id, b.title, b.slug, b.content, b.cover_image, b.category, b.sub_category, b.tags, b.views,
             b.status, b.is_ai_generated, b.ai_metadata, b.created_at,
             u.name as author_name, u.is_verified as author_is_verified,
             (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count,
             (COALESCE(b.views, 0) + (SELECT COUNT(*) * 3 FROM blog_likes WHERE blog_id = b.id) + (SELECT COUNT(*) * 2 FROM comments WHERE blog_id = b.id)) as engagement_score
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published'
      ORDER BY engagement_score DESC, b.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      trending: result.rows,
    });
  } catch (error) {
    console.error('Error fetching trending blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending blogs.' });
  }
});

// 3. POST /api/blogs/:id/view (Public - Increment article views)
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE blogs
       SET views = COALESCE(views, 0) + 1
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'View recorded.' });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ success: false, message: 'Failed to record view.' });
  }
});

// 4. GET /api/blogs/my/list (User - Get current user's own blogs with multimedia details)
router.get('/my/list', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, u.name as author_name, u.is_verified as author_is_verified,
              (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count
       FROM blogs b
       JOIN users u ON b.author_id = u.id
       WHERE b.author_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      blogs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your blogs.' });
  }
});

// 5. GET /api/blogs/my/requests (User - Get current user's blog requests)
router.get('/my/requests', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT br.id as request_id, br.status as request_status, br.review_note, br.created_at as requested_at,
              b.id as blog_id, b.title, b.slug, b.content, b.cover_image, b.category, b.status as blog_status,
              reviewer.name as reviewer_name
       FROM blog_requests br
       JOIN blogs b ON br.blog_id = b.id
       LEFT JOIN users reviewer ON br.reviewed_by = reviewer.id
       WHERE br.user_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your requests.' });
  }
});

// 6. GET /api/blogs/:slug (Public - Get single blog details by slug or numeric ID)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      `SELECT b.id, b.title, b.slug, b.content, b.cover_image, b.category, b.sub_category, b.tags, b.blocks, b.views,
              b.status, b.is_ai_generated, b.ai_metadata, b.created_at, b.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email, u.is_verified as author_is_verified,
              (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count
       FROM blogs b
       JOIN users u ON b.author_id = u.id
       WHERE LOWER(b.slug) = LOWER($1) OR b.slug = $1 OR (b.id::text = $1)`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found.' });
    }

    const blog = result.rows[0];

    // If blog is not published, only allow author or admin to view
    if (blog.status !== 'published') {
      return res.json({
        success: true,
        blog,
        isPrivate: true,
      });
    }

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error('Error fetching blog details:', error);
    res.status(500).json({ success: false, message: 'Failed to load blog.' });
  }
});

// 7. POST /api/blogs (User / Admin - Create new multimedia blog)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, cover_image, category, sub_category, tags, blocks } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    // Default fallback text content if blocks are provided
    let finalContent = content;
    if (!finalContent && Array.isArray(blocks)) {
      finalContent = blocks
        .map((b) => (b.content ? b.content : b.code ? b.code : ''))
        .join('\n\n');
    }

    if (!finalContent || !finalContent.trim()) {
      finalContent = title;
    }

    finalContent = cleanHtmlText(finalContent);

    const slug = generateSlug(title, category);
    const isAutoPublished = req.user.role === 'admin' || req.user.is_verified === true;
    const initialStatus = isAutoPublished ? 'published' : 'pending';

    const tagsArray = Array.isArray(tags) ? tags : [];
    const cleanedBlocks = Array.isArray(blocks)
      ? blocks.map(b => ({ ...b, content: b.content ? cleanHtmlText(b.content) : b.content }))
      : [];
    const blocksJson = JSON.stringify(cleanedBlocks);

    // Insert blog
    const blogResult = await db.query(
      `INSERT INTO blogs (title, slug, content, cover_image, category, sub_category, tags, blocks, views, author_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
       RETURNING *`,
      [
        title.trim(),
        slug,
        finalContent.trim(),
        cover_image || null,
        category || 'Technology',
        sub_category ? sub_category.trim() : null,
        tagsArray,
        blocksJson,
        req.user.id,
        initialStatus,
      ]
    );

    const newBlog = blogResult.rows[0];

    // If user is unverified, create a blog request record for Admin review
    if (!isAutoPublished) {
      await db.query(
        `INSERT INTO blog_requests (blog_id, user_id, status)
         VALUES ($1, $2, 'pending')`,
        [newBlog.id, req.user.id]
      );

      // Send real-time notification to Admins
      await notifyAdmins({
        title: 'New Blog Approval Request',
        message: `${req.user.name} submitted "${newBlog.title}" for review.`,
        link: '/admin',
      });

      // Broadcast new request to admin room
      broadcastBlogRequestsUpdated({ blog_id: newBlog.id, user_id: req.user.id, title: newBlog.title, status: 'pending' });
    } else {
      // Auto-published: broadcast to everyone in real time and clear sitemap cache!
      clearSitemapCache();
      broadcastBlogPublished(newBlog);

      // Send Telegram Notification to Subscribed Users (Non-blocking)
      telegramService.notifySubscribersForBlog(newBlog).catch((err) => {
        console.warn('⚠️ [BlogCreation] Telegram notification broadcast error:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: isAutoPublished
        ? 'Blog published directly!'
        : 'Blog submitted successfully! Awaiting Admin approval since your account is unverified.',
      blog: newBlog,
      isAutoPublished,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to create blog post.' });
  }
});

// 8. PUT /api/blogs/:id (Owner or Admin - Update multimedia blog)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, cover_image, category, sub_category, tags, blocks } = req.body;

    // Check ownership
    const check = await db.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found.' });
    }

    const blog = check.rows[0];
    if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this blog.' });
    }

    let finalContent = content || blog.content;
    if (Array.isArray(blocks) && blocks.length > 0) {
      finalContent = blocks
        .map((b) => (b.content ? b.content : b.code ? b.code : ''))
        .join('\n\n');
    }

    finalContent = cleanHtmlText(finalContent);

    const tagsArray = Array.isArray(tags) ? tags : blog.tags || [];
    let cleanedBlocks = Array.isArray(blocks)
      ? blocks.map(b => ({ ...b, content: b.content ? cleanHtmlText(b.content) : b.content }))
      : blog.blocks;
    const blocksJson = typeof cleanedBlocks === 'string' ? cleanedBlocks : JSON.stringify(cleanedBlocks);

    const updateResult = await db.query(
      `UPDATE blogs
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           cover_image = COALESCE($3, cover_image),
           category = COALESCE($4, category),
           sub_category = COALESCE($5, sub_category),
           tags = COALESCE($6, tags),
           blocks = COALESCE($7, blocks),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        title ? title.trim() : null,
        finalContent ? finalContent.trim() : null,
        cover_image !== undefined ? cover_image : blog.cover_image,
        category || null,
        sub_category !== undefined ? (sub_category ? sub_category.trim() : null) : blog.sub_category,
        tagsArray,
        blocksJson,
        id,
      ]
    );

    const updatedBlog = updateResult.rows[0];
    clearSitemapCache();
    if (updatedBlog.status === 'published') {
      broadcastBlogPublished(updatedBlog);
    }

    res.json({
      success: true,
      message: 'Blog updated successfully!',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to update blog.' });
  }
});

// 9. DELETE /api/blogs/:id (Owner or Admin - Delete blog)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const check = await db.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found.' });
    }

    const blog = check.rows[0];
    if (blog.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this blog.' });
    }

    await db.query('DELETE FROM blogs WHERE id = $1', [id]);
    clearSitemapCache();
    broadcastBlogDeleted(id);

    res.json({
      success: true,
      message: 'Blog deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blog.' });
  }
});

module.exports = router;
