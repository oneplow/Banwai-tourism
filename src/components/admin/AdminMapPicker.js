"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, Loader2, X } from "lucide-react";

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

// บ้านหวาย หล่มสัก เพชรบูรณ์
const CENTER = [16.7599, 101.2921];
const DEFAULT_ZOOM = 14;

function createPinIcon() {
  if (typeof window === "undefined") return null;
  const L = require("leaflet");
  return L.divIcon({
    className: "admin-map-pin",
    html: `<div style="
      width: 36px; height: 36px;
      background: #e63946;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    "><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/><circle cx='12' cy='10' r='3'/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Click handler component (needs to be a child of MapContainer)
function ClickHandler({ onClick }) {
  if (typeof window === "undefined") return null;
  const { useMapEvents: useMapEventsHook } = require("react-leaflet");
  useMapEventsHook({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const ClickHandlerDynamic = dynamic(
  () => Promise.resolve(ClickHandler),
  { ssr: false }
);

// FlyTo component — moves the map to a new position
function FlyToPosition({ position, zoom }) {
  if (typeof window === "undefined") return null;
  const { useMap } = require("react-leaflet");
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 17, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
}

const FlyToDynamic = dynamic(
  () => Promise.resolve(FlyToPosition),
  { ssr: false }
);

export default function AdminMapPicker({ lat, lng, onChange }) {
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const searchTimeout = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        document.head.appendChild(link);
      }
      setMapReady(true);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search using Nominatim API (debounced)
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        // Use Esri ArcGIS World Geocoding Service (Free, no API key required, high accuracy)
        const res = await fetch(
          `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine=${encodeURIComponent(value)}&f=json&maxLocations=5&outFields=Place_addr,PlaceName`
        );
        const data = await res.json();
        
        if (data.candidates && data.candidates.length > 0) {
          setSearchResults(data.candidates);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  // Select a search result
  const selectResult = (result) => {
    const newLat = parseFloat(result.location.y);
    const newLng = parseFloat(result.location.x);
    onChange({ lat: newLat, lng: newLng });
    setFlyTarget([newLat, newLng]);
    setSearchQuery(result.address.split(",")[0]);
    setShowResults(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const hasPosition = lat && lng && lat !== 0 && lng !== 0;
  const center = hasPosition ? [Number(lat), Number(lng)] : CENTER;

  return (
    <div
      className="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative"
      style={{ height: "450px" }}
    >
      {/* Search Box */}
      <div className="absolute top-3 left-14 right-3 z-[1000]" ref={resultsRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="ค้นหาสถานที่... เช่น วัดบ้านหวาย, หล่มสัก"
            className="w-full bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl pl-9 pr-16 py-2.5 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] placeholder:text-gray-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            {searchQuery && !searching && (
              <button onClick={clearSearch} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-[200px] overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => selectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-[#edf7f2] transition-colors border-b border-gray-50 last:border-0 flex items-start gap-2.5"
              >
                <span className="text-[#2d6a4f] mt-0.5 flex-shrink-0">📍</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {result.address.split(",")[0]}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate mt-0.5">
                    {result.address.split(",").slice(1).join(",")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Coordinate display */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 shadow-sm z-[1000] pointer-events-none">
        พิกัด: {lat ? Number(lat).toFixed(14) : "-"}, {lng ? Number(lng).toFixed(14) : "-"}
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-[#1b4332] shadow-sm z-[1000] pointer-events-none">
        คลิกแผนที่เพื่อปักหมุด
      </div>

      {mapReady && (
        <MapContainer
          center={center}
          zoom={hasPosition ? 16 : DEFAULT_ZOOM}
          style={{ width: "100%", height: "100%", cursor: "crosshair" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={22}
          />
          <ClickHandlerDynamic onClick={(coords) => {
            onChange(coords);
            setFlyTarget(null); // reset fly target after manual click
          }} />
          {flyTarget && <FlyToDynamic position={flyTarget} zoom={17} />}
          {hasPosition && (
            <Marker
              position={[Number(lat), Number(lng)]}
              icon={createPinIcon()}
            />
          )}
        </MapContainer>
      )}
    </div>
  );
}
