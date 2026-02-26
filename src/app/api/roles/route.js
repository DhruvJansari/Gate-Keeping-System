import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

function getCurrentUser(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    return jwt.verify(token, secret || 'dev-only-fallback-secret');
  } catch {
    return null;
  }
}

async function hasPermission(current, permissionCode) {
  if (!current) return false;
  if (current.roleName === 'Admin') return true;
  
  const db = await getDb();
  const [rows] = await db.execute(`
    SELECT p.code 
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    WHERE rp.role_id = ?
  `, [current.roleId]);
  
  const perms = rows.map(r => r.code);
  return perms.includes(permissionCode) || perms.includes('*');
}

// Public GET for dropdowns (e.g. login, user form); no auth required
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const withPermissions = searchParams.get('withPermissions') === 'true';
    const current = getCurrentUser(request);

    // If asking for list with counts (admin panel), require auth
    if (withPermissions) {
      if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const canAccess = await hasPermission(current, 'manage_roles');
      if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `SELECT r.role_id, r.name, r.description, r.created_at`;
    if (withPermissions) {
      sql += `, (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.role_id) AS permission_count`;
    }
    sql += ` FROM roles r WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }
    sql += ' ORDER BY r.name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Roles fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const current = getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const canManage = await hasPermission(current, 'manage_roles');
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, description, permission_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const db = await getDb();
    const [result] = await db.execute(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name.trim(), description?.trim() || null]
    );
    const roleId = result.insertId;

    const ids = Array.isArray(permission_ids) ? permission_ids.filter((id) => id != null && id !== '') : [];
    if (ids.length > 0) {
      const placeholders = ids.map(() => '(?, ?)').join(', ');
      const values = ids.flatMap((id) => [roleId, parseInt(id, 10)]);
      await db.execute(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      );
    }

    return NextResponse.json({ success: true, role_id: roleId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
    }
    console.error('Role create error:', err);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
