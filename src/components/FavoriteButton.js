"use client";
import { useState, useEffect } from "react";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let sid = localStorage.getItem("bw_session");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("bw_session", sid);
  }
  return sid;
}

export default function FavoriteButton({ placeId }) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) return;
    fetch(`/api/favorites?session_id=${sid}`)
      .then((r) => r.json())
      .then((data) => {
        setIsFav(data.some((f) => f.place_id === placeId));
      })
      .catch(() => {});
  }, [placeId]);

  const toggle = async () => {
    setLoading(true);
    const sid = getSessionId();
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, place_id: placeId }),
      });
      const data = await res.json();
      setIsFav(data.added);
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isFav ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
        isFav
          ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
          : "bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-400"
      } disabled:opacity-50`}
    >
      <svg
        className="w-4 h-4"
        fill={isFav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {isFav ? "บันทึกแล้ว" : "บันทึก"}
    </button>
  );
}
