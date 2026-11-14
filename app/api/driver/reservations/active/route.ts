import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";
import { expireStaleReservations } from "@/lib/reservations";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    await expireStaleReservations();

    const activeRes = await query(
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
         p.location as parking_location
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.driver_id = $1 AND r.status IN ('active', 'checked_in')
       ORDER BY r.created_at DESC LIMIT 1`,
      [user.id]
    );

    if (activeRes.rows.length === 0) {
      return NextResponse.json({ active: false, reservation: null, alternative_spots: [] });
    }

    const a = activeRes.rows[0];

    // Find available spots in the same parking for potential spot changes
    const altSpotsRes = await query(
      `SELECT id, name, level, price, status
       FROM parking_spots
       WHERE parking_id = $1 AND status = 'LIBRE' AND id != $2
       ORDER BY name ASC`,
      [a.parking_id, a.parking_spot_id]
    );

    return NextResponse.json({
      active: true,
      reservation: {
        id: a.id,
        parking_spot_id: a.parking_spot_id,
        driver_name: a.driver_name,
        plate_number: a.plate_number,
        status: a.status,
        created_at: a.created_at,
        expires_at: a.expires_at,
        spot_name: a.spot_name,
        spot_level: a.spot_level,
        parking_id: a.parking_id,
        parking_name: a.parking_name,
        parking_location: a.parking_location,
        spot_price: a.spot_price,
      },
      alternative_spots: altSpotsRes.rows,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
