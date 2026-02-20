import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const [rows] = await db.execute('SELECT * FROM vehicles WHERE vehicle_id = ?', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Vehicle fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    if (!vehicle_number?.trim()) return NextResponse.json({ error: 'Vehicle number is required' }, { status: 400 });
    if (!vehicle_type?.trim()) return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 });
    if (!owner_name?.trim()) return NextResponse.json({ error: 'Owner name is required' }, { status: 400 });

    const db = await getDb();

    // Check unique if changing vehicle_number
    const [existing] = await db.execute(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_number = ? AND vehicle_id != ?',
      [vehicle_number.trim(), id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Vehicle number already exists' }, { status: 400 });
    }

    const s = status === 'Inactive' ? 'Inactive' : 'Active';
    const cleanDate = (d) => (d ? new Date(d) : null);

    await db.execute(
      `UPDATE vehicles SET
        vehicle_number = ?, vehicle_type = ?, owner_name = ?, rc_number = ?, chassis_number = ?, 
        insurance_expiry = ?, fitness_expiry = ?, permit_expiry = ?, puc_expiry = ?, status = ?
      WHERE vehicle_id = ?`,
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
        s,
        id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vehicle update error:', err);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // Optional: Check if used in other tables (e.g. transactions) before delete
    // For now, hard delete as per requirement
    await db.execute('DELETE FROM vehicles WHERE vehicle_id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Vehicle delete error:', err);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
