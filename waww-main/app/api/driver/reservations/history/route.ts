import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";
import { expireStaleReservations } from "@/lib/reservations";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    await expireStaleReservations();

    const historyRes = await query(
      `SELECT 
         r.id,
         r.parking_spot_id,
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
         p.location as parking_location,
         EXTRACT(EPOCH FROM (r.expires_at - r.created_at)) / 60 as duration_minutes
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.driver_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    const result = historyRes.rows.map((r) => {
      const durationMins = Math.round(parseFloat(r.duration_minutes || "60"));
      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? mins + "m" : ""}`.trim() : `${mins}m`;

      return {
        id: r.id,
        parking_spot_id: r.parking_spot_id,
        driver_name: r.driver_name,
        plate_number: r.plate_number,
        status: r.status,
        created_at: r.created_at,
        expires_at: r.expires_at,
        duration: durationStr,
        spot_name: r.spot_name,
        spot_level: r.spot_level,
        parking_name: r.parking_name,
        parking_location: r.parking_location,
        spot_price: r.spot_price,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
