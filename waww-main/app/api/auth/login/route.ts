import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyPassword,
  createAccessToken,
  setAuthCookie,
  handleApiError,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Incorrect email or password" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const res = await query(
      `SELECT id, email, full_name, hashed_password, role, status
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [trimmedEmail]
    );

    const user = res.rows[0];
    if (!user || !user.hashed_password) {
      return NextResponse.json(
        { detail: "Incorrect email or password" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, user.hashed_password);
    if (!isValid) {
      return NextResponse.json(
        { detail: "Incorrect email or password" },
        { status: 400 }
      );
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
