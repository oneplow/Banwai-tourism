"use client";
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Link as LinkIcon, Smartphone } from "lucide-react";

export default function ShareButtons({ placeId, placeName }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const qrRef = useRef(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/places/${placeId}`);
  }, [placeId]);

  // Generate QR with qrcode.js via CDN
  useEffect(() => {
    if (!showQR || !url || !qrRef.current) return;
    qrRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      if (qrRef.current && window.QRCode) {
        new window.QRCode(qrRef.current, {
          text: url,
          width: 200,
          height: 200,
          colorDark: "#1b4332",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [showQR, url]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToFB = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  const shareToLine = () => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, "_blank");
  const shareToTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`ลองดู ${placeName} ที่บ้านหวาย!`)}`, "_blank");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-display font-semibold text-base text-gray-800 mb-3">แชร์สถานที่นี้</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={copyLink}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
            copied ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}>
          {copied ? <><CheckCircle2 className="w-4 h-4" /> คัดลอกแล้ว!</> : <><LinkIcon className="w-4 h-4" /> คัดลอกลิงก์</>}
        </button>
        <button onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all">
          <Smartphone className="w-4 h-4" /> QR Code
        </button>
        <button onClick={shareToFB}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
          Facebook
        </button>
        <button onClick={shareToLine}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
          LINE
        </button>
        <button onClick={shareToTwitter}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all">
          X (Twitter)
        </button>
      </div>

      {showQR && (
        <div className="border border-gray-100 rounded-xl p-4 text-center bg-gray-50">
          <p className="text-xs text-gray-400 mb-3">สแกน QR Code เพื่อเข้าชมสถานที่นี้</p>
          <div className="flex justify-center">
            <div ref={qrRef} className="inline-block bg-white p-2 rounded-xl shadow-sm" />
          </div>
          <p className="text-xs text-gray-400 mt-3 font-mono break-all">{url}</p>
        </div>
      )}
    </div>
  );
}
