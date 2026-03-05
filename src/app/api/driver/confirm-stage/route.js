import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "../../../../lib/server-auth";

export async function PATCH(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entry_id, stage_key } = body;

    if (!entry_id || !stage_key) {
        return NextResponse.json({ error: "Missing entry_id or stage_key" }, { status: 400 });
    }

    const db = await getDb();
    
    // Verify entry belongs to driver (truck_no)
    const [entries] = await db.execute("SELECT * FROM logistic_entries WHERE logistic_id = ?", [entry_id]);
    if (entries.length === 0) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    const entry = entries[0];
    
    // Strict check: User username must match truck no
    if (user.username !== entry.truck_no) {
        return NextResponse.json({ error: "Unauthorized for this vehicle" }, { status: 403 });
    }
    
    if (entry.status === 'Closed') {
        return NextResponse.json({ error: "Entry is already closed" }, { status: 400 });
    }

    // Validate Stage Sequence
    const STAGES = [
        "loading_site_at",
        "loading_point_in_at",
        "loading_point_out_at",
        "unloading_site_at",
        "unloading_point_in_at",
        "unloading_point_out_at",
    ];

    if (!STAGES.includes(stage_key)) {
        return NextResponse.json({ error: "Invalid stage key" }, { status: 400 });
    }

    // Block overwriting an already confirmed stage
    if (entry[stage_key]) {
        return NextResponse.json({ error: "Stage is already confirmed" }, { status: 400 });
    }

    // Check if previous stage is done
    const currentIndex = STAGES.indexOf(stage_key);
    if (currentIndex > 0) {
        const prevStage = STAGES[currentIndex - 1];
        if (!entry[prevStage]) {
             return NextResponse.json({ error: "Previous stage not completed" }, { status: 400 });
        }
    }

    // Update
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let updateQuery = `UPDATE logistic_entries SET ${stage_key} = ?`;
    const params = [now];

    // If last stage, close the entry
    if (currentIndex === STAGES.length - 1) {
        updateQuery += `, status = 'Closed'`;
    }

    updateQuery += ` WHERE logistic_id = ?`;
    params.push(entry_id);

    await db.execute(updateQuery, params);

    return NextResponse.json({ 
        message: "Stage confirmed", 
        stage: stage_key, 
        timestamp: now,
        closed: currentIndex === STAGES.length - 1
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
