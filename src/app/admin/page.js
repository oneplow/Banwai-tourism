import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { Landmark, Star, Hourglass, Megaphone, User, Hand, CheckCircle, BarChart, Users, Trophy } from "lucide-react";

export const metadata = { title: "Dashboard | Admin บ้านหวาย" };

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bw_token")?.value;
  const payload = await verifyToken(token);

  const [totalPlaces, totalReviews, pendingReviews, totalAnnouncements, totalUsers, topPlaces, recentReviews] =
    await Promise.all([
      prisma.place.count({ where: { is_active: true } }),
      prisma.review.count(),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.announcement.count({ where: { is_published: true } }),
      prisma.user.count(),
      prisma.place.findMany({
        where: { is_active: true },
        orderBy: { view_count: "desc" },
        take: 5,
        include: { category: { select: { icon: true, name: true } } },
      }),
      prisma.review.findMany({
        where: { status: "pending" },
        orderBy: { created_at: "desc" },
        take: 3,
        include: { place: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { label: "สถานที่", value: totalPlaces, icon: <Landmark className="w-6 h-6" />, href: "/admin/places", color: "bg-green-50 border-green-200" },
    { label: "รีวิว", value: totalReviews, icon: <Star className="w-6 h-6" />, href: "/admin/reviews", color: "bg-amber-50 border-amber-200" },
    { label: "รอตรวจสอบ", value: pendingReviews, icon: <Hourglass className="w-6 h-6" />, href: "/admin/reviews", color: "bg-orange-50 border-orange-200" },
    { label: "ประกาศ", value: totalAnnouncements, icon: <Megaphone className="w-6 h-6" />, href: "/admin/announcements", color: "bg-blue-50 border-blue-200" },
    { label: "ผู้ใช้", value: totalUsers, icon: <User className="w-6 h-6" />, href: "/admin/users", color: "bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="font-display text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">สวัสดี, {payload?.username || "Admin"} <Hand className="w-6 h-6 text-yellow-500" /></h1>
        <p className="text-gray-400 text-sm mt-0.5">{payload?.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"} · บ้านหวาย Tourism</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-2xl p-4 border ${s.color} hover:shadow-md transition-all`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-display font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-display font-semibold text-gray-800 mb-4">ทางลัด</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "จัดการสถานที่", href: "/admin/places", icon: <Landmark className="w-5 h-5" /> },
              { label: "ตรวจรีวิว", href: "/admin/reviews", icon: <CheckCircle className="w-5 h-5" /> },
              { label: "สถิติกราฟ", href: "/admin/stats", icon: <BarChart className="w-5 h-5" /> },
              { label: "จัดการผู้ใช้", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="border border-gray-100 rounded-xl p-3.5 hover:border-[#2d6a4f]/30 hover:shadow-sm transition-all">
                <div className="text-xl mb-1.5">{item.icon}</div>
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Top 5</h2>
            <Link href="/admin/stats" className="text-xs text-[#2d6a4f] hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="space-y-2.5">
            {topPlaces.map((place, i) => (
              <div key={place.place_id} className="flex items-center gap-3">
                <span className={`text-base font-bold w-6 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-gray-400" : "text-gray-300"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{place.name}</div>
                  <div className="text-xs text-gray-400">{place.category?.icon} {place.category?.name}</div>
                </div>
                <span className="text-xs text-gray-400 font-mono">{place.view_count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {pendingReviews > 0 && (
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-orange-800 flex items-center gap-2"><Hourglass className="w-5 h-5" /> รีวิวรอตรวจสอบ ({pendingReviews})</h2>
              <Link href="/admin/reviews" className="text-xs text-orange-600 font-medium hover:underline">ตรวจสอบ →</Link>
            </div>
            <div className="space-y-2">
              {recentReviews.map((r) => (
                <div key={r.review_id} className="bg-white rounded-xl px-3 py-2.5 border border-orange-100 flex items-center gap-3 text-sm">
                  <span className="flex items-center text-amber-400 gap-0.5">{Array(r.rating).fill(0).map((_, idx) => <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</span>
                  <span className="font-medium text-gray-700">{r.guest_name}</span>
                  <span className="text-gray-400 text-xs">· {r.place?.name}</span>
                  <span className="text-gray-400 text-xs truncate flex-1">{r.comment?.slice(0, 40)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
