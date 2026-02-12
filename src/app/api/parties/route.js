import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `SELECT party_id, party_name, email, gst_no, pan_no, address, contact_phone, status, created_at 
               FROM parties WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ' AND (party_name LIKE ? OR email LIKE ? OR contact_phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY party_name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Parties fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { party_name, email, contact_phone, address, gst_no, pan_no, status } = body;

    if (!party_name?.trim()) {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';

    const [result] = await db.execute(
      `INSERT INTO parties (party_name, email, contact_phone, address, gst_no, pan_no, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        party_name.trim(),
        email?.trim() || null,
        contact_phone?.trim() || null,
        address?.trim() || null,
        gst_no?.trim() || null,
        pan_no?.trim() || null,
        s,
      ]
    );

    return NextResponse.json({ success: true, party_id: result.insertId });
  } catch (err) {
    console.error('Party create error:', err);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
}
