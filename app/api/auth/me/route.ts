import { NextResponse } from "next/server";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      plate_number: user.plate_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
