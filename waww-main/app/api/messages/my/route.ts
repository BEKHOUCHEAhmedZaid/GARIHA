import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const res = await query(
      `SELECT * FROM messages 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at ASC`,
      [user.id]
    );

    await query(
      "UPDATE messages SET is_read = 1 WHERE receiver_id = $1 AND is_read = 0",
      [user.id]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
