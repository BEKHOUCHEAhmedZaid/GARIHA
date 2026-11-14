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
    const values: any[] = [];

    if (roleFilter) {
      values.push(roleFilter.toLowerCase());
      conditions.push(`LOWER(role) = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(
        `(LOWER(full_name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT id, email, full_name, role, status, avatar, phone, plate_number, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const res = await query(sql, values);
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
