import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireUser(req);
    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    if (isNaN(otherUserId)) {
      return NextResponse.json({ detail: "ID utilisateur invalide" }, { status: 400 });
    }

    if (user.id === otherUserId) {
      return NextResponse.json({ detail: "Impossible d'ouvrir une discussion avec vous-même" }, { status: 400 });
    }

    const userRole = (user.role || "").toLowerCase();

    // Verify authorization
    if (userRole === "driver") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND LOWER(role) = 'admin'", [otherUserId]);
      if (adminCheck.rows.length === 0) {
        const ownerCheck = await query(
          `SELECT p.owner_id 
           FROM reservations r
           JOIN parking_spots s ON r.parking_spot_id = s.id
           JOIN parkings p ON s.parking_id = p.id
           WHERE r.driver_id = $1 AND p.owner_id = $2`,
          [user.id, otherUserId]
        );
        if (ownerCheck.rows.length === 0) {
          return NextResponse.json(
            { detail: "Accès refusé : Vous n'êtes pas autorisé à consulter ces messages" },
            { status: 403 }
          );
        }
      }
    } else if (userRole === "owner") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND LOWER(role) = 'admin'", [otherUserId]);
      if (adminCheck.rows.length === 0) {
        const driverCheck = await query(
          `SELECT r.driver_id
           FROM reservations r
           JOIN parking_spots s ON r.parking_spot_id = s.id
           JOIN parkings p ON s.parking_id = p.id
           WHERE p.owner_id = $1 AND r.driver_id = $2`,
          [user.id, otherUserId]
        );
        if (driverCheck.rows.length === 0) {
          return NextResponse.json(
            { detail: "Accès refusé : Vous n'êtes pas autorisé à consulter ces messages" },
            { status: 403 }
          );
        }
      }
    }

    const res = await query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [user.id, otherUserId]
    );

    await query(
      "UPDATE messages SET is_read = 1 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0",
      [otherUserId, user.id]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
