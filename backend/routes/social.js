const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { 
  notifyUser, 
  broadcastCommentAdded, 
  broadcastCommentDeleted, 
  broadcastBlogLiked 
} = require('../socket');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Optional auth helper to check if requester is logged in (without blocking if guest)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.userId, role: decoded.role };
    } catch (e) {
      // invalid token, treat as guest
    }
  }
  next();
}

// 1. GET /api/blogs/:blogId/comments (Public - Get all comments for a blog)
router.get('/blogs/:blogId/comments', async (req, res) => {
  try {
    const { blogId } = req.params;
    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, c.user_id,
              u.name as user_name, u.role as user_role, u.is_verified as user_is_verified
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.blog_id = $1
       ORDER BY c.created_at ASC`,
      [blogId]
    );

    res.json({
      success: true,
      comments: result.rows,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
});

// 2. POST /api/blogs/:blogId/comments (Auth - Post a new comment)
router.post('/blogs/:blogId/comments', authenticateToken, async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    // Insert comment
    const result = await db.query(
      `INSERT INTO comments (blog_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at, user_id`,
      [blogId, req.user.id, content.trim()]
    );

    const newComment = {
      ...result.rows[0],
      user_name: req.user.name,
      user_role: req.user.role,
      user_is_verified: req.user.is_verified,
    };

    // Notify blog author if commenter is not author
    const blogRes = await db.query('SELECT author_id, title, slug FROM blogs WHERE id = $1', [blogId]);
    let blogSlug = '';
    if (blogRes.rows.length > 0) {
      const blog = blogRes.rows[0];
      blogSlug = blog.slug;
      if (blog.author_id !== req.user.id) {
        await notifyUser({
          userId: blog.author_id,
          title: 'New Comment on Your Article 💬',
          message: `${req.user.name} commented: "${content.trim().slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          link: `/blog/${blog.slug}`,
        });
      }
    }

    // Broadcast new comment to everyone in real time!
    broadcastCommentAdded(blogId, blogSlug, newComment);

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment: newComment,
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment.' });
  }
});

// 3. DELETE /api/comments/:id (Auth - Delete a comment)
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check comment and blog ownership
    const check = await db.query(
      `SELECT c.*, b.slug as blog_slug, b.author_id as blog_author_id
       FROM comments c
       JOIN blogs b ON c.blog_id = b.id
       WHERE c.id = $1`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const comment = check.rows[0];

    // Allowed if user is comment author, blog author, or admin
    const canDelete =
      req.user.id === comment.user_id ||
      req.user.id === comment.blog_author_id ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);

    // Broadcast comment deletion in real time!
    broadcastCommentDeleted(comment.blog_id, comment.blog_slug, id);

    res.json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment.' });
  }
});

// 4. POST /api/blogs/:blogId/like (Auth - Toggle like)
router.post('/blogs/:blogId/like', authenticateToken, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const existing = await db.query(
      'SELECT id FROM blog_likes WHERE blog_id = $1 AND user_id = $2',
      [blogId, userId]
    );

    let liked = false;
    let blogSlug = '';

    const blogRes = await db.query('SELECT author_id, title, slug FROM blogs WHERE id = $1', [blogId]);
    if (blogRes.rows.length > 0) {
      blogSlug = blogRes.rows[0].slug;
    }

    if (existing.rows.length > 0) {
      // Unlike
      await db.query('DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2', [blogId, userId]);
      liked = false;
    } else {
      // Like
      await db.query('INSERT INTO blog_likes (blog_id, user_id) VALUES ($1, $2)', [blogId, userId]);
      liked = true;

      // Notify author on like (if not author themselves)
      if (blogRes.rows.length > 0) {
        const blog = blogRes.rows[0];
        if (blog.author_id !== userId) {
          await notifyUser({
            userId: blog.author_id,
            title: 'New Like on Your Article ❤️',
            message: `${req.user.name} liked your article "${blog.title}".`,
            link: `/blog/${blog.slug}`,
          });
        }
      }
    }

    // Count updated likes
    const countRes = await db.query('SELECT COUNT(*) FROM blog_likes WHERE blog_id = $1', [blogId]);
    const likeCount = parseInt(countRes.rows[0].count, 10);

    // Broadcast updated like count in real time!
    broadcastBlogLiked(blogId, blogSlug, likeCount, userId, liked);

    res.json({
      success: true,
      liked,
      likeCount,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
});

// 5. GET /api/blogs/:blogId/social-status (Optional Auth - Get like & bookmark status)
router.get('/blogs/:blogId/social-status', optionalAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user ? req.user.id : null;

    const likeCountRes = await db.query('SELECT COUNT(*) FROM blog_likes WHERE blog_id = $1', [blogId]);
    const commentCountRes = await db.query('SELECT COUNT(*) FROM comments WHERE blog_id = $1', [blogId]);

    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const likeCheck = await db.query(
        'SELECT id FROM blog_likes WHERE blog_id = $1 AND user_id = $2',
        [blogId, userId]
      );
      isLiked = likeCheck.rows.length > 0;

      const bookmarkCheck = await db.query(
        'SELECT id FROM blog_bookmarks WHERE blog_id = $1 AND user_id = $2',
        [blogId, userId]
      );
      isBookmarked = bookmarkCheck.rows.length > 0;
    }

    res.json({
      success: true,
      likeCount: parseInt(likeCountRes.rows[0].count, 10),
      commentCount: parseInt(commentCountRes.rows[0].count, 10),
      isLiked,
      isBookmarked,
    });
  } catch (error) {
    console.error('Error fetching social status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch social status.' });
  }
});

