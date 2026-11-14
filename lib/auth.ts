import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "./db";

export interface UserSession {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "owner" | "driver" | string;
  status: "pending" | "approved" | "rejected" | string;
  avatar?: string | null;
  phone?: string | null;
  plate_number?: string | null;
  created_at: string;
  updated_at?: string;
}

const DEFAULT_DEV_SECRET = "gariha-dev-secret-key-change-in-production-123456789";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is missing. Please configure it in your Vercel project settings."
      );
    }
    return new TextEncoder().encode(DEFAULT_DEV_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createAccessToken(payload: { sub: string; role: string; id: number }): Promise<string> {
  const key = getJwtSecretKey();
  const token = await new SignJWT({
    sub: payload.sub,
    role: payload.role,
    id: payload.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);

  return token;
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; role: string; id: number } | null> {
  try {
    const key = getJwtSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    return {
      sub: payload.sub as string,
      role: (payload.role as string) || "driver",
      id: Number(payload.id),
    };
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header: gariha_token
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    if (cookies["gariha_token"]) {
      return cookies["gariha_token"];
    }
  }

  return null;
}

export async function getCurrentUser(req: Request): Promise<UserSession | null> {
  const token = extractToken(req);
  if (!token) return null;

  const decoded = await verifyAccessToken(token);
  if (!decoded || !decoded.sub) return null;

  const result = await query<UserSession>(
    `SELECT id, email, full_name, role, status, avatar, phone, plate_number, created_at, updated_at 
     FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [decoded.sub]
  );

  const user = result.rows[0];
  if (!user) return null;

  // Auto-sync admin role if configured in ADMIN_EMAILS
  const adminList = getAdminEmails();
  if (adminList.includes(user.email.toLowerCase()) && (user.role !== "admin" || user.status !== "approved")) {
    await query(
      `UPDATE users SET role = 'admin', status = 'approved', updated_at = NOW() WHERE id = $1`,
      [user.id]
    );
    user.role = "admin";
    user.status = "approved";
  }

  return user;
}

export async function requireUser(req: Request): Promise<UserSession> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Response(
      JSON.stringify({ detail: "Could not validate credentials", error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

export async function requireRole(req: Request, roles: string[]): Promise<UserSession> {
  const user = await requireUser(req);
  if (!roles.includes(user.role)) {
    throw new Response(
      JSON.stringify({ detail: "Not enough permissions", error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

export async function requireAdmin(req: Request): Promise<UserSession> {
  const user = await requireUser(req);
  if (user.role !== "admin") {
    throw new Response(
      JSON.stringify({ detail: "Admin access required", error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

export async function requireApprovedOwner(req: Request): Promise<UserSession> {
  const user = await requireUser(req);
  if (user.role !== "owner") {
    throw new Response(
      JSON.stringify({ detail: "Not enough permissions: Owner access required", error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  if (user.status !== "approved") {
    throw new Response(
      JSON.stringify({ detail: "Account pending approval or rejected", error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return user;
}

export function setAuthCookie(res: NextResponse, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: "gariha_token",
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: "gariha_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }
  console.error("API Route Error:", error);
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ detail: message, error: message }, { status: 500 });
}
