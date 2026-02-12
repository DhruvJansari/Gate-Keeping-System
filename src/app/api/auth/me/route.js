import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-change-me'
    );

    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.email, u.full_name, r.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND u.is_active = 1`,
      [decoded.userId]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const [permRows] = await db.execute(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?
       UNION
       SELECT p.code FROM permissions p
       JOIN user_permissions up ON p.permission_id = up.permission_id
       WHERE up.user_id = ? AND up.granted = 1`,
      [user.role_id, user.user_id]
    );

    const permissions = permRows.map((r) => r.code);

    return NextResponse.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: user.role_name,
      },
      permissions,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
