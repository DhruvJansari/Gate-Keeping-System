import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";

// Reusing same minimal auth from other routes
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
export async function GET(request, context) {
  try {
    const { id } = await context.params;   // ✅ FIX

    const db = await getDb();
    const [rows] = await db.execute(
      `SELECT
         le.*,
         d.driver_id   AS driver_id,
         d.driver_name AS driver_name,
         d.mobile      AS driver_mobile,
         d.adhar_number AS adhar_number,
         d.licence     AS licence,
         d.licence_expiry AS licence_expiry
       FROM logistic_entries le
       LEFT JOIN drivers d ON le.driver_id = d.driver_id
       WHERE le.logistic_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update entry
export async function PATCH(request, context) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;   // ✅ MUST await

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const db = await getDb();

    const [existing] = await db.execute(
      "SELECT * FROM logistic_entries WHERE logistic_id = ?",
      [id]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const updates = [];
    const values = [];

    const allowedFields = [
      "loading_site_at", "loading_point_in_at", "loading_point_out_at",
      "unloading_site_at", "unloading_point_in_at", "unloading_point_out_at",
      "deduction", "net_amount", "rec_amount", "rec_date",
      "payment_rec_ac", "payment_rec_ac_note",
      "payment_cash", "payment_cash_note",
      "expense", "advance", "diesel_ltr", "diesel_rate",
      "unloading_wt", "deduction_2", "holtage", "start_km", "end_km",
      "status", "transporter_name", "company_notes", "final_notes", "loss_gain", "total_km",
      "gross_weight", "tare_weight", "net_weight", "rate", "amounts", "driver_id",
      "consignor_name", "consignee_name", "truck_no", "product"
    ];

    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key) && body[key] !== undefined) {
        updates.push(`${key} = ?`);

        let val = body[key];

        if (val === "" && (key.endsWith("_at") || key === "rec_date" || key.endsWith("_date"))) {
          val = null;
        }

        if (key.endsWith("_at") && val) {
          val = new Date(val).toISOString().slice(0, 19).replace("T", " ");
        }

        values.push(val ?? null);  // ✅ prevent undefined
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE logistic_entries 
       SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
       WHERE logistic_id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: "Entry updated successfully" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete entry
export async function DELETE(request, context) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Explicit block for Manager roles
    if (['Manager', 'Logistics Manager', 'Contract Manager', 'View Only Admin', 'Viewer'].includes(user.roleName)) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete" }, { status: 403 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();
    
    // Check if exists
    const [existing] = await db.execute(
      "SELECT * FROM logistic_entries WHERE logistic_id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await db.execute("DELETE FROM logistic_entries WHERE logistic_id = ?", [id]);

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
