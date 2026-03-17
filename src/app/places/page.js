import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import PlaceCard from "@/components/PlaceCard";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "สถานที่ท่องเที่ยว | บ้านหวาย",
};

export default async function PlacesPage({ searchParams }) {
  const sp = await searchParams;
  const categoryId = sp.category ? parseInt(sp.category) : null;
  const search = sp.search || "";

  const [places, categories] = await Promise.all([
    prisma.place.findMany({
      where: {
        is_active: true,
        ...(categoryId && { category_id: categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { address: { contains: search } },
          ],
        }),
      },
      include: {
        category: true,
        reviews: { where: { status: "approved" }, select: { rating: true } },
      },
      orderBy: { view_count: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sort_order: "asc" } }),
  ]);

  const activeCategory = categoryId
    ? categories.find((c) => c.category_id === categoryId)
    : null;

  return (
    <>
      <Navbar />

      {/* Header */}
      <div className="bg-[#f8f4ef] thai-pattern border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#2d6a4f] text-sm font-medium hover:underline mb-3">
            <ArrowLeft className="w-4 h-4" /> หน้าแรก
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1b4332] mb-2">
            {activeCategory
              ? `${activeCategory.icon} ${activeCategory.name}`
              : "สถานที่ท่องเที่ยว"}
          </h1>
          <p className="text-gray-500 text-sm">
            พบ {places.length} สถานที่{activeCategory ? `ในหมวด ${activeCategory.name}` : ""}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search bar */}
        <form className="mb-6" method="GET">
          {categoryId && (
            <input type="hidden" name="category" value={categoryId} />
          )}
          <div className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="ค้นหาสถานที่..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
            />
            <button
              type="submit"
              className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/places"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !categoryId
                ? "bg-[#2d6a4f] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            ทั้งหมด
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.category_id}
              href={`/places?category=${cat.category_id}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                categoryId === cat.category_id
                  ? "bg-[#2d6a4f] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>

        {/* Places Grid */}
        {places.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4 text-gray-400"><Search className="w-12 h-12" /></div>
            <h3 className="font-display text-xl text-gray-600 mb-2">ไม่พบสถานที่</h3>
            <p className="text-gray-400 text-sm mb-6">
              ลองเปลี่ยนคำค้นหาหรือหมวดหมู่
            </p>
            <Link
              href="/places"
              className="text-[#2d6a4f] font-medium hover:underline text-sm"
            >
              ดูสถานที่ทั้งหมด
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, i) => (
              <PlaceCard key={place.place_id} place={place} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
