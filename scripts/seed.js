/**
 * Seed script to create default admin user
 * Run: node scripts/seed.js
 * Default: username: admin, password: Admin@123
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gatekeeping_db',
};

async function seed() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log('DB connected');

    const passwordHash = await bcrypt.hash('Admin@123', 12);

    await conn.execute(
      `INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
       VALUES (?, ?, ?, 1, 'System Administrator', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['admin', 'admin@gatekeeping.local', passwordHash]
    );

    console.log('Default admin created/updated: username=admin, password=Admin@123');
    await conn.end();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
