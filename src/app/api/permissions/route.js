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

export async function GET(request) {
  try {
    const current = getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // View permissions is generally allowed if you can manage roles
    const canAccess = await hasPermission(current, 'manage_roles');
    if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = 'SELECT permission_id, code, name, created_at FROM permissions WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (code LIKE ? OR name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }
    sql += ' ORDER BY code';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Permissions fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const current = getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const canManage = await hasPermission(current, 'manage_roles');
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { code, name } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: 'Permission code and name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [result] = await db.execute(
      'INSERT INTO permissions (code, name) VALUES (?, ?)',
      [code.trim(), name.trim()]
    );

    return NextResponse.json({ success: true, permission_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Permission code already exists' }, { status: 400 });
    }
    console.error('Permission create error:', err);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}
