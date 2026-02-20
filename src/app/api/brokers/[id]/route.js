import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
    const { id } = await params;
    const db = await getDb();
    await db.execute('DELETE FROM brokers WHERE broker_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Broker delete error:', err);
    return NextResponse.json({ error: 'Failed to delete broker' }, { status: 500 });
  }
}
