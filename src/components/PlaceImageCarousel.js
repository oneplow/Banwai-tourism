"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function PlaceImageCarousel({ images = [], coverImage = null, fallbackIcon = null, gradClass = "from-green-700 to-green-500", viewCount = 0 }) {
    // Combine cover image and additional images into one array of URLs
    const allImages = [];
    if (coverImage) allImages.push(coverImage);
    if (images && images.length > 0) {
        images.forEach(img => {
            if (img.image_url && img.image_url !== coverImage) {
                allImages.push(img.image_url);
            }
        });
    }

    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEndHandler = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) next();
        if (isRightSwipe) prev();
    };

    const prev = () => setCurrentIndex((curr) => (curr === 0 ? allImages.length - 1 : curr - 1));
    const next = () => setCurrentIndex((curr) => (curr === allImages.length - 1 ? 0 : curr + 1));

    // If no images exist, fallback to the original colored block with icon
    if (allImages.length === 0) {
        return (
            <div className={`relative rounded-3xl overflow-hidden h-64 md:h-[420px] bg-gradient-to-br ${gradClass} flex items-center justify-center mb-8 shadow-lg`}>
                <span className="text-white drop-shadow-md select-none text-8xl">
                    {fallbackIcon || <ImageIcon className="w-24 h-24 opacity-60" />}
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-5 text-white pointer-events-none">
                    <span className="bg-white/20 backdrop-blur-sm text-xs px-3 py-1 flex items-center gap-1 rounded-full">
                        👁️ {viewCount.toLocaleString()} ครั้ง
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative rounded-3xl overflow-hidden h-64 md:h-[420px] mb-8 shadow-lg group bg-gray-100"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
        >
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {allImages.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`ภาพสถานที่ ${idx + 1}`}
                        className="w-full h-full object-cover flex-shrink-0"
                        draggable={false}
                    />
                ))}
            </div>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute z-20 left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all md:opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6 -ml-0.5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute z-20 right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all md:opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6 ml-0.5" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                        {allImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? "bg-white scale-125 shadow-[0_0_4px_rgba(0,0,0,0.5)]" : "bg-white/40"}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Bottom Gradient Overlay + View Count */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-5 text-white pointer-events-none z-10">
                <span className="bg-black/30 backdrop-blur-md text-xs px-3 py-1 flex items-center gap-1.5 rounded-full shadow-sm">
                    <span className="text-[10px]">👁️</span> {viewCount.toLocaleString()} ครั้ง
                </span>
            </div>
        </div>
    );
}
