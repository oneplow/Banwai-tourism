"use client";
import { useState, useEffect } from "react";
import { Layers, Search } from "lucide-react";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "", pin_color: "#f59e0b", sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const toast = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const openAdd = () => { setForm({ name: "", icon: "", pin_color: "#f59e0b", sort_order: 0 }); setModal("add"); };
  const openEdit = (cat) => {
    setForm({ name: cat.name || "", icon: cat.icon || "", pin_color: cat.pin_color || "#f59e0b", sort_order: cat.sort_order || 0 });
    setModal(cat);
  };

  const save = async () => {
    setSaving(true);
    const isNew = modal === "add";
    const url = isNew ? "/api/categories" : `/api/categories/${modal.category_id}`;
    const method = isNew ? "POST" : "PUT";

    // Convert sort_order to number
    const body = { ...form, sort_order: parseInt(form.sort_order) || 0 };

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { toast(data.error || "เกิดข้อผิดพลาด", "error"); return; }

    if (isNew) {
      setCategories([...categories, { ...data, _count: { places: 0 } }].sort((a, b) => a.sort_order - b.sort_order));
      toast("เพิ่มหมวดหมู่สำเร็จ");
    } else {
      setCategories(categories.map((c) => c.category_id === modal.category_id ? { ...c, ...data } : c).sort((a, b) => a.sort_order - b.sort_order));
      toast("อัปเดตสำเร็จ");
    }
    setModal(null);
  };

  const deleteCategory = (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(categories.filter((c) => c.category_id !== id));
      toast("ลบหมวดหมู่สำเร็จ");
    } else {
      const data = await res.json();
      toast(data.error || "ลบไม่สำเร็จ", "error");
    }
  };

  const filtered = categories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${msg.type === "error" ? "bg-red-500 text-white" : "bg-[#2d6a4f] text-white"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">จัดการหมวดหมู่</h1>
          <p className="text-gray-400 text-sm mt-0.5">{categories.length} หมวดหมู่ทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหมวดหมู่..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f] w-48" />
          <button onClick={openAdd} className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors whitespace-nowrap">
            + เพิ่มหมวดหมู่
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 w-16 text-center">Icon</th>
              <th className="px-4 py-3 font-medium text-gray-500">ชื่อหมวดหมู่</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">ลำดับ</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">จำนวนสถานที่</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat) => (
              <tr key={cat.category_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-2xl text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200" style={{ backgroundColor: cat.pin_color || '#2d6a4f' }} />
                    {cat.icon}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                <td className="px-4 py-3 text-center text-gray-500">{cat.sort_order}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-medium">
                    {cat._count?.places || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(cat)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      แก้ไข
                    </button>
                    <button onClick={() => deleteCategory(cat.category_id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center mb-3"><Layers className="w-10 h-10" /></div><p>ไม่พบหมวดหมู่</p>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-xl text-gray-800 mb-5">
              {modal === "add" ? "เพิ่มหมวดหมู่ใหม่" : `แก้ไข: ${modal.name}`}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block font-medium">ชื่อหมวดหมู่ *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block font-medium">Icon (Emoji หรือ Text) *</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="เช่น 🏖️"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] text-2xl" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block font-medium">ลำดับการแสดงผล (น้อยไปมาก)</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block font-medium">สีหมุดบนแผนที่</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { color: "#f59e0b", label: "เหลือง" },
                    { color: "#22c55e", label: "เขียว" },
                    { color: "#f97316", label: "ส้ม" },
                    { color: "#a855f7", label: "ม่วง" },
                    { color: "#06b6d4", label: "ฟ้า" },
                    { color: "#e63946", label: "แดง" },
                    { color: "#ec4899", label: "ชมพู" },
                    { color: "#2d6a4f", label: "เขียวเข้ม" },
                    { color: "#6366f1", label: "อินดิโก้" },
                    { color: "#78716c", label: "เทา" },
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.color}
                      onClick={() => setForm({ ...form, pin_color: c.color })}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border-2 transition-all ${
                        form.pin_color === c.color
                          ? "border-gray-800 shadow-md scale-105"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: c.color + "20", color: c.color }}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">หรือเลือกเอง:</label>
                  <input type="color" value={form.pin_color || "#f59e0b"}
                    onChange={(e) => setForm({ ...form, pin_color: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-xs font-mono text-gray-500">{form.pin_color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={save} disabled={saving || !form.name || !form.icon}
                className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 hover:bg-[#1b4332]">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="ยืนยันการลบหมวดหมู่"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="ลบทันที"
      />
    </div>
  );
}
