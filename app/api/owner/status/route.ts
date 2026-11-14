import { NextResponse } from "next/server";
import { requireUser, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (user.role !== "owner") {
      return NextResponse.json({ detail: "User is not an owner" }, { status: 400 });
    }
    return NextResponse.json({ status: user.status });
  } catch (err) {
    return handleApiError(err);
  }
}
