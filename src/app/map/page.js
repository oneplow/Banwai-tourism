import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "แผนที่ท่องเที่ยว | บ้านหวาย",
  description: "แผนที่สถานที่ท่องเที่ยวตำบลบ้านหวาย",
};

export default async function MapPage() {
  const [places, categories] = await Promise.all([
    prisma.place.findMany({
      where: { is_active: true },
      include: {
        categories: {
          include: { category: true },
          orderBy: { is_primary: "desc" },
        },
      },
      orderBy: { view_count: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sort_order: "asc" } }),
  ]);

  // Serialize Decimal → number for client components
  const serializedPlaces = places.map((p) => {
    const primaryEntry = p.categories?.find((c) => c.is_primary) || p.categories?.[0];
    return {
      ...p,
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      created_at: p.created_at?.toISOString?.() ?? p.created_at,
      updated_at: p.updated_at?.toISOString?.() ?? p.updated_at,
      category: primaryEntry?.category
        ? { ...primaryEntry.category, created_at: undefined, updated_at: undefined }
        : null,
      category_id: primaryEntry?.category_id || null,
      categories: p.categories?.map((pc) => ({
        ...pc,
        category: pc.category ? { ...pc.category, created_at: undefined, updated_at: undefined } : null,
      })),
    };
  });

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#2d6a4f] text-sm font-medium hover:underline mb-3">
            <ArrowLeft className="w-4 h-4" /> หน้าแรก
          </Link>
          <h1 className="font-display text-3xl font-bold text-[#1b4332] mb-1">
            แผนที่ท่องเที่ยว
          </h1>
          <p className="text-gray-500 text-sm">
            คลิกที่หมุดบนแผนที่หรือเลือกจากรายการเพื่อดูข้อมูลสถานที่
          </p>
        </div>
        <MapView places={serializedPlaces} categories={categories} />
      </div>
    </>
  );
}
