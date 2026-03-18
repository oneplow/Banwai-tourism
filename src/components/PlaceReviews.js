"use client";
import { useState } from "react";
import StarRating from "./StarRating";
import { MessageSquare, ShieldAlert } from "lucide-react";

export default function PlaceReviews({ placeId, initialReviews = [], avgRating = 0 }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [form, setForm] = useState({ guest_name: "", rating: 5, comment: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, place_id: placeId }),
      });

      if (res.ok) {
        const newReview = await res.json();
        // Optimistically add to top of list with "pending" badge
        setReviews([{ ...newReview, replies: [], isNew: true }, ...reviews]);
        setStatus("success");
        setForm({ guest_name: "", rating: 5, comment: "" });

        // Hide success message after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-[#1b4332]">
          รีวิวจากนักท่องเที่ยว
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
            <span className="text-amber-500 text-sm font-bold">
              {avgRating > 0 ? avgRating.toFixed(1) : (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <StarRating rating={Math.round(avgRating) || Math.round(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length) || 0} size="sm" />
            <span className="text-gray-400 text-xs">
              {reviews.length} รีวิว
            </span>
          </div>
        )}
      </div>

      {/* Write Review Form (Top) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
        <h3 className="font-display font-semibold text-base text-[#1b4332] mb-4">
          เขียนรีวิว
        </h3>
        {status === "success" && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 text-sm">
            ขอบคุณสำหรับรีวิว! ความคิดเห็นของคุณกำลังรอการตรวจสอบจากเจ้าหน้าที่
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1.5 block font-medium">ชื่อของคุณ *</label>
              <input
                type="text"
                required
                value={form.guest_name}
                onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f]"
                placeholder="ชื่อของคุณ"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1.5 block font-medium">ให้คะแนน *</label>
              <div className="flex items-center gap-3 pt-1">
                <StarRating rating={form.rating} interactive onChange={(r) => setForm({ ...form, rating: r })} size="md" />
              </div>
            </div>
          </div>
          <div>
            <textarea
              rows={3}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none"
              placeholder="ความประทับใจของคุณ..."
            />
          </div>
          {status === "error" && (
            <p className="text-red-500 text-xs mt-1">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-[#2d6a4f] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-60"
            >
              {status === "loading" ? "กำลังส่ง..." : "โพสต์รีวิว"}
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl">
          <div className="flex justify-center text-gray-300 mb-2"><MessageSquare className="w-8 h-8" /></div>
          <p className="text-gray-400 text-sm">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสถานที่นี้!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.review_id}
              className={`bg-white rounded-xl p-4 border shadow-sm transition-all ${review.isNew ? "border-yellow-200 bg-yellow-50/10" : "border-gray-50"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{review.guest_name}</span>
                  {review.isNew && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">รอตรวจสอบ</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} size="sm" />
                  <span suppressHydrationWarning className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-600 text-sm leading-relaxed mt-2.5">
                  {review.comment}
                </p>
              )}

              {/* Staff replies */}
              {review.replies?.map((reply) => (
                <div
                  key={reply.reply_id}
                  className="mt-3 pl-3 border-l-2 border-[#2d6a4f]/30 bg-green-50/50 rounded-r-lg py-2 pr-3"
                >
                  <span className="text-xs font-medium text-[#2d6a4f] flex items-center gap-1 mb-0.5">
                    <ShieldAlert className="w-3 h-3" /> {reply.user?.username || "เจ้าหน้าที่"}
                    <span className="text-gray-400 font-normal">ตอบกลับ:</span>
                  </span>
                  <p className="text-xs text-gray-600">{reply.reply_text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
