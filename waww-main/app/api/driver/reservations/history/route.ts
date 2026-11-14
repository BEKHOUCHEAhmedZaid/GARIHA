import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const historyRes = await query(
      `SELECT r.*, s.name as spot_name, s.price as spot_price, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.driver_id = $1
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    const result = historyRes.rows.map((r) => ({
      id: r.id,
      parking_spot_id: r.parking_spot_id,
      driver_name: r.driver_name,
      plate_number: r.plate_number,
      status: r.status,
      created_at: r.created_at,
      expires_at: r.expires_at,
      spot_name: r.spot_name,
      parking_name: r.parking_name,
      spot_price: r.spot_price,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
