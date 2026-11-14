import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const res = await query(
      "SELECT * FROM parkings WHERE owner_id = $1 ORDER BY created_at DESC",
      [owner.id]
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return handleApiError(err);
  }
}
