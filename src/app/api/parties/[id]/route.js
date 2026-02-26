import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/* =========================
   GET PARTY BY ID
========================= */
export async function GET(request, context) {
  try {
    const { params } = context;
    const { id } = await params; // ✅ FIX

    if (!id) {
      return NextResponse.json(
        { error: 'Party ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [rows] = await db.execute(
      `
      SELECT 
        party_id,
        party_name,
        email,
        gst_no,
        pan_no,
        address,
        city,
        contact_phone,
        status,
        created_at
      FROM parties
      WHERE party_id = ?
      `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Party fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch party', details: err.message },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE PARTY
========================= */
export async function PUT(request, context) {
  try {
    const { params } = context;
    const { id } = await params; // ✅ FIX

    if (!id) {
      return NextResponse.json(
        { error: 'Party ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      party_name,
      email,
      contact_phone,
      address,
      city,
      gst_no,
      pan_no,
      status
    } = body;

    /* ---------- Validation ---------- */
    if (!party_name || !party_name.trim()) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    /* ---------- Normalize payload ---------- */
    const payload = {
      party_name: party_name.trim(),
      email: email?.trim() ?? null,
      contact_phone: contact_phone?.trim() ?? null,
      address: address?.trim() ?? null,
      city: city?.trim() ?? null,
      gst_no: gst_no?.trim() ?? null,
      pan_no: pan_no?.trim() ?? null,
      status: status === 'Inactive' ? 'Inactive' : 'Active'
    };

    const db = await getDb();

    const [result] = await db.execute(
      `
      UPDATE parties
      SET
        party_name = ?,
        email = ?,
        contact_phone = ?,
        address = ?,
        city = ?,
        gst_no = ?,
        pan_no = ?,
        status = ?
      WHERE party_id = ?
      `,
      [
        payload.party_name,
        payload.email,
        payload.contact_phone,
        payload.address,
        payload.city,
        payload.gst_no,
        payload.pan_no,
        payload.status,
        Number(id)
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Party update error:', err);
    return NextResponse.json(
      {
        error: 'Failed to update party',
        details: err.message
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE PARTY
========================= */
export async function DELETE(request, context) {
  try {
    const { params } = context;
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Party ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [result] = await db.execute(
      `
      UPDATE parties
      SET status = 'Inactive'
      WHERE party_id = ?
      `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Party deactivated successfully'
    });
  } catch (err) {
    console.error('Party delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete party', details: err.message },
      { status: 500 }
    );
  }
}

