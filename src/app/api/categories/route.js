import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort_order: "asc" },
    include: { _count: { select: { places: { where: { is_active: true } } } } },
  });
  return NextResponse.json(categories);
}

export async function POST(request) {
  const body = await request.json();
  const category = await prisma.category.create({
    data: { name: body.name, icon: body.icon, sort_order: body.sort_order ?? 0 },
  });
  return NextResponse.json(category, { status: 201 });
}