// 6. POST /api/blogs/:blogId/bookmark (Auth - Toggle Bookmark)
router.post('/blogs/:blogId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;

    const existing = await db.query(
      'SELECT id FROM blog_bookmarks WHERE blog_id = $1 AND user_id = $2',
      [blogId, userId]
    );

    let bookmarked = false;

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM blog_bookmarks WHERE blog_id = $1 AND user_id = $2', [blogId, userId]);
      bookmarked = false;
    } else {
      await db.query('INSERT INTO blog_bookmarks (blog_id, user_id) VALUES ($1, $2)', [blogId, userId]);
      bookmarked = true;
    }

    res.json({
      success: true,
      bookmarked,
      message: bookmarked ? 'Article added to bookmarks!' : 'Article removed from bookmarks.',
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
});

// 7. GET /api/user/bookmarks (Auth - Get current user's bookmarked blogs)
router.get('/user/bookmarks', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.id, b.title, b.slug, b.content, b.cover_image, b.category, b.tags, b.status, b.created_at,
              u.name as author_name, u.is_verified as author_is_verified,
              bb.created_at as bookmarked_at,
              (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count
       FROM blog_bookmarks bb
       JOIN blogs b ON bb.blog_id = b.id
       JOIN users u ON b.author_id = u.id
       WHERE bb.user_id = $1
       ORDER BY bb.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      bookmarks: result.rows,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
});

// 8. GET /api/users/:id/profile (Public - Creator Profile Page)
router.get('/users/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const userRes = await db.query(
      `SELECT id, name, role, is_verified, bio, avatar_url, github_url, twitter_url, website_url, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Author not found.' });
    }

    const author = userRes.rows[0];

    // Get author's published blogs
    const blogsRes = await db.query(
      `SELECT b.id, b.title, b.slug, b.content, b.cover_image, b.category, b.tags, b.blocks, b.views, b.created_at,
              (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) as comment_count
       FROM blogs b
       WHERE b.author_id = $1 AND b.status = 'published'
       ORDER BY b.created_at DESC`,
      [id]
    );

    const blogs = blogsRes.rows;

    // Calculate aggregated metrics
    const totalBlogs = blogs.length;
    const totalViews = blogs.reduce((acc, curr) => acc + (parseInt(curr.views, 10) || 0), 0);
    const totalLikes = blogs.reduce((acc, curr) => acc + (parseInt(curr.like_count, 10) || 0), 0);
    const totalComments = blogs.reduce((acc, curr) => acc + (parseInt(curr.comment_count, 10) || 0), 0);

    res.json({
      success: true,
      author,
      stats: {
        totalBlogs,
        totalViews,
        totalLikes,
        totalComments,
      },
      blogs,
    });
  } catch (error) {
    console.error('Error fetching author profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch author profile.' });
  }
});

// 9. PUT /api/user/profile (Auth - Update Current User Profile & Bio)
router.put('/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, avatar_url, github_url, twitter_url, website_url } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           github_url = COALESCE($4, github_url),
           twitter_url = COALESCE($5, twitter_url),
           website_url = COALESCE($6, website_url)
       WHERE id = $7
       RETURNING id, name, email, role, is_verified, bio, avatar_url, github_url, twitter_url, website_url, created_at`,
      [
        name ? name.trim() : null,
        bio !== undefined ? bio : null,
        avatar_url !== undefined ? avatar_url : null,
        github_url !== undefined ? github_url : null,
        twitter_url !== undefined ? twitter_url : null,
        website_url !== undefined ? website_url : null,
        userId,
      ]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// 10. GET /api/users/top-authors (Public - Get Top Creators for Spotlight)
router.get('/users/top-authors', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.role, u.is_verified, u.bio, u.avatar_url,
              COUNT(b.id) as blog_count,
              COALESCE(SUM(b.views), 0) as total_views,
              (SELECT COUNT(*) FROM blog_likes bl JOIN blogs b2 ON bl.blog_id = b2.id WHERE b2.author_id = u.id) as total_likes
       FROM users u
       LEFT JOIN blogs b ON u.id = b.author_id AND b.status = 'published'
       GROUP BY u.id, u.name, u.role, u.is_verified, u.bio, u.avatar_url
       ORDER BY u.is_verified DESC, blog_count DESC, total_views DESC
       LIMIT 6`
    );

    res.json({
      success: true,
      authors: result.rows,
    });
  } catch (error) {
    console.error('Error fetching top authors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top authors.' });
  }
});

module.exports = router;
