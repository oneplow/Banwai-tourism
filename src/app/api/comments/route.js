import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const status = searchParams.get("status") || "approved";
  const all = searchParams.get("all") === "true";

  const comments = await prisma.comment.findMany({
    where: {
      ...(placeId && { place_id: parseInt(placeId) }),
      ...(all ? (status ? { status } : {}) : { status }),
    },
    include: {
      place: { select: { name: true } },
      replies: { include: { user: { select: { username: true } } } },
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(comments);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.guest_name || !body.place_id || !body.rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const comment = await prisma.comment.create({
    data: {
      place_id: parseInt(body.place_id),
      guest_name: body.guest_name,
      rating: parseInt(body.rating),
      comment: body.comment || "",
      status: "pending",
    },
  });
  return NextResponse.json(comment, { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  const comment = await prisma.comment.update({
    where: { comment_id: body.comment_id },
    data: { status: body.status },
  });
  return NextResponse.json(comment);
}
