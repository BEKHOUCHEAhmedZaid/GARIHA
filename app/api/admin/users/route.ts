import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role") || "";
    const search = searchParams.get("search") || "";

    const conditions: string[] = [];
    const values: string[] = [];

    if (roleFilter) {
      values.push(roleFilter.toLowerCase());
      conditions.push(`LOWER(u.role) = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(COALESCE(u.phone, '')) LIKE $${values.length} OR LOWER(COALESCE(u.plate_number, '')) LIKE $${values.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.status, 
        u.avatar, 
        u.phone, 
        COALESCE(u.plate_number, (SELECT r.plate_number FROM reservations r WHERE r.driver_id = u.id ORDER BY r.created_at DESC LIMIT 1)) AS plate_number,
        (SELECT COUNT(*)::int FROM reservations r WHERE r.driver_id = u.id) AS reservations_count,
        (SELECT COALESCE(SUM(ps.price), 0)::int FROM reservations r JOIN parking_spots ps ON ps.id = r.parking_spot_id WHERE r.driver_id = u.id AND r.status != 'cancelled') AS total_spent,
        (SELECT string_agg(p.parking_name, ', ') FROM parkings p WHERE p.owner_id = u.id) AS parking_name,
        (SELECT string_agg(p.location, ' | ') FROM parkings p WHERE p.owner_id = u.id) AS parking_location,
        (SELECT COALESCE(SUM(p.total_places), 0)::int FROM parkings p WHERE p.owner_id = u.id) AS total_places,
        (SELECT COALESCE(SUM(p.available_places), 0)::int FROM parkings p WHERE p.owner_id = u.id) AS available_places,
        u.created_at, 
        u.updated_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const res = await query(sql, values);
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
