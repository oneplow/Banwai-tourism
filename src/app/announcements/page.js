import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Megaphone, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "ข่าวสาร | บ้านหวาย",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { is_published: true },
    include: { user: { select: { username: true } } },
    orderBy: { created_at: "desc" },
  });

  return (
    <>
      <Navbar />

      <div className="bg-[#f8f4ef] thai-pattern border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#2d6a4f] text-sm font-medium hover:underline mb-3">
            <ArrowLeft className="w-4 h-4" /> หน้าแรก
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1b4332] mb-2">
            ข่าวสารและประกาศ
          </h1>
          <p className="text-gray-500 text-sm">อัปเดตข่าวสารจากตำบลบ้านหวาย</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {announcements.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="flex justify-center mb-4"><Megaphone className="w-12 h-12" /></div>
            <p>ยังไม่มีประกาศในขณะนี้</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((ann) => (
              <article
                key={ann.announcement_id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                  <span className="bg-[#2d6a4f]/10 text-[#2d6a4f] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> ประกาศ
                  </span>
                  <span suppressHydrationWarning>
                    {new Date(ann.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>โดย {ann.user?.username}</span>
                </div>
                <h2 className="font-display font-bold text-xl text-gray-900 mb-3">
                  {ann.title}
                </h2>
                {ann.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                    <img src={ann.image_url} alt={ann.title} className="w-full max-h-[400px] object-cover" />
                  </div>
                )}
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#2d6a4f] text-sm font-medium hover:underline"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
      </div>
    </>
  );
}
