import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  createAccessToken,
  setAuthCookie,
  getAdminEmails,
  handleApiError,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ detail: "Token is required" }, { status: 400 });
    }

    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!googleRes.ok) {
      return NextResponse.json({ detail: "Invalid Google Token" }, { status: 401 });
    }

    const idinfo = await googleRes.json();
    const email = idinfo.email?.toLowerCase();
    const fullName = idinfo.name || "Google User";
    const googleId = idinfo.sub;
    const avatar = idinfo.picture || null;

    if (!email) {
      return NextResponse.json(
        { detail: "Email not found in Google token" },
        { status: 400 }
      );
    }

    const adminList = getAdminEmails();
    const isAdmin = adminList.includes(email);

    const userRes = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [
      email,
    ]);

    let user = userRes.rows[0];

    if (!user) {
      const initialRole = isAdmin ? "admin" : "owner";
      const initialStatus = isAdmin ? "approved" : "pending";

      const insertRes = await query(
        `INSERT INTO users (email, full_name, google_id, avatar, role, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, status`,
        [email, fullName, googleId, avatar, initialRole, initialStatus]
      );
      user = insertRes.rows[0];
    } else {
      const targetRole = isAdmin ? "admin" : user.role;
      const targetStatus = isAdmin ? "approved" : user.status;

      const updateRes = await query(
        `UPDATE users 
         SET full_name = $1, google_id = $2, avatar = COALESCE($3, avatar),
             role = $4, status = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING id, email, full_name, role, status`,
        [fullName, googleId, avatar, targetRole, targetStatus, user.id]
      );
      user = updateRes.rows[0];
    }

    const accessToken = await createAccessToken({
      sub: user.email,
      role: user.role,
      id: user.id,
    });

    const response = NextResponse.json({
      access_token: accessToken,
      token_type: "bearer",
    });

    setAuthCookie(response, accessToken);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
