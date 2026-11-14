import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    const res = await query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [admin.id, otherUserId]
    );

    await query(
      "UPDATE messages SET is_read = 1 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0",
      [otherUserId, admin.id]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
