import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
  
  // If permissions are not in the token, we might need to fetch them. 
  // For now, let's assume they might be in 'permissions' or we fetch them.
  // Ideally, we should fetch permissions from DB if not in token to be secure and up-to-date.
  const db = await getDb();
  const [rows] = await db.execute(`
    SELECT p.code 
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    WHERE rp.role_id = ?
  `, [current.roleId || current.role_id]);
  
  const perms = rows.map(r => r.code);
  return perms.includes(permissionCode) || perms.includes('*');
}

export async function GET(request) {
  try {
    const current = getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Check permission
    const canAccess = await hasPermission(current, 'manage_users');
    if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('role') || '';

    let sql = `SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.role_id, r.name AS role_name
               FROM users u
               JOIN roles r ON u.role_id = r.role_id
               WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (roleId && roleId !== 'all') {
      sql += ' AND u.role_id = ?';
      params.push(parseInt(roleId, 10));
    }

    sql += ' ORDER BY u.username';

    const [rows] = await db.execute(sql, params);

    // Fetch user_items
    const [itemRows] = await db.execute(
      `SELECT ui.user_id, i.item_id, i.item_name 
       FROM user_items ui 
       JOIN items i ON ui.item_id = i.item_id`
    );

    const usersWithItems = rows.map(user => {
      const uItems = itemRows.filter(ir => ir.user_id === user.user_id);
      return {
        ...user,
        items: uItems.map(ir => ({ item_id: ir.item_id, item_name: ir.item_name }))
      };
    });

    return NextResponse.json(usersWithItems);
  } catch (err) {
    console.error('Users fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const current = getCurrentUser(request);
    if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const canManage = await hasPermission(current, 'manage_users');
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { username, email, full_name, role_id, is_active } = body;
    let { password } = body;

    if (!username?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Username and email are required' },
        { status: 400 }
      );
    }

    if (!role_id) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password && password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const active = is_active === false || is_active === 0 ? 0 : 1;

    await db.execute(
      `INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username.trim(),
        email.trim(),
        passwordHash,
        parseInt(role_id, 10),
        full_name?.trim() || null,
        active,
      ]
    );

    const [resId] = await db.execute('SELECT LAST_INSERT_ID() AS id');
    const newUserId = resId[0]?.id;

    const itemIds = Array.isArray(body.item_ids) ? body.item_ids.filter((id) => id != null && id !== '') : [];
    if (itemIds.length > 0 && newUserId) {
      const itemPlaceholders = itemIds.map(() => '(?, ?)').join(', ');
      const itemValues = itemIds.flatMap((id) => [newUserId, parseInt(id, 10)]);
      await db.execute(
        `INSERT INTO user_items (user_id, item_id) VALUES ${itemPlaceholders}`,
        itemValues
      );
    }

    return NextResponse.json({ success: true, user_id: newUserId ?? null });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }
    console.error('User create error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
