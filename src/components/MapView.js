"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, Clock, Phone, Image as ImageIcon } from "lucide-react";

const CATEGORY_COLORS = {
  "วัด / ศาสนสถาน": "#f59e0b",
  "แหล่งธรรมชาติ": "#22c55e",
  "ตลาด / ของกิน": "#f97316",
  "วัฒนธรรม / ประเพณี": "#a855f7",
  "โฮมสเตย์ / ที่พัก": "#06b6d4",
};

const DEFAULT_COLOR = "#2d6a4f";

function getPinColor(categoryName) {
  return CATEGORY_COLORS[categoryName] || DEFAULT_COLOR;
}

// Pulse ring animation keyframes injected once
const PULSE_STYLE = `
  @keyframes mapPulse {
    0%   { r: 12; opacity: 0.6; }
    100% { r: 22; opacity: 0; }
  }
  .map-pulse { animation: mapPulse 2s ease-out infinite; }
`;

export default function MapView({ places = [], categories = [] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(null);
  const [filterCat, setFilterCat] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, name }
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState(null);

  const visiblePlaces = filterCat
    ? places.filter((p) => p.category?.category_id === filterCat)
    : places;

  const handlePinClick = useCallback(
    (place) => {
      setActiveId(place.place_id);
      setDetailPlace(place);
      setDetailOpen(true);
    },
    []
  );

  const handleListClick = useCallback(
    (place) => {
      setActiveId(place.place_id);
      setDetailPlace(place);
      setDetailOpen(true);
    },
    []
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setActiveId(null);
    setDetailPlace(null);
  }, []);

  const goToDetail = useCallback(
    (id) => {
      router.push(`/places/${id}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col md:flex-row h-[800px] md:h-[720px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
      <style>{PULSE_STYLE}</style>

      {/* ─── LEFT: Map ─── */}
      <div className="relative w-full h-[60%] md:w-[55%] md:h-full bg-[#dbe8d0] overflow-auto flex-shrink-0 touch-pan-x touch-pan-y">
        {/* Title card */}
        <div className="absolute top-4 left-4 z-10 bg-white/88 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-black/10 shadow-sm">
          <div className="font-display font-bold text-[#1b4332] text-sm leading-tight">
            ตำบลบ้านหวาย
          </div>
          <div className="text-[#52796f] text-[10px] mt-0.5">
            Ban Wai Sub-district Map
          </div>
        </div>

        {/* SVG Map */}
        <svg
          viewBox="0 0 400 680"
          className="w-full h-full"
          style={{ display: "block", minWidth: "500px", minHeight: "850px" }}
        >
          <defs>
            <radialGradient id="bwBgGrad" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#d4e8c2" />
              <stop offset="100%" stopColor="#b8d49a" />
            </radialGradient>
            <filter id="bwShadow">
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
            fill="url(#bwBgGrad)"
            stroke="#7aad5e"
            strokeWidth="2"
            filter="url(#bwShadow)"
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

          {/* Pins */}
          {visiblePlaces.map((place) => {
            const px = place.map_x ?? 200;
            const py = place.map_y ?? 300;
            const color = getPinColor(place.category?.name);
            const isActive = activeId === place.place_id;
            return (
              <g
                key={place.place_id}
                onClick={() => handlePinClick(place)}
                onMouseEnter={() => setTooltip({ x: px, y: py, name: place.name })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Pulse ring when active */}
                {isActive && (
                  <circle
                    cx={px}
                    cy={py}
                    r="12"
                    fill={color}
                    opacity="0.3"
                    className="map-pulse"
                  />
                )}
                {/* Outer ring */}
                {isActive && (
                  <circle
                    cx={px}
                    cy={py}
                    r="18"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                )}
                {/* Pin circle */}
                <circle
                  cx={px}
                  cy={py}
                  r={isActive ? 14 : 11}
                  fill={color}
                  opacity={isActive ? 1 : 0.85}
                  stroke="white"
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{ transition: "all 0.2s" }}
                />
                {/* Icon */}
                {place.category?.icon ? (
                  <text
                    x={px}
                    y={py + 5}
                    textAnchor="middle"
                    fontSize={isActive ? 16 : 13}
                    fontFamily="Sarabun,sans-serif"
                  >
                    {place.category?.icon}
                  </text>
                ) : (
                  <MapPin 
                    x={px - (isActive ? 8 : 6.5)} 
                    y={py - (isActive ? 8 : 6.5)} 
                    width={isActive ? 16 : 13} 
                    height={isActive ? 16 : 13} 
                    color="white" 
                  />
                )}
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={tooltip.x - 52}
                y={tooltip.y - 42}
                width="104"
                height="24"
                rx="6"
                fill="rgba(27,67,50,0.92)"
              />
              <text
                x={tooltip.x}
                y={tooltip.y - 26}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                fontFamily="Sarabun,sans-serif"
              >
                {tooltip.name}
              </text>
              <polygon
                points={`${tooltip.x - 5},${tooltip.y - 18} ${tooltip.x + 5},${tooltip.y - 18} ${tooltip.x},${tooltip.y - 12}`}
                fill="rgba(27,67,50,0.92)"
              />
            </g>
          )}

          {/* Compass */}
          <g transform="translate(360,60)">
            <circle cx="0" cy="0" r="18" fill="rgba(255,255,255,0.8)" stroke="#aaa" strokeWidth="0.5" />
            <polygon points="0,-14 3,-4 -3,-4" fill="#e63946" />
            <polygon points="0,14 3,4 -3,4" fill="#999" />
            <polygon points="-14,0 -4,3 -4,-3" fill="#555" />
            <polygon points="14,0 4,3 4,-3" fill="#555" />
            <text x="0" y="-17" textAnchor="middle" fontSize="7" fill="#c00" fontFamily="sans-serif" fontWeight="700">
              N
            </text>
          </g>

          {/* Scale bar */}
          <g transform="translate(20,640)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="#555" strokeWidth="1.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#555" strokeWidth="1.5" />
            <line x1="60" y1="-4" x2="60" y2="4" stroke="#555" strokeWidth="1.5" />
            <text x="30" y="-7" textAnchor="middle" fontSize="9" fill="#555" fontFamily="Sarabun,sans-serif">
              500 ม.
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3.5 right-3.5 bg-white/88 backdrop-blur-md rounded-xl px-3 py-2 border border-black/10 text-[10px] leading-relaxed">
          {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT: List + Detail ─── */}
      <div className="relative flex-1 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <h2 className="font-display font-bold text-[#1b4332] text-base">สถานที่ท่องเที่ยว</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {visiblePlaces.length} สถานที่
            {filterCat ? ` ในหมวดนี้` : " ในตำบลบ้านหวาย"}
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 px-3 py-2 flex-wrap border-b border-gray-100">
          <button
            onClick={() => setFilterCat(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !filterCat
                ? "bg-[#2d6a4f] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() =>
                setFilterCat(filterCat === cat.category_id ? null : cat.category_id)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterCat === cat.category_id
                  ? "bg-[#2d6a4f] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Places list */}
        <div className="flex-1 overflow-y-auto p-2">
          {visiblePlaces.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">ไม่พบสถานที่</div>
          ) : (
            visiblePlaces.map((place) => {
              const color = getPinColor(place.category?.name);
              const isActive = activeId === place.place_id;
              return (
                <div
                  key={place.place_id}
                  onClick={() => handleListClick(place)}
                  className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all mb-1 border ${
                    isActive
                      ? "bg-[#edf7f2] border-[#52796f]/40"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2d6a4f] flex-shrink-0"
                    style={{ background: color + "22", color: color }}
                  >
                    {place.category?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {place.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      {place.category?.name} · <Eye className="w-3 h-3 ml-1" /> {place.view_count}
                    </div>
                  </div>
                  <span className="text-gray-300 text-base">›</span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Detail panel (slides in) ── */}
        <div
          className={`absolute inset-0 bg-white flex flex-col z-20 transition-transform duration-300 ease-out ${
            detailOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {detailPlace && (
            <>
              {/* Hero */}
              <div
                className="h-44 flex items-center justify-center relative flex-shrink-0"
                style={{
                  background: getPinColor(detailPlace.category?.name) + "25",
                }}
              >
                <button
                  onClick={closeDetail}
                  className="absolute top-3 left-3 bg-white/85 border-none rounded-lg px-2.5 py-1.5 text-xs text-[#1b4332] font-medium cursor-pointer flex items-center gap-1 hover:bg-white transition-colors"
                >
                  ← กลับ
                </button>
                <span className="text-[#2d6a4f] flex items-center justify-center w-24 h-24">{detailPlace?.category?.icon || <ImageIcon className="w-16 h-16" />}</span>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full mb-2"
                  style={{
                    background: getPinColor(detailPlace.category?.name) + "20",
                    color: getPinColor(detailPlace.category?.name),
                  }}
                >
                  {detailPlace.category?.icon} {detailPlace.category?.name}
                </div>
                <h3 className="font-display font-bold text-xl text-[#1b4332] mb-2 leading-tight">
                  {detailPlace.name}
                </h3>
                {detailPlace.description && (
                  <p className="text-gray-500 text-xs leading-relaxed mb-3">
                    {detailPlace.description.slice(0, 120)}
                    {detailPlace.description.length > 120 ? "..." : ""}
                  </p>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "เวลาทำการ", value: detailPlace.open_hours, icon: <Clock className="w-3 h-3" /> },
                    { label: "โทรศัพท์", value: detailPlace.phone, icon: <Phone className="w-3 h-3" /> },
                    { label: "ผู้เข้าชม", value: `${detailPlace.view_count} ครั้ง`, icon: <Eye className="w-3 h-3" /> },
                    { label: "พิกัด", value: detailPlace.address ? detailPlace.address.slice(0, 20) : "-", icon: <MapPin className="w-3 h-3" /> },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gray-50 rounded-xl p-2.5"
                    >
                      <div className="text-[10px] text-gray-400 mb-1 flex gap-1 items-center">{item.icon} {item.label}</div>
                      <div className="text-xs text-gray-700 font-medium leading-snug">
                        {item.value || "-"}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => goToDetail(detailPlace.place_id)}
                  className="w-full bg-[#2d6a4f] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1b4332] transition-colors flex items-center justify-center gap-2"
                >
                  ดูข้อมูลเพิ่มเติม <span>→</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
