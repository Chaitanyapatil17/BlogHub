const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  notifyUser, 
  broadcastBlogPublished, 
  broadcastBlogRequestsUpdated, 
  broadcastBlogDeleted 
} = require('../socket');
const { clearSitemapCache } = require('./sitemap');
const telegramService = require('../services/telegramService');

// Helper middleware array for admin routes
const adminAuth = [authenticateToken, requireAdmin];

// 1. GET /api/blog-requests (Admin - View all blog requests)
router.get('/blog-requests', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT br.id, br.status, br.review_note, br.created_at, br.updated_at,
             b.id as blog_id, b.title as blog_title, b.slug as blog_slug, b.content as blog_content, b.status as blog_status,
             b.cover_image as blog_cover_image, b.category as blog_category, b.sub_category as blog_sub_category,
             b.tags as blog_tags, b.blocks as blog_blocks, b.is_ai_generated as blog_is_ai_generated, b.ai_metadata as blog_ai_metadata,
             u.id as user_id, u.name as user_name, u.email as user_email, u.is_verified as user_is_verified,
             reviewer.name as reviewer_name
      FROM blog_requests br
      JOIN blogs b ON br.blog_id = b.id
      JOIN users u ON br.user_id = u.id
      LEFT JOIN users reviewer ON br.reviewed_by = reviewer.id
      ORDER BY 
        CASE WHEN br.status = 'pending' THEN 1 ELSE 2 END,
        br.created_at DESC
    `);

    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error fetching blog requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog requests.' });
  }
});

// 2. PUT /api/blog-requests/:id/approve (Admin - Approve request -> publish blog)
router.put('/blog-requests/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the request along with blog details
    const reqResult = await db.query(
      `SELECT br.*, b.title as blog_title, b.slug as blog_slug
       FROM blog_requests br
       JOIN blogs b ON br.blog_id = b.id
       WHERE br.id = $1`,
      [id]
    );
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog request not found.' });
    }

    const blogReq = reqResult.rows[0];

    // Update blog_requests table
    await db.query(
      `UPDATE blog_requests
       SET status = 'approved', reviewed_by = $1, review_note = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [req.user.id, req.body.review_note || 'Approved by admin.', id]
    );

    // Update blogs table to 'published'
    const blogUpdateResult = await db.query(
      `UPDATE blogs
       SET status = 'published', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [blogReq.blog_id]
    );

    const publishedBlog = blogUpdateResult.rows[0];

    // Real-time notification to the author
    await notifyUser({
      userId: blogReq.user_id,
      title: 'Blog Approved & Published! 🎉',
      message: `Your blog post "${blogReq.blog_title}" was approved by an admin and is now live!`,
      link: `/blog/${blogReq.blog_slug}`,
    });

    // Broadcast real-time blog publication & requests update to all users
    clearSitemapCache();
    broadcastBlogPublished(publishedBlog);
    broadcastBlogRequestsUpdated({ id, status: 'approved', blog_id: blogReq.blog_id });

    // Send Telegram Notification to Subscribed Users (Non-blocking)
    telegramService.notifySubscribersForBlog(publishedBlog).catch((err) => {
      console.warn('⚠️ [AdminApproval] Telegram notification broadcast error:', err.message);
    });

    res.json({
      success: true,
      message: 'Blog request approved and published successfully!',
      blog: publishedBlog,
    });
  } catch (error) {
    console.error('Error approving blog request:', error);
    res.status(500).json({ success: false, message: 'Failed to approve blog request.' });
  }
});

// 3. PUT /api/blog-requests/:id/reject (Admin - Reject request)
router.put('/blog-requests/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { review_note } = req.body;

    const reqResult = await db.query(
      `SELECT br.*, b.title as blog_title
       FROM blog_requests br
       JOIN blogs b ON br.blog_id = b.id
       WHERE br.id = $1`,
      [id]
    );
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog request not found.' });
    }

    const blogReq = reqResult.rows[0];

    // Update blog_requests table
    await db.query(
      `UPDATE blog_requests
       SET status = 'rejected', reviewed_by = $1, review_note = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [req.user.id, review_note || 'Rejected by admin.', id]
    );

    // Update blogs table to 'rejected'
    await db.query(
      `UPDATE blogs
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [blogReq.blog_id]
    );

    // Real-time notification to the author
    await notifyUser({
      userId: blogReq.user_id,
      title: 'Blog Submission Update ⚠️',
      message: `Your blog "${blogReq.blog_title}" was rejected. Feedback: "${review_note || 'No notes provided'}"`,
      link: '/dashboard',
    });

    // Broadcast real-time requests update
    broadcastBlogRequestsUpdated({ id, status: 'rejected', blog_id: blogReq.blog_id });

    res.json({
      success: true,
      message: 'Blog request rejected.',
    });
  } catch (error) {
    console.error('Error rejecting blog request:', error);
    res.status(500).json({ success: false, message: 'Failed to reject blog request.' });
  }
});

// 4. GET /api/users (Admin - List all users)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.is_verified, u.created_at,
             COUNT(DISTINCT b.id) as blog_count
      FROM users u
      LEFT JOIN blogs b ON u.id = b.author_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// 5. PUT /api/users/:id/verify (Admin - Verify / Unverify user)
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const newStatus = typeof is_verified === 'boolean' ? is_verified : !userCheck.rows[0].is_verified;

    const updateResult = await db.query(
      `UPDATE users
       SET is_verified = $1
       WHERE id = $2
       RETURNING id, name, email, role, is_verified`,
      [newStatus, id]
    );

    // Real-time notification to user
    await notifyUser({
      userId: id,
      title: 'Verification Status Changed 🎖️',
      message: newStatus
        ? 'Congratulations! Your account is now Verified. You can publish blogs directly with 1 click!'
        : 'Your account verification status was set to Unverified. New posts will undergo admin review.',
      link: '/dashboard',
    });

    res.json({
      success: true,
      message: `User status updated to ${newStatus ? 'Verified' : 'Unverified'}.`,
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user verification.' });
  }
});

// 6. DELETE /api/users/:id (Admin - Delete user)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting own account accidentally
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const check = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

// 7. GET /api/admin/blogs (Admin - View all blogs across all statuses)
router.get('/admin/blogs', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, u.name as author_name, u.email as author_email, u.is_verified as author_is_verified
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      blogs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching all blogs for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blogs.' });
  }
});

// 8. GET /api/admin/stats (Admin - Dashboard analytics stats)
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const totalBlogs = await db.query('SELECT COUNT(*) FROM blogs');
    const publishedBlogs = await db.query("SELECT COUNT(*) FROM blogs WHERE status = 'published'");
    const pendingRequests = await db.query("SELECT COUNT(*) FROM blog_requests WHERE status = 'pending'");
    const totalComments = await db.query('SELECT COUNT(*) FROM comments');
    const totalLikes = await db.query('SELECT COUNT(*) FROM blog_likes');

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count, 10),
        totalBlogs: parseInt(totalBlogs.rows[0].count, 10),
        publishedBlogs: parseInt(publishedBlogs.rows[0].count, 10),
        pendingRequests: parseInt(pendingRequests.rows[0].count, 10),
        totalComments: parseInt(totalComments.rows[0].count, 10),
        totalLikes: parseInt(totalLikes.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
