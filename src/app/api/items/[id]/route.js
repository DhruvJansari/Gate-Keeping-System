import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";

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

/* =======================
   GET SINGLE ITEM
======================= */
export async function GET(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params
    const db = await getDb();

    const [rows] = await db.execute(
      "SELECT item_id, item_name, description, status, created_at FROM items WHERE item_id = ?",
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Item fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

/* =======================
   UPDATE ITEM
======================= */
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params

    const body = await request.json();
    const { item_name, description, status } = body;

    if (!item_name?.trim()) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const s = status === "Inactive" ? "Inactive" : "Active";

    const [result] = await db.execute(
      `UPDATE items 
       SET item_name = ?, description = ?, status = ?
       WHERE item_id = ?`,
      [item_name.trim(), description?.trim() || null, s, Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Item update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =======================
   DELETE ITEM
======================= */
export async function DELETE(request, { params }) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (['Manager', 'Logistics Manager', 'Contract Manager', 'View Only Admin', 'Viewer'].includes(user.roleName)) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDb();

    const [result] = await db.execute(
      "UPDATE items SET status = 'Inactive' WHERE item_id = ?",
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Item delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

