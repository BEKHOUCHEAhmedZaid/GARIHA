import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/auth";
import { createReservationNotification, expireStaleReservations } from "@/lib/reservations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const user = await getCurrentUser(req);
    await expireStaleReservations();

    const { id } = await params;
    const resId = parseInt(id, 10);
    const body = await req.json();
    const { new_spot_id, plate_number } = body;

    if (!new_spot_id) {
      return NextResponse.json(
        { detail: "New parking spot ID is required" },
        { status: 400 }
      );
    }
    const newSpotId = parseInt(new_spot_id, 10);

    // 1. Fetch current reservation with parking information
    const checkRes = await client.query(
      `SELECT 
         r.id, 
         r.driver_id, 
         r.driver_name, 
         r.plate_number, 
         r.parking_spot_id, 
         r.status, 
         r.created_at, 
         r.expires_at,
         s.parking_id,
         s.name as old_spot_name,
         p.parking_name,
         p.owner_id
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.id = $1`,
      [resId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { detail: "Reservation not found" },
        { status: 404 }
      );
    }

    const currentRes = checkRes.rows[0];

    // 2. Authorization check
    let isAuthorized = false;
    if (user) {
      if (currentRes.driver_id === user.id || currentRes.owner_id === user.id || user.role === "admin") {
        isAuthorized = true;
      }
    } else if (plate_number && currentRes.driver_id === null) {
      if (currentRes.plate_number.trim().toUpperCase() === plate_number.trim().toUpperCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { detail: "Forbidden: You are not authorized to modify this reservation" },
        { status: 403 }
      );
    }

    // 3. Status validation
    if (!["active", "checked_in"].includes(currentRes.status)) {
      return NextResponse.json(
        { detail: `Cannot change spot: reservation status is '${currentRes.status}'` },
        { status: 400 }
      );
    }

    if (currentRes.parking_spot_id === newSpotId) {
      return NextResponse.json(
        { detail: "Selected spot is already assigned to this reservation" },
        { status: 400 }
      );
    }

    // 4. Atomic transaction with row locking
    await client.query("BEGIN");

    // Lock new spot row to guarantee no race condition
    const lockNewSpot = await client.query(
      `SELECT id, name, level, status, price, parking_id 
       FROM parking_spots 
       WHERE id = $1 AND parking_id = $2 
       FOR UPDATE`,
      [newSpotId, currentRes.parking_id]
    );

    if (lockNewSpot.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { detail: "Target parking spot not found in this parking lot" },
        { status: 404 }
      );
    }

    const targetSpot = lockNewSpot.rows[0];
    if (targetSpot.status !== "LIBRE") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { detail: `Target spot ${targetSpot.name} is no longer available (status: ${targetSpot.status})` },
        { status: 409 }
      );
    }

    // Free the old spot
    await client.query(
      "UPDATE parking_spots SET status = 'LIBRE' WHERE id = $1",
      [currentRes.parking_spot_id]
    );

    // Reserve the new spot
    const newSpotStatus = currentRes.status === "checked_in" ? "OCCUPEE" : "RESERVEE";
    await client.query(
      "UPDATE parking_spots SET status = $1 WHERE id = $2",
      [newSpotStatus, newSpotId]
    );

    // Update the reservation record
    const updatedRes = await client.query(
      `UPDATE reservations 
       SET parking_spot_id = $1 
       WHERE id = $2 
       RETURNING *`,
      [newSpotId, resId]
    );

    await client.query("COMMIT");

    // Send notification
    if (currentRes.driver_id) {
      await createReservationNotification(
        currentRes.driver_id,
        "Spot Changed",
        `Your parking spot has been changed from ${currentRes.old_spot_name} to ${targetSpot.name} at ${currentRes.parking_name}.`
      );
    }

    const r = updatedRes.rows[0];
    return NextResponse.json({
      id: r.id,
      parking_spot_id: r.parking_spot_id,
      driver_name: r.driver_name,
      plate_number: r.plate_number,
      status: r.status,
      created_at: r.created_at,
      expires_at: r.expires_at,
      spot_name: targetSpot.name,
      spot_level: targetSpot.level,
      spot_price: targetSpot.price,
      parking_name: currentRes.parking_name,
      message: `Place modifiée avec succès : vous êtes maintenant assigné à la place ${targetSpot.name}.`,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors if connection failed
    }
    return handleApiError(err);
  } finally {
    client.release();
  }
}
