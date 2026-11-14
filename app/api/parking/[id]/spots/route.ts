import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireApprovedOwner(req);
    const { id } = await params;
    const parkingId = parseInt(id, 10);

    const check = await query("SELECT owner_id FROM parkings WHERE id = $1", [
      parkingId,
    ]);
    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Parking not found" }, { status: 404 });
    }
    if (check.rows[0].owner_id !== owner.id) {
      return NextResponse.json({ detail: "Not authorized" }, { status: 403 });
    }

    const res = await query(
      "SELECT * FROM parking_spots WHERE parking_id = $1 ORDER BY id ASC",
      [parkingId]
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireApprovedOwner(req);
    const { id } = await params;
    const parkingId = parseInt(id, 10);

    const check = await query("SELECT owner_id FROM parkings WHERE id = $1", [
      parkingId,
    ]);
    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Parking not found" }, { status: 404 });
    }
    if (check.rows[0].owner_id !== owner.id) {
      return NextResponse.json({ detail: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, level = "Ground", status = "LIBRE", price = 250 } = body;

    if (!name) {
      return NextResponse.json({ detail: "Spot name is required" }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO parking_spots (parking_id, name, level, status, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parkingId, name, level, status, price]
    );

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
