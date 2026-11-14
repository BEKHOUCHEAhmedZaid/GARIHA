import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);

    // 1. Get access rules for owner's parkings
    const rulesRes = await query(
      `SELECT r.id, r.parking_id, r.driver_name, r.plate_number, r.rule_type, r.notes, r.created_at, r.expires_at, p.parking_name
       FROM parking_access_rules r
       JOIN parkings p ON r.parking_id = p.id
       WHERE p.owner_id = $1
       ORDER BY r.created_at DESC`,
      [owner.id]
    );

    const whitelisted = rulesRes.rows
      .filter((r) => r.rule_type === "whitelist")
      .map((r) => ({
        id: r.id,
        name: r.driver_name,
        initials: (r.driver_name || "D")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        plate: r.plate_number,
        parking_name: r.parking_name,
        whitelistedAt: new Date(r.created_at).getTime(),
        expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : new Date(r.created_at).getTime() + 7 * 86400000,
      }));

    const blacklisted = rulesRes.rows
      .filter((r) => r.rule_type === "blacklist")
      .map((r) => ({
        id: r.id,
        name: r.driver_name,
        initials: (r.driver_name || "D")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        plate: r.plate_number,
        parking_name: r.parking_name,
        notes: r.notes,
        createdAt: r.created_at,
      }));

    // 2. Active access requests/drivers (currently active reservations on owner's parkings)
    const activeRequestsRes = await query(
      `SELECT r.id, r.driver_name, r.plate_number, r.status, r.created_at, r.expires_at, s.name as spot_name, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE p.owner_id = $1 AND r.status IN ('active', 'checked_in')
       ORDER BY r.created_at DESC`,
      [owner.id]
    );

    return NextResponse.json({
      whitelisted,
      blacklisted,
      active_access_drivers: activeRequestsRes.rows,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const body = await req.json();
    const { driver_name, plate_number, rule_type = "whitelist", parking_id, notes } = body;

    if (!driver_name || !plate_number) {
      return NextResponse.json(
        { detail: "Driver name and plate number are required" },
        { status: 400 }
      );
    }

    // Determine parking_id (either specified or first parking of owner)
    let targetParkingId = parking_id;
    if (!targetParkingId) {
      const firstP = await query(
        "SELECT id FROM parkings WHERE owner_id = $1 LIMIT 1",
        [owner.id]
      );
      if (firstP.rows.length === 0) {
        return NextResponse.json(
          { detail: "No parking found for this owner" },
          { status: 404 }
        );
      }
      targetParkingId = firstP.rows[0].id;
    } else {
      // Verify ownership
      const check = await query(
        "SELECT id FROM parkings WHERE id = $1 AND owner_id = $2",
        [targetParkingId, owner.id]
      );
      if (check.rows.length === 0) {
        return NextResponse.json(
          { detail: "Parking not found or unauthorized" },
          { status: 403 }
        );
      }
    }

    const expiresAt = rule_type === "whitelist" 
      ? new Date(Date.now() + 7 * 86400000) // 7 days free access
      : null;

    const inserted = await query(
      `INSERT INTO parking_access_rules (parking_id, driver_name, plate_number, rule_type, notes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [targetParkingId, driver_name.trim(), plate_number.trim().toUpperCase(), rule_type, notes || null, expiresAt]
    );

    return NextResponse.json(inserted.rows[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
