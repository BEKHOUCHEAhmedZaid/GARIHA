import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  expireStaleReservations,
  createReservationNotification,
} from "@/lib/reservations";
import { requireUser, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await expireStaleReservations();

    const body = await req.json();
    const { parking_spot_id, driver_name, plate_number, duration_minutes = 60 } = body;

    if (!parking_spot_id || !driver_name || !plate_number) {
      return NextResponse.json(
        { detail: "Parking spot, driver name and plate number are required" },
        { status: 400 }
      );
    }

    const spotRes = await query(
      `SELECT s.id, s.name, s.status, s.price, s.parking_id, p.parking_name 
       FROM parking_spots s 
       JOIN parkings p ON s.parking_id = p.id 
       WHERE s.id = $1`,
      [parking_spot_id]
    );

    if (spotRes.rows.length === 0) {
      return NextResponse.json({ detail: "Parking spot not found" }, { status: 404 });
    }

    const spot = spotRes.rows[0];
    if (spot.status !== "LIBRE") {
      return NextResponse.json(
        { detail: `Spot not available (status: ${spot.status})` },
        { status: 409 }
      );
    }

    const duration = parseInt(duration_minutes || "60", 10);
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const insertRes = await query(
      `INSERT INTO reservations (
        parking_spot_id, driver_id, driver_name, plate_number, status, expires_at
      )
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING *`,
      [spot.id, user.id, driver_name, plate_number, expiresAt]
    );

    await query("UPDATE parking_spots SET status = 'RESERVEE' WHERE id = $1", [spot.id]);

    await createReservationNotification(
      user.id,
      "Reservation Confirmed",
      `Your reservation for spot ${spot.name} at ${spot.parking_name} is confirmed.`
    );

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
    return handleApiError(err);
  }
}
