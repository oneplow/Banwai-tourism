"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart, Landmark, Star, Megaphone, TrendingUp, User, Globe, LogOut, Shield, Menu, X, Layers } from "lucide-react";

const NAV_ADMIN = [
  { href: "/admin", label: "ภาพรวม", icon: <BarChart className="w-5 h-5" />, exact: true },
  { href: "/admin/places", label: "สถานที่ท่องเที่ยว", icon: <Landmark className="w-5 h-5" /> },
  { href: "/admin/categories", label: "หมวดหมู่สถานที่", icon: <Layers className="w-5 h-5" /> },
  { href: "/admin/comments", label: "ความคิดเห็น", icon: <Star className="w-5 h-5" /> },
  { href: "/admin/announcements", label: "ประกาศข่าวสาร", icon: <Megaphone className="w-5 h-5" /> },
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: <User className="w-5 h-5" />, adminOnly: true },
  { href: "/admin/users", label: "สิทธิ์เจ้าหน้าที่", icon: <Shield className="w-5 h-5" />, staffOnly: true },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const visibleNav = NAV_ADMIN.filter((item) => {
    if (item.adminOnly) return user?.role === "admin";
    if (item.staffOnly) return user?.role === "staff";
    return true;
  });

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-[#40916c] flex items-center justify-center text-white font-bold text-sm">บ</div>
          <div>
            <div className="text-white font-display font-bold text-sm leading-tight">บ้านหวาย</div>
            <div className="text-green-300 text-[10px]">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item, i) => (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive(item)
                ? "bg-white/15 text-white"
                : "text-green-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="flex justify-center flex-shrink-0 w-6">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="pt-3 mt-3 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-green-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <span className="flex justify-center flex-shrink-0 w-6"><Globe className="w-5 h-5" /></span>
            ดูหน้าเว็บ
          </Link>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-[#40916c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.username}</div>
            <div className="text-green-300 text-[10px]">
              {user?.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-green-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1b4332] flex items-center justify-between px-4 h-14 shadow-lg">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#40916c] flex items-center justify-center text-white font-bold text-xs">บ</div>
          <span className="text-white font-display font-bold text-sm">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-out Sidebar */}
      <aside
        className={`md:hidden fixed top-14 left-0 bottom-0 z-40 w-64 bg-[#1b4332] flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-[#1b4332] flex-col min-h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
