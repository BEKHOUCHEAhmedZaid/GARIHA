import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "This Week";

    // Date range filter in Africa/Algiers timezone
    let dateFilter = "TRUE";
    let daysInPeriod = 7;
    if (period === "Today") {
      dateFilter = "DATE(r.created_at AT TIME ZONE 'Africa/Algiers') = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')::date";
      daysInPeriod = 1;
    } else if (period === "This Week") {
      dateFilter = "r.created_at >= DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')";
      daysInPeriod = 7;
    } else if (period === "This Month") {
      dateFilter = "r.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')";
      daysInPeriod = 30;
    } else if (period === "This Year") {
      dateFilter = "r.created_at >= DATE_TRUNC('year', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')";
      daysInPeriod = 365;
    }

    // 1. Summary Metrics
    const summaryRes = await query(
      `SELECT 
         COUNT(r.id) as total_reservations,
         COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as total_revenue,
         COUNT(r.id) FILTER (WHERE r.status IN ('completed', 'checked_in')) as completed_count,
         COUNT(r.id) FILTER (WHERE r.status = 'cancelled') as cancelled_count,
         COUNT(r.id) FILTER (WHERE r.status = 'active') as active_count
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE p.owner_id = $1 AND ${dateFilter}`,
      [owner.id]
    );

    const sRow = summaryRes.rows[0];
    const totalReservations = parseInt(sRow?.total_reservations || "0", 10);
    const totalRevenue = parseInt(sRow?.total_revenue || "0", 10);
    const avgDailyRevenue = Math.round(totalRevenue / daysInPeriod);

    // Total capacity of owner
    const capacityRes = await query(
      `SELECT COUNT(s.id) as total_spots 
       FROM parking_spots s
       JOIN parkings p ON s.parking_id = p.id
       WHERE p.owner_id = $1`,
      [owner.id]
    );
    const totalCapacity = parseInt(capacityRes.rows[0]?.total_spots || "0", 10);
    const peakOccupancy = totalCapacity > 0 
      ? Math.min(100, Math.round((parseInt(sRow?.active_count || "0", 10) / totalCapacity) * 100))
      : 0;

    // 2. Monthly Revenue for current year (Jan to Jun or Jan to Dec)
    const monthlyRevRes = await query(
      `WITH months AS (
         SELECT generate_series(1, 12) AS m
       )
       SELECT 
         m.m,
         COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as rev
       FROM months m
       LEFT JOIN reservations r ON EXTRACT(MONTH FROM r.created_at AT TIME ZONE 'Africa/Algiers') = m.m
         AND EXTRACT(YEAR FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
       LEFT JOIN parking_spots s ON r.parking_spot_id = s.id
       LEFT JOIN parkings p ON s.parking_id = p.id AND p.owner_id = $1
       GROUP BY m.m
       ORDER BY m.m`,
      [owner.id]
    );
    const monthlyRevenue = monthlyRevRes.rows.map((r) => parseInt(r.rev || "0", 10));

    // 3. Weekly Occupancy % (7 days Mon to Sun of current week)
    const weeklyOccRes = await query(
      `WITH days AS (
         SELECT 
           (DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers') + (n || ' days')::interval)::date AS day_date,
           n AS day_idx
         FROM generate_series(0, 6) AS n
       )
       SELECT 
         d.day_idx,
         COUNT(r.id) FILTER (WHERE r.status != 'cancelled') as count
       FROM days d
       LEFT JOIN reservations r ON DATE(r.created_at AT TIME ZONE 'Africa/Algiers') = d.day_date
       LEFT JOIN parking_spots s ON r.parking_spot_id = s.id
       LEFT JOIN parkings p ON s.parking_id = p.id AND p.owner_id = $1
       GROUP BY d.day_idx
       ORDER BY d.day_idx`,
      [owner.id]
    );
    const weeklyOccupancy = weeklyOccRes.rows.map((r) => {
      const cnt = parseInt(r.count || "0", 10);
      return totalCapacity > 0 ? Math.min(100, Math.round((cnt / totalCapacity) * 100)) : 0;
    });

    // 4. Status breakdown percentages
    const completedCount = parseInt(sRow?.completed_count || "0", 10);
    const cancelledCount = parseInt(sRow?.cancelled_count || "0", 10);
    const activeCount = parseInt(sRow?.active_count || "0", 10);

    const statusBreakdown = {
      completed: totalReservations > 0 ? Math.round((completedCount / totalReservations) * 100) : 0,
      cancelled: totalReservations > 0 ? Math.round((cancelledCount / totalReservations) * 100) : 0,
      active: totalReservations > 0 ? Math.round((activeCount / totalReservations) * 100) : 0,
      pending: totalReservations > 0 
        ? Math.max(0, 100 - Math.round((completedCount / totalReservations) * 100) - Math.round((cancelledCount / totalReservations) * 100) - Math.round((activeCount / totalReservations) * 100))
        : 0,
    };

    return NextResponse.json({
      period,
      total_revenue: totalRevenue,
      total_reservations: totalReservations,
      avg_daily_revenue: avgDailyRevenue,
      peak_occupancy: peakOccupancy,
      monthly_revenue: monthlyRevenue,
      weekly_occupancy: weeklyOccupancy,
      status_breakdown: statusBreakdown,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
