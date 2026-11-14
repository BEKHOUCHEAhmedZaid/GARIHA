import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApprovedOwner, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);

    // 1. Get owner's parkings
    const parkingsRes = await query(
      `SELECT * FROM parkings WHERE owner_id = $1 ORDER BY created_at DESC`,
      [owner.id]
    );
    const parkings = parkingsRes.rows;
    const totalParkings = parkings.length;

    let totalPlaces = 0;
    let occupiedPlaces = 0;
    let availablePlaces = 0;
    let unavailablePlaces = 0;
    let reservationsCount = 0;

    const occupancyTrend = [0, 0, 0, 0, 0, 0, 0];
    const revenueTrend = [0, 0, 0, 0, 0, 0, 0];
    let recentActivity: Array<{
      id: number;
      driver_name: string;
      plate_number: string;
      status: string;
      created_at: string;
      expires_at: string;
      spot_name: string;
      price: number;
      parking_name: string;
    }> = [];
    let monthlyRevenue = 0;

    if (totalParkings > 0) {
      const parkingIds = parkings.map((p) => p.id);

      // Spots breakdown
      const spotsRes = await query(
        `SELECT id, parking_id, name, level, status, price 
         FROM parking_spots 
         WHERE parking_id = ANY($1::int[])`,
        [parkingIds]
      );

      const spots = spotsRes.rows;
      totalPlaces = spots.length;

      for (const s of spots) {
        const st = (s.status || "").toLowerCase();
        if (st === "occupee" || st === "occupied") {
          occupiedPlaces++;
        } else if (st === "libre" || st === "available") {
          availablePlaces++;
        } else if (st === "reservee" || st === "reserved") {
          reservationsCount++;
        } else if (st === "indisponible" || st === "unavailable") {
          unavailablePlaces++;
        }
      }

      // Real Monthly Revenue for current month in Africa/Algiers timezone
      const monthlyRevRes = await query(
        `SELECT COALESCE(SUM(s.price), 0) as rev
         FROM reservations r
         JOIN parking_spots s ON r.parking_spot_id = s.id
         JOIN parkings p ON s.parking_id = p.id
         WHERE p.owner_id = $1
           AND r.status != 'cancelled'
           AND EXTRACT(MONTH FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
           AND EXTRACT(YEAR FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')`,
        [owner.id]
      );
      monthlyRevenue = parseInt(monthlyRevRes.rows[0]?.rev || "0", 10);

      // Weekly Revenue Trend & Occupancy Trend (Mon-Sun of current week in Africa/Algiers)
      const weeklyTrendRes = await query(
        `WITH days AS (
           SELECT 
             (DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers') + (n || ' days')::interval)::date AS day_date,
             n AS day_idx
           FROM generate_series(0, 6) AS n
         )
         SELECT 
           d.day_idx,
           COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as rev,
           COUNT(r.id) FILTER (WHERE r.status != 'cancelled') as res_count
         FROM days d
         LEFT JOIN reservations r ON DATE(r.created_at AT TIME ZONE 'Africa/Algiers') = d.day_date
         LEFT JOIN parking_spots s ON r.parking_spot_id = s.id
         LEFT JOIN parkings p ON s.parking_id = p.id AND p.owner_id = $1
         GROUP BY d.day_idx
         ORDER BY d.day_idx`,
        [owner.id]
      );

      for (const row of weeklyTrendRes.rows) {
        const rev = parseInt(row.rev || "0", 10);
        const count = parseInt(row.res_count || "0", 10);
        revenueTrend[row.day_idx] = rev;
        // Occupancy % formula: (reservations on that day / total places) * 100 capped at 100%
        occupancyTrend[row.day_idx] = totalPlaces > 0 
          ? Math.min(100, Math.round((count / totalPlaces) * 100))
          : 0;
      }

      // Recent Activity for this owner's parkings
      const recentActRes = await query(
        `SELECT 
           r.id, 
           r.driver_name, 
           r.plate_number, 
           r.status, 
           r.created_at, 
           r.expires_at,
           s.name as spot_name, 
           s.price,
           p.parking_name
         FROM reservations r
         JOIN parking_spots s ON r.parking_spot_id = s.id
         JOIN parkings p ON s.parking_id = p.id
         WHERE p.owner_id = $1
         ORDER BY r.created_at DESC
         LIMIT 6`,
        [owner.id]
      );
      recentActivity = recentActRes.rows as unknown as typeof recentActivity;
    }

    const totalDrivers = occupiedPlaces + reservationsCount;

    return NextResponse.json({
      total_parkings: totalParkings,
      total_places: totalPlaces,
      available_places: availablePlaces,
      occupied_places: occupiedPlaces,
      unavailable_places: unavailablePlaces,
      total_drivers: totalDrivers,
      reservations_count: reservationsCount,
      revenue: monthlyRevenue,
      monthly_revenue: monthlyRevenue,
      occupancy_trend: occupancyTrend,
      revenue_trend: revenueTrend,
      recent_activity: recentActivity,
      parkings,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
