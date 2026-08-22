const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { broadcastAdvertisementUpdated } = require('../socket');

// 1. GET /api/advertisements/active (Public - Get active advertisements for Explore page)
router.get('/active', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM advertisements 
       WHERE is_active = true 
       ORDER BY updated_at DESC 
       LIMIT 2`
    );

    res.json({
      success: true,
      advertisement: result.rows[0] || null,
      advertisements: result.rows,
    });
  } catch (error) {
    console.error('Error fetching active advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active advertisement.' });
  }
});

// 2. POST /api/advertisements/:id/click (Public - Record ad click)
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE advertisements 
       SET click_count = COALESCE(click_count, 0) + 1 
       WHERE id = $1`,
      [id]
    );
    res.json({ success: true, message: 'Click recorded.' });
  } catch (error) {
    console.error('Error recording ad click:', error);
    res.status(500).json({ success: false, message: 'Failed to record click.' });
  }
});

// 3. GET /api/admin/advertisements (Admin - List all advertisements)
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM advertisements ORDER BY created_at DESC`
    );
    res.json({
      success: true,
      advertisements: result.rows,
    });
  } catch (error) {
    console.error('Error fetching all advertisements:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advertisements.' });
  }
});

// 4. POST /api/admin/advertisements (Admin - Create new advertisement with image/video/graphic)
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      media_type,
      media_url,
      badge_text,
      button_text,
      target_url,
      features,
      is_active,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Advertisement title is required.' });
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : '[]';

    // If this ad is set to active, optionally deactivate other ads if single active mode
    if (is_active) {
      await db.query('UPDATE advertisements SET is_active = false');
    }

    const result = await db.query(
      `INSERT INTO advertisements (
        title, description, media_type, media_url, badge_text, button_text, target_url, features, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        title.trim(),
        description ? description.trim() : '',
        media_type || 'image',
        media_url ? media_url.trim() : null,
        badge_text ? badge_text.trim() : 'Sponsored',
        button_text ? button_text.trim() : 'Learn More',
        target_url ? target_url.trim() : '/register',
        featuresJson,
        is_active !== undefined ? is_active : true,
      ]
    );

    const newAd = result.rows[0];
    broadcastAdvertisementUpdated(newAd);

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully!',
      advertisement: newAd,
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to create advertisement.' });
  }
});

// 5. PUT /api/admin/advertisements/:id (Admin - Update advertisement)
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      media_type,
      media_url,
      badge_text,
      button_text,
      target_url,
      features,
      is_active,
    } = req.body;

    // Check existence
    const check = await db.query('SELECT * FROM advertisements WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }

    // If activating, deactivate others
    if (is_active) {
      await db.query('UPDATE advertisements SET is_active = false WHERE id != $1', [id]);
    }

    const featuresJson = Array.isArray(features) ? JSON.stringify(features) : check.rows[0].features;

    const result = await db.query(
      `UPDATE advertisements
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           media_type = COALESCE($3, media_type),
           media_url = $4,
           badge_text = COALESCE($5, badge_text),
           button_text = COALESCE($6, button_text),
           target_url = COALESCE($7, target_url),
           features = COALESCE($8, features),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        title ? title.trim() : null,
        description !== undefined ? description.trim() : null,
        media_type || null,
        media_url !== undefined ? (media_url ? media_url.trim() : null) : check.rows[0].media_url,
        badge_text ? badge_text.trim() : null,
        button_text ? button_text.trim() : null,
        target_url ? target_url.trim() : null,
        featuresJson,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );

    const updatedAd = result.rows[0];
    broadcastAdvertisementUpdated(updatedAd);

    res.json({
      success: true,
      message: 'Advertisement updated successfully!',
      advertisement: updatedAd,
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to update advertisement.' });
  }
});

// 6. PUT /api/admin/advertisements/:id/toggle (Admin - Toggle active state)
router.put('/admin/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT is_active FROM advertisements WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }

    const currentStatus = check.rows[0].is_active;
    const nextStatus = !currentStatus;

    if (nextStatus) {
      await db.query('UPDATE advertisements SET is_active = false');
    }

    const result = await db.query(
      `UPDATE advertisements 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [nextStatus, id]
    );

    const toggledAd = result.rows[0];
    broadcastAdvertisementUpdated(toggledAd);

    res.json({
      success: true,
      message: `Advertisement is now ${nextStatus ? 'Active' : 'Inactive'}.`,
      advertisement: toggledAd,
    });
  } catch (error) {
    console.error('Error toggling advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle advertisement status.' });
  }
});

// 7. DELETE /api/admin/advertisements/:id (Admin - Delete advertisement)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT id FROM advertisements WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }

    await db.query('DELETE FROM advertisements WHERE id = $1', [id]);

    broadcastAdvertisementUpdated(null);

    res.json({
      success: true,
      message: 'Advertisement deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ success: false, message: 'Failed to delete advertisement.' });
  }
});

module.exports = router;
