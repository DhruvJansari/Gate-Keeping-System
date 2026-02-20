import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/brokers - List brokers with search
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT 
        broker_id, 
        broker_name, 
        broker_address, 
        mobile, 
        email, 
        status, 
        gst_no,
        pan_no,
        created_at 
      FROM brokers 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (broker_name LIKE ? OR mobile LIKE ? OR email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY broker_name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Brokers fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch brokers' }, { status: 500 });
  }
}

// POST /api/brokers - Create new broker
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      broker_name,
      broker_address,
      mobile,
      email,
      status
    } = body;

    // Validation
    if (!broker_name?.trim()) return NextResponse.json({ error: 'Broker name is required' }, { status: 400 });

    if (mobile?.trim() && !/^[6-9]\d{9}$/.test(mobile.trim())) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    if (body.pan_no?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(body.pan_no.trim())) {
        return NextResponse.json({ error: 'Invalid PAN format' }, { status: 400 });
    }

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';

    const [result] = await db.execute(
      `INSERT INTO brokers (
        broker_name, broker_address, mobile, email, status, gst_no, pan_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        broker_name.trim(),
        broker_address?.trim() || null,
        mobile?.trim() || null,
        email?.trim() || null,
        s,
        body.gst_no?.trim() || null,
        body.pan_no?.trim() || null
      ]
    );

    return NextResponse.json({ success: true, broker_id: result.insertId });
  } catch (err) {
    console.error('Broker create error:', err);
    return NextResponse.json({ error: 'Failed to create broker' }, { status: 500 });
  }
}
