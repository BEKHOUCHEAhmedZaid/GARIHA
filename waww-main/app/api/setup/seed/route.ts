import { NextResponse } from "next/server";
import { query, ensureTables } from "@/lib/db";
import { hashPassword, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const setupSecret = process.env.SETUP_SECRET;

    // Safety guard: in production, require SETUP_SECRET
    if (isProd) {
      const headerSecret = req.headers.get("x-setup-secret");
      if (!setupSecret || headerSecret !== setupSecret) {
        return NextResponse.json(
          { detail: "Forbidden: demo seeding requires a valid x-setup-secret header in production" },
          { status: 403 }
        );
      }
    }

    await ensureTables();

    // Check if parkings already exist
    const countRes = await query("SELECT COUNT(*) as total FROM parkings");
    if (parseInt(countRes.rows[0].total || "0", 10) > 0) {
      return NextResponse.json({
        message: "Demo parkings already seeded. Skipping to avoid duplicates.",
      });
    }

    // Create or find a demo owner
    const demoOwnerEmail = "owner.demo@gariha.com";
    const ownerRes = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [
      demoOwnerEmail,
    ]);

    let ownerId: number;
    if (ownerRes.rows.length === 0) {
      const demoPw = process.env.DEMO_ACCOUNTS_PASSWORD || "GarihaDemo2026!";
      const hashed = await hashPassword(demoPw);
      const inserted = await query(
        `INSERT INTO users (full_name, email, hashed_password, role, status, phone)
         VALUES ($1, $2, $3, 'owner', 'approved', '0555000001')
         RETURNING id`,
        ["Demo Parking Owner", demoOwnerEmail, hashed]
      );
      ownerId = inserted.rows[0].id;
    } else {
      ownerId = ownerRes.rows[0].id;
    }

    const demoParkings = [
      {
        name: "PlayLand Parking",
        lat: 36.752,
        lng: 5.0574,
        price: "50 DZD/H",
        places: 30,
      },
      {
        name: "Parking Public Payant",
        lat: 36.7558,
        lng: 5.0812,
        price: "30 DZD/H",
        places: 40,
      },
      {
        name: "Parking Auto Centre",
        lat: 36.7571,
        lng: 5.0835,
        price: "60 DZD/H",
        places: 20,
      },
      {
        name: "Bougie Park",
        lat: 36.749,
        lng: 5.065,
        price: "50 DZD/H",
        places: 35,
      },
      {
        name: "Parking Gare Ferroviaire",
        lat: 36.758,
        lng: 5.087,
        price: "40 DZD/H",
        places: 25,
      },
    ];

    for (const dp of demoParkings) {
      const pRes = await query(
        `INSERT INTO parkings (
          owner_id, parking_name, location, total_places, available_places, pricing, lat, lng, description
        )
        VALUES ($1, $2, 'Béjaïa, Algérie', $3, $3, $4, $5, $6, 'Secured and covered parking spots.')
        RETURNING id`,
        [ownerId, dp.name, dp.places, dp.price, dp.lat, dp.lng]
      );

      const parkingId = pRes.rows[0].id;
      for (let i = 1; i <= dp.places; i++) {
        await query(
          `INSERT INTO parking_spots (parking_id, name, level, status, price)
           VALUES ($1, $2, 'Ground', 'LIBRE', 50)`,
          [parkingId, `P${i}`]
        );
      }
    }

    return NextResponse.json({
      message: "Demo parkings and spots seeded successfully.",
      parkings_created: demoParkings.length,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
