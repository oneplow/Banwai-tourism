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
      ...(category && {
        categories: { some: { category_id: parseInt(category) } },
      }),
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
        categories: {
          include: { category: true },
          orderBy: { is_primary: "desc" },
        },
        images: { orderBy: { sort_order: "asc" } },
        comments: { where: { status: "approved" }, select: { rating: true } },
      },
      orderBy: { view_count: "desc" },
    });

    // Serialize: add computed primaryCategory + category (for backward compat)
    const serialized = places.map((p) => {
      const primary = p.categories.find((c) => c.is_primary) || p.categories[0];
      return {
        ...p,
        latitude: p.latitude ? Number(p.latitude) : null,
        longitude: p.longitude ? Number(p.longitude) : null,
        // Backward compat: flatten primary category
        category: primary?.category || null,
        category_id: primary?.category_id || null,
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("GET /api/places error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const categoryIds = body.category_ids || [];
    const primaryCategoryId = body.primary_category_id || categoryIds[0];

    const place = await prisma.place.create({
      data: {
        name: body.name,
        description: body.description,
        history: body.history,
        latitude: body.latitude || 0,
        longitude: body.longitude || 0,
        map_url: body.map_url,
        address: body.address,
        phone: body.phone,
        open_hours: body.open_hours,
        cover_image: body.cover_image,
        is_active: body.is_active ?? true,
        categories: {
          create: categoryIds.map((catId) => ({
            category_id: catId,
            is_primary: catId === primaryCategoryId,
          })),
        },
        images: {
          create: body.images?.map((img, index) => ({
            image_url: img.image_url,
            sort_order: index,
          })) || [],
        },
      },
      include: {
        categories: { include: { category: true }, orderBy: { is_primary: "desc" } },
        images: true,
      },
    });

    const primary = place.categories.find((c) => c.is_primary) || place.categories[0];
    return NextResponse.json({
      ...place,
      latitude: place.latitude ? Number(place.latitude) : null,
      longitude: place.longitude ? Number(place.longitude) : null,
      category: primary?.category || null,
      category_id: primary?.category_id || null,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/places error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
