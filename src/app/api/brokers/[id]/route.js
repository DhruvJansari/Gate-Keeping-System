import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from "jsonwebtoken";

function getUser(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    return jwt.verify(token, secret || 'dev-only-fallback-secret');
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const [rows] = await db.execute('SELECT * FROM brokers WHERE broker_id = ?', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Broker fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch broker' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      broker_name,
      broker_address,
      mobile,
      email,
      status
    } = body;

    if (!broker_name?.trim()) return NextResponse.json({ error: 'Broker name is required' }, { status: 400 });

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';

    await db.execute(
      `UPDATE brokers SET
        broker_name = ?, broker_address = ?, mobile = ?, email = ?, status = ?
      WHERE broker_id = ?`,
      [
        broker_name.trim(),
        broker_address?.trim() || null,
        mobile?.trim() || null,
        email?.trim() || null,
        s,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Broker update error:', err);
    return NextResponse.json({ error: 'Failed to update broker' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (['Manager', 'Logistics Manager', 'Contract Manager', 'View Only Admin', 'Viewer'].includes(user.roleName)) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDb();
    await db.execute('DELETE FROM brokers WHERE broker_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Broker delete error:', err);
    return NextResponse.json({ error: 'Failed to delete broker' }, { status: 500 });
  }
}
