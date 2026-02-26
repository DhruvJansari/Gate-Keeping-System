import mysql from 'mysql2/promise';

// Sanity check in production: required DB env vars must be set
if (process.env.NODE_ENV === 'production') {
  const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
  }
}

// Global config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gatekeeping_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
};

let pool = null;

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    try {
      const conn = await pool.getConnection();
      if (process.env.NODE_ENV !== 'production') {
        console.log('DB connected');
      }
      conn.release();
    } catch (err) {
      console.error('DB connection failed:', err.message);
      throw err;
    }
  }
  return pool;
}

export { dbConfig };
