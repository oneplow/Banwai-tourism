"use client";
import { useRef, useState, useCallback } from "react";
import Link from "next/link";

const GRAD = [
  "from-green-700 to-emerald-500",
  "from-teal-700 to-teal-400",
  "from-amber-700 to-amber-500",
  "from-sky-700 to-sky-400",
  "from-orange-700 to-orange-400",
  "from-emerald-800 to-green-500",
  "from-rose-700 to-rose-400",
  "from-violet-700 to-violet-400",
];

export default function FeaturedCarousel({ places = [] }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragState.current.startX = e.pageX - scrollRef.current.offsetLeft;
    dragState.current.scrollLeft = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - dragState.current.startX) * 1.5;
      scrollRef.current.scrollLeft = dragState.current.scrollLeft - walk;
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  }, []);

  if (places.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="flex gap-4 overflow-x-auto pb-4 px-4 scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{ cursor: "grab", WebkitOverflowScrolling: "touch" }}
      >
        {places.map((place, i) => {
          const grad = GRAD[i % GRAD.length];
          return (
            <Link
              key={place.place_id}
              href={`/places/${place.place_id}`}
              draggable={false}
              onClick={(e) => isDragging && e.preventDefault()}
              className="flex-shrink-0 snap-start relative w-[260px] sm:w-[300px] h-[360px] rounded-3xl overflow-hidden group select-none"
            >
              {/* Background Cover Image or Gradient Fallback */}
              {place.cover_image ? (
                <img
                  src={place.cover_image}
                  alt={place.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  draggable={false}
                />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${grad}`} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-8xl select-none pointer-events-none transition-transform duration-700 group-hover:scale-110">
                    {place.category?.icon}
                  </div>
                </>
              )}

              {/* Subtle overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                {place.category?.name && (
                  <span className="inline-block text-xs bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full mb-2 font-medium">
                    {place.category.icon} {place.category.name}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold leading-tight mb-1 drop-shadow-md group-hover:translate-x-1 transition-transform">
                  {place.name}
                </h3>
                {place.description && (
                  <p className="text-white/70 text-xs line-clamp-2 leading-relaxed">
                    {place.description.slice(0, 80)}...
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
