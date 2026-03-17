"use client";
import { useState, useEffect, useCallback } from "react";
import { Landmark, Eye, Star, Heart, BarChart as BarChartIcon, Trophy } from "lucide-react";

function BarChart({ data, color = "#2d6a4f" }) {
  if (!data?.length) return <div className="text-center text-gray-400 py-10 text-sm">ไม่มีข้อมูล</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-48 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: "160px" }}>
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${Math.max((d.value / max) * 160, d.value > 0 ? 4 : 0)}px`,
                background: color,
                opacity: 0.85,
              }}
              title={`${d.value} ครั้ง`}
            />
            {d.value > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {d.value.toLocaleString()}
              </div>
            )}
          </div>
          <span className="text-[9px] text-gray-400 text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-display font-bold text-gray-800">{value?.toLocaleString?.() ?? value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-orange-500 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

export default function AdminStatsPage() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (r) => {
    setLoading(true);
    const res = await fetch(`/api/admin/stats?range=${r}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(range); }, [range, fetchStats]);

  const RANGES = [
    { key: "day", label: "รายวัน (30 วัน)" },
    { key: "month", label: "รายเดือน (12 เดือน)" },
    { key: "year", label: "รายปี (5 ปี)" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-800">สถิติและรายงาน</h1>
        <p className="text-gray-400 text-sm mt-0.5">ข้อมูลการเข้าชมและความนิยม</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard icon={<Landmark className="w-6 h-6" />} label="สถานที่ทั้งหมด" value={data?.summary?.totalPlaces ?? "—"} />
        <StatCard icon={<Eye className="w-6 h-6" />} label="ยอดเข้าชมรวม" value={data?.summary?.totalViews ?? "—"} />
        <StatCard icon={<Star className="w-6 h-6" />} label="รีวิวทั้งหมด" value={data?.summary?.totalReviews ?? "—"}
          sub={data?.summary?.pendingReviews > 0 ? `รอตรวจสอบ ${data.summary.pendingReviews}` : null} />
        <StatCard icon={<Heart className="w-6 h-6" />} label="บันทึกถูกใจ" value={data?.summary?.totalFavorites ?? "—"} />
        <StatCard icon={<BarChartIcon className="w-6 h-6" />} label="สถานะ" value="ปกติ" />
      </div>

      {/* Chart + Top 10 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-gray-800">สถิติการเข้าชม</h2>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button key={r.key} onClick={() => setRange(r.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    range === r.key ? "bg-[#2d6a4f] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">กำลังโหลด...</div>
          ) : (
            <BarChart data={data?.chartData} />
          )}
        </div>

        {/* Rating distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-display font-semibold text-gray-800 mb-4">การกระจายคะแนน</h2>
          <div className="space-y-2">
            {(data?.ratings || [5,4,3,2,1].map(s=>({star:s,count:0}))).map((r) => {
              const total = data?.ratings?.reduce((s, x) => s + x.count, 0) || 1;
              const pct = Math.round((r.count / total) * 100);
              return (
                <div key={r.star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8 text-right flex items-center justify-end gap-0.5">{r.star}<Star className="w-3 h-3 fill-gray-400 text-gray-400" /></span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8">{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 10 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="font-display font-semibold text-gray-800">Top 10 สถานที่ยอดนิยม</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(data?.topPlaces || Array(5).fill(null)).map((place, i) => {
            const maxV = data?.topPlaces?.[0]?.view_count || 1;
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <span className={`text-lg font-display font-bold w-8 text-center ${
                  i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"
                }`}>
                  {i + 1}
                </span>
                {place ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{place.name}</div>
                      <div className="text-xs text-gray-400">
                        {place.category?.icon} {place.category?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 bg-[#2d6a4f] rounded-full transition-all"
                          style={{ width: `${(place.view_count / maxV) * 100}%` }} />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right font-mono">
                        {place.view_count.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
