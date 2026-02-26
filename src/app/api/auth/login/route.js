import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier?.trim() || !password) {
      return NextResponse.json(
        { error: 'Username or email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.full_name, u.is_active,
              r.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE (u.username = ? OR u.email = ?) AND u.is_active = 1
       LIMIT 1`,
      [identifier.trim(), identifier.trim()]
    );

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is not set');
      }
    }
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        roleId: user.role_id,
        roleName: user.role_name,
      },
      jwtSecret || 'dev-only-fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const response = NextResponse.json({
      token,
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

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
