import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function serializePlace(place) {
  const primary = place.categories?.find((c) => c.is_primary) || place.categories?.[0];
  return {
    ...place,
    latitude: place.latitude ? Number(place.latitude) : null,
    longitude: place.longitude ? Number(place.longitude) : null,
    category: primary?.category || null,
    category_id: primary?.category_id || null,
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const place = await prisma.place.update({
      where: { place_id: parseInt(id), is_active: true },
      data: { view_count: { increment: 1 } },
      include: {
        categories: {
          include: { category: true },
          orderBy: { is_primary: "desc" },
        },
        images: { orderBy: { sort_order: "asc" } },
        comments: {
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
    return NextResponse.json(serializePlace(place));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const categoryIds = body.category_ids || [];
    const primaryCategoryId = body.primary_category_id || categoryIds[0];

    const place = await prisma.place.update({
      where: { place_id: parseInt(id) },
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
          deleteMany: {},
          create: categoryIds.map((catId) => ({
            category_id: catId,
            is_primary: catId === primaryCategoryId,
          })),
        },
        images: {
          deleteMany: {},
          create: body.images?.map((img, index) => ({
            image_url: img.image_url,
            sort_order: index,
          })) || [],
        },
      },
      include: {
        categories: { include: { category: true }, orderBy: { is_primary: "desc" } },
        images: { orderBy: { sort_order: "asc" } },
      },
    });
    return NextResponse.json(serializePlace(place));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const placeId = parseInt(id);
  try {
    await prisma.$transaction([
      prisma.commentReply.deleteMany({
        where: { comment: { place_id: placeId } },
      }),
      prisma.comment.deleteMany({ where: { place_id: placeId } }),
      prisma.placeImage.deleteMany({ where: { place_id: placeId } }),
      prisma.staffPermission.deleteMany({ where: { place_id: placeId } }),
      prisma.favorite.deleteMany({ where: { place_id: placeId } }),
      prisma.viewStat.deleteMany({ where: { place_id: placeId } }),
      prisma.placeCategory.deleteMany({ where: { place_id: placeId } }),
      prisma.place.delete({ where: { place_id: placeId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete place error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
