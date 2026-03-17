"use client";
import { useState, useEffect } from "react";

export default function AdminProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState(null);

  const toast = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) { setUser(d.user); setForm({ username: d.user.username, email: d.user.email }); }
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: user.role }),
    });
    setSaving(false);
    if (res.ok) toast("อัปเดตข้อมูลสำเร็จ");
    else toast("เกิดข้อผิดพลาด", "error");
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast("รหัสผ่านใหม่ไม่ตรงกัน", "error"); return; }
    if (pwForm.newPw.length < 6) { toast("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", "error"); return; }
    setSavingPw(true);
    const res = await fetch(`/api/admin/users/${user.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: user.role, password: pwForm.newPw }),
    });
    setSavingPw(false);
    if (res.ok) { toast("เปลี่ยนรหัสผ่านสำเร็จ"); setPwForm({ current: "", newPw: "", confirm: "" }); }
    else toast("เกิดข้อผิดพลาด", "error");
  };

  if (!user) return <div className="p-6 text-gray-400 text-sm">กำลังโหลด...</div>;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${msg.type === "error" ? "bg-red-500 text-white" : "bg-[#2d6a4f] text-white"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-800">ข้อมูลส่วนตัว</h1>
        <p className="text-gray-400 text-sm mt-0.5">จัดการข้อมูลบัญชีของคุณ</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#2d6a4f]/15 flex items-center justify-center text-[#2d6a4f] text-2xl font-bold">
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <div className="font-display font-semibold text-gray-800">{user.username}</div>
          <div className="text-sm text-gray-400">{user.email}</div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
            {user.role === "admin" ? "Admin" : "Staff"}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4">
        <h2 className="font-display font-semibold text-gray-800 mb-4">แก้ไขข้อมูล</h2>
        <div className="space-y-4">
          {[
            { key: "username", label: "ชื่อผู้ใช้", type: "text" },
            { key: "email", label: "อีเมล", type: "email" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-sm text-gray-600 mb-1.5 block font-medium">{f.label}</label>
              <input type={f.type} value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]" />
            </div>
          ))}
          <button onClick={saveProfile} disabled={saving}
            className="w-full bg-[#2d6a4f] text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 hover:bg-[#1b4332] transition-colors">
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-display font-semibold text-gray-800 mb-4">เปลี่ยนรหัสผ่าน</h2>
        <div className="space-y-4">
          {[
            { key: "newPw", label: "รหัสผ่านใหม่" },
            { key: "confirm", label: "ยืนยันรหัสผ่านใหม่" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-sm text-gray-600 mb-1.5 block font-medium">{f.label}</label>
              <input type="password" value={pwForm[f.key]}
                onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f]"
                placeholder="••••••••" />
            </div>
          ))}
          <button onClick={changePassword} disabled={savingPw || !pwForm.newPw || !pwForm.confirm}
            className="w-full border border-[#2d6a4f] text-[#2d6a4f] py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 hover:bg-[#2d6a4f]/5 transition-colors">
            {savingPw ? "กำลังเปลี่ยน..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </div>
      </div>
    </div>
  );
}
