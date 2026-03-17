"use client";
import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", image_url: "", is_published: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const toast = (text) => { setMsg(text); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    fetch("/api/announcements?all=true").then((r) => r.json()).then(setItems);
  }, []);

  const openAdd = () => { setForm({ title: "", content: "", image_url: "", is_published: true }); setModal("add"); };
  const openEdit = (item) => { setForm({ title: item.title, content: item.content, image_url: item.image_url || "", is_published: item.is_published }); setModal(item); };

  const save = async () => {
    setSaving(true);
    const isNew = modal === "add";
    const url = "/api/announcements";
    const method = isNew ? "POST" : "PATCH";
    const body = isNew ? form : { ...form, announcement_id: modal.announcement_id };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      if (isNew) setItems([{ ...data, user: { username: "admin" } }, ...items]);
      else setItems(items.map((i) => i.announcement_id === modal.announcement_id ? { ...i, ...data } : i));
      toast(isNew ? "เพิ่มประกาศสำเร็จ" : "อัปเดตสำเร็จ");
      setModal(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {msg && <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg bg-[#2d6a4f] text-white">{msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">จัดการประกาศ</h1>
          <p className="text-gray-400 text-sm mt-0.5">ข่าวสารและกิจกรรม</p>
        </div>
        <button onClick={openAdd} className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b4332]">
          + เพิ่มประกาศ
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.announcement_id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.is_published ? "เผยแพร่" : "ฉบับร่าง"}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleDateString("th-TH", { year:"numeric",month:"long",day:"numeric" })}</p>
            </div>
            <button onClick={() => openEdit(item)} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex-shrink-0">
              แก้ไข
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-16 text-gray-400"><div className="flex justify-center mb-3"><Megaphone className="w-10 h-10" /></div><p>ยังไม่มีประกาศ</p></div>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-display font-bold text-lg text-gray-800 mb-5">{modal === "add" ? "เพิ่มประกาศ" : "แก้ไขประกาศ"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">หัวข้อ *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">เนื้อหา *</label>
                <textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">URL รูปภาพ (ถ้ามี)</label>
                <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 accent-[#2d6a4f]" />
                <span className="text-sm text-gray-700 font-medium">เผยแพร่ทันที</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={save} disabled={saving || !form.title || !form.content}
                className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
