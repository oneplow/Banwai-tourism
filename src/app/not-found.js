import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="flex justify-center mb-6 text-[#2d6a4f]"><Leaf className="w-20 h-20" /></div>
        <h1 className="font-display text-4xl font-bold text-[#1b4332] mb-3">
          ไม่พบหน้านี้
        </h1>
        <p className="text-gray-500 mb-8">
          หน้าที่คุณกำลังมองหาอาจถูกลบหรือเปลี่ยนที่อยู่แล้ว
        </p>
        <Link
          href="/"
          className="bg-[#2d6a4f] text-white px-8 py-3 rounded-full font-medium hover:bg-[#1b4332] transition-colors"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </>
  );
}
