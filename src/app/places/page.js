import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import PlaceCard from "@/components/PlaceCard";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "สถานที่ท่องเที่ยว | บ้านหวาย",
};

const SORT_OPTIONS = [
  { key: "popular", label: "ยอดนิยม" },
  { key: "latest", label: "ใหม่ล่าสุด" },
  { key: "rating", label: "คะแนนรีวิว" },
];

export default async function PlacesPage({ searchParams }) {
  const sp = await searchParams;
  const categoryId = sp.category ? parseInt(sp.category) : null;
  const search = sp.search || "";
  const sort = sp.sort || "popular";

  const orderBy =
    sort === "latest"
      ? { created_at: "desc" }
      : { view_count: "desc" }; // default & popular

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
      orderBy,
    }),
    prisma.category.findMany({ orderBy: { sort_order: "asc" } }),
  ]);

  // Sort by average rating if selected
  let sortedPlaces = places;
  if (sort === "rating") {
    sortedPlaces = [...places].sort((a, b) => {
      const avgA = a.reviews.length > 0 ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0;
      const avgB = b.reviews.length > 0 ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0;
      return avgB - avgA;
    });
  }

  const activeCategory = categoryId
    ? categories.find((c) => c.category_id === categoryId)
    : null;

  // Build URL helper for sort links
  const buildSortUrl = (sortKey) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (search) params.set("search", search);
    params.set("sort", sortKey);
    return `/places?${params.toString()}`;
  };

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
            พบ {sortedPlaces.length} สถานที่{activeCategory ? `ในหมวด ${activeCategory.name}` : ""}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search bar */}
        <form className="mb-6" method="GET">
          {categoryId && (
            <input type="hidden" name="category" value={categoryId} />
          )}
          {sort && sort !== "popular" && (
            <input type="hidden" name="sort" value={sort} />
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
        <div className="flex gap-2 flex-wrap mb-4">
          <Link
            href={`/places${sort !== "popular" ? `?sort=${sort}` : ""}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!categoryId
                ? "bg-[#2d6a4f] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            ทั้งหมด
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.category_id}
              href={`/places?category=${cat.category_id}${search ? `&search=${search}` : ""}${sort !== "popular" ? `&sort=${sort}` : ""}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${categoryId === cat.category_id
                  ? "bg-[#2d6a4f] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs text-gray-400">เรียงตาม:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={buildSortUrl(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sort === opt.key
                  ? "bg-[#2d6a4f]/10 text-[#2d6a4f] border border-[#2d6a4f]/20"
                  : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Places Grid */}
        {sortedPlaces.length === 0 ? (
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
            {sortedPlaces.map((place, i) => (
              <PlaceCard key={place.place_id} place={place} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
