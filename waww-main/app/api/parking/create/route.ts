import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const body = await req.json();
    const {
      parking_name,
      location,
      total_places,
      pricing,
      opening_hours,
      description,
      lat,
      lng,
    } = body;

    if (!parking_name || !location) {
      return NextResponse.json(
        { detail: "Parking name and location are required" },
        { status: 400 }
      );
    }

    const places = parseInt(total_places || "0", 10) || 0;

    const insertRes = await query(
      `INSERT INTO parkings (
        owner_id, parking_name, location, total_places, available_places,
        pricing, opening_hours, description, lat, lng
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        owner.id,
        parking_name,
        location,
        places,
        places,
        pricing || null,
        opening_hours || null,
        description || null,
        lat || null,
        lng || null,
      ]
    );

    const newParking = insertRes.rows[0];

    if (places > 0) {
      for (let i = 1; i <= places; i++) {
        await query(
          `INSERT INTO parking_spots (parking_id, name, level, status, price)
           VALUES ($1, $2, 'Ground', 'LIBRE', 250)`,
          [newParking.id, `P${i}`]
        );
      }
    }

    return NextResponse.json(newParking);
  } catch (err) {
    return handleApiError(err);
  }
}
