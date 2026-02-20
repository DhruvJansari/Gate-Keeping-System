import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/drivers - List drivers with search
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT 
        driver_id, 
        driver_name, 
        address, 
        mobile, 
        licence, 
        licence_expiry, 
        adhar_number, 
        status, 
        created_at 
      FROM drivers 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (driver_name LIKE ? OR mobile LIKE ? OR licence LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY driver_name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Drivers fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

// POST /api/drivers - Create new driver
export async function POST(request) {
  try {
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

    // Validation
    if (!driver_name?.trim()) return NextResponse.json({ error: 'Driver name is required' }, { status: 400 });
    
    if (!mobile?.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    if (!licence?.trim()) return NextResponse.json({ error: 'Licence number is required' }, { status: 400 });

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';
    const cleanDate = (d) => (d ? new Date(d) : null);

    const [result] = await db.execute(
      `INSERT INTO drivers (
        driver_name, address, mobile, licence, licence_expiry, adhar_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        driver_name.trim(),
        address?.trim() || null,
        mobile.trim(),
        licence?.trim() || null,
        cleanDate(licence_expiry),
        adhar_number?.trim() || null,
        s
      ]
    );

    return NextResponse.json({ success: true, driver_id: result.insertId });
  } catch (err) {
    console.error('Driver create error:', err);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
