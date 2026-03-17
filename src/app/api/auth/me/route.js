import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ user: null });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      user_id: payload.user_id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    },
  });
}
