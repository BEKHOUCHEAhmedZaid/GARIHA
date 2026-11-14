import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (user.role !== "driver") {
      return NextResponse.json({ detail: "Accès réservé aux conducteurs" }, { status: 403 });
    }

    const contacts: Array<{
      user_id: number;
      full_name: string;
      email: string;
      avatar: string;
      role: string;
      subtitle: string;
    }> = [];

    // 1. Admin / Support GARIHA
    const adminRes = await query(
      "SELECT id, full_name, email, avatar, role FROM users WHERE LOWER(role) = 'admin' ORDER BY id ASC LIMIT 1"
    );
    if (adminRes.rows.length > 0) {
      const a = adminRes.rows[0];
      contacts.push({
        user_id: a.id,
        full_name: "Support GARIHA (Admin)",
        email: a.email,
        avatar: a.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png",
        role: "admin",
        subtitle: "Assistance & Support plateforme",
      });
    }

    // 2. Parking Owners for this driver's reservations (deduplicated by owner u.id)
    const ownersRes = await query(
      `SELECT 
         u.id as user_id, 
         u.full_name, 
         u.email, 
         u.avatar, 
         u.role, 
         string_agg(DISTINCT p.parking_name, ', ') as parking_names
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       JOIN users u ON p.owner_id = u.id
       WHERE r.driver_id = $1
       GROUP BY u.id, u.full_name, u.email, u.avatar, u.role
       ORDER BY u.full_name ASC`,
      [user.id]
    );

    for (const o of ownersRes.rows) {
      contacts.push({
        user_id: o.user_id,
        full_name: o.full_name,
        email: o.email,
        avatar: o.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png",
        role: "owner",
        subtitle: `Propriétaire — ${o.parking_names}`,
      });
    }

    return NextResponse.json(contacts);
  } catch (err) {
    return handleApiError(err);
  }
}
