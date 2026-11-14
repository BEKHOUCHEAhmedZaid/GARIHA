import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { receiver_id, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ detail: "Content is required" }, { status: 400 });
    }

    let targetReceiverId = receiver_id ? parseInt(receiver_id, 10) : null;

    if (!targetReceiverId) {
      // Default to admin for support
      const adminRes = await query(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
      );
      if (adminRes.rows.length === 0) {
        return NextResponse.json(
          { detail: "No admin available to receive message" },
          { status: 404 }
        );
      }
      targetReceiverId = adminRes.rows[0].id;
    }

    if (user.id === targetReceiverId) {
      return NextResponse.json({ detail: "Cannot send a message to yourself" }, { status: 400 });
    }

    // Verify recipient authorization
    if (user.role === "driver") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND role = 'admin'", [targetReceiverId]);
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
            { detail: "Forbidden: You can only message the administrator or owners of parkings you reserved" },
            { status: 403 }
          );
        }
      }
    } else if (user.role === "owner") {
      const adminCheck = await query("SELECT id FROM users WHERE id = $1 AND role = 'admin'", [targetReceiverId]);
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
            { detail: "Forbidden: You can only message the administrator or drivers who booked your parkings" },
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
