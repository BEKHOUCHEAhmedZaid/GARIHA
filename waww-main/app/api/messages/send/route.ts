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

    let targetReceiverId = receiver_id;

    if (user.role === "owner") {
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

    if (!targetReceiverId) {
      return NextResponse.json({ detail: "Receiver is required" }, { status: 400 });
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
