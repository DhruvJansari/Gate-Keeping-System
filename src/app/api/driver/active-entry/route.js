import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Driver username is the truck number
    const truckNo = user.username;

    const db = await getDb();
    
    // Find active entry:
    const [entries] = await db.execute(`
        SELECT * FROM logistic_entries 
        WHERE truck_no = ? 
          AND (status IS NULL OR status != 'Closed')
        ORDER BY created_at DESC 
        LIMIT 1
    `, [truckNo]);

    if (entries.length === 0) {
        return NextResponse.json({ active: false, message: "No active trip found" });
    }

    const entry = entries[0];
    
    const STAGES = [
        { field: "loading_site_at", label: "Loading Site" },
        { field: "loading_point_in_at", label: "Loading Point In" },
        { field: "loading_point_out_at", label: "Loading Point Out" },
        { field: "unloading_site_at", label: "Unloading Site" },
        { field: "unloading_point_in_at", label: "Unloading Point In" },
        { field: "unloading_point_out_at", label: "Unloading Point Out" },
    ];

    let nextStage = null;
    let completed = false;

    for (const stage of STAGES) {
        if (!entry[stage.field]) {
            nextStage = stage;
            break;
        }
    }

    if (!nextStage) {
        completed = true;
    }

    return NextResponse.json({
        active: true,
        entry_id: entry.logistic_id,
        product: entry.product,
        truck_no: entry.truck_no,
        current_stage: nextStage, // null if all done
        is_completed: completed
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
