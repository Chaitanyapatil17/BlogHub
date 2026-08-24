/**
 * Telegram Notification System REST API Routes
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const telegramService = require('../services/telegramService');

const adminAuth = [authenticateToken, requireAdmin];

// Standard available categories on BlogHub
const ALL_CATEGORIES = [
  'All',
  'Technology',
  'AI & Code',
  'World News',
  'Sports',
  'Business',
  'Science',
  'Lifestyle',
  'Food & Cooking',
  'Entertainment'
];

/**
 * 1. GET /api/telegram/status (Authenticated User)
 * Returns connection status, bot info, deep link, and category preferences
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const botInfo = await telegramService.getBotInfo();
    const botUsername = botInfo?.username || 'BlogHubNewsBot';

    // 1. Get or generate user's unique linking token
    const userRes = await db.query(
      `SELECT telegram_auth_token FROM users WHERE id = $1`,
      [userId]
    );

    let authToken = userRes.rows.length > 0 ? userRes.rows[0].telegram_auth_token : null;
    if (!authToken) {
      authToken = `user_${userId}_${crypto.randomBytes(8).toString('hex')}`;
      await db.query(
        `UPDATE users SET telegram_auth_token = $1 WHERE id = $2`,
        [authToken, userId]
      );
    }

    // 2. Find existing subscriber record
    const subRes = await db.query(
      `SELECT * FROM telegram_subscribers WHERE user_id = $1 AND chat_id NOT LIKE 'pending_%'`,
      [userId]
    );

    const subscriber = subRes.rows.length > 0 ? subRes.rows[0] : null;
    const isConnected = !!(subscriber && subscriber.chat_id);
    const deepLink = `https://t.me/${botUsername}?start=${authToken}`;

    res.json({
      success: true,
      bot: {
        username: botUsername,
        first_name: botInfo?.first_name || 'BlogHub Notifications',
        is_configured: !!telegramService.getBotToken(),
      },
      connection: {
        is_connected: isConnected,
        chat_id: isConnected ? subscriber.chat_id : null,
        username: subscriber?.username || null,
        first_name: subscriber?.first_name || null,
        is_active: subscriber?.is_active ?? true,
        categories: subscriber?.categories || ['All'],
        available_categories: ALL_CATEGORIES,
        deep_link: deepLink,
        linked_at: subscriber?.updated_at || subscriber?.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching Telegram status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Telegram status.' });
  }
});

/**
 * 2. POST /api/telegram/generate-link (Authenticated User)
 * Refreshes auth token and returns fresh Telegram deep-link
 */
router.post('/generate-link', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const botInfo = await telegramService.getBotInfo();
    const botUsername = botInfo?.username || 'BlogHubNewsBot';

    const authToken = `user_${userId}_${crypto.randomBytes(8).toString('hex')}`;

    await db.query(
      `UPDATE users SET telegram_auth_token = $1 WHERE id = $2`,
      [authToken, userId]
    );

    const deepLink = `https://t.me/${botUsername}?start=${authToken}`;

    res.json({
      success: true,
      deep_link: deepLink,
      auth_token: authToken,
      bot_username: botUsername,
    });
  } catch (error) {
    console.error('Error generating Telegram link:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Telegram deep link.' });
  }
});

/**
 * 3. PUT /api/telegram/preferences (Authenticated User)
 * Updates subscribed categories and active status toggle
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { categories, is_active } = req.body;

    let targetCategories = ['All'];
    if (Array.isArray(categories) && categories.length > 0) {
      targetCategories = categories.filter((c) => ALL_CATEGORIES.includes(c));
      if (targetCategories.length === 0) targetCategories = ['All'];
    }

    const isActiveBool = typeof is_active === 'boolean' ? is_active : true;

    const result = await db.query(
      `UPDATE telegram_subscribers
       SET categories = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING *`,
      [targetCategories, isActiveBool, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Telegram subscriber profile not found. Please connect your bot first.' });
    }

    res.json({
      success: true,
      message: 'Telegram notification preferences updated successfully!',
      preferences: {
        categories: result.rows[0].categories,
        is_active: result.rows[0].is_active,
      },
    });
  } catch (error) {
    console.error('Error updating Telegram preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
});

/**
 * 4. DELETE /api/telegram/unlink (Authenticated User)
 * Unlinks Telegram chat from user account
 */
router.delete('/unlink', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `DELETE FROM telegram_subscribers WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Telegram account unlinked successfully. You will no longer receive alerts.',
    });
  } catch (error) {
    console.error('Error unlinking Telegram:', error);
    res.status(500).json({ success: false, message: 'Failed to unlink Telegram.' });
  }
});

/**
 * 5. GET /api/telegram/logs (Admin Only)
 * View Telegram notification dispatch logs and subscriber statistics
 */
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const logsRes = await db.query(
      `SELECT tl.*, b.title as blog_title, b.slug as blog_slug
       FROM telegram_notification_logs tl
       LEFT JOIN blogs b ON tl.blog_id = b.id
       ORDER BY tl.created_at DESC
       LIMIT 40`
    );

    const statsRes = await db.query(
      `SELECT
         COUNT(*) as total_subscribers,
         COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
         COUNT(*) FILTER (WHERE user_id IS NOT NULL) as registered_subscribers
       FROM telegram_subscribers
       WHERE chat_id NOT LIKE 'pending_%'`
    );

    res.json({
      success: true,
      logs: logsRes.rows,
      stats: statsRes.rows[0] || { total_subscribers: 0, active_subscribers: 0, registered_subscribers: 0 },
    });
  } catch (error) {
    console.error('Error fetching Telegram logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Telegram logs.' });
  }
});

/**
 * 6. POST /api/telegram/test-broadcast (Admin Only)
 * Broadcast a test message to all active Telegram subscribers
 */
router.post('/test-broadcast', adminAuth, async (req, res) => {
  try {
    const { message_text, category } = req.body;
    const targetCat = category || 'Technology';

    const testBlog = {
      id: null,
      title: 'BlogHub Editorial Telemetry: System Broadcast',
      category: targetCat,
      content: message_text || 'This is a test notification from the BlogHub Telegram Notification System. All delivery channels are operating at peak efficiency.',
      author_name: req.user.name || 'Editorial Bureau',
      slug: '',
    };

    const result = await telegramService.notifySubscribersForBlog(testBlog);

    res.json({
      success: true,
      message: `Test broadcast completed: ${result.sent || 0} messages delivered to subscribers.`,
      result,
    });
  } catch (error) {
    console.error('Error sending test broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to send test broadcast: ' + error.message });
  }
});

/**
 * 7. POST /api/telegram/webhook (Public / Webhook Endpoint)
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update && update.message) {
      await telegramService.handleTelegramMessage(update.message);
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('ERROR'); // Telegram expects 200 to not retry indefinitely
  }
});

module.exports = router;
