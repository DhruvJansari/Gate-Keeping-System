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

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-change-me"
    );
  } catch {
    return null;
  }
}

function requireAdmin(current) {
  return current && current.roleName === "Admin";
}

/* ======================
   GET ROLE
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
      `SELECT role_id, name, description, created_at
       FROM roles
       WHERE role_id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const role = rows[0];

    const [permRows] = await db.execute(
      `SELECT permission_id
       FROM role_permissions
       WHERE role_id = ?`,
      [Number(id)]
    );

    role.permission_ids = permRows.map((r) => r.permission_id);

    return NextResponse.json(role);
  } catch (err) {
    console.error("Role fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

/* ======================
   UPDATE ROLE
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
    const { name, description, permission_ids } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [result] = await db.execute(
      `UPDATE roles
       SET name = ?, description = ?
       WHERE role_id = ?`,
      [name.trim(), description?.trim() || null, Number(id)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    /* ---- Reset permissions ---- */
    await db.execute("DELETE FROM role_permissions WHERE role_id = ?", [
      Number(id),
    ]);

    const ids = Array.isArray(permission_ids)
      ? permission_ids.filter((p) => p !== null && p !== "")
      : [];

    if (ids.length > 0) {
      const placeholders = ids.map(() => "(?, ?)").join(", ");
      const values = ids.flatMap((pid) => [Number(id), Number(pid)]);

      await db.execute(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ${placeholders}`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 400 }
      );
    }

    console.error("Role update error:", err);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

/* ======================
   DELETE ROLE
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

    const [userCount] = await db.execute(
      `SELECT COUNT(*) AS cnt
       FROM users
       WHERE role_id = ?`,
      [Number(id)]
    );

    if (userCount[0]?.cnt > 0) {
      return NextResponse.json(
        { error: "Cannot delete role: users are assigned to this role" },
        { status: 400 }
      );
    }

    const [result] = await db.execute("DELETE FROM roles WHERE role_id = ?", [
      Number(id),
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Role delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
