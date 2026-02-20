import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/vehicles - List vehicles with search
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT 
        vehicle_id, 
        vehicle_number, 
        vehicle_type, 
        owner_name, 
        rc_number, 
        chassis_number, 
        insurance_expiry, 
        fitness_expiry, 
        permit_expiry, 
        puc_expiry, 
        status, 
        created_at 
      FROM vehicles 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (vehicle_number LIKE ? OR owner_name LIKE ? OR vehicle_type LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vehicle_number';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Vehicles fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

// POST /api/vehicles - Create new vehicle
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      vehicle_number,
      vehicle_type,
      owner_name,
      rc_number,
      chassis_number,
      insurance_expiry,
      fitness_expiry,
      permit_expiry,
      puc_expiry,
      status
    } = body;

    // Validation
    if (!vehicle_number?.trim()) return NextResponse.json({ error: 'Vehicle number is required' }, { status: 400 });
    if (!vehicle_type?.trim()) return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 });
    if (!owner_name?.trim()) return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });

    const db = await getDb();

    // Check unique vehicle_number
    const [existing] = await db.execute('SELECT vehicle_id FROM vehicles WHERE vehicle_number = ?', [vehicle_number.trim()]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Vehicle number already exists' }, { status: 400 });
    }

    const s = status === 'Inactive' ? 'Inactive' : 'Active';
    const cleanDate = (d) => (d ? new Date(d) : null);

    const [result] = await db.execute(
      `INSERT INTO vehicles (
        vehicle_number, vehicle_type, owner_name, rc_number, chassis_number, 
        insurance_expiry, fitness_expiry, permit_expiry, puc_expiry, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle_number.trim(),
        vehicle_type.trim(),
        owner_name.trim(),
        rc_number?.trim() || null,
        chassis_number?.trim() || null,
        cleanDate(insurance_expiry),
        cleanDate(fitness_expiry),
        cleanDate(permit_expiry),
        cleanDate(puc_expiry),
        s
      ]
    );

    return NextResponse.json({ success: true, vehicle_id: result.insertId });
  } catch (err) {
    console.error('Vehicle create error:', err);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
