import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

const PLACEHOLDER_COLORS = [
  "from-green-600 to-green-400",
  "from-teal-600 to-teal-400",
  "from-emerald-600 to-emerald-400",
  "from-amber-600 to-amber-400",
  "from-orange-600 to-orange-400",
];

export default function PlaceCard({ place, index = 0 }) {
  const gradientClass = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  return (
    <Link href={`/places/${place.place_id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {place.cover_image ? (
            <Image
              src={place.cover_image}
              alt={place.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white`}
            >
              {place.category?.icon || <ImageIcon className="w-16 h-16" />}
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-[#2d6a4f] text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
              {place.category?.icon} {place.category?.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display font-semibold text-gray-900 text-base mb-1 group-hover:text-[#2d6a4f] transition-colors">
            {place.name}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-3">
            {place.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{place.open_hours || "ตลอดวัน"}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{place.view_count || 0} ครั้ง</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
