import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const messageId = parseInt(id, 10);

    const check = await query(
      "SELECT id FROM messages WHERE id = $1 AND receiver_id = $2",
      [messageId, user.id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Message not found" }, { status: 404 });
    }

    await query("UPDATE messages SET is_read = 1 WHERE id = $1", [messageId]);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return handleApiError(err);
  }
}
