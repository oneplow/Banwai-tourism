import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const admin = searchParams.get("admin") === "true";

    const where = {
      ...(admin ? {} : { is_active: true }),
      ...(category && { category_id: parseInt(category) }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const places = await prisma.place.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sort_order: "asc" } },
        reviews: { where: { status: "approved" }, select: { rating: true } },
      },
      orderBy: { view_count: "desc" },
    });

    // Serialize Decimal fields
    const serialized = places.map((p) => ({
      ...p,
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      map_x: p.map_x ? Number(p.map_x) : null,
      map_y: p.map_y ? Number(p.map_y) : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/places error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const place = await prisma.place.create({
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
        map_x: body.map_x || null,
        map_y: body.map_y || null,
        is_active: body.is_active ?? true,
        images: {
          create: body.images?.map((img, index) => ({
            image_url: img.image_url,
            caption: img.caption || null,
            sort_order: index,
          })) || [],
        },
      },
      include: { category: true, images: true },
    });
    return NextResponse.json({
      ...place,
      latitude: place.latitude ? Number(place.latitude) : null,
      longitude: place.longitude ? Number(place.longitude) : null,
      map_x: place.map_x ? Number(place.map_x) : null,
      map_y: place.map_y ? Number(place.map_y) : null,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/places error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
