import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);

    const parkingsRes = await query(
      `SELECT * FROM parkings WHERE owner_id = $1 ORDER BY created_at DESC`,
      [owner.id]
    );
    const parkings = parkingsRes.rows;
    const totalParkings = parkings.length;

    let totalPlaces = 0;
    let occupiedPlaces = 0;
    let availablePlaces = 0;
    let unavailablePlaces = 0;
    let reservationsCount = 0;
    let revenue = 0;

    if (totalParkings > 0) {
      const parkingIds = parkings.map((p) => p.id);
      const spotsRes = await query(
        `SELECT id, parking_id, name, level, status, price 
         FROM parking_spots 
         WHERE parking_id = ANY($1::int[])`,
        [parkingIds]
      );

      const spots = spotsRes.rows;
      totalPlaces = spots.length;

      for (const s of spots) {
        const st = (s.status || "").toLowerCase();
        if (st === "occupee" || st === "occupied") {
          occupiedPlaces++;
          revenue += Number(s.price) || 0;
        } else if (st === "libre" || st === "available") {
          availablePlaces++;
        } else if (st === "reservee" || st === "reserved") {
          reservationsCount++;
          revenue += Number(s.price) || 0;
        } else if (st === "indisponible" || st === "unavailable") {
          unavailablePlaces++;
        }
      }
    }

    const totalDrivers = occupiedPlaces + reservationsCount;

    return NextResponse.json({
      total_parkings: totalParkings,
      total_places: totalPlaces,
      available_places: availablePlaces,
      occupied_places: occupiedPlaces,
      unavailable_places: unavailablePlaces,
      total_drivers: totalDrivers,
      reservations_count: reservationsCount,
      revenue,
      parkings,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
