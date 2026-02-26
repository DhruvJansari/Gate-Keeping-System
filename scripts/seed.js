/**
 * Seed script to create default system baseline: Permissions, Roles, and Base Users
 * Run: node --env-file=.env.local scripts/seed.js
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

const permissions = [
  { id: 1, code: 'create_transactions', name: 'Create transactions' },
  { id: 2, code: 'edit_transactions', name: 'Edit/delete transactions' },
  { id: 3, code: 'weighbridge_access', name: 'Access weighbridge modules' },
  { id: 4, code: 'view_reports', name: 'View/export reports' },
  { id: 5, code: 'manage_users', name: 'Create users and assign roles' },
  { id: 6, code: 'manage_masters', name: 'Manage party, item, transporter masters' },
  { id: 7, code: 'confirm_stages', name: 'Confirm transaction stages' },
  { id: 8, code: 'add_weight_entries', name: 'Add weighbridge weight entries' },
  { id: 10, code: 'view_transactions', name: 'View transaction details' },
  { id: 12, code: 'view_masters', name: 'View master data' },
  { id: 14, code: 'export_data', name: 'Export data to Excel/PDF' },
  { id: 16, code: 'manage_roles', name: 'Manage roles and permissions' },
  { id: 21, code: 'delete_masters', name: 'Delete master data (items, parties, transporters)' },
  { id: 22, code: 'view_logistic_entry', name: 'View assigned logistic entry' },
  { id: 23, code: 'confirm_logistic_stages', name: 'Confirm logistic stages' },
  { id: 24, code: 'manage_logistics', name: 'Full access to logistic entries and related masters' },
  { id: 25, code: 'manage_contracts', name: 'Full access to contracts and related masters' },
];

const roles = [
  { id: 1, name: 'Admin', description: 'Full system control' },
  { id: 2, name: 'Gatekeeper', description: 'Entry & registration (Step-1)' },
  { id: 3, name: 'Weighbridge', description: 'Weighing & clearance (Step-2)' },
  { id: 4, name: 'Yard', description: 'Internal movement (Step-3)' },
  { id: 5, name: 'Viewer', description: 'View and audit only' },
  { id: 6, name: 'SuperAdmin', description: 'View only access to all administrative modules' },
  { id: 7, name: 'DHRUV', description: 'New Role' },
  { id: 8, name: 'Driver', description: 'Vehicle Driver for verifying logistic stages' },
  { id: 10, name: 'Logistics Manager', description: 'Manages logistics entries, vehicles, and items' },
  { id: 11, name: 'Contract Manager', description: 'Manages contracts, parties, brokers, and items' },
  { id: 13, name: 'View Only Admin', description: 'View only access to all administrative modules' },
];

const rolePermissions = [
  { role_id: 1, permission_id: 1 },
  { role_id: 2, permission_id: 1 },
  { role_id: 6, permission_id: 1 },
  { role_id: 7, permission_id: 1 },
  { role_id: 1, permission_id: 2 },
  { role_id: 2, permission_id: 2 },
  { role_id: 6, permission_id: 2 },
  { role_id: 7, permission_id: 2 },
  { role_id: 1, permission_id: 3 },
  { role_id: 3, permission_id: 3 },
  { role_id: 6, permission_id: 3 },
  { role_id: 7, permission_id: 3 },
  { role_id: 1, permission_id: 4 },
  { role_id: 2, permission_id: 4 },
  { role_id: 3, permission_id: 4 },
  { role_id: 4, permission_id: 4 },
  { role_id: 5, permission_id: 4 },
  { role_id: 6, permission_id: 4 },
  { role_id: 7, permission_id: 4 },
  { role_id: 10, permission_id: 4 },
  { role_id: 11, permission_id: 4 },
  { role_id: 1, permission_id: 5 },
  { role_id: 6, permission_id: 5 },
  { role_id: 7, permission_id: 5 },
  { role_id: 1, permission_id: 6 },
  { role_id: 2, permission_id: 6 },
  { role_id: 6, permission_id: 6 },
  { role_id: 7, permission_id: 6 },
  { role_id: 10, permission_id: 6 },
  { role_id: 11, permission_id: 6 },
  { role_id: 1, permission_id: 7 },
  { role_id: 2, permission_id: 7 },
  { role_id: 3, permission_id: 7 },
  { role_id: 4, permission_id: 7 },
  { role_id: 6, permission_id: 7 },
  { role_id: 7, permission_id: 7 },
  { role_id: 1, permission_id: 8 },
  { role_id: 3, permission_id: 8 },
  { role_id: 6, permission_id: 8 },
  { role_id: 7, permission_id: 8 },
  { role_id: 1, permission_id: 10 },
  { role_id: 2, permission_id: 10 },
  { role_id: 3, permission_id: 10 },
  { role_id: 4, permission_id: 10 },
  { role_id: 5, permission_id: 10 },
  { role_id: 6, permission_id: 10 },
  { role_id: 7, permission_id: 10 },
  { role_id: 13, permission_id: 10 },
  { role_id: 1, permission_id: 12 },
  { role_id: 2, permission_id: 12 },
  { role_id: 3, permission_id: 12 },
  { role_id: 4, permission_id: 12 },
  { role_id: 5, permission_id: 12 },
  { role_id: 6, permission_id: 12 },
  { role_id: 7, permission_id: 12 },
  { role_id: 10, permission_id: 12 },
  { role_id: 11, permission_id: 12 },
  { role_id: 13, permission_id: 12 },
  { role_id: 1, permission_id: 14 },
  { role_id: 2, permission_id: 14 },
  { role_id: 6, permission_id: 14 },
  { role_id: 7, permission_id: 14 },
  { role_id: 11, permission_id: 14 },
  { role_id: 13, permission_id: 14 },
  { role_id: 1, permission_id: 16 },
  { role_id: 6, permission_id: 16 },
  { role_id: 7, permission_id: 16 },
  { role_id: 1, permission_id: 21 },
  { role_id: 7, permission_id: 21 },
  { role_id: 8, permission_id: 22 },
  { role_id: 8, permission_id: 23 },
  { role_id: 10, permission_id: 24 },
  { role_id: 11, permission_id: 25 },
];

async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('DB connected');

    // 0. Disable foreign key checks to allow clearing tables and prevent sequence violations
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Clear old data precisely
    console.log('Clearing old role/permission data...');
    await conn.execute('TRUNCATE TABLE role_permissions');
    await conn.execute('DELETE FROM roles');
    await conn.execute('DELETE FROM permissions');
    
    // Enable foreign key checks back
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 1. Seed Permissions
    console.log('Seeding Permissions...');
    for (const p of permissions) {
      await conn.execute(
        `INSERT IGNORE INTO permissions (permission_id, code, name) VALUES (?, ?, ?)`,
        [p.id, p.code, p.name]
      );
    }

    // 2. Seed Roles
    console.log('Seeding Roles...');
    for (const r of roles) {
      await conn.execute(
        `INSERT INTO roles (role_id, name, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [r.id, r.name, r.description]
      );
    }

    // 3. Seed Role Permissions
    console.log('Seeding Role Permissions...');
    for (const rp of rolePermissions) {
      await conn.execute(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [rp.role_id, rp.permission_id]
      );
    }

    // 4. Seed Base Users
    console.log('Seeding Users...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    await conn.execute(
      `INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
       VALUES (?, ?, ?, 1, 'System Administrator', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role_id = 1`,
      ['admin', 'admin@gatekeeping.local', adminPasswordHash]
    );

    const viewAdminPasswordHash = await bcrypt.hash('ViewAdmin@123', 12);
    await conn.execute(
      `INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
       VALUES (?, ?, ?, 13, 'View-Only Admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role_id = 13`,
      ['view_admin', 'viewadmin@gatekeeping.local', viewAdminPasswordHash]
    );

    console.log('Default admin created/updated: username=admin, password=Admin@123');
    console.log('Default view admin created/updated: username=view_admin, password=ViewAdmin@123');
    
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

seed();
