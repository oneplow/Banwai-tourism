import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import PlaceReviews from "@/components/PlaceReviews";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButtons from "@/components/ShareButtons";
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#2d6a4f]">หน้าแรก</Link>
          <span>/</span>
          <Link href="/places" className="hover:text-[#2d6a4f]">สถานที่</Link>
          <span>/</span>
          <Link
            href={`/places?category=${place.category_id}`}
            className="hover:text-[#2d6a4f]"
          >
            {place.category?.icon} {place.category?.name}
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-xs">{place.name}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1b4332] mb-2">
              {place.name}
            </h1>
            {place.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} size="sm" />
                <span className="text-sm text-gray-500">
                  {avgRating.toFixed(1)} ({place.reviews.length} รีวิว)
                </span>
              </div>
            )}
          </div>
          <FavoriteButton placeId={place.place_id} />
        </div>

        {/* Cover image / hero */}
        <div
          className={`relative rounded-3xl overflow-hidden h-64 md:h-[420px] bg-gradient-to-br ${gradClass} flex items-center justify-center mb-8 shadow-lg`}
        >
          <span className="text-white drop-shadow-md select-none">
            {place.category?.icon || <ImageIcon className="w-24 h-24 opacity-60" />}
          </span>
          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-5 text-white">
            <span className="bg-white/20 backdrop-blur-sm text-xs px-3 py-1 flex items-center gap-1 rounded-full">
              <Eye className="w-3 h-3" /> {place.view_count.toLocaleString()} ครั้ง
            </span>
          </div>
        </div>

        {/* Extra images grid */}
        {place.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {place.images.slice(0, 3).map((img, i) => (
              <div key={img.image_id} className={`rounded-xl overflow-hidden bg-gradient-to-br ${GRAD[i % GRAD.length]} h-24`} />
            ))}
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "ที่อยู่", value: place.address, icon: <MapPin className="w-4 h-4" /> },
            { label: "โทรศัพท์", value: place.phone, icon: <Phone className="w-4 h-4" /> },
            { label: "เวลาทำการ", value: place.open_hours, icon: <Clock className="w-4 h-4" /> },
            {
              label: "พิกัด",
              value:
                place.latitude && place.longitude
                  ? `${Number(place.latitude).toFixed(4)}, ${Number(place.longitude).toFixed(4)}`
                  : null,
              icon: <MapIcon className="w-4 h-4" />,
              href:
                place.latitude && place.longitude
                  ? `https://www.google.com/maps?q=${place.latitude},${place.longitude}`
                  : null,
            },
          ]
            .filter((i) => i.value)
            .map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm"
              >
                <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  {item.icon} {item.label}
                </div>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#2d6a4f] hover:underline font-medium"
                  >
                    เปิดแผนที่ →
                  </a>
                ) : (
                  <div className="text-sm text-gray-700 leading-snug">{item.value}</div>
                )}
              </div>
            ))}
        </div>

        {/* Description */}
        {place.description && (
          <section className="mb-8">
            <h2 className="font-display font-bold text-xl text-[#1b4332] mb-3">
              เกี่ยวกับสถานที่นี้
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">{place.description}</p>
          </section>
        )}

        {/* History */}
        {place.history && (
          <section className="mb-10">
            <h2 className="font-display font-bold text-xl text-[#1b4332] mb-3">
              ประวัติความเป็นมา
            </h2>
            <div className="bg-[#f8f4ef] rounded-2xl p-6 border-l-4 border-[#2d6a4f]">
              <p className="text-gray-600 leading-relaxed">{place.history}</p>
            </div>
          </section>
        )}

        {/* Divider */}
        <hr className="border-gray-100 mb-10" />

        {/* Reviews Section */}
        <PlaceReviews placeId={place.place_id} initialReviews={place.reviews} avgRating={avgRating} />

        {/* Share */}
        <div className="mt-6">
          <ShareButtons placeId={place.place_id} placeName={place.name} />
        </div>

        {/* Back button */}
        <div className="pt-4">
          <Link
            href="/places"
            className="inline-flex items-center gap-2 text-[#2d6a4f] text-sm font-medium hover:underline"
          >
            ← กลับไปดูสถานที่ทั้งหมด
          </Link>
        </div>
      </div>
    </>
  );
}
