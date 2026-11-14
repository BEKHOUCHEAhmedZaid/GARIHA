import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { expireStaleReservations } from "@/lib/reservations";
import { handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await expireStaleReservations();

    const body = await req.json();
    const { reservation_id, plate_number } = body;

    if (!reservation_id || !plate_number || !plate_number.trim()) {
      return NextResponse.json(
        { detail: "Le numéro de réservation et la plaque d'immatriculation sont requis pour le suivi." },
        { status: 400 }
      );
    }

    const resId = parseInt(reservation_id.toString().replace(/[^0-9]/g, ""), 10);
    if (isNaN(resId) || resId <= 0) {
      return NextResponse.json(
        { detail: "Numéro de réservation invalide." },
        { status: 400 }
      );
    }

    const cleanPlate = plate_number.trim().toUpperCase();

    const resQuery = await query(
      `SELECT 
         r.id, 
         r.driver_id, 
         r.driver_name, 
         r.plate_number, 
         r.status, 
         r.created_at, 
         r.expires_at,
         s.id as spot_id, 
         s.name as spot_name, 
         s.level as spot_level, 
         s.price as spot_price,
         p.id as parking_id, 
         p.parking_name, 
         p.location as parking_location
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.id = $1 AND UPPER(TRIM(r.plate_number)) = $2`,
      [resId, cleanPlate]
    );

    if (resQuery.rows.length === 0) {
      return NextResponse.json(
        { detail: `Aucune réservation trouvée pour le numéro #${resId} avec l'immatriculation ${cleanPlate}.` },
        { status: 404 }
      );
    }

    const reservation = resQuery.rows[0];

    // Find alternative spots in the same parking if reservation is active
    let alternativeSpots: Array<{ id: number; name: string; level: string; price: number }> = [];
    if (["active", "checked_in"].includes(reservation.status)) {
      const altRes = await query(
        `SELECT id, name, level, price 
         FROM parking_spots 
         WHERE parking_id = $1 AND status = 'LIBRE' AND id != $2
         ORDER BY name ASC`,
        [reservation.parking_id, reservation.spot_id]
      );
      alternativeSpots = altRes.rows as unknown as typeof alternativeSpots;
    }

    return NextResponse.json({
      found: true,
      reservation: {
        id: reservation.id,
        driver_name: reservation.driver_name,
        plate_number: reservation.plate_number,
        status: reservation.status,
        created_at: reservation.created_at,
        expires_at: reservation.expires_at,
        spot_id: reservation.spot_id,
        spot_name: reservation.spot_name,
        spot_level: reservation.spot_level || "RDC",
        spot_price: reservation.spot_price,
        parking_id: reservation.parking_id,
        parking_name: reservation.parking_name,
        parking_location: reservation.parking_location,
      },
      alternative_spots: alternativeSpots,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
