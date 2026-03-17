import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const place = await prisma.place.update({
      where: { place_id: parseInt(id), is_active: true },
      data: { view_count: { increment: 1 } },
      include: {
        category: true,
        images: { orderBy: { sort_order: "asc" } },
        reviews: {
          where: { status: "approved" },
          include: {
            replies: {
              include: { user: { select: { username: true, role: true } } },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });
    return NextResponse.json({
      ...place,
      latitude: place.latitude ? Number(place.latitude) : null,
      longitude: place.longitude ? Number(place.longitude) : null,
      map_x: place.map_x ? Number(place.map_x) : null,
      map_y: place.map_y ? Number(place.map_y) : null,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const place = await prisma.place.update({
      where: { place_id: parseInt(id) },
      data: {
        category_id: parseInt(body.category_id),
        name: body.name,
        description: body.description,
        history: body.history,
        latitude: body.latitude || 0,
        longitude: body.longitude || 0,
        address: body.address,
        phone: body.phone,
        open_hours: body.open_hours,
        cover_image: body.cover_image,
        map_x: body.map_x ?? null,
        map_y: body.map_y ?? null,
        is_active: body.is_active ?? true,
        images: {
          deleteMany: {},
          create: body.images?.map((img, index) => ({
            image_url: img.image_url,
            caption: img.caption || null,
            sort_order: index,
          })) || [],
        },
      },
      include: { category: true, images: { orderBy: { sort_order: "asc" } } },
    });
    return NextResponse.json({
      ...place,
      latitude: place.latitude ? Number(place.latitude) : null,
      longitude: place.longitude ? Number(place.longitude) : null,
      map_x: place.map_x ? Number(place.map_x) : null,
      map_y: place.map_y ? Number(place.map_y) : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.place.update({
      where: { place_id: parseInt(id) },
      data: { is_active: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
