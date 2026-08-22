const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
// Supports either DATABASE_URL (Cloud like Neon, Supabase, Render) or individual credentials (Local PostgreSQL)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'bloghub',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

// Event listener for database connection
pool.on('connect', () => {
  console.log(' Connected to PostgreSQL database successfully!');
});

pool.on('error', (err) => {
  console.warn('⚠️ Idle PostgreSQL client error (will reconnect automatically):', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
