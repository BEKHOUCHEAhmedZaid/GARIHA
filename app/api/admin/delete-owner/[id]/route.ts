import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const ownerId = parseInt(id, 10);

    const check = await query(
      "SELECT id, email FROM users WHERE id = $1 AND role = 'owner'",
      [ownerId]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Owner not found" }, { status: 404 });
    }

    const email = check.rows[0].email;

    // Log the deletion action first
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details)
       VALUES ($1, 'delete_owner', NULL, $2)`,
      [admin.id, `Deleted owner ${email}`]
    );

    // Delete related entities (foreign keys cascade or manual cleanup)
    await query(
      "DELETE FROM admin_logs WHERE admin_id = $1 OR target_user_id = $1",
      [ownerId]
    );
    await query(
      "DELETE FROM notifications WHERE sender_id = $1 OR receiver_id = $1",
      [ownerId]
    );
    await query(
      "DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1",
      [ownerId]
    );

    // Delete parkings (spots cascade via foreign key constraint)
    await query("DELETE FROM parkings WHERE owner_id = $1", [ownerId]);

    // Finally delete user
    await query("DELETE FROM users WHERE id = $1", [ownerId]);

    return NextResponse.json({
      detail: "Owner and associated data deleted successfully",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
