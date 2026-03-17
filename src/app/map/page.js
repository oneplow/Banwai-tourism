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
      include: { category: true },
      orderBy: { view_count: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sort_order: "asc" } }),
  ]);

  // Assign default map coordinates per category if not in DB
  // In production, store map_x / map_y in the places table
  const PIN_DEFAULTS = [
    { place_id: 1, map_x: 188, map_y: 230 },
    { place_id: 2, map_x: 258, map_y: 180 },
    { place_id: 3, map_x: 210, map_y: 310 },
    { place_id: 4, map_x: 155, map_y: 290 },
    { place_id: 5, map_x: 220, map_y: 390 },
  ];

  const placesWithCoords = places.map((p, i) => {
    const pin = PIN_DEFAULTS.find((d) => d.place_id === p.place_id);
    return {
      ...p,
      map_x: pin?.map_x ?? 180 + (i * 30) % 140,
      map_y: pin?.map_y ?? 200 + (i * 50) % 260,
      // Prisma Decimal → plain number
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
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
            คลิกที่ pin บนแผนที่หรือเลือกจากรายการเพื่อดูข้อมูลสถานที่
          </p>
        </div>
        <MapView places={placesWithCoords} categories={categories} />
      </div>
    </>
  );
}
