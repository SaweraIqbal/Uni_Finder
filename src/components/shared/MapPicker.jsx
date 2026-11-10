/**
 * MapPicker.jsx — reusable Leaflet map picker modal.
 *
 * Usage:
 *   <MapPicker
 *     lat={form.lat}          // string or number, may be "" / null
 *     lng={form.lng}
 *     onConfirm={(lat, lng) => { setLat(lat); setLng(lng); }}
 *     onClose={() => setPickerOpen(false)}
 *   />
 *
 * The user can:
 *  - Click anywhere on the map to drop a pin.
 *  - Type coordinates directly into the inputs.
 *  - Press "Use My Location" to auto-detect via browser GPS.
 *  - Press "Confirm" to commit the chosen position.
 *
 * Leaflet CSS is imported inline — no extra global import needed.
 * Tiles: OpenStreetMap (no API key, free, non-commercial allowed).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Navigation, X, Check } from "lucide-react";

// ── Lazy-load Leaflet only when the picker is opened ──────────────────────────
let _L = null;
async function getLeaflet() {
  if (_L) return _L;
  // inject Leaflet CSS once
  if (!document.querySelector('link[data-leaflet-css]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet-css", "1");
    document.head.appendChild(link);
  }
  const mod = await import("leaflet");
  _L = mod.default ?? mod;
  return _L;
}

// Pakistan bounds for initial view when no coords given
const PK_CENTER = [30.3753, 69.3451];
const PK_ZOOM   = 5;

export default function MapPicker({ lat, lng, onConfirm, onClose }) {
  const mapRef    = useRef(null);   // DOM node
  const leafletRef = useRef(null);  // L.map instance
  const markerRef  = useRef(null);  // L.marker instance

  const initLat = parseFloat(lat) || null;
  const initLng = parseFloat(lng) || null;

  const [inputLat, setInputLat] = useState(initLat != null ? String(lat) : "");
  const [inputLng, setInputLng] = useState(initLng != null ? String(lng) : "");
  const [locating, setLocating] = useState(false);
  const [error, setError]       = useState(null);

  // ── Init map after mount ───────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    getLeaflet().then((L) => {
      if (destroyed || !mapRef.current) return;

      const center = initLat && initLng ? [initLat, initLng] : PK_CENTER;
      const zoom   = initLat && initLng ? 14 : PK_ZOOM;

      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom orange pin icon
      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;background:#f97316;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: "",
      });

      // Place marker if coords already exist
      if (initLat && initLng) {
        markerRef.current = L.marker([initLat, initLng], { icon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e) => {
          const { lat: la, lng: ln } = e.target.getLatLng();
          setInputLat(la.toFixed(6));
          setInputLng(ln.toFixed(6));
        });
      }

      // Click to place / move marker
      map.on("click", (e) => {
        const { lat: la, lng: ln } = e.latlng;
        setInputLat(la.toFixed(6));
        setInputLng(ln.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([la, ln]);
        } else {
          markerRef.current = L.marker([la, ln], { icon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", (ev) => {
            const { lat: la2, lng: ln2 } = ev.target.getLatLng();
            setInputLat(la2.toFixed(6));
            setInputLng(ln2.toFixed(6));
          });
        }
      });

      leafletRef.current = map;
    });

    return () => {
      destroyed = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync typed coords → move marker / pan map ────────────────────────────
  const syncMarker = (la, ln) => {
    const map = leafletRef.current;
    if (!map) return;

    getLeaflet().then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([la, ln]);
      } else {
        const icon = L.divIcon({
          html: `<div style="
            width:32px;height:32px;background:#f97316;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
          "></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          className: "",
        });
        markerRef.current = L.marker([la, ln], { icon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e) => {
          const { lat: la2, lng: ln2 } = e.target.getLatLng();
          setInputLat(la2.toFixed(6));
          setInputLng(ln2.toFixed(6));
        });
      }
      map.panTo([la, ln], { animate: true });
    });
  };

  const handleLatChange = (v) => {
    setInputLat(v);
    const la = parseFloat(v);
    const ln = parseFloat(inputLng);
    if (!isNaN(la) && !isNaN(ln)) syncMarker(la, ln);
  };

  const handleLngChange = (v) => {
    setInputLng(v);
    const la = parseFloat(inputLat);
    const ln = parseFloat(v);
    if (!isNaN(la) && !isNaN(ln)) syncMarker(la, ln);
  };

  // ── GPS auto-detect ───────────────────────────────────────────────────────
  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setInputLat(la.toFixed(6));
        setInputLng(ln.toFixed(6));
        syncMarker(la, ln);
        leafletRef.current?.setZoom(16, { animate: true });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1)
          setError("Location access denied. Allow location in browser settings.");
        else
          setError("Could not get your location. Try again.");
      },
      { timeout: 10000 }
    );
  };

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const la = parseFloat(inputLat);
    const ln = parseFloat(inputLng);
    if (isNaN(la) || isNaN(ln)) {
      setError("Please click on the map or type valid coordinates.");
      return;
    }
    onConfirm(inputLat, inputLng);
    onClose();
  };

  // ── Render via portal so it sits above all z-index stacks ────────────────
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Pick Location on Map</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Close map picker"
          >
            <X size={16} />
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="flex-1" style={{ minHeight: "360px" }} />

        {/* Footer controls */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            {/* Lat input */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLat}
                onChange={(e) => handleLatChange(e.target.value)}
                placeholder="e.g. 33.7215"
                className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              />
            </div>

            {/* Lng input */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLng}
                onChange={(e) => handleLngChange(e.target.value)}
                placeholder="e.g. 73.0431"
                className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              />
            </div>

            {/* GPS button */}
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:border-orange-300 hover:text-orange-500 disabled:opacity-50 transition-colors"
            >
              <Navigation size={14} className={locating ? "animate-spin" : ""} />
              {locating ? "Detecting…" : "My Location"}
            </button>

            {/* Confirm */}
            <button
              type="button"
              onClick={handleConfirm}
              className="ml-auto inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              <Check size={14} />
              Confirm Location
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Click on the map to drop a pin, drag it to adjust, or type coordinates directly.
            Tiles © OpenStreetMap contributors.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
