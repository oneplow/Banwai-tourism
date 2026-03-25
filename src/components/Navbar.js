"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-lg font-bold shadow">
            บ
          </div>
          <div>
            <div className="font-display font-bold text-[#1b4332] text-base leading-tight">
              บ้านหวาย
            </div>
            <div className="text-xs text-[#40916c] font-body">
              ตำบลบ้านหวาย
            </div>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-body">
          <Link
            href="/"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors"
          >
            หน้าแรก
          </Link>
          <Link
            href="/places"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors"
          >
            สถานที่ท่องเที่ยว
          </Link>
          <Link
            href="/map"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors"
          >
            แผนที่
          </Link>
          <Link
            href="/trip"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors"
          >
            จัดทริป AI
          </Link>
          <Link
            href="/favorites"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors flex items-center gap-1"
          >
            {/* <Heart className="w-4 h-4 text-red-500 fill-red-500" /> */} บันทึก
          </Link>
          <Link
            href="/announcements"
            className="text-gray-600 hover:text-[#2d6a4f] transition-colors"
          >
            ข่าวสาร
          </Link>
          {/* <Link
            href="/admin"
            className="px-4 py-1.5 rounded-full bg-[#2d6a4f] text-white hover:bg-[#1b4332] transition-colors text-sm"
          >
            จัดการระบบ
          </Link> */}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3 text-sm font-body">
          <Link href="/" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>หน้าแรก</Link>
          <Link href="/places" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>สถานที่ท่องเที่ยว</Link>
          <Link href="/map" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>แผนที่</Link>
          <Link href="/trip" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>จัดทริป AI</Link>
          <Link href="/favorites" className="text-gray-700 py-1 flex items-center gap-1.5" onClick={() => setMenuOpen(false)}><Heart className="w-4 h-4 text-red-500 fill-red-500" /> บันทึก</Link>
          <Link href="/announcements" className="text-gray-700 py-1" onClick={() => setMenuOpen(false)}>ข่าวสาร</Link>
          <Link href="/admin" className="text-[#2d6a4f] font-medium py-1" onClick={() => setMenuOpen(false)}>จัดการระบบ</Link>
        </div>
      )}
    </nav>
  );
}
