import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      plate_number,
      parking_name,
      location,
      spots,
    } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { detail: "First name, last name, email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [trimmedEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { detail: "Email already registered" },
        { status: 400 }
      );
    }

    // Public registration strictly assigns 'driver' (approved) or 'owner' (pending approval).
    // Admin role can NEVER be obtained through public registration.
    let role = "driver";
    let statusVal = "approved";

    if (parking_name) {
      role = "owner";
      statusVal = "pending";
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${first_name.trim()} ${last_name.trim()}`;

    const insertResult = await query(
      `INSERT INTO users (full_name, email, hashed_password, phone, plate_number, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role, status, phone, plate_number, created_at, updated_at`,
      [
        fullName,
        trimmedEmail,
        hashedPassword,
        phone || null,
        plate_number || null,
        role,
        statusVal,
      ]
    );

    const newUser = insertResult.rows[0];

    // If registered as an owner with parking details, auto-create the parking & spots
    if (parking_name && location) {
      const totalPlaces = parseInt(spots || "0", 10) || 0;
      const parkingRes = await query(
        `INSERT INTO parkings (owner_id, parking_name, location, total_places, available_places)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [newUser.id, parking_name, location, totalPlaces, totalPlaces]
      );

      const parkingId = parkingRes.rows[0].id;
      if (totalPlaces > 0) {
        for (let i = 1; i <= totalPlaces; i++) {
          await query(
            `INSERT INTO parking_spots (parking_id, name, level, status, price)
             VALUES ($1, $2, 'Ground', 'LIBRE', 250)`,
            [parkingId, `P${i}`]
          );
        }
      }
    }

    return NextResponse.json(newUser);
  } catch (err) {
    return handleApiError(err);
  }
}
