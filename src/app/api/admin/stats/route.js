import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "month"; // day | month | year

  try {
    // Summary counts
    const [totalPlaces, totalComments, pendingComments, totalFavorites] =
      await Promise.all([
        prisma.place.count({ where: { is_active: true } }),
        prisma.comment.count(),
        prisma.comment.count({ where: { status: "pending" } }),
        prisma.favorite.count(),
      ]);

    // Total views
    const viewAgg = await prisma.viewStat.aggregate({ _sum: { view_count: true } });
    const totalViews = viewAgg._sum.view_count || 0;

    // Top 10 places by view_count
    const topPlaces = await prisma.place.findMany({
      where: { is_active: true },
      orderBy: { view_count: "desc" },
      take: 10,
      select: {
        place_id: true,
        name: true,
        view_count: true,
        categories: {
          select: { category: { select: { name: true, icon: true } } },
          orderBy: { is_primary: "desc" },
          take: 1,
        },
      },
    });

    // Chart data based on range
    let chartData = [];
    const now = new Date();

    if (range === "day") {
      // Last 30 days
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      const stats = await prisma.viewStat.groupBy({
        by: ["view_date"],
        _sum: { view_count: true },
        where: { view_date: { gte: start } },
        orderBy: { view_date: "asc" },
      });

      const map = {};
      stats.forEach((s) => {
        const key = s.view_date.toISOString().slice(0, 10);
        map[key] = s._sum.view_count || 0;
      });

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        chartData.push({ label, value: map[key] || 0 });
      }
    } else if (range === "month") {
      // Last 12 months
      const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const stats = await prisma.viewStat.groupBy({
        by: ["view_date"],
        _sum: { view_count: true },
        where: { view_date: { gte: start } },
      });

      const map = {};
      stats.forEach((s) => {
        const d = s.view_date;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map[key] = (map[key] || 0) + (s._sum.view_count || 0);
      });

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        chartData.push({ label: MONTHS_TH[d.getMonth()], value: map[key] || 0 });
      }
    } else {
      // Last 5 years
      const startYear = now.getFullYear() - 4;
      const stats = await prisma.viewStat.groupBy({
        by: ["view_date"],
        _sum: { view_count: true },
        where: {
          view_date: { gte: new Date(`${startYear}-01-01`) },
        },
      });
      const map = {};
      stats.forEach((s) => {
        const y = s.view_date.getFullYear();
        map[y] = (map[y] || 0) + (s._sum.view_count || 0);
      });
      for (let y = startYear; y <= now.getFullYear(); y++) {
        chartData.push({ label: `${y + 543}`, value: map[y] || 0 });
      }
    }

    // Comments by rating
    const ratingDist = await prisma.comment.groupBy({
      by: ["rating"],
      _count: { rating: true },
      where: { status: "approved" },
    });
    const ratings = [5, 4, 3, 2, 1].map((r) => ({
      star: r,
      count: ratingDist.find((d) => d.rating === r)?._count.rating || 0,
    }));

    return NextResponse.json({
      summary: { totalPlaces, totalComments, pendingComments, totalFavorites, totalViews },
      topPlaces,
      chartData,
      ratings,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
