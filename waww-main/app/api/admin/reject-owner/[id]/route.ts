import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function PUT(
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

    const updated = await query(
      `UPDATE users SET status = 'rejected', updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, status, avatar, phone, plate_number, created_at, updated_at`,
      [ownerId]
    );

    await query(
      `INSERT INTO admin_logs (admin_id, action, target_user_id, details)
       VALUES ($1, 'reject_owner', $2, $3)`,
      [admin.id, ownerId, `Rejected owner ${check.rows[0].email}`]
    );

    return NextResponse.json(updated.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
