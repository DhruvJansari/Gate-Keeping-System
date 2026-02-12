import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `SELECT transporter_id, name, contact_person, contact_phone, email, service_type, notes, status, created_at 
               FROM transporters WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR contact_phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Transporters fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch transporters' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contact_person, contact_phone, email, service_type, notes, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Transporter name is required' }, { status: 400 });
    }

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';

    const [result] = await db.execute(
      `INSERT INTO transporters (name, contact_person, contact_phone, email, service_type, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        contact_person?.trim() || null,
        contact_phone?.trim() || null,
        email?.trim() || null,
        service_type?.trim() || null,
        notes?.trim() || null,
        s,
      ]
    );

    return NextResponse.json({ success: true, transporter_id: result.insertId });
  } catch (err) {
    console.error('Transporter create error:', err);
    return NextResponse.json({ error: 'Failed to create transporter' }, { status: 500 });
  }
}
