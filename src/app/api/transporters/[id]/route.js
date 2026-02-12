import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/* =======================
   GET SINGLE TRANSPORTER
======================= */
export async function GET(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params
    const db = await getDb();

    const [rows] = await db.execute(
      `SELECT transporter_id, name, contact_person, contact_phone, email,
              service_type, notes, status, created_at
       FROM transporters
       WHERE transporter_id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Transporter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Transporter fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transporter" },
      { status: 500 }
    );
  }
}

/* =======================
   UPDATE TRANSPORTER
======================= */
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params

    const body = await request.json();
    const {
      name,
      contact_person,
      contact_phone,
      email,
      service_type,
      notes,
      status,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Transporter name is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const s = status === "Inactive" ? "Inactive" : "Active";

    const [result] = await db.execute(
      `UPDATE transporters 
       SET name = ?, contact_person = ?, contact_phone = ?, email = ?,
           service_type = ?, notes = ?, status = ?
       WHERE transporter_id = ?`,
      [
        name.trim(),
        contact_person?.trim() || null,
        contact_phone?.trim() || null,
        email?.trim() || null,
        service_type?.trim() || null,
        notes?.trim() || null,
        s,
        Number(id),
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Transporter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Transporter update error:", err);
    return NextResponse.json(
      { error: "Failed to update transporter" },
      { status: 500 }
    );
  }
}

/* =======================
   DELETE TRANSPORTER
======================= */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Transporter ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [result] = await db.execute(
      `
      UPDATE transporters
      SET status = 'Inactive'
      WHERE transporter_id = ?
      `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Transporter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transporter deactivated successfully",
    });
  } catch (err) {
    console.error("Transporter delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete transporter", details: err.message },
      { status: 500 }
    );
  }
}
