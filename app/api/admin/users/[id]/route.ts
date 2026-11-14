import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ detail: "ID utilisateur invalide" }, { status: 400 });
    }

    const userRes = await query(
      `SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.status, 
        u.avatar, 
        u.phone, 
        COALESCE(u.plate_number, (SELECT r.plate_number FROM reservations r WHERE r.driver_id = u.id ORDER BY r.created_at DESC LIMIT 1)) AS plate_number,
        u.created_at, 
        u.updated_at
      FROM users u
      WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ detail: "Utilisateur non trouvé" }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Fetch related driver reservations
    const reservationsRes = await query(
      `SELECT 
        r.id,
        r.status,
        r.created_at,
        r.expires_at,
        r.plate_number,
        s.name AS spot_name,
        s.price AS spot_price,
        p.parking_name,
        p.location AS parking_location
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
      JOIN parkings p ON s.parking_id = p.id
      WHERE r.driver_id = $1
      ORDER BY r.created_at DESC`,
      [userId]
    );

    // Fetch related owner parkings
    const parkingsRes = await query(
      `SELECT 
        p.id,
        p.parking_name,
        p.location,
        p.total_places,
        p.available_places,
        p.pricing,
        p.created_at,
        (SELECT COUNT(*)::int FROM parking_spots s WHERE s.parking_id = p.id) AS spots_count,
        (SELECT COUNT(*)::int 
         FROM reservations r 
         JOIN parking_spots s ON r.parking_spot_id = s.id 
         WHERE s.parking_id = p.id AND r.status IN ('active', 'checked_in')
        ) AS active_reservations_count
      FROM parkings p
      WHERE p.owner_id = $1
      ORDER BY p.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      user,
      reservations: reservationsRes.rows,
      parkings: parkingsRes.rows,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
