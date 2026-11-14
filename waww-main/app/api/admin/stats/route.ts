import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    // 1. Users count by role & status
    const usersCountRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'driver') as total_drivers,
        COUNT(*) FILTER (WHERE role = 'owner') as total_owners,
        COUNT(*) FILTER (WHERE role = 'owner' AND status = 'pending') as pending_owners,
        COUNT(*) FILTER (WHERE role = 'owner' AND status = 'approved') as approved_owners,
        COUNT(*) FILTER (WHERE role = 'owner' AND status = 'rejected') as rejected_owners,
        COUNT(*) FILTER (WHERE DATE(created_at AT TIME ZONE 'Africa/Algiers') = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')::date) as new_users_today
      FROM users
    `);
    const uStats = usersCountRes.rows[0];

    // 2. Parkings count
    const parkingsCountRes = await query("SELECT COUNT(*) as total FROM parkings");
    const totalParkings = parseInt(parkingsCountRes.rows[0]?.total || "0", 10);

    // 3. Real Revenue & Transactions from recorded reservations
    const reservationsStatsRes = await query(`
      SELECT 
        COUNT(*) as total_reservations,
        COUNT(*) FILTER (WHERE DATE(r.created_at AT TIME ZONE 'Africa/Algiers') = (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')::date) as today_transactions,
        COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as total_revenue
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
    `);
    const rStats = reservationsStatsRes.rows[0];

    const totalDrivers = parseInt(uStats.total_drivers || "0", 10);
    const approvedOwners = parseInt(uStats.approved_owners || "0", 10);
    const pendingOwners = parseInt(uStats.pending_owners || "0", 10);
    const rejectedOwners = parseInt(uStats.rejected_owners || "0", 10);
    const newUsersToday = parseInt(uStats.new_users_today || "0", 10);

    const totalRevenue = parseInt(rStats.total_revenue || "0", 10);
    const todayTransactions = parseInt(rStats.today_transactions || "0", 10);
    const totalTransactions = parseInt(rStats.total_reservations || "0", 10);
    const commissionsEarned = Math.floor(totalRevenue * 0.1);

    // 4. Revenue evolution (Week, Month, Year in Africa/Algiers timezone)
    // Week: 7 days Mon-Sun of current week
    const weekRevRes = await query(`
      WITH days AS (
        SELECT 
          (DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers') + (n || ' days')::interval)::date AS day_date,
          n AS day_idx
        FROM generate_series(0, 6) AS n
      )
      SELECT 
        d.day_idx,
        COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as rev
      FROM days d
      LEFT JOIN reservations r ON DATE(r.created_at AT TIME ZONE 'Africa/Algiers') = d.day_date
      LEFT JOIN parking_spots s ON r.parking_spot_id = s.id
      GROUP BY d.day_idx
      ORDER BY d.day_idx
    `);
    const weekData = Array(7).fill(0);
    for (const row of weekRevRes.rows) {
      weekData[row.day_idx] = parseInt(row.rev || "0", 10);
    }

    // Month: 4 weeks of current month (days 1-7, 8-14, 15-21, 22-end)
    const monthRevRes = await query(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM r.created_at AT TIME ZONE 'Africa/Algiers') <= 7 THEN 0
          WHEN EXTRACT(DAY FROM r.created_at AT TIME ZONE 'Africa/Algiers') <= 14 THEN 1
          WHEN EXTRACT(DAY FROM r.created_at AT TIME ZONE 'Africa/Algiers') <= 21 THEN 2
          ELSE 3
        END as week_idx,
        COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as rev
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
      WHERE EXTRACT(MONTH FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
        AND EXTRACT(YEAR FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
      GROUP BY 1
    `);
    const monthData = Array(4).fill(0);
    for (const row of monthRevRes.rows) {
      monthData[row.week_idx] = parseInt(row.rev || "0", 10);
    }

    // Year: 12 months Jan-Dec of current year
    const yearRevRes = await query(`
      WITH months AS (
        SELECT generate_series(1, 12) AS m
      )
      SELECT 
        m.m,
        COALESCE(SUM(CASE WHEN r.status != 'cancelled' THEN s.price ELSE 0 END), 0) as rev
      FROM months m
      LEFT JOIN reservations r ON EXTRACT(MONTH FROM r.created_at AT TIME ZONE 'Africa/Algiers') = m.m
        AND EXTRACT(YEAR FROM r.created_at AT TIME ZONE 'Africa/Algiers') = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Algiers')
      LEFT JOIN parking_spots s ON r.parking_spot_id = s.id
      GROUP BY m.m
      ORDER BY m.m
    `);
    const yearData = Array(12).fill(0);
    for (const row of yearRevRes.rows) {
      yearData[row.m - 1] = parseInt(row.rev || "0", 10);
    }

    // 5. Recent Transactions
    const recentTxRes = await query(`
      SELECT 
        r.id,
        p.parking_name,
        r.driver_name,
        r.plate_number,
        s.price as amount,
        FLOOR(s.price * 0.1) as commission,
        r.status,
        r.created_at
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
      JOIN parkings p ON s.parking_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    const recentTransactions = recentTxRes.rows.map((tx) => ({
      id: tx.id,
      parking_name: tx.parking_name,
      driver_name: tx.driver_name,
      plate_number: tx.plate_number,
      amount: parseInt(tx.amount || "0", 10),
      commission: parseInt(tx.commission || "0", 10),
      status: tx.status,
      created_at: tx.created_at,
    }));

    // 6. Platform Activity
    const activityRes = await query(`
      SELECT 
        id, 
        'admin_log' as kind, 
        action as action_title, 
        details as details, 
        created_at 
      FROM admin_logs
      UNION ALL
      SELECT 
        r.id, 
        'reservation' as kind, 
        CONCAT('Reservation #', r.id, ' (', r.status, ')') as action_title, 
        CONCAT(r.driver_name, ' (', r.plate_number, ') - ', p.parking_name) as details, 
        r.created_at 
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
      JOIN parkings p ON s.parking_id = p.id
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const platformActivity = activityRes.rows;

    return NextResponse.json({
      total_parkings: totalParkings,
      total_drivers: totalDrivers,
      active_drivers: totalDrivers,
      approved_owners: approvedOwners,
      pending_owners: pendingOwners,
      suspended_owners: rejectedOwners,
      revenue: totalRevenue,
      transactions: todayTransactions,
      total_transactions: totalTransactions,
      new_users: newUsersToday,
      total_processed: totalRevenue,
      commissions_earned: commissionsEarned,
      pending_validations: pendingOwners,
      revenue_evolution: {
        week: weekData,
        month: monthData,
        year: yearData,
      },
      user_distribution: [totalDrivers, approvedOwners, pendingOwners, rejectedOwners],
      recent_transactions: recentTransactions,
      platform_activity: platformActivity,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
