"use client";
import { useState, useEffect, useCallback } from "react";
import { Eye, Star, Heart, BarChart as BarChartIcon } from "lucide-react";

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

const RANGES = [
  { key: "day", label: "รายวัน" },
  { key: "month", label: "รายเดือน" },
  { key: "year", label: "รายปี" },
];

export default function DashboardStats() {
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

  return (
    <>
      {/* Extra summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Eye className="w-5 h-5 text-gray-400 mb-1.5" />
          <div className="text-xl font-display font-bold text-gray-800">{data?.summary?.totalViews?.toLocaleString() ?? "—"}</div>
          <div className="text-xs text-gray-500">ยอดเข้าชมรวม</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Heart className="w-5 h-5 text-gray-400 mb-1.5" />
          <div className="text-xl font-display font-bold text-gray-800">{data?.summary?.totalFavorites?.toLocaleString() ?? "—"}</div>
          <div className="text-xs text-gray-500">บันทึกถูกใจ</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <Star className="w-5 h-5 text-gray-400 mb-1.5" />
          <div className="text-xl font-display font-bold text-gray-800">{data?.summary?.totalComments?.toLocaleString() ?? "—"}</div>
          <div className="text-xs text-gray-500">ความคิดเห็นทั้งหมด</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <BarChartIcon className="w-5 h-5 text-gray-400 mb-1.5" />
          <div className="text-xl font-display font-bold text-gray-800">ปกติ</div>
          <div className="text-xs text-gray-500">สถานะระบบ</div>
        </div>
      </div>

      {/* Chart + Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </>
  );
}
