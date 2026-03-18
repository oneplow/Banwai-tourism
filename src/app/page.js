import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { Bot, Heart, Copyright, MapPin, Compass, Users, Megaphone } from "lucide-react";

function serializePlace(p) {
  return {
    ...p,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    created_at: p.created_at?.toISOString?.() ?? p.created_at,
    updated_at: p.updated_at?.toISOString?.() ?? p.updated_at,
    category: p.category
      ? { ...p.category, created_at: undefined, updated_at: undefined }
      : null,
  };
}

export default async function HomePage() {
  const [allPlaces, categories, announcements] = await Promise.all([
    prisma.place.findMany({
      where: { is_active: true },
      include: { category: true },
      orderBy: { view_count: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sort_order: "asc" } }),
    prisma.announcement.findMany({
      where: { is_published: true },
      orderBy: { created_at: "desc" },
      take: 3,
    }),
  ]);

  const totalViews = allPlaces.reduce((s, p) => s + p.view_count, 0);

  // Serialize for client components (fix Decimal issue)
  const serializedPlaces = allPlaces.map(serializePlace);

  return (
    <>
      <Navbar />

      {/* ── 1. Announcements (Top banner) ── */}
      {announcements.length > 0 && (
        <section className="bg-[#f8f4ef] border-b border-[#e8ddd0]">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-[#1b4332] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#2d6a4f]" /> ประกาศ / ข่าวสาร
              </h2>
              <Link href="/announcements" className="text-[#2d6a4f] text-xs font-medium hover:underline">ดูทั้งหมด →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {announcements.map((ann) => (
                <div key={ann.announcement_id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div suppressHydrationWarning className="text-[10px] text-[#40916c] font-medium mb-1.5">
                    {new Date(ann.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <h3 className="font-display font-semibold text-gray-900 text-sm mb-1 leading-snug">{ann.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Featured Places Carousel ── */}
      <section className="py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-[#1b4332]">สถานที่แนะนำ</h2>
          <Link href="/places" className="text-[#2d6a4f] text-xs font-medium hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="max-w-6xl mx-auto">
          <FeaturedCarousel places={serializedPlaces} />
        </div>
      </section>

      {/* ── 3. Feature Cards ── */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Compass className="w-7 h-7" />, title: "แผนที่สถานที่", desc: "ดูสถานที่บนแผนที่จริง กดเลือกเพื่อดูรายละเอียด", href: "/map", btn: "เปิดแผนที่" },
            { icon: <Bot className="w-7 h-7" />, title: "วางแผนทริป AI", desc: "บอกความสนใจ AI จะออกแบบเส้นทางท่องเที่ยวให้อัตโนมัติ", href: "/trip", btn: "จัดทริปเลย", accent: true },
            { icon: <Heart className="w-7 h-7" />, title: "สถานที่ถูกใจ", desc: "บันทึกสถานที่ที่ชอบไว้ดูภายหลัง ไม่ต้องสมัครสมาชิก", href: "/favorites", btn: "ดูรายการ" },
          ].map((f) => (
            <div key={f.href} className={`rounded-2xl p-5 border ${f.accent ? "bg-[#2d6a4f] border-[#2d6a4f] text-white" : "bg-white border-gray-100 shadow-sm"}`}>
              <div className="mb-3">{f.icon}</div>
              <h3 className={`font-display font-semibold text-base mb-1 ${f.accent ? "text-white" : "text-gray-800"}`}>{f.title}</h3>
              <p className={`text-sm mb-4 leading-relaxed ${f.accent ? "text-green-200" : "text-gray-400"}`}>{f.desc}</p>
              <Link href={f.href}
                className={`inline-block px-4 py-2 rounded-xl text-sm font-medium transition-all ${f.accent ? "bg-white text-[#2d6a4f] hover:bg-green-50" : "bg-[#2d6a4f] text-white hover:bg-[#1b4332]"
                  }`}>
                {f.btn}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Map Section ── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-[#1b4332] mb-1">แผนที่ท่องเที่ยว</h2>
          <p className="text-gray-400 text-xs">คลิกที่หมุดบนแผนที่เพื่อดูข้อมูลสถานที่</p>
        </div>
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <MapView places={serializedPlaces} categories={categories} />
        </div>
      </section>

      {/* ── 5. Footer with Stats ── */}
      <footer className="bg-[#1b4332] text-green-200 px-4">
        <div className="max-w-6xl mx-auto py-8 text-center text-sm">
          <div className="font-display text-white text-xl font-bold mb-2">ตำบลบ้านหวาย</div>
          <p className="mb-3">เว็บไซต์แนะนำสถานที่ท่องเที่ยวตำบลบ้านหวาย</p>
          <div className="flex justify-center gap-4 text-xs text-green-400 mb-4">
            <Link href="/places" className="hover:text-white">สถานที่ท่องเที่ยว</Link>
            <Link href="/map" className="hover:text-white">แผนที่</Link>
            <Link href="/trip" className="hover:text-white">จัดทริป AI</Link>
            <Link href="/announcements" className="hover:text-white">ข่าวสาร</Link>
            <Link href="/admin" className="hover:text-white">Admin</Link>
          </div>
          <p className="text-green-400/60 text-xs flex items-center justify-center gap-1"><Copyright className="w-3 h-3" /> {new Date().getFullYear()} Ban Wai Tourism. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
