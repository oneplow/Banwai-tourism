"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, MapPin, Clock, Phone, Image as ImageIcon, Navigation, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components (SSR incompatible)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

function FlyToPosition({ position, zoom }) {
  if (typeof window === "undefined") return null;
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 16, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
}
const FlyToDynamic = dynamic(() => Promise.resolve(FlyToPosition), { ssr: false });

function createUserIcon() {
  if (typeof window === "undefined") return null;
  const L = require("leaflet");
  return L.divIcon({
    className: "gps-marker",
    html: `<div style="width:16px; height:16px; background:#3b82f6; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(59,130,246,0.6);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

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

// Helper: get primary category from place (multi-category support)
function getPrimaryCategory(place) {
  if (place.categories && place.categories.length > 0) {
    const primary = place.categories.find((c) => c.is_primary) || place.categories[0];
    return primary.category || primary;
  }
  return place.category || null;
}

function getPrimaryCategoryColor(place) {
  const cat = getPrimaryCategory(place);
  return cat?.pin_color || getPinColor(cat?.name);
}

// บ้านหวาย หล่มสัก เพชรบูรณ์
const CENTER = { lat: 16.7599, lng: 101.2921 };
const DEFAULT_ZOOM = 14;

function createCategoryIcon(categoryName, isActive = false, customColor = null) {
  if (typeof window === "undefined") return null;
  const L = require("leaflet");
  const color = customColor || getPinColor(categoryName);
  const size = isActive ? 40 : 32;

  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      ${isActive ? "transform: scale(1.2); box-shadow: 0 4px 12px rgba(0,0,0,0.4);" : ""}
    "><svg xmlns='http://www.w3.org/2000/svg' width='${size * 0.45}' height='${size * 0.45}' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/><circle cx='12' cy='10' r='3'/></svg></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function MapView({ places = [], categories = [] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(null);
  const [filterCat, setFilterCat] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [routePath, setRoutePath] = useState(null);

  const locateUser = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับ GPS หรือเว็บไซต์ไม่ได้ทำงานบน HTTPS");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(coords);
        setFlyTarget(coords);
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (err.code === 1) alert("การเข้าถึงตำแหน่งถูกปฏิเสธ (คุณต้องกดยอมรับ Permission ในเบราว์เซอร์ด้วย)");
        else if (err.code === 2) alert("ไม่สามารถระบุตำแหน่งได้ (อุปกรณ์อาจแจ้งตำแหน่งไม่ได้ในขณะนี้)");
        else if (err.code === 3) alert("หมดเวลาในการหาตำแหน่ง (Timeout) กรุณาลองใหม่ในที่โล่ง");
        else alert("เกิดข้อผิดพลาดในการดึงตำแหน่ง กรุณาเปิดระบบ GPS ของอุปกรณ์");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    // Load Leaflet CSS
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setMapReady(true);
    }
  }, []);

  // Fetch actual driving route using free OSRM API 
  useEffect(() => {
    if (userLoc && detailPlace?.latitude && detailPlace?.longitude) {
      const fetchRoute = async () => {
        try {
          const startLng = userLoc[1];
          const startLat = userLoc[0];
          const endLng = Number(detailPlace.longitude);
          const endLat = Number(detailPlace.latitude);

          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            // OSRM GeoJSON coords are [lng, lat], Leaflet wants [lat, lng]
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRoutePath(coords);
          } else {
            // Fallback to straight line
            setRoutePath([userLoc, [endLat, endLng]]);
          }
        } catch (error) {
          console.error("OSRM Route Error:", error);
          setRoutePath([userLoc, [Number(detailPlace.latitude), Number(detailPlace.longitude)]]);
        }
      };

      fetchRoute();
    } else {
      setRoutePath(null);
    }
  }, [userLoc, detailPlace]);

  const visiblePlaces = filterCat
    ? places.filter((p) => {
        // Multi-category: check if any category matches
        if (p.categories && p.categories.length > 0) {
          return p.categories.some((c) => (c.category_id || c.category?.category_id) === filterCat);
        }
        return p.category?.category_id === filterCat;
      })
    : places;

  // Filter places that have valid coordinates
  const mappablePlaces = visiblePlaces.filter(
    (p) => p.latitude && p.longitude && p.latitude !== 0 && p.longitude !== 0
  );

  const handlePinClick = useCallback((place) => {
    setActiveId(place.place_id);
    setDetailPlace(place);
    setDetailOpen(true);
  }, []);

  const handleListClick = useCallback((place) => {
    setActiveId(place.place_id);
    setDetailPlace(place);
    setDetailOpen(true);
    if (place.latitude && place.longitude) {
      setFlyTarget([Number(place.latitude), Number(place.longitude)]);
    }
  }, []);

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

  // Compute center from places if available
  const mapCenter =
    mappablePlaces.length > 0
      ? [
        mappablePlaces.reduce((s, p) => s + Number(p.latitude), 0) / mappablePlaces.length,
        mappablePlaces.reduce((s, p) => s + Number(p.longitude), 0) / mappablePlaces.length,
      ]
      : [CENTER.lat, CENTER.lng];

  return (
    <div className="flex flex-col md:flex-row h-[650px] md:h-[720px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0 isolate bg-white">
      {/* ─── LEFT: Map ─── */}
      <div className="relative w-full h-[45%] md:w-[60%] md:h-full bg-gray-100 flex-shrink-0 z-0">
        {mapReady && (
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={22}
            />
            {flyTarget && <FlyToDynamic position={flyTarget} zoom={16} />}
            {userLoc && (
              <Marker position={userLoc} icon={createUserIcon()}>
                <Popup>
                  <div className="text-center font-medium font-display text-sm">ตำแหน่งของคุณ</div>
                </Popup>
              </Marker>
            )}
            {/* Draw route line from user to selected place */}
            {routePath && (
              <Polyline
                positions={routePath}
                pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }}
              />
            )}
            {mappablePlaces.map((place) => (
              <Marker
                key={place.place_id}
                position={[Number(place.latitude), Number(place.longitude)]}
                icon={createCategoryIcon(
                  getPrimaryCategory(place)?.name,
                  activeId === place.place_id,
                  getPrimaryCategoryColor(place)
                )}
                eventHandlers={{
                  click: () => handlePinClick(place),
                }}
              >
                <Popup>
                  <div className="text-center min-w-[160px] pb-1">
                    {place.cover_image && (
                      <div className="w-full h-24 mb-2 rounded-lg overflow-hidden">
                        <img src={place.cover_image} alt={place.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="font-bold text-sm mb-1">{place.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {!place.cover_image && getPrimaryCategory(place)?.icon} {getPrimaryCategory(place)?.name}
                    </div>
                    <button
                      onClick={() => goToDetail(place.place_id)}
                      className="bg-[#2d6a4f] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#1b4332] transition-colors"
                    >
                      ดูรายละเอียด →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* GPS Button */}
        <button
          onClick={locateUser}
          title="ตำแหน่งของฉัน"
          className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md hover:bg-white text-[#1b4332] p-2.5 rounded-xl shadow-md border border-gray-100 transition-all flex items-center justify-center hover:scale-105"
        >
          {locating ? <Loader2 className="w-5 h-5 animate-spin text-[#2d6a4f]" /> : <Navigation className="w-5 h-5 text-[#2d6a4f]" />}
        </button>

        {/* Legend */}
        <div className="absolute bottom-3.5 right-3.5 z-[1000] bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 border border-black/10 text-[10px] leading-relaxed shadow-sm">
          {categories.map((cat) => (
            <div key={cat.category_id} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.pin_color || getPinColor(cat.name) }} />
              <span className="text-gray-700">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT: List ─── */}
      <div className="relative w-full h-[55%] md:w-[40%] md:h-full bg-white flex flex-col overflow-hidden z-10 border-t md:border-t-0 md:border-l border-gray-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-display font-bold text-[#1b4332] text-base">สถานที่ท่องเที่ยว</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {visiblePlaces.length} สถานที่
            {filterCat ? ` ในหมวดนี้` : " ในตำบลบ้านหวาย"}
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 px-4 py-2.5 flex-wrap border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button
            onClick={() => setFilterCat(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${!filterCat
              ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
              : "bg-white text-gray-500 hover:bg-gray-50 border-gray-200"
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${filterCat === cat.category_id
                ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                : "bg-white text-gray-500 hover:bg-gray-50 border-gray-200"
                }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Places list */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {visiblePlaces.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">ไม่พบสถานที่</div>
          ) : (
            visiblePlaces.map((place) => {
              const color = getPrimaryCategoryColor(place);
              const primaryCat = getPrimaryCategory(place);
              const isActive = activeId === place.place_id;
              return (
                <div
                  key={place.place_id}
                  onClick={() => handleListClick(place)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1.5 border ${isActive
                    ? "bg-[#edf7f2] border-[#52796f]/40 shadow-sm"
                    : "border-transparent hover:bg-gray-50 border-gray-100"
                    }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[#2d6a4f] flex-shrink-0 overflow-hidden shadow-sm border border-black/5"
                    style={{ background: color + "15", color: color }}
                  >
                    {place.cover_image ? (
                      <img src={place.cover_image} alt={place.name} className="w-full h-full object-cover" />
                    ) : (
                      primaryCat?.icon || <ImageIcon className="w-5 h-5 opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate mb-0.5">
                      {place.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                      {place.categories && place.categories.length > 0 ? (
                        place.categories.map((pc) => {
                          const cat = pc.category || pc;
                          const catColor = cat.pin_color || getPinColor(cat.name);
                          return (
                            <span key={cat.category_id} className="flex items-center gap-0.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                              {cat.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}></div> {primaryCat?.name}</span>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {place.view_count}</span>
                    </div>
                  </div>
                  <span className="text-[#2d6a4f] text-base opacity-40">›</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Detail panel (Mobile Bottom Sheet / Desktop Sidebar) ── */}
      <div
        className={`absolute left-0 right-0 top-12 bottom-0 md:left-auto md:w-[40%] md:top-0 h-auto md:h-full bg-white flex flex-col z-50 transition-transform duration-300 ease-out shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl rounded-t-3xl md:rounded-none overflow-hidden ${detailOpen ? "translate-y-0 md:translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}`}
      >
        {detailPlace && (
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 relative flex flex-col bg-white">
            {/* Drag Handle (Mobile only) */}
            <div className="w-full h-8 flex justify-center items-center md:hidden bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 z-50 rounded-t-3xl" onClick={closeDetail} style={{ background: detailPlace.cover_image ? undefined : 'rgba(255,255,255,0.7)' }}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mt-1"></div>
            </div>

            {/* Hero */}
            <div
              className="h-48 min-h-[192px] flex items-center justify-center relative flex-shrink-0 overflow-hidden"
              style={{
                background: getPrimaryCategoryColor(detailPlace) + "25",
              }}
            >
              {detailPlace.cover_image && (
                <img src={detailPlace.cover_image} alt={detailPlace.name} className="absolute inset-0 w-full h-full object-cover" />
              )}
              {/* Dark gradient overlay if image exists so back button is readable */}
              {detailPlace.cover_image && <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />}

              <button
                onClick={closeDetail}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border-none rounded-xl px-3 py-2 text-xs text-[#1b4332] font-bold cursor-pointer flex items-center gap-1.5 hover:bg-white transition-colors z-10 shadow-sm"
              >
                ← กลับ
              </button>
              {!detailPlace.cover_image && (
                <span className="text-[#2d6a4f] flex items-center justify-center w-24 h-24 z-10 text-6xl drop-shadow-sm">
                  {getPrimaryCategory(detailPlace)?.icon || <ImageIcon className="w-16 h-16 opacity-50" />}
                </span>
              )}
            </div>

            {/* Content Margin / Overlap */}
            <div className="flex-1 bg-white -mt-6 rounded-t-3xl relative z-20 px-5 pt-7 pb-8 flex flex-col min-h-0">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {detailPlace.categories && detailPlace.categories.length > 0 ? (
                  detailPlace.categories.map((pc) => {
                    const cat = pc.category || pc;
                    const catColor = cat.pin_color || getPinColor(cat.name);
                    return (
                      <span
                        key={cat.category_id}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: catColor + "15",
                          color: catColor,
                          border: `1px solid ${catColor}30`
                        }}
                      >
                        {cat.icon} {cat.name}
                        {pc.is_primary && ' ★'}
                      </span>
                    );
                  })
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{
                      background: getPrimaryCategoryColor(detailPlace) + "15",
                      color: getPrimaryCategoryColor(detailPlace),
                      border: `1px solid ${getPrimaryCategoryColor(detailPlace)}30`
                    }}
                  >
                    {detailPlace.category?.icon} {detailPlace.category?.name}
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-2xl text-[#1b4332] mb-3 leading-tight pr-2">
                {detailPlace.name}
              </h3>

              {detailPlace.description && (
                <div className="text-gray-600 text-sm leading-relaxed mb-5 space-y-0.5">
                  {detailPlace.description.slice(0, 300).split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                      return (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] mt-1.5 flex-shrink-0" />
                          <span>{trimmed.slice(2)}</span>
                        </div>
                      );
                    }
                    return <p key={i}>{trimmed}</p>;
                  })}
                  {detailPlace.description.length > 300 && <span className="text-gray-400">...</span>}
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { label: "เวลาทำการ", value: detailPlace.open_hours, icon: <Clock className="w-3.5 h-3.5" /> },
                  { label: "โทรศัพท์", value: detailPlace.phone, icon: <Phone className="w-3.5 h-3.5" /> },
                  { label: "ผู้เข้าชม", value: `${detailPlace.view_count} ครั้ง`, icon: <Eye className="w-3.5 h-3.5" /> },
                  { label: "พิกัด", value: detailPlace.address ? detailPlace.address.slice(0, 20) : "เปิด Google Maps", icon: <MapPin className="w-3.5 h-3.5" /> },
                ].filter(i => i.value).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-gray-50/80 px-3 py-2.5 rounded-xl border border-gray-100">
                    <span className="text-[#2d6a4f] bg-white p-1 rounded-md shadow-sm">{item.icon}</span>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium mb-0.5">{item.label}</div>
                      <div className="text-xs text-gray-700 font-semibold truncate max-w-[120px]">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => goToDetail(detailPlace.place_id)}
                  className="w-full bg-[#2d6a4f] text-white font-bold py-3.5 rounded-xl hover:bg-[#1b4332] transition-colors shadow-md shadow-[#2d6a4f]/20 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  ดูข้อมูลแบบเต็มหน้าจอ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
