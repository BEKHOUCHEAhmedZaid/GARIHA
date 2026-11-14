import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const countRes = await query(
      "SELECT COUNT(*) as total FROM reservations WHERE driver_id = $1",
      [user.id]
    );
    const totalReservations = parseInt(countRes.rows[0].total || "0", 10);

    const activeRes = await query(
      `SELECT r.*, s.name as spot_name, s.price as spot_price, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.driver_id = $1 AND r.status IN ('active', 'checked_in')
       ORDER BY r.created_at DESC LIMIT 1`,
      [user.id]
    );

    let activeData = null;
    if (activeRes.rows.length > 0) {
      const a = activeRes.rows[0];
      activeData = {
        id: a.id,
        parking_spot_id: a.parking_spot_id,
        driver_name: a.driver_name,
        plate_number: a.plate_number,
        status: a.status,
        created_at: a.created_at,
        expires_at: a.expires_at,
        spot_name: a.spot_name,
        parking_name: a.parking_name,
        spot_price: a.spot_price,
      };
    }

    return NextResponse.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      plate_number: user.plate_number,
      role: user.role,
      created_at: user.created_at,
      total_reservations: totalReservations,
      active_reservation: activeData,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
