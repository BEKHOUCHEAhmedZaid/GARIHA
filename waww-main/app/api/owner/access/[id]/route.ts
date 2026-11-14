import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireApprovedOwner(req);
    const { id } = await params;
    const ruleId = parseInt(id, 10);

    // Verify the rule belongs to a parking owned by this owner
    const check = await query(
      `SELECT r.id 
       FROM parking_access_rules r
       JOIN parkings p ON r.parking_id = p.id
       WHERE r.id = $1 AND p.owner_id = $2`,
      [ruleId, owner.id]
    );

    if (check.rows.length === 0) {
      return NextResponse.json(
        { detail: "Rule not found or unauthorized" },
        { status: 404 }
      );
    }

    await query("DELETE FROM parking_access_rules WHERE id = $1", [ruleId]);
    return NextResponse.json({ success: true, deleted_id: ruleId });
  } catch (err) {
    return handleApiError(err);
  }
}
