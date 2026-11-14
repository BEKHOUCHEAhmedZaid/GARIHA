import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, handleApiError, verifyPassword, hashPassword } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);

    const countRes = await query(
      "SELECT COUNT(*) as total FROM reservations WHERE driver_id = $1",
      [user.id]
    );
    const totalReservations = parseInt(countRes.rows[0].total || "0", 10);

    const activeRes = await query(
      `SELECT r.*, s.name as spot_name, s.price as spot_price, p.parking_name
       FROM reservations r
       JOIN parking_spots s ON r.parking_spot_id = s.id
       JOIN parkings p ON s.parking_id = p.id
       WHERE r.driver_id = $1 AND r.status IN ('active', 'checked_in')
       ORDER BY r.created_at DESC LIMIT 1`,
      [user.id]
    );

    let activeData = null;
    if (activeRes.rows.length > 0) {
      const a = activeRes.rows[0];
      activeData = {
        id: a.id,
        parking_spot_id: a.parking_spot_id,
        driver_name: a.driver_name,
        plate_number: a.plate_number,
        status: a.status,
        created_at: a.created_at,
        expires_at: a.expires_at,
        spot_name: a.spot_name,
        parking_name: a.parking_name,
        spot_price: a.spot_price,
      };
    }

    return NextResponse.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      plate_number: user.plate_number,
      role: user.role,
      created_at: user.created_at,
      total_reservations: totalReservations,
      active_reservation: activeData,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { full_name, phone, plate_number, current_password, new_password } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ detail: "Le nom complet est obligatoire." }, { status: 400 });
    }

    // Password change verification if provided
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ detail: "Veuillez saisir votre mot de passe actuel." }, { status: 400 });
      }
      if (new_password.length < 6) {
        return NextResponse.json({ detail: "Le nouveau mot de passe doit comporter au moins 6 caractères." }, { status: 400 });
      }

      // Fetch user's current hashed_password
      const userRes = await query("SELECT hashed_password FROM users WHERE id = $1", [user.id]);
      const currentHashed = userRes.rows[0]?.hashed_password;

      if (!currentHashed) {
        return NextResponse.json({ detail: "Impossible de modifier le mot de passe pour ce compte." }, { status: 400 });
      }

      const isMatch = await verifyPassword(current_password, currentHashed);
      if (!isMatch) {
        return NextResponse.json({ detail: "Le mot de passe actuel est incorrect." }, { status: 400 });
      }

      const newHashed = await hashPassword(new_password);
      await query("UPDATE users SET hashed_password = $1 WHERE id = $2", [newHashed, user.id]);
    }

    // Update profile info
    const updateRes = await query(
      `UPDATE users 
       SET full_name = $1, 
           phone = $2, 
           plate_number = $3, 
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, full_name, email, phone, plate_number, role, created_at`,
      [
        full_name.trim(),
        phone ? phone.trim() : null,
        plate_number ? plate_number.trim().toUpperCase() : null,
        user.id,
      ]
    );

    const updated = updateRes.rows[0];

    return NextResponse.json({
      message: "Profil mis à jour avec succès !",
      user: {
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        plate_number: updated.plate_number,
        role: updated.role,
        created_at: updated.created_at,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
