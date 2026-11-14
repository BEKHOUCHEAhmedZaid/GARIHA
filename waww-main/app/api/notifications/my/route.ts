import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    // Auto-mark scheduled notifications as sent if scheduled time has arrived
    await query(
      `UPDATE notifications 
       SET is_sent = 1 
       WHERE receiver_id = $1 AND is_sent = 0 AND scheduled_for <= NOW()`,
      [user.id]
    );

    const res = await query(
      `SELECT * FROM notifications 
       WHERE receiver_id = $1 AND (is_sent = 1 OR (scheduled_for IS NOT NULL AND scheduled_for <= NOW()))
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
