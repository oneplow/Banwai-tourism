import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { place_ids } = await request.json();
  const userId = parseInt(id);

  // Delete all existing, then re-create
  await prisma.staffPermission.deleteMany({ where: { user_id: userId } });
  if (place_ids?.length > 0) {
    await prisma.staffPermission.createMany({
      data: place_ids.map((pid) => ({ user_id: userId, place_id: pid })),
    });
  }
  const permissions = await prisma.staffPermission.findMany({
    where: { user_id: userId },
    include: { place: { select: { name: true, place_id: true } } },
  });
  return NextResponse.json({ permissions });
}
