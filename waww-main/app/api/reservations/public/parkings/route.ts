import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { expireStaleReservations } from "@/lib/reservations";
import { handleApiError } from "@/lib/auth";

export async function GET() {
  try {
    await expireStaleReservations();

    const res = await query(`
      SELECT 
        p.id, 
        p.parking_name, 
        p.location, 
        p.total_places, 
        COUNT(s.id) FILTER (WHERE s.status = 'LIBRE') as available_places,
        p.lat, 
        p.lng, 
        p.pricing
      FROM parkings p
      LEFT JOIN parking_spots s ON s.parking_id = p.id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const parkings = res.rows.map((p) => ({
      id: p.id,
      parking_name: p.parking_name,
      location: p.location,
      total_places: parseInt(p.total_places || "0", 10),
      available_places: parseInt(p.available_places || "0", 10),
      lat: p.lat ? parseFloat(p.lat) : null,
      lng: p.lng ? parseFloat(p.lng) : null,
      pricing: p.pricing,
    }));

    return NextResponse.json(parkings);
  } catch (err) {
    return handleApiError(err);
  }
}
