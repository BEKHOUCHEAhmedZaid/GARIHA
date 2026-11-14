import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";
import { createReservationNotification } from "@/lib/reservations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const user = await requireUser(req);
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

    // Authorization: driver, owner, or admin
    const isDriver = res.driver_id === user.id;
    const isOwner = res.owner_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isDriver && !isOwner && !isAdmin) {
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
        `Your reservation for spot ${res.spot_name} at ${res.parking_name} has been cancelled.`
      );
    }

    return NextResponse.json({
      id: res.id,
      parking_spot_id: res.parking_spot_id,
      driver_name: res.driver_name,
      plate_number: res.plate_number,
      status: "cancelled",
      created_at: res.created_at,
      expires_at: res.expires_at,
      spot_name: res.spot_name,
      parking_name: res.parking_name,
      message: "Réservation annulée avec succès. La place a été libérée.",
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    return handleApiError(err);
  } finally {
    client.release();
  }
}
