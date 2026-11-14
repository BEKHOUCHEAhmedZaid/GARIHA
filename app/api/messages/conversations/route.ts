import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const res = await query(
      `SELECT * FROM messages 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    const conversations: Record<number, {
      user_id: number;
      full_name: string;
      avatar: string;
      role: string;
      subtitle?: string;
      last_message: string;
      last_message_time: string;
      unread_count: number;
    }> = {};

    for (const m of res.rows) {
      const otherId = m.receiver_id === user.id ? m.sender_id : m.receiver_id;
      if (!conversations[otherId]) {
        const userRes = await query(
          "SELECT id, full_name, avatar, role FROM users WHERE id = $1",
          [otherId]
        );
        if (userRes.rows.length === 0) continue;
        const u = userRes.rows[0];

        let subtitle = u.role === "admin" ? "Support GARIHA" : u.role === "owner" ? "Propriétaire de parking" : "Conducteur";
        if (u.role === "owner") {
          const pRes = await query("SELECT parking_name FROM parkings WHERE owner_id = $1 LIMIT 1", [u.id]);
          if (pRes.rows.length > 0) {
            subtitle = `Propriétaire — ${pRes.rows[0].parking_name}`;
          }
        }

        conversations[otherId] = {
          user_id: otherId,
          full_name: u.role === "admin" ? "Support GARIHA" : u.full_name,
          avatar: u.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png",
          role: u.role,
          subtitle,
          last_message: m.content,
          last_message_time: m.created_at,
          unread_count: 0,
        };
      }

      if (m.receiver_id === user.id && m.is_read === 0) {
        conversations[otherId].unread_count += 1;
      }
    }

    return NextResponse.json(Object.values(conversations));
  } catch (err) {
    return handleApiError(err);
  }
}
