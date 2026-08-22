const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Apply auth to all notification routes
router.use(authenticateToken);

// 1. GET /api/notifications (Fetch current user's notifications & unread count)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );

    const unreadRes = await db.query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(unreadRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// 2. PUT /api/notifications/:id/read (Mark a single notification as read)
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// 3. PUT /api/notifications/read-all (Mark all user's notifications as read)
router.put('/read-all', async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

// 4. DELETE /api/notifications/:id (Delete notification)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

module.exports = router;
