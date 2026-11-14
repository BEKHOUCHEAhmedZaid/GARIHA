import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { expireStaleReservations, createReservationNotification } from "@/lib/reservations";
import { getCurrentUser, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await expireStaleReservations();
    const user = await getCurrentUser(req);
    const body = await req.json();
    const { parking_spot_id, driver_name, plate_number, duration_minutes = 60 } = body;

    if (!parking_spot_id || !driver_name || !plate_number) {
      return NextResponse.json(
        { detail: "Parking spot, driver name and plate number are required" },
        { status: 400 }
      );
    }

    const spotId = parseInt(parking_spot_id, 10);
    const duration = parseInt(duration_minutes || "60", 10);
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    // Atomic transaction with row locking
    await client.query("BEGIN");

    const spotRes = await client.query(
      `SELECT s.id, s.name, s.status, s.price, s.parking_id, p.parking_name 
       FROM parking_spots s 
       JOIN parkings p ON s.parking_id = p.id 
       WHERE s.id = $1
       FOR UPDATE`,
      [spotId]
    );

    if (spotRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ detail: "Parking spot not found" }, { status: 404 });
    }

    const spot = spotRes.rows[0];
    if (spot.status !== "LIBRE") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { detail: `Cette place n'est plus disponible (statut: ${spot.status})` },
        { status: 409 }
      );
    }

    const driverId = user?.id || null;

    const insertRes = await client.query(
      `INSERT INTO reservations (
        parking_spot_id, driver_id, driver_name, plate_number, status, expires_at
      )
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING *`,
      [spot.id, driverId, driver_name.trim(), plate_number.trim().toUpperCase(), expiresAt]
    );

    await client.query(
      "UPDATE parking_spots SET status = 'RESERVEE' WHERE id = $1",
      [spot.id]
    );

    await client.query("COMMIT");

    if (driverId) {
      await createReservationNotification(
        driverId,
        "Reservation Confirmed",
        `Your reservation for spot ${spot.name} at ${spot.parking_name} is confirmed.`
      );
    }

    const res = insertRes.rows[0];
    return NextResponse.json({
      id: res.id,
      parking_spot_id: res.parking_spot_id,
      driver_id: res.driver_id,
      driver_name: res.driver_name,
      plate_number: res.plate_number,
      status: res.status,
      created_at: res.created_at,
      expires_at: res.expires_at,
      spot_name: spot.name,
      parking_name: spot.parking_name,
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
