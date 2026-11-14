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
    const spotId = parseInt(id, 10);

    const check = await query(
      `SELECT s.id, p.owner_id 
       FROM parking_spots s 
       JOIN parkings p ON s.parking_id = p.id 
       WHERE s.id = $1`,
      [spotId]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Spot not found" }, { status: 404 });
    }
    if (check.rows[0].owner_id !== owner.id) {
      return NextResponse.json({ detail: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, level, status, price } = body;

    const res = await query(
      `UPDATE parking_spots
       SET name = COALESCE($1, name),
           level = COALESCE($2, level),
           status = COALESCE($3, status),
           price = COALESCE($4, price)
       WHERE id = $5
       RETURNING *`,
      [name, level, status, price, spotId]
    );

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireApprovedOwner(req);
    const { id } = await params;
    const spotId = parseInt(id, 10);

    const check = await query(
      `SELECT s.id, p.owner_id 
       FROM parking_spots s 
       JOIN parkings p ON s.parking_id = p.id 
       WHERE s.id = $1`,
      [spotId]
    );

    if (check.rows.length === 0) {
      return NextResponse.json({ detail: "Spot not found" }, { status: 404 });
    }
    if (check.rows[0].owner_id !== owner.id) {
      return NextResponse.json({ detail: "Not authorized" }, { status: 403 });
    }

    await query("DELETE FROM parking_spots WHERE id = $1", [spotId]);
    return NextResponse.json({ message: "Spot deleted successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
