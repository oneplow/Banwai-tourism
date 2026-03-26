"use client";
import { Bot, Sparkles, Map as MapIcon, Lightbulb, RefreshCw, Clock, Wallet, UserRound, CalendarDays, ChevronRight, ChevronLeft, Pencil, ArrowLeft, MapPin, LocateFixed } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

const STEPS = [
  { label: "กำหนดทริป", icon: CalendarDays },
  { label: "ความสนใจ", icon: Sparkles },
  { label: "สร้างแผน", icon: MapIcon },
];

const REQUIREMENTS = [
  { id: "elderly", label: "มีผู้สูงอายุ", icon: "👴" },
  { id: "kids", label: "มีเด็กเล็ก", icon: "👶" },
  { id: "wheelchair", label: "ต้องการทางเข้าเก้าอี้รถเข็น", icon: "♿" },
  { id: "food", label: "เน้นอาหารท้องถิ่น", icon: "🍜" },
  { id: "photo", label: "เน้นถ่ายรูป/เช็คอิน", icon: "📸" },
  { id: "nature", label: "ชอบธรรมชาติ", icon: "🌿" },
  { id: "history", label: "สนใจประวัติศาสตร์", icon: "🏛️" },
];

export default function TripPlannerPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    days: "1",
    interests: [],
    startTime: "08:00",
    budget: "ปานกลาง",
    travelers: "2",
    requirements: [],
    noteExtra: "",
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(""); // "", "loading", "ok", "error"

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const toggleInterest = (i) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i],
    }));

  const toggleRequirement = (id) =>
    setForm((f) => ({
      ...f,
      requirements: f.requirements.includes(id) ? f.requirements.filter((x) => x !== id) : [...f.requirements, id],
    }));

  const handleGpsToggle = () => {
    if (gpsEnabled) {
      setGpsEnabled(false);
      setUserCoords(null);
      setGpsStatus("");
      return;
    }
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsEnabled(true);
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
      },
      () => {
        setGpsStatus("error");
        setGpsEnabled(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const reqLabels = form.requirements.map((id) => REQUIREMENTS.find((r) => r.id === id)?.label).filter(Boolean);
      const res = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          interests: form.interests.join(", ") || "ทั่วไป",
          note: [...reqLabels, form.noteExtra].filter(Boolean).join(", "),
          ...(gpsEnabled && userCoords ? { userLat: userCoords.lat, userLng: userCoords.lng } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data);
    } catch (e) {
      setError(e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setLoading(false);
  };

  const canNext = step === 0 ? true : step === 1 ? true : false;

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-start mb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#2d6a4f] text-sm font-medium hover:underline">
              <ArrowLeft className="w-4 h-4" /> หน้าแรก
            </Link>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2d6a4f]/10 text-[#2d6a4f] mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#1b4332] mb-2">
            ผู้ช่วยจัดทริปอัจฉริยะ
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            บอกความต้องการของคุณ แล้ว AI จะวางแผนทริปบ้านหวายให้อัตโนมัติ
          </p>
        </div>

        {/* Step indicator */}
        {!plan && (
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex items-center">
                  <button
                    onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#2d6a4f] text-white shadow-md"
                        : isDone
                        ? "bg-[#2d6a4f]/10 text-[#2d6a4f] cursor-pointer hover:bg-[#2d6a4f]/20"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className={`w-4 h-4 mx-1 ${i < step ? "text-[#2d6a4f]" : "text-gray-300"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 0: Trip settings ── */}
        {!plan && step === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-fade-in">
            <h2 className="font-display font-semibold text-lg text-[#1b4332] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#2d6a4f]" /> กำหนดรายละเอียดทริป
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Days */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> จำนวนวัน
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: Math.max(1, Math.min(7, Math.floor(Number(e.target.value) || 1))).toString() })}
                  onKeyDown={(e) => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 h-[42px]"
                />
              </div>

              {/* Start time */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> เวลาเริ่ม
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 h-[42px]"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> งบประมาณ
                </label>
                <select
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 h-[42px]"
                >
                  {["ฟรี", "ประหยัด", "ปานกลาง", "พรีเมียม"].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Travelers */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                  <UserRound className="w-3 h-3" /> จำนวนคน
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={form.travelers}
                  onChange={(e) => setForm({ ...form, travelers: Math.max(1, Math.min(50, Math.floor(Number(e.target.value) || 1))).toString() })}
                  onKeyDown={(e) => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 h-[42px]"
                />
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block flex items-center gap-1">
                <Pencil className="w-3 h-3" /> ความต้องการพิเศษ (ไม่บังคับ)
              </label>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENTS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRequirement(r.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-1.5 ${
                      form.requirements.includes(r.id)
                        ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#2d6a4f]/50 hover:bg-green-50/50"
                    }`}
                  >
                    <span>{r.icon}</span> {r.label}
                  </button>
                ))}
              </div>
              <textarea
                value={form.noteExtra}
                onChange={(e) => setForm({ ...form, noteExtra: e.target.value })}
                placeholder="อื่นๆ เพิ่มเติม..."
                rows={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 resize-none mt-2.5"
              />
            </div>

            {/* GPS Nearby toggle */}
            <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <LocateFixed className={`w-5 h-5 ${gpsEnabled ? "text-[#2d6a4f]" : "text-gray-400"}`} />
                <div>
                  <span className="text-sm font-medium text-gray-700">แนะนำจากตำแหน่งของฉัน</span>
                  <p className="text-xs text-gray-400">เรียงสถานที่ใกล้คุณก่อน</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gpsStatus === "loading" && <span className="text-xs text-amber-500 animate-pulse">กำลังค้นหา...</span>}
                {gpsStatus === "ok" && <span className="text-xs text-green-600">✅ พบตำแหน่ง</span>}
                {gpsStatus === "error" && <span className="text-xs text-red-500">❌ ไม่สามารถเข้าถึง</span>}
                <button
                  type="button"
                  onClick={handleGpsToggle}
                  className={`relative w-11 h-6 rounded-full transition-colors ${gpsEnabled ? "bg-[#2d6a4f]" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gpsEnabled ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-[#2d6a4f] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#1b4332] transition-colors flex items-center justify-center gap-2"
            >
              ถัดไป <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 1: Interests ── */}
        {!plan && step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-fade-in">
            <h2 className="font-display font-semibold text-lg text-[#1b4332] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2d6a4f]" /> เลือกสิ่งที่สนใจ
            </h2>
            <p className="text-gray-500 text-sm">เลือกได้หลายอย่าง — AI จะจัดสถานที่ตามความสนใจของคุณ</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.category_id}
                  onClick={() => toggleInterest(c.name)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border text-left flex items-center gap-2 ${
                    form.interests.includes(c.name)
                      ? "border-[#2d6a4f] text-white shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2d6a4f]/50 hover:bg-green-50/50"
                  }`}
                  style={
                    form.interests.includes(c.name)
                      ? { backgroundColor: c.pin_color || '#2d6a4f', borderColor: c.pin_color || '#2d6a4f' }
                      : {}
                  }
                >
                  <span className="text-base">{c.icon}</span>
                  {c.name}
                </button>
              ))}
              <button
                onClick={() => {
                  const allSelected = categories.every(c => form.interests.includes(c.name));
                  if (allSelected) {
                    setForm(f => ({ ...f, interests: [] }));
                  } else {
                    setForm(f => ({ ...f, interests: categories.map(c => c.name) }));
                  }
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border text-left flex items-center gap-2 ${
                  categories.length > 0 && categories.every(c => form.interests.includes(c.name))
                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2d6a4f]/50 hover:bg-green-50/50"
                }`}
              >
                🗺️ ทั้งหมด
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#2d6a4f] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#1b4332] transition-colors flex items-center justify-center gap-2"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Generate ── */}
        {!plan && step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-fade-in">
            <h2 className="font-display font-semibold text-lg text-[#1b4332] flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-[#2d6a4f]" /> สรุปและสร้างแผนทริป
            </h2>

            {/* Summary of selections */}
            <div className="bg-[#f8f4ef] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">จำนวนวัน</span>
                <span className="font-medium text-[#1b4332]">{form.days} วัน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">เริ่มเวลา</span>
                <span className="font-medium text-[#1b4332]">{form.startTime} น.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">งบประมาณ</span>
                <span className="font-medium text-[#1b4332]">{form.budget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">จำนวนคน</span>
                <span className="font-medium text-[#1b4332]">{form.travelers} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ความสนใจ</span>
                <span className="font-medium text-[#1b4332] text-right max-w-[60%]">
                  {form.interests.length > 0 ? form.interests.join(", ") : "ทั่วไป"}
                </span>
              </div>
              {form.note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">หมายเหตุ</span>
                  <span className="font-medium text-[#1b4332] text-right max-w-[60%]">{form.note}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-shrink-0 border border-gray-200 text-gray-600 py-3 px-5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> แก้ไข
              </button>
              <button
                onClick={generate}
                disabled={loading}
                className="flex-1 bg-[#2d6a4f] text-white py-3.5 rounded-xl text-base font-semibold hover:bg-[#1b4332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    AI กำลังวางแผนทริป...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    สร้างแผนทริปเดี๋ยวนี้
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {plan && (
          <div className="space-y-5 animate-fade-in">
            {/* Mock notice */}
            {plan._isMock && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
                <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
                <div className="text-sm">
                  <p className="font-medium text-amber-800">นี่คือแผนตัวอย่าง (ข้อมูลจริง แต่ยังไม่ผ่าน AI)</p>
                  <p className="text-amber-600 mt-0.5">โควต้า AI หมดชั่วคราว — ลองกด &quot;สร้างแผนใหม่&quot; อีกครั้งใน 1-2 นาที</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <MapIcon className="w-5 h-5 text-green-300" />
                <span className="font-display font-bold text-lg">แผนทริปของคุณ</span>
              </div>
              <p className="text-green-100 text-sm leading-relaxed">{plan.summary}</p>
              <div className="flex gap-3 mt-4 text-xs">
                <span className="bg-white/15 px-3 py-1 rounded-full">{form.days} วัน</span>
                <span className="bg-white/15 px-3 py-1 rounded-full">{form.travelers} คน</span>
                <span className="bg-white/15 px-3 py-1 rounded-full">{form.budget}</span>
              </div>
            </div>

            {/* Days */}
            {plan.days?.map((day) => (
              <div key={day.day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#2d6a4f] px-5 py-3 flex items-center gap-2">
                  <span className="text-white font-display font-bold">วันที่ {day.day}</span>
                  <span className="text-green-200 text-sm">— {day.title}</span>
                </div>
                <div className="relative">
                  {day.schedule?.map((item, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4 relative">
                      {/* Vertical timeline line */}
                      {i < day.schedule.length - 1 && (
                        <div className="absolute left-[2.95rem] top-[3.5rem] bottom-0 w-px bg-[#2d6a4f]/15" />
                      )}
                      <div className="text-center flex-shrink-0 w-14 relative z-10">
                        <div className="text-[#2d6a4f] font-mono font-semibold text-sm">{item.time}</div>
                        <div className="w-8 h-8 mx-auto mt-1 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-base">
                          {item.category_icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start gap-3">
                          {item.cover_image && (
                            <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              <Image
                                src={item.cover_image}
                                alt={item.place_name}
                                width={64}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.place_id ? (
                                <Link
                                  href={`/places/${item.place_id}`}
                                  className="font-medium text-gray-800 hover:text-[#2d6a4f] transition-colors text-sm"
                                >
                                  {item.place_name} →
                                </Link>
                              ) : (
                                <span className="font-medium text-gray-800 text-sm">{item.place_name}</span>
                              )}
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {item.duration}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">{item.activity}</p>
                            {item.tip && (
                              <p className="text-xs text-[#40916c] mt-1.5 bg-green-50 px-2.5 flex items-center gap-1 py-1 rounded-lg inline-block">
                                <Lightbulb className="w-3 h-3" /> {item.tip}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Tips */}
            {plan.tips?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <div className="font-display font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" /> เคล็ดลับการเดินทาง
                </div>
                <ul className="space-y-1.5">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={generate}
                className="flex-1 flex justify-center items-center gap-2 border border-[#2d6a4f] text-[#2d6a4f] py-3 rounded-xl text-sm font-medium hover:bg-[#2d6a4f]/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> สร้างแผนใหม่
              </button>
              <button
                onClick={() => {
                  setPlan(null);
                  setStep(0);
                }}
                className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> เริ่มใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
