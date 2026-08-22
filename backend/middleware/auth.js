const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'bloghub_super_secret_jwt_key_2026';

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token is required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch latest user data from DB (in case role or is_verified changed)
    const result = await db.query(
      'SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET,
};
