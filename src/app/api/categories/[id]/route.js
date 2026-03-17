import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  try {
    const category = await prisma.category.update({
      where: { category_id: parseInt(id) },
      data: { name: body.name, icon: body.icon, sort_order: parseInt(body.sort_order) || 0 },
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.category.delete({
      where: { category_id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "ไม่สามารถลบได้เนื่องจากมีสถานที่ในหมวดหมู่นี้อยู่" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete category" }, { status: 400 });
  }
}
