"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Heart, Image as ImageIcon, ArrowLeft } from "lucide-react";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let sid = localStorage.getItem("bw_session");
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("bw_session", sid); }
  return sid;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) { setLoading(false); return; }
    fetch(`/api/favorites?session_id=${sid}`)
      .then((r) => r.json())
      .then((data) => { setFavorites(data); setLoading(false); });
  }, []);

  const remove = async (placeId) => {
    const sid = getSessionId();
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, place_id: placeId }),
    });
    setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#2d6a4f] text-sm font-medium hover:underline mb-3">
            <ArrowLeft className="w-4 h-4" /> หน้าแรก
          </Link>
          <h1 className="font-display text-3xl font-bold text-[#1b4332] mb-1">สถานที่ที่บันทึกไว้</h1>
          <p className="text-gray-400 text-sm">บันทึกเฉพาะในอุปกรณ์นี้ ไม่ต้องสมัครสมาชิก</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4 text-gray-400"><Heart className="w-16 h-16" /></div>
            <h3 className="font-display text-xl text-gray-600 mb-2">ยังไม่มีสถานที่ที่บันทึก</h3>
            <p className="text-gray-400 text-sm mb-6">กดปุ่ม "บันทึก" ในหน้าสถานที่เพื่อเพิ่มที่นี่</p>
            <Link href="/places" className="bg-[#2d6a4f] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1b4332] transition-colors">
              ดูสถานที่ทั้งหมด
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((fav) => {
              const place = fav.place;
              const primaryCategory = place?.categories?.find((c) => c.is_primary)?.category || place?.categories?.[0]?.category;

              return (
                <div key={fav.favorite_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-3">
                  {place.cover_image ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={place.cover_image} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-[#2d6a4f] flex-shrink-0 bg-[#2d6a4f]/10" style={primaryCategory?.pin_color ? { backgroundColor: `${primaryCategory.pin_color}20`, color: primaryCategory.pin_color } : {}}>
                      {primaryCategory ? <span className="text-2xl">{primaryCategory.icon}</span> : <ImageIcon className="w-6 h-6" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-sm mb-0.5 truncate">{place?.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{primaryCategory?.name || "ทั่วไป"}</div>
                    <div className="flex gap-2">
                      <Link href={`/places/${place?.place_id}`}
                        className="text-xs px-2.5 py-1 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors">
                        ดูรายละเอียด
                      </Link>
                      <button onClick={() => remove(fav.place_id)}
                        className="text-xs px-2.5 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                        ลบออก
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
