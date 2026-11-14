import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const res = await query(
      `SELECT id, email, full_name, role, status, avatar, phone, plate_number, created_at, updated_at
       FROM users WHERE role = 'owner' AND status = 'pending'
       ORDER BY created_at DESC`
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
