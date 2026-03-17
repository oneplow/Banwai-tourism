import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const status = searchParams.get("status") || "approved";
  const all = searchParams.get("all") === "true";

  const reviews = await prisma.review.findMany({
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
  return NextResponse.json(reviews);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.guest_name || !body.place_id || !body.rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const review = await prisma.review.create({
    data: {
      place_id: parseInt(body.place_id),
      guest_name: body.guest_name,
      rating: parseInt(body.rating),
      comment: body.comment || "",
      status: "pending",
    },
  });
  return NextResponse.json(review, { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  const review = await prisma.review.update({
    where: { review_id: body.review_id },
    data: { status: body.status },
  });
  return NextResponse.json(review);
}
