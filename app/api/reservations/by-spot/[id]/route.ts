import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { expireStaleReservations } from "@/lib/reservations";
import { handleApiError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await expireStaleReservations();
    const { id } = await params;
    const spotId = parseInt(id, 10);

    const resQuery = await query(
      `SELECT r.*, s.name as spot_name, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.parking_spot_id = $1
       ORDER BY r.created_at DESC`,
      [spotId]
    );

    return NextResponse.json(resQuery.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
