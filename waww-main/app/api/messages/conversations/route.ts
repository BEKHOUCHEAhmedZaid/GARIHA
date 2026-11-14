import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);

    const res = await query(
      `SELECT * FROM messages 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at DESC`,
      [admin.id]
    );

    const conversations: Record<number, any> = {};

    for (const m of res.rows) {
      const otherId = m.receiver_id === admin.id ? m.sender_id : m.receiver_id;
      if (!conversations[otherId]) {
        const userRes = await query(
          "SELECT id, full_name, avatar FROM users WHERE id = $1",
          [otherId]
        );
        if (userRes.rows.length === 0) continue;
        const u = userRes.rows[0];

        conversations[otherId] = {
          user_id: otherId,
          full_name: u.full_name,
          avatar: u.avatar,
          last_message: m.content,
          last_message_time: m.created_at,
          unread_count: 0,
        };
      }

      if (m.receiver_id === admin.id && m.is_read === 0) {
        conversations[otherId].unread_count += 1;
      }
    }

    return NextResponse.json(Object.values(conversations));
  } catch (err) {
    return handleApiError(err);
  }
}
