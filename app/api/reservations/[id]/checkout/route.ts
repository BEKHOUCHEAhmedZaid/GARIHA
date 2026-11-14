import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createReservationNotification } from "@/lib/reservations";
import { handleApiError } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resId = parseInt(id, 10);

    const resQuery = await query(
      `SELECT r.*, s.name as spot_name, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.id = $1`,
      [resId]
    );

    if (resQuery.rows.length === 0) {
      return NextResponse.json({ detail: "Reservation not found" }, { status: 404 });
    }

    const res = resQuery.rows[0];
    if (res.status !== "checked_in") {
      return NextResponse.json(
        { detail: `Cannot check out — reservation status is '${res.status}'` },
        { status: 400 }
      );
    }

    await query("UPDATE reservations SET status = 'completed' WHERE id = $1", [resId]);
    await query("UPDATE parking_spots SET status = 'LIBRE' WHERE id = $1", [
      res.parking_spot_id,
    ]);

    await createReservationNotification(
      res.driver_id,
      "Checked Out",
      `You have successfully checked out of spot ${res.spot_name}.`
    );

    return NextResponse.json({
      id: res.id,
      parking_spot_id: res.parking_spot_id,
      driver_name: res.driver_name,
      plate_number: res.plate_number,
      status: "completed",
      created_at: res.created_at,
      expires_at: res.expires_at,
      spot_name: res.spot_name,
      parking_name: res.parking_name,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
