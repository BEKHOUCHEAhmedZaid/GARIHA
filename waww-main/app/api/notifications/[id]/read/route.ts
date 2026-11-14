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
    const notifId = parseInt(id, 10);

    const check = await query(
      "SELECT id FROM notifications WHERE id = $1 AND receiver_id = $2",
      [notifId, user.id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Notification not found" }, { status: 404 });
    }

    await query("UPDATE notifications SET is_read = 1 WHERE id = $1", [notifId]);
    return NextResponse.json({ message: "Notification marked as read" });
  } catch (err) {
    return handleApiError(err);
  }
}
