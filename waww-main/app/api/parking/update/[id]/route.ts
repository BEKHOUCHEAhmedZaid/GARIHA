import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireApprovedOwner(req);
    const { id } = await params;
    const parkingId = parseInt(id, 10);

    const check = await query("SELECT * FROM parkings WHERE id = $1", [parkingId]);
    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Parking not found" }, { status: 404 });
    }
    if (check.rows[0].owner_id !== owner.id) {
      return NextResponse.json(
        { detail: "Not authorized to update this parking" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "parking_name",
      "location",
      "total_places",
      "available_places",
      "pricing",
      "opening_hours",
      "description",
      "lat",
      "lng",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        values.push(body[key]);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(check.rows[0]);
    }

    values.push(parkingId);
    const updateSql = `
      UPDATE parkings 
      SET ${fields.join(", ")}, updated_at = NOW() 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const res = await query(updateSql, values);
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
