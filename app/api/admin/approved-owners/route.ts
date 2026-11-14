import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const res = await query(
      `SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.status, 
        u.avatar, 
        u.phone, 
        u.plate_number, 
        u.created_at, 
        u.updated_at,
        p.parking_name,
        p.location,
        p.total_places
       FROM users u
       LEFT JOIN parkings p ON p.owner_id = u.id
       WHERE u.role = 'owner' AND u.status = 'approved'
       ORDER BY u.created_at DESC`
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
