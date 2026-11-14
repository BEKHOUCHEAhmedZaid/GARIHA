import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const status = searchParams.get("status") || "all";

    let dateCondition = "TRUE";
    if (period === "week" || period === "This Week") {
      dateCondition = "r.created_at >= DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')";
    } else if (period === "month" || period === "This Month") {
      dateCondition = "r.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')";
    }

    let statusCondition = "TRUE";
    if (status && status !== "all") {
      statusCondition = "r.status = $2";
    }

    const params: (string | number)[] = [owner.id];
    if (status && status !== "all") {
      params.push(status);
    }

    const reservationsRes = await query(
      `SELECT 
         r.id,
         r.driver_name,
         r.plate_number,
         r.status,
         r.created_at,
         r.expires_at,
         s.name as spot_name,
         s.level as spot_level,
         s.price as spot_price,
         p.id as parking_id,
         p.parking_name,
         EXTRACT(EPOCH FROM (r.expires_at - r.created_at)) / 60 as duration_minutes
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE p.owner_id = $1 
         AND ${dateCondition}
         AND ${statusCondition}
       ORDER BY r.created_at DESC`,
      params
    );

    const formatted = reservationsRes.rows.map((r) => {
      const durationMins = Math.round(parseFloat(r.duration_minutes || "60"));
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? mins + "m" : ""}`.trim() : `${mins}m`;

      return {
        id: r.id,
        driver_name: r.driver_name,
        plate_number: r.plate_number,
        parking_name: r.parking_name,
        spot_name: r.spot_name,
        spot_level: r.spot_level,
        spot_price: r.spot_price,
        status: r.status,
        created_at: r.created_at,
        expires_at: r.expires_at,
        duration: durationStr,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    return handleApiError(err);
  }
}
