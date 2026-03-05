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
    const [rows] = await db.execute('SELECT * FROM drivers WHERE driver_id = ?', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Driver fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      driver_name,
      address,
      mobile,
      licence,
      licence_expiry,
      adhar_number,
      status
    } = body;

    if (!driver_name?.trim()) return NextResponse.json({ error: 'Driver name is required' }, { status: 400 });
    if (!mobile?.trim()) return NextResponse.json({ error: 'Mobile is required' }, { status: 400 });

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';
    const cleanDate = (d) => (d ? new Date(d) : null);

    await db.execute(
      `UPDATE drivers SET
        driver_name = ?, address = ?, mobile = ?, licence = ?, licence_expiry = ?, adhar_number = ?, status = ?
      WHERE driver_id = ?`,
      [
        driver_name.trim(),
        address?.trim() || null,
        mobile.trim(),
        licence?.trim() || null,
        cleanDate(licence_expiry),
        adhar_number?.trim() || null,
        s,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Driver update error:', err);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
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
    await db.execute('DELETE FROM drivers WHERE driver_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Driver delete error:', err);
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
  }
}
