import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import PlaceReviews from "@/components/PlaceReviews";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButtons from "@/components/ShareButtons";
import PlaceImageCarousel from "@/components/PlaceImageCarousel";
import { Eye, MapPin, Phone, Clock, Map as MapIcon, MessageSquare, ShieldAlert, Image as ImageIcon } from "lucide-react";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const place = await prisma.place.findUnique({
      where: { place_id: parseInt(id) },
      select: { name: true, description: true },
    });
    return {
      title: `${place?.name || "สถานที่"} | บ้านหวาย`,
      description: place?.description || "",
    };
  } catch {
    return { title: "บ้านหวาย" };
  }
}

const GRAD = [
  "from-green-700 to-green-500",
  "from-teal-700 to-teal-500",
  "from-emerald-700 to-emerald-500",
  "from-amber-700 to-amber-500",
  "from-orange-700 to-orange-500",
];

export default async function PlaceDetailPage({ params }) {
  const { id } = await params;

  let place;
  const placeId = parseInt(id);
  const today = new Date(new Date().toISOString().slice(0, 10));

  try {
    place = await prisma.place.update({
      where: { place_id: placeId, is_active: true },
      data: {
        view_count: { increment: 1 },
      },
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
  } catch {
    notFound();
  }

  // Update daily view stats separately to avoid unique constraint errors
  try {
    await prisma.viewStat.upsert({
      where: {
        place_id_view_date: {
          place_id: placeId,
          view_date: today,
        },
      },
      create: {
        place_id: placeId,
        view_date: today,
        view_count: 1,
      },
      update: { view_count: { increment: 1 } },
    });
  } catch {
    // Silently ignore — don't break page load for stats
  }

  if (!place) notFound();

  const avgRating =
    place.reviews.length > 0
      ? place.reviews.reduce((s, r) => s + r.rating, 0) / place.reviews.length
      : 0;

  const gradClass = GRAD[place.category_id % GRAD.length];

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-[#2d6a4f] transition-colors">หน้าแรก</Link>
          <span>/</span>
          <Link href="/places" className="hover:text-[#2d6a4f] transition-colors">สถานที่ท่องเที่ยว</Link>
          <span>/</span>
          <Link
            href={`/places?category=${place.category_id}`}
            className="hover:text-[#2d6a4f] transition-colors flex items-center gap-1"
          >
            {place.category?.icon} {place.category?.name}
          </Link>
          <span>/</span>
          <span className="text-gray-800 truncate max-w-[200px] sm:max-w-xs">{place.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ----- Left Column: Main Content ----- */}
          <div className="lg:col-span-2">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1b4332] mb-3 leading-tight">
                  {place.name}
                </h1>
                <div className="flex items-center gap-3">
                  {place.reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1 rounded-full text-yellow-700">
                      <StarRating rating={Math.round(avgRating)} size="sm" />
                      <span className="text-xs font-bold ml-1">
                        {avgRating.toFixed(1)} <span className="text-yellow-600/70 font-normal">({place.reviews.length} รีวิว)</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full text-blue-700 text-xs font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    เข้าชม {place.view_count} ครั้ง
                  </div>
                </div>
              </div>
              <FavoriteButton placeId={place.place_id} />
            </div>

            {/* Image Carousel */}
            <div className="mb-8 rounded-3xl overflow-hidden shadow-sm">
              <PlaceImageCarousel
                images={place.images}
                coverImage={place.cover_image}
                fallbackIcon={place.category?.icon}
                gradClass={gradClass}
              />
            </div>

            {/* Description */}
            {place.description && (
              <section className="mb-10">
                <h2 className="font-display font-bold text-2xl text-[#1b4332] mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-[#2d6a4f]" />
                  เกี่ยวกับสถานที่นี้
                </h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-base">
                  <p>{place.description}</p>
                </div>
              </section>
            )}

            {/* History */}
            {place.history && (
              <section className="mb-12">
                <h2 className="font-display font-bold text-2xl text-[#1b4332] mb-4">
                  ประวัติความเป็นมา
                </h2>
                <div className="bg-[#f8f4ef] rounded-3xl p-6 sm:p-8 border-l-[6px] border-[#2d6a4f] shadow-inner">
                  <p className="text-gray-700 leading-relaxed italic text-[15px]">{place.history}</p>
                </div>
              </section>
            )}

            {/* Divider */}
            <hr className="border-gray-100 mb-10" />

            {/* Reviews Section */}
            <div>
              <h2 className="font-display font-bold text-2xl text-[#1b4332] mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#2d6a4f]" />
                ความคิดเห็น ({place.reviews.length})
              </h2>
              <PlaceReviews placeId={place.place_id} initialReviews={place.reviews} avgRating={avgRating} />
            </div>
          </div>

          {/* ----- Right Column: Sidebar ----- */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Info Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/40">
                <h3 className="font-display font-bold text-[#1b4332] text-lg mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2d6a4f]" /> ข้อมูลและการเดินทาง
                </h3>

                <div className="space-y-5">
                  {[
                    { label: "ที่อยู่", value: place.address, icon: <MapPin className="w-4 h-4 text-gray-400" /> },
                    { label: "โทรศัพท์", value: place.phone, icon: <Phone className="w-4 h-4 text-gray-400" /> },
                    { label: "เวลาทำการ", value: place.open_hours, icon: <Clock className="w-4 h-4 text-gray-400" /> },
                  ].filter((i) => i.value).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 bg-gray-50 p-2 rounded-lg">{item.icon}</div>
                      <div>
                        <div className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</div>
                        <div className="text-sm text-gray-800 font-medium leading-snug">{item.value}</div>
                      </div>
                    </div>
                  ))}

                  {place.latitude && place.longitude && (
                    <div className="pt-2">
                      <a
                        href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#edf7f2] text-[#2d6a4f] py-3 rounded-xl font-bold text-sm hover:bg-[#d8efe3] transition-colors border border-[#2d6a4f]/20"
                      >
                        <MapIcon className="w-4 h-4" /> ดูแผนที่นำทาง (Google Maps)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/40">
                <h3 className="font-display font-bold text-gray-800 text-sm mb-4">แชร์สถานที่นี้ให้เพื่อน</h3>
                <ShareButtons placeId={place.place_id} placeName={place.name} />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
