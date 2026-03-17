"use client";
import { MapPin } from "lucide-react";

export default function AdminMapPicker({ x, y, onChange }) {
  const handleMapClick = (e) => {
    const svg = e.currentTarget;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const cursorPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    
    onChange({
      x: Math.round(cursorPoint.x),
      y: Math.round(cursorPoint.y),
    });
  };

  return (
    <div className="w-full bg-[#dbe8d0] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative" style={{ height: "400px" }}>
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-[#1b4332] shadow-sm z-10 pointer-events-none">
        คลิกบนแผนที่เพื่อปักหมุดตรงนี้
      </div>
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 shadow-sm z-10 pointer-events-none">
        พิกัดบนจอ: X: {x || "-"}, Y: {y || "-"}
      </div>

      <div className="w-full h-full overflow-auto touch-pan-x touch-pan-y cursor-crosshair">
        <svg
          viewBox="0 0 400 680"
          className="w-full h-full"
          style={{ display: "block", minWidth: "350px", minHeight: "600px" }}
          onClick={handleMapClick}
        >
          <defs>
            <radialGradient id="bwBgGradPicker" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#d4e8c2" />
              <stop offset="100%" stopColor="#b8d49a" />
            </radialGradient>
            <filter id="bwShadowPicker">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background */}
          <rect width="400" height="680" fill="#dbe8d0" />

          {/* Topo rings */}
          <ellipse cx="200" cy="340" rx="190" ry="310" fill="none" stroke="#c5daa8" strokeWidth="1" opacity="0.5" />
          <ellipse cx="200" cy="340" rx="155" ry="260" fill="none" stroke="#c5daa8" strokeWidth="1" opacity="0.4" />
          <ellipse cx="200" cy="340" rx="118" ry="200" fill="none" stroke="#c5daa8" strokeWidth="1" opacity="0.3" />

          {/* Sub-district boundary */}
          <path
            d="M200,60 C240,55 280,70 310,100 C340,130 355,165 360,200 C368,245 362,290 350,330 C338,370 318,405 295,435 C272,465 245,488 215,505 C198,514 180,518 162,515 C140,512 118,500 100,482 C75,458 56,425 45,388 C32,345 28,298 35,254 C42,210 58,168 82,134 C106,100 148,68 200,60 Z"
            fill="url(#bwBgGradPicker)"
            stroke="#7aad5e"
            strokeWidth="2"
            filter="url(#bwShadowPicker)"
          />

          {/* Roads */}
          <path d="M200,60 L200,515" stroke="#fff" strokeWidth="2.5" strokeDasharray="6,5" opacity="0.5" fill="none" />
          <path d="M80,280 Q140,260 200,270 Q260,280 320,260" stroke="#fff" strokeWidth="2" strokeDasharray="5,4" opacity="0.4" fill="none" />
          <path d="M100,380 Q160,365 210,370 Q265,375 310,355" stroke="#fff" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.35" fill="none" />

          {/* Water body */}
          <ellipse cx="165" cy="420" rx="28" ry="18" fill="#90c9e8" opacity="0.7" stroke="#5ba8d4" strokeWidth="0.8" />
          <text x="165" y="423" textAnchor="middle" fontSize="9" fill="#1a5e7a" fontFamily="Sarabun,sans-serif" fontWeight="500">
            แหล่งน้ำ
          </text>

          {/* Green area */}
          <ellipse cx="255" cy="185" rx="32" ry="22" fill="#8dc96a" opacity="0.45" stroke="#5a9a3c" strokeWidth="0.8" />
          <text x="255" y="188" textAnchor="middle" fontSize="9" fill="#2d5a1b" fontFamily="Sarabun,sans-serif">
            ป่าหวาย
          </text>

          {/* Active Pin */}
          {x && y && (
            <g>
              <circle
                cx={x}
                cy={y}
                r="18"
                fill="none"
                stroke="#e63946"
                strokeWidth="1.5"
                opacity="0.5"
                className="animate-pulse"
              />
              <circle cx={x} cy={y} r="12" fill="#e63946" stroke="white" strokeWidth="2" />
              <MapPin x={x - 7} y={y - 7} width={14} height={14} color="white" />
            </g>
          )}

          {/* Scale bar (bottom right in svg space) */}
          <g transform="translate(320,640)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="#555" strokeWidth="1.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#555" strokeWidth="1.5" />
            <line x1="60" y1="-4" x2="60" y2="4" stroke="#555" strokeWidth="1.5" />
            <text x="30" y="-7" textAnchor="middle" fontSize="9" fill="#555" fontFamily="Sarabun,sans-serif">
              500 ม.
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
