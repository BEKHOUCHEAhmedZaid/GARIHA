import { query } from "./db";

export async function expireStaleReservations(): Promise<void> {
  try {
    const staleRes = await query<{
      id: number;
      parking_spot_id: number;
      driver_id: number | null;
      spot_name: string | null;
    }>(`
      SELECT r.id, r.parking_spot_id, r.driver_id, s.name as spot_name
      FROM reservations r
      JOIN parking_spots s ON r.parking_spot_id = s.id
      WHERE r.status = 'active' AND r.expires_at <= NOW()
    `);

    for (const res of staleRes.rows) {
      await query("UPDATE reservations SET status = 'expired' WHERE id = $1", [res.id]);
      await query(
        "UPDATE parking_spots SET status = 'LIBRE' WHERE id = $1 AND status = 'RESERVEE'",
        [res.parking_spot_id]
      );

      if (res.driver_id) {
        await query(
          `INSERT INTO notifications (receiver_id, title, message, category, priority, is_sent)
           VALUES ($1, $2, $3, 'Reservation', 'Normal', 1)`,
          [
            res.driver_id,
            "Reservation Expired",
            `Your reservation for spot ${res.spot_name || "your spot"} has expired.`,
          ]
        );
      }
    }
  } catch (err) {
    console.error("Error in expireStaleReservations:", err);
  }
}

export async function createReservationNotification(
  receiverId: number | null | undefined,
  title: string,
  message: string,
  category = "Reservation"
): Promise<void> {
  if (!receiverId) return;
  try {
    await query(
      `INSERT INTO notifications (receiver_id, title, message, category, priority, is_sent)
       VALUES ($1, $2, $3, $4, 'Normal', 1)`,
      [receiverId, title, message, category]
    );
  } catch (e) {
    console.error("Failed to insert notification", e);
  }
}
