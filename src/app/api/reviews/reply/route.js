import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? await verifyToken(token) : null;
  const userId = payload?.user_id || 1; // fallback for dev

  const body = await request.json();
  if (!body.review_id || !body.reply_text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const reply = await prisma.reviewReply.create({
    data: {
      review_id: parseInt(body.review_id),
      user_id: parseInt(userId),
      reply_text: body.reply_text,
    },
    include: { user: { select: { username: true } } },
  });
  return NextResponse.json(reply, { status: 201 });
}
