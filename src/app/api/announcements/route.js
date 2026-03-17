import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  const announcements = await prisma.announcement.findMany({
    where: all ? {} : { is_published: true },
    include: { user: { select: { username: true } } },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(announcements);
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? await verifyToken(token) : null;
  const body = await request.json();
  const announcement = await prisma.announcement.create({
    data: {
      user_id: payload?.user_id || 1,
      title: body.title,
      content: body.content,
      image_url: body.image_url || null,
      is_published: body.is_published ?? false,
    },
    include: { user: { select: { username: true } } },
  });
  return NextResponse.json(announcement, { status: 201 });
}

export async function PATCH(request) {
  const body = await request.json();
  const announcement = await prisma.announcement.update({
    where: { announcement_id: body.announcement_id },
    data: {
      title: body.title,
      content: body.content,
      image_url: body.image_url || null,
      is_published: body.is_published,
    },
    include: { user: { select: { username: true } } },
  });
  return NextResponse.json(announcement);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  await prisma.announcement.delete({ where: { announcement_id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
