import { NextResponse } from "next/server";
import { query, ensureTables } from "@/lib/db";
import { hashPassword, getAdminEmails, handleApiError } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // In production, strictly require SETUP_SECRET to be defined AND match the header
    const isProd = process.env.NODE_ENV === "production";
    const setupSecret = process.env.SETUP_SECRET;

    if (isProd) {
      if (!setupSecret) {
        return NextResponse.json(
          { detail: "Forbidden: SETUP_SECRET is not configured on this server" },
          { status: 403 }
        );
      }
      const headerSecret = req.headers.get("x-setup-secret");
      if (!headerSecret || headerSecret !== setupSecret) {
        return NextResponse.json(
          { detail: "Forbidden: invalid setup secret" },
          { status: 403 }
        );
      }
    } else if (setupSecret) {
      // In non-production, if SETUP_SECRET is set, enforce it as well
      const headerSecret = req.headers.get("x-setup-secret");
      if (!headerSecret || headerSecret !== setupSecret) {
        return NextResponse.json(
          { detail: "Forbidden: invalid setup secret" },
          { status: 403 }
        );
      }
    }

    // 1. Ensure tables and indexes exist
    await ensureTables();

    // 2. Check if an initial admin is configured via environment variables
    const adminEmails = getAdminEmails();
    const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;

    let adminCreated = false;
    let adminEmail = null;

    if (adminEmails.length > 0 && initialAdminPassword) {
      adminEmail = adminEmails[0];
      const existing = await query(
        "SELECT id, role, status FROM users WHERE LOWER(email) = LOWER($1)",
        [adminEmail]
      );

      if (existing.rows.length === 0) {
        const hashed = await hashPassword(initialAdminPassword);
        await query(
          `INSERT INTO users (full_name, email, hashed_password, role, status)
           VALUES ($1, $2, $3, 'admin', 'approved')`,
          ["Super Administrator", adminEmail, hashed]
        );
        adminCreated = true;
      } else {
        // Ensure role is admin
        await query(
          "UPDATE users SET role = 'admin', status = 'approved', updated_at = NOW() WHERE id = $1",
          [existing.rows[0].id]
        );
      }
    }

    return NextResponse.json({
      status: "Database initialized successfully",
      tables_created: true,
      initial_admin_configured: adminEmails.length > 0 && !!initialAdminPassword,
      initial_admin_created: adminCreated,
      admin_email: adminEmail ? adminEmail : undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
