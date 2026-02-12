import mysql from 'mysql2/promise';

// Global config from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gatekeeping_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    try {
      const conn = await pool.getConnection();
      console.log('DB connected');
      conn.release();
    } catch (err) {
      console.error('DB connection failed:', err.message);
      throw err;
    }
  }
  return pool;
}

export { dbConfig };
