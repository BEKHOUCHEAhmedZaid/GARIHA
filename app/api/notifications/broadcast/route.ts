import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      title,
      message,
      category = "📢 Announcement",
      priority = "Normal",
      target_role = "All Users",
      scheduled_for = null,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { detail: "Title and message are required" },
        { status: 400 }
      );
    }

    let roleFilter = "";
    if (target_role === "Drivers Only") {
      roleFilter = "WHERE role = 'driver'";
    } else if (target_role === "Owners Only") {
      roleFilter = "WHERE role = 'owner'";
    } else {
      roleFilter = "WHERE role != 'admin'";
    }

    const usersRes = await query(`SELECT id FROM users ${roleFilter}`);
    if (usersRes.rows.length === 0) {
      return NextResponse.json({ message: "No users found for this target" });
    }

    const isSent = scheduled_for ? 0 : 1;
    for (const u of usersRes.rows) {
      await query(
        `INSERT INTO notifications (
          sender_id, receiver_id, title, message, category, priority, scheduled_for, is_sent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [admin.id, u.id, title, message, category, priority, scheduled_for, isSent]
      );
    }

    return NextResponse.json({
      message: `Successfully created ${usersRes.rows.length} notifications`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
