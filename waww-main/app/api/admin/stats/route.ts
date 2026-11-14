import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const ownersCountRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved
      FROM users WHERE role = 'owner'
    `);

    const ownersStats = ownersCountRes.rows[0];

    const parkingsCountRes = await query("SELECT COUNT(*) as total FROM parkings");
    const totalParkings = parseInt(parkingsCountRes.rows[0].total || "0", 10);

    const spotsStatsRes = await query(`
      SELECT 
        COUNT(*) as total_spots,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('occupee', 'occupied', 'reservee', 'reserved')) as active_drivers,
        COALESCE(SUM(price * 30), 0) as total_revenue
      FROM parking_spots
    `);

    const spotsStats = spotsStatsRes.rows[0];
    const activeDrivers = parseInt(spotsStats.active_drivers || "0", 10);
    const revenue = parseInt(spotsStats.total_revenue || "0", 10);
    const transactions = activeDrivers * 2;

    return NextResponse.json({
      total_owners: parseInt(ownersStats.total || "0", 10),
      pending_owners: parseInt(ownersStats.pending || "0", 10),
      approved_owners: parseInt(ownersStats.approved || "0", 10),
      suspended_owners: 0,
      total_parkings: totalParkings,
      active_drivers: activeDrivers,
      reported_drivers: 0,
      banned_drivers: 0,
      revenue: revenue,
      transactions: transactions,
      new_users: 0,
      open_reports: 0,
      warnings_issued: 0,
      bans_this_month: 0,
      resolved_reports: 0,
      total_processed: revenue,
      commissions_earned: Math.floor(revenue * 0.1),
      pending_payments: 0,
      disputes: 0,
      pending_validations: parseInt(ownersStats.pending || "0", 10),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
