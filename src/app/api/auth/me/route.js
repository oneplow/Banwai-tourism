import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ user: null });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  // Fetch full user with staff_permissions for permission-based filtering
  const dbUser = await prisma.user.findUnique({
    where: { user_id: payload.user_id },
    select: {
      user_id: true,
      username: true,
      email: true,
      role: true,
      staff_permissions: {
        select: { place_id: true },
      },
    },
  });

  return NextResponse.json({
    user: dbUser || {
      user_id: payload.user_id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    },
  });
}
