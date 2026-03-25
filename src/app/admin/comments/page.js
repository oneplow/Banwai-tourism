"use client";
import { useState, useEffect } from "react";
import StarRating from "@/components/StarRating";
import { Mailbox, ShieldAlert, MapPin } from "lucide-react";

const STATUS_LABELS = { pending: "รอตรวจสอบ", approved: "อนุมัติ", hidden: "ซ่อน" };
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  hidden: "bg-gray-100 text-gray-500",
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [allowedPlaceIds, setAllowedPlaceIds] = useState(null);

  const toast = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  // Fetch user info on mount to get staff permissions
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setUser(d.user);
        if (d.user.role === "staff") {
          setAllowedPlaceIds(d.user.staff_permissions?.map((sp) => sp.place_id) || []);
        }
      }
    });
  }, []);

  const fetchComments = async (status) => {
    setLoading(true);
    const res = await fetch(`/api/comments?status=${status}&all=true`);
    let data = await res.json();
    // Staff: filter comments to only assigned places
    if (allowedPlaceIds !== null) {
      data = data.filter((r) => allowedPlaceIds.includes(r.place_id));
    }
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user !== null) fetchComments(filter);
  }, [filter, user]);

  const updateStatus = async (commentId, status) => {
    const res = await fetch("/api/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId, status }),
    });
    if (res.ok) {
      setComments((prev) => prev.map((r) => r.comment_id === commentId ? { ...r, status } : r));
      toast(`เปลี่ยนสถานะเป็น "${STATUS_LABELS[status]}" แล้ว`);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    const res = await fetch("/api/comments/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: replyModal.comment_id, reply_text: replyText }),
    });
    setSaving(false);
    if (res.ok) { toast("ตอบกลับสำเร็จ"); setReplyModal(null); setReplyText(""); fetchComments(filter); }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${msg.type === "error" ? "bg-red-500 text-white" : "bg-[#2d6a4f] text-white"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-800">จัดการความคิดเห็น</h1>
        <p className="text-gray-400 text-sm mt-0.5">ตรวจสอบและจัดการความคิดเห็น</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === k ? "bg-[#2d6a4f] text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><div className="flex justify-center mb-3"><Mailbox className="w-10 h-10" /></div><p>ไม่มีความคิดเห็น</p></div>
      ) : (
        <div className="space-y-3">
          {comments.map((item) => (
            <div key={item.comment_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-800 text-sm">{item.guest_name}</span>
                    <StarRating rating={item.rating} size="sm" />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{item.comment}</p>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.place?.name} · {new Date(item.created_at).toLocaleDateString("th-TH")}
                  </div>
                  {item.replies?.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-[#2d6a4f]/30 bg-green-50/50 rounded-r-lg py-2 pr-3">
                      <span className="flex items-center gap-1 text-xs text-[#2d6a4f] font-medium"><ShieldAlert className="w-3 h-3" /> ตอบกลับแล้ว: </span>
                      <span className="text-xs text-gray-600">{item.replies[0].reply_text}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {item.status !== "approved" && (
                    <button onClick={() => updateStatus(item.comment_id, "approved")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                      อนุมัติ
                    </button>
                  )}
                  {item.status !== "hidden" && (
                    <button onClick={() => updateStatus(item.comment_id, "hidden")}
                      className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      ซ่อน
                    </button>
                  )}
                  {item.replies?.length === 0 && (
                    <button onClick={() => { setReplyModal(item); setReplyText(""); }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                      ตอบกลับ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && setReplyModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-lg text-gray-800 mb-1">ตอบกลับความคิดเห็น</h3>
            <p className="text-sm text-gray-400 mb-4">จาก: {replyModal.guest_name}</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">{replyModal.comment}</div>
            <textarea rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none mb-4"
              placeholder="เขียนข้อความตอบกลับ..." />
            <div className="flex gap-2">
              <button onClick={() => setReplyModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={submitReply} disabled={saving || !replyText.trim()}
                className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
                {saving ? "กำลังส่ง..." : "ส่งการตอบกลับ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
