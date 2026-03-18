"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AdminMapPicker from "@/components/admin/AdminMapPicker";
import ConfirmModal from "@/components/admin/ConfirmModal";

const EMPTY_FORM = {
  name: "", category_id: "", description: "", history: "",
  latitude: "", longitude: "", address: "", phone: "",
  open_hours: "", cover_image: "", map_x: "", map_y: "", is_active: true,
  images: [],
};

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isAdmin = user?.role === "admin";

  const toast = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  useEffect(() => {
    Promise.all([
      fetch("/api/places?admin=true").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([p, c, me]) => {
      setUser(me.user);
      // Staff: filter places by assigned permissions
      if (me.user?.role === "staff") {
        const allowedIds = me.user.staff_permissions?.map((sp) => sp.place_id) || [];
        setPlaces(p.filter((place) => allowedIds.includes(place.place_id)));
      } else {
        setPlaces(p);
      }
      setCategories(c);
    });
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit = (place) => {
    setForm({
      name: place.name || "", category_id: place.category_id || "",
      description: place.description || "", history: place.history || "",
      latitude: place.latitude || "", longitude: place.longitude || "",
      address: place.address || "", phone: place.phone || "",
      open_hours: place.open_hours || "", cover_image: place.cover_image || "",
      map_x: place.map_x || "", map_y: place.map_y || "",
      is_active: place.is_active ?? true,
      images: place.images?.map(img => ({ image_url: img.image_url, caption: img.caption || "" })) || [],
    });
    setModal(place);
  };

  const addImageField = () => {
    setForm({ ...form, images: [...form.images, { image_url: "", caption: "" }] });
  };

  const updateImageField = (index, field, value) => {
    const newImages = [...form.images];
    newImages[index][field] = value;
    setForm({ ...form, images: newImages });
  };

  const removeImageField = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const save = async () => {
    setSaving(true);
    const isNew = modal === "add";
    const url = isNew ? "/api/places" : `/api/places/${modal.place_id}`;
    const method = isNew ? "POST" : "PUT";
    const body = {
      ...form,
      category_id: parseInt(form.category_id),
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
      map_x: parseFloat(form.map_x) || null,
      map_y: parseFloat(form.map_y) || null,
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error || "เกิดข้อผิดพลาด", "error"); return; }
    if (isNew) { setPlaces([data, ...places]); toast("เพิ่มสถานที่สำเร็จ"); }
    else { setPlaces(places.map((p) => p.place_id === modal.place_id ? { ...p, ...data } : p)); toast("อัปเดตสำเร็จ"); }
    setModal(null);
  };

  const toggleActive = async (place) => {
    const cleanImages = place.images?.map(img => ({ image_url: img.image_url, caption: img.caption || "" })) || [];
    const res = await fetch(`/api/places/${place.place_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...place, is_active: !place.is_active, images: cleanImages }),
    });
    if (res.ok) {
      setPlaces(places.map((p) => p.place_id === place.place_id ? { ...p, is_active: !p.is_active } : p));
    }
  };

  const deletePlace = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/places/${confirmDelete}`, { method: "DELETE" });
    if (res.ok) {
      setPlaces(places.filter((p) => p.place_id !== confirmDelete));
      toast("ลบสถานที่สำเร็จ");
    } else {
      toast("เกิดข้อผิดพลาดในการลบ", "error");
    }
    setConfirmDelete(null);
  };

  const filtered = places.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  const FIELDS = [
    { key: "name", label: "ชื่อสถานที่ *", type: "text", full: true },
    { key: "address", label: "ที่อยู่", type: "text", full: true },
    { key: "description", label: "รายละเอียด", type: "textarea", full: true },
    { key: "history", label: "ประวัติความเป็นมา", type: "textarea", full: true },
    { key: "phone", label: "โทรศัพท์", type: "text" },
    { key: "open_hours", label: "เวลาทำการ", type: "text" },
    { key: "latitude", label: "Latitude", type: "number" },
    { key: "longitude", label: "Longitude", type: "number" },
    { key: "cover_image", label: "รูปปก (path หรือ URL)", type: "text", full: true },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${msg.type === "error" ? "bg-red-500 text-white" : "bg-[#2d6a4f] text-white"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">สถานที่ท่องเที่ยว</h1>
          <p className="text-gray-400 text-sm mt-0.5">{places.length} สถานที่ทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อสถานที่..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f] w-48" />
          {isAdmin && (
            <button onClick={openAdd} className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors whitespace-nowrap">
              + เพิ่มสถานที่
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">ชื่อสถานที่</th>
              <th className="px-4 py-3 font-medium text-gray-500">หมวดหมู่</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">เข้าชม</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">สถานะ</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((place) => (
              <tr key={place.place_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{place.name}</div>
                  <div className="text-xs text-gray-400 truncate max-w-xs">{place.address}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {place.category?.icon} {place.category?.name}
                </td>
                <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                  {place.view_count?.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(place)}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      place.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}>
                    {place.is_active ? "แสดง" : "ซ่อน"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/places/${place.place_id}`} target="_blank"
                      className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      ดู
                    </Link>
                    <button onClick={() => openEdit(place)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      แก้ไข
                    </button>
                    {isAdmin && (
                      <button onClick={() => setConfirmDelete(place.place_id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        ลบ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center mb-3"><Search className="w-10 h-10" /></div><p>ไม่พบสถานที่</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-xl text-gray-800 mb-5">
              {modal === "add" ? "เพิ่มสถานที่ใหม่" : `แก้ไข: ${modal.name}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="col-span-2">
                <label className="text-sm text-gray-600 mb-1.5 block font-medium">หมวดหมู่ *</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]">
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {FIELDS.map((f) => (
                <div key={f.key} className={f.full ? "col-span-2" : ""}>
                  <label className="text-sm text-gray-600 mb-1.5 block font-medium">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none" />
                  ) : (
                    <input type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
                  )}
                </div>
              ))}

              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-gray-600 font-medium">
                    แกลเลอรีรูปภาพเพิ่มเติม
                  </label>
                  <button type="button" onClick={addImageField} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    + เพิ่มรูปภาพ
                  </button>
                </div>
                <div className="space-y-3">
                  {form.images.map((img, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="URL รูปภาพ หรือ path"
                          value={img.image_url}
                          onChange={(e) => updateImageField(index, "image_url", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f]"
                        />
                        <input
                          type="text"
                          placeholder="คำบรรยายรูปภาพ (Caption)"
                          value={img.caption}
                          onChange={(e) => updateImageField(index, "caption", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบรูปภาพนี้"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <div className="text-xs text-center text-gray-400 py-2">
                      ยังไม่มีรูปภาพเพิ่มเติม
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                <label className="text-sm text-gray-600 mb-2 block font-medium">
                  พิกัดบนแผนที่จำลอง (คลิกเพื่อเลือกตำแหน่ง)
                </label>
                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 block mb-1">X (แนวนอน)</label>
                    <input type="number" value={form.map_x} onChange={(e) => setForm({ ...form, map_x: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 block mb-1">Y (แนวตั้ง)</label>
                    <input type="number" value={form.map_y} onChange={(e) => setForm({ ...form, map_y: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
                <AdminMapPicker 
                  x={form.map_x} 
                  y={form.map_y} 
                  onChange={(coords) => setForm({ ...form, map_x: coords.x, map_y: coords.y })}
                />
              </div>

              <div className="col-span-2 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span className="text-sm text-gray-700 font-medium">แสดงในเว็บไซต์</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={save} disabled={saving || !form.name || !form.category_id}
                className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 hover:bg-[#1b4332]">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="ยืนยันการลบสถานที่"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบสถานที่นี้? ข้อมูลรีวิว รูปภาพ และสถิติที่เกี่ยวข้องจะถูกลบทั้งหมด ไม่สามารถย้อนกลับได้"
        onConfirm={deletePlace}
        onCancel={() => setConfirmDelete(null)}
        confirmText="ลบถาวร"
      />
    </div>
  );
}
