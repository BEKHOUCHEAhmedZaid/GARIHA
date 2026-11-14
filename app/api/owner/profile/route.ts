import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  requireApprovedOwner,
  hashPassword,
  handleApiError,
} from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const owner = await requireApprovedOwner(req);
    const body = await req.json();
    const { email, phone, password } = body;

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      const existing = await query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2 LIMIT 1",
        [trimmedEmail, owner.id]
      );
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { detail: "Email already registered" },
          { status: 400 }
        );
      }
      await query("UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2", [
        trimmedEmail,
        owner.id,
      ]);
    }

    if (phone !== undefined) {
      await query("UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2", [
        phone || null,
        owner.id,
      ]);
    }

    if (password) {
      const hashed = await hashPassword(password);
      await query(
        "UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE id = $2",
        [hashed, owner.id]
      );
    }

    const updated = await query(
      `SELECT id, email, full_name, role, status, avatar, phone, plate_number, created_at, updated_at
       FROM users WHERE id = $1`,
      [owner.id]
    );

    return NextResponse.json(updated.rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
