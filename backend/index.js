const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const initDb = require('./initDb');
const { initSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const adminRoutes = require('./routes/admin');
const socialRoutes = require('./routes/social');
const notificationRoutes = require('./routes/notifications');
const advertisementRoutes = require('./routes/advertisements');
const reelsRoutes = require('./routes/reels');
const { router: sitemapRoutes } = require('./routes/sitemap');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initSocket(server);

// Global CORS Headers & Preflight Handler for Cross-Origin Production Requests
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middlewares (allow up to 50MB for direct image uploads)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Public SEO & Sitemap Routes (Mounted at root)
app.use('/', sitemapRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/advertisements', advertisementRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api', socialRoutes);
app.use('/api', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Connection Test Route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, current_database() as database_name');
    res.json({
      success: true,
      message: 'PostgreSQL connection is working!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to PostgreSQL database.',
      error: error.message,
    });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: 'BlogHub API is running with Socket.io Real-Time Support',
    version: '1.2.0',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start Server and Initialize Database
server.listen(PORT, async () => {
  console.log(`🚀 BlogHub Backend with Socket.io running on http://localhost:${PORT}`);
  await initDb();
});
