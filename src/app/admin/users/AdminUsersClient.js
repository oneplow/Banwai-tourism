"use client";
import { useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminUsersClient({ users: initialUsers, places }) {
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState(null); // null | 'add' | {user}
  const [permModal, setPermModal] = useState(null); // {user}
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "staff" });
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const toast = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const openAdd = () => {
    setForm({ username: "", email: "", password: "", role: "staff" });
    setModal("add");
  };

  const openEdit = (user) => {
    setForm({ username: user.username, email: user.email, password: "", role: user.role });
    setModal(user);
  };

  const openPerm = (user) => {
    setSelectedPlaces(user.staff_permissions?.map((p) => p.place_id) || []);
    setPermModal(user);
  };

  const saveUser = async () => {
    setSaving(true);
    const isNew = modal === "add";
    const url = isNew ? "/api/admin/users" : `/api/admin/users/${modal.user_id}`;
    const method = isNew ? "POST" : "PUT";
    const body = { ...form };
    if (!body.password) delete body.password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error || "เกิดข้อผิดพลาด", "error"); return; }

    if (isNew) {
      setUsers([{ ...data, staff_permissions: [] }, ...users]);
      toast("เพิ่มผู้ใช้สำเร็จ");
    } else {
      setUsers(users.map((u) => u.user_id === modal.user_id ? { ...u, ...data } : u));
      toast("อัปเดตข้อมูลสำเร็จ");
    }
    setModal(null);
  };

  const deleteUser = (userId) => {
    setConfirmDelete(userId);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const userId = confirmDelete;
    setConfirmDelete(null);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(users.filter((u) => u.user_id !== userId));
      toast("ลบผู้ใช้สำเร็จ");
    }
  };

  const savePerm = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${permModal.user_id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_ids: selectedPlaces }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setUsers(users.map((u) =>
        u.user_id === permModal.user_id
          ? { ...u, staff_permissions: data.permissions }
          : u
      ));
      toast("บันทึกสิทธิ์สำเร็จ");
      setPermModal(null);
    }
  };

  const togglePlace = (id) =>
    setSelectedPlaces((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${msg.type === "error" ? "bg-red-500 text-white" : "bg-[#2d6a4f] text-white"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
          <p className="text-gray-400 text-sm mt-0.5">Admin และ Staff ทั้งหมด {users.length} คน</p>
        </div>
        <button onClick={openAdd} className="bg-[#2d6a4f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors">
          + เพิ่มผู้ใช้
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">ผู้ใช้</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">สิทธิ์สถานที่</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f]/15 flex items-center justify-center text-[#2d6a4f] text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{user.username}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {user.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.role === "staff" ? (
                    <span className="text-xs text-gray-500">
                      {user.staff_permissions?.length > 0
                        ? user.staff_permissions.map((p) => p.place?.name).join(", ")
                        : "ยังไม่ได้กำหนด"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">ทุกสถานที่</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {user.role === "staff" && (
                      <button onClick={() => openPerm(user)} className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                        สิทธิ์
                      </button>
                    )}
                    <button onClick={() => openEdit(user)} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      แก้ไข
                    </button>
                    <button onClick={() => deleteUser(user.user_id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-lg text-gray-800 mb-5">
              {modal === "add" ? "เพิ่มผู้ใช้ใหม่" : `แก้ไข: ${modal.username}`}
            </h3>
            <div className="space-y-4">
              {[
                { key: "username", label: "ชื่อผู้ใช้", type: "text", placeholder: "ชื่อผู้ใช้" },
                { key: "email", label: "อีเมล", type: "email", placeholder: "email@example.com" },
                { key: "password", label: modal === "add" ? "รหัสผ่าน" : "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)", type: "password", placeholder: "••••••••" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-sm text-gray-600 mb-1 block font-medium">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                    placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-600 mb-1 block font-medium">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]">
                  <option value="staff">Staff — เจ้าหน้าที่</option>
                  <option value="admin">Admin — ผู้ดูแลระบบ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={saveUser} disabled={saving} className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#1b4332] disabled:opacity-60">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={(e) => e.target === e.currentTarget && setPermModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-lg text-gray-800 mb-1">
              กำหนดสิทธิ์: {permModal.username}
            </h3>
            <p className="text-sm text-gray-400 mb-4">เลือกสถานที่ที่เจ้าหน้าที่คนนี้ดูแล</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {places.map((place) => (
                <label key={place.place_id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedPlaces.includes(place.place_id)}
                    onChange={() => togglePlace(place.place_id)}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span className="text-sm text-gray-700">{place.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setPermModal(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={savePerm} disabled={saving} className="flex-1 bg-[#2d6a4f] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
                {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="ยืนยันการลบผู้ใช้"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? ไม่สามารถย้อนกลับได้"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
        confirmText="ลบทันที"
      />
    </div>
  );
}
