import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { receiver_id, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ detail: "Le contenu du message est requis" }, { status: 400 });
    }

    let targetReceiverId = receiver_id ? parseInt(receiver_id, 10) : null;

    if (!targetReceiverId) {
      // Default to platform admin / support
      const adminRes = await query(
        "SELECT id FROM users WHERE LOWER(role) = 'admin' ORDER BY id ASC LIMIT 1"
      );
      if (adminRes.rows.length === 0) {
        return NextResponse.json(
          { detail: "Aucun administrateur disponible pour recevoir le message" },
          { status: 404 }
        );
      }
      targetReceiverId = adminRes.rows[0].id;
    }

    if (user.id === targetReceiverId) {
      return NextResponse.json({ detail: "Impossible d'envoyer un message à vous-même" }, { status: 400 });
    }

    // Check that receiver exists
    const receiverRes = await query("SELECT id, role, full_name FROM users WHERE id = $1", [targetReceiverId]);
    if (receiverRes.rows.length === 0) {
      return NextResponse.json({ detail: "Destinataire introuvable" }, { status: 404 });
    }

    const userRole = (user.role || "").toLowerCase();

    // Verify recipient authorization
    if (userRole === "driver") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND LOWER(role) = 'admin'", [targetReceiverId]);
      if (adminCheck.rows.length === 0) {
        const ownerCheck = await query(
          `SELECT p.owner_id 
           FROM reservations r
           JOIN parking_spots s ON r.parking_spot_id = s.id
           JOIN parkings p ON s.parking_id = p.id
           WHERE r.driver_id = $1 AND p.owner_id = $2`,
          [user.id, targetReceiverId]
        );
        if (ownerCheck.rows.length === 0) {
          return NextResponse.json(
            { detail: "Accès refusé : Vous pouvez uniquement contacter l'administrateur ou les propriétaires des parkings réservés" },
            { status: 403 }
          );
        }
      }
    } else if (userRole === "owner") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND LOWER(role) = 'admin'", [targetReceiverId]);
      if (adminCheck.rows.length === 0) {
        const driverCheck = await query(
          `SELECT r.driver_id
           FROM reservations r
           JOIN parking_spots s ON r.parking_spot_id = s.id
           JOIN parkings p ON s.parking_id = p.id
           WHERE p.owner_id = $1 AND r.driver_id = $2`,
          [user.id, targetReceiverId]
        );
        if (driverCheck.rows.length === 0) {
          return NextResponse.json(
            { detail: "Accès refusé : Vous pouvez uniquement contacter l'administrateur ou les conducteurs ayant réservé dans vos parkings" },
            { status: 403 }
          );
        }
      }
    }

    const res = await query(
      `INSERT INTO messages (sender_id, receiver_id, content, is_read)
       VALUES ($1, $2, $3, 0)
       RETURNING *`,
      [user.id, targetReceiverId, content.trim()]
    );

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
