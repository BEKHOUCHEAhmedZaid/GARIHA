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
    const parkingId = parseInt(id, 10);

    const check = await query("SELECT id FROM parkings WHERE id = $1", [parkingId]);
    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Parking not found" }, { status: 404 });
    }

    const res = await query(
      `SELECT id, name, level, status, price 
       FROM parking_spots 
       WHERE parking_id = $1 
       ORDER BY id ASC`,
      [parkingId]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
