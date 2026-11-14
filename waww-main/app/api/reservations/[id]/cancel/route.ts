import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/auth";
import { createReservationNotification } from "@/lib/reservations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const user = await getCurrentUser(req);
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const resId = parseInt(id, 10);

    const resQuery = await client.query(
      `SELECT r.*, s.name as spot_name, p.parking_name, p.owner_id
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

    // Authorization check
    let isAuthorized = false;
    if (user) {
      if (res.driver_id === user.id || res.owner_id === user.id || user.role === "admin") {
        isAuthorized = true;
      }
    } else if (body.plate_number && res.driver_id === null) {
      if (res.plate_number.trim().toUpperCase() === body.plate_number.trim().toUpperCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { detail: "Forbidden: You are not authorized to cancel this reservation" },
        { status: 403 }
      );
    }

    if (!["active", "checked_in"].includes(res.status)) {
      return NextResponse.json(
        { detail: `Cannot cancel — reservation status is '${res.status}'` },
        { status: 400 }
      );
    }

    // Atomic transaction
    await client.query("BEGIN");
    await client.query("UPDATE reservations SET status = 'cancelled' WHERE id = $1", [resId]);
    await client.query("UPDATE parking_spots SET status = 'LIBRE' WHERE id = $1", [
      res.parking_spot_id,
    ]);
    await client.query("COMMIT");

    if (res.driver_id) {
      await createReservationNotification(
        res.driver_id,
        "Reservation Cancelled",
        `Your reservation #${res.id} for spot ${res.spot_name} at ${res.parking_name} has been cancelled.`
      );
    }

    return NextResponse.json({
      message: "Reservation cancelled successfully. Spot is now free.",
      reservation_id: resId,
      status: "cancelled",
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    return handleApiError(err);
  } finally {
    client.release();
  }
}
