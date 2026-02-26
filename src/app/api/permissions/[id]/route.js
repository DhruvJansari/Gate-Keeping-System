import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

/* ======================
   AUTH HELPERS
====================== */
function getCurrentUser(request) {
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

function requireAdmin(current) {
  return current && current.roleName === "Admin";
}

/* ======================
   GET PERMISSION
====================== */
export async function GET(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getDb();

    const [rows] = await db.execute(
      `SELECT permission_id, code, name, created_at
       FROM permissions
       WHERE permission_id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Permission fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

/* ======================
   UPDATE PERMISSION
====================== */
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { code, name } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Permission code and name are required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [result] = await db.execute(
      `UPDATE permissions 
       SET code = ?, name = ?
       WHERE permission_id = ?`,
      [code.trim(), name.trim(), Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Permission code already exists" },
        { status: 400 }
      );
    }

    console.error("Permission update error:", err);
    return NextResponse.json(
      { error: "Failed to update permission" },
      { status: 500 }
    );
  }
}

/* ======================
   DELETE PERMISSION
====================== */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getDb();

    const [result] = await db.execute(
      "DELETE FROM permissions WHERE permission_id = ?",
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Permission delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 }
    );
  }
}
