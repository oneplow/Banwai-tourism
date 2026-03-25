import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) return NextResponse.json([]);

  const favorites = await prisma.favorite.findMany({
    where: { session_id: sessionId },
    include: { place: { include: { categories: { include: { category: true }, orderBy: { is_primary: "desc" } } } } },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(favorites);
}

export async function POST(request) {
  const body = await request.json();
  try {
    const fav = await prisma.favorite.create({
      data: { session_id: body.session_id, place_id: parseInt(body.place_id) },
    });
    return NextResponse.json({ added: true, favorite: fav }, { status: 201 });
  } catch {
    // unique constraint — already exists, so remove it (toggle)
    await prisma.favorite.deleteMany({
      where: { session_id: body.session_id, place_id: parseInt(body.place_id) },
    });
    return NextResponse.json({ added: false });
  }
}
