/**
 * CampusMapEmbed.jsx — read-only embedded Leaflet map for the campus detail page.
 *
 * Shows the campus pin at (lat, lng).
 * Falls back to a "View on Google Maps" link if no coords are stored.
 *
 * Usage:
 *   <CampusMapEmbed lat={campus.lat} lng={campus.lng} label={campus.name} />
 */

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";

let _cssInjected = false;
async function getLeaflet() {
  if (!_cssInjected) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet-css", "1");
    if (!document.querySelector('link[data-leaflet-css]')) {
      document.head.appendChild(link);
    }
    _cssInjected = true;
  }
  const mod = await import("leaflet");
  return mod.default ?? mod;
}

export default function CampusMapEmbed({ lat, lng, label = "Campus" }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const [ready, setReady] = useState(false);

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  const hasCoords = !isNaN(numLat) && !isNaN(numLng);

  useEffect(() => {
    if (!hasCoords || !mapRef.current) return;
    let destroyed = false;

    getLeaflet().then((L) => {
      if (destroyed || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [numLat, numLng],
        zoom: 15,
        scrollWheelZoom: false,   // don't hijack page scroll
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

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

      L.marker([numLat, numLng], { icon })
        .addTo(map)
        .bindPopup(`<strong style="font-size:13px">${label}</strong>`, { closeButton: false })
        .openPopup();

      leafletRef.current = map;
      setReady(true);
    });

    return () => {
      destroyed = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [numLat, numLng, label]); // eslint-disable-line react-hooks/exhaustive-deps

  const googleUrl = hasCoords
    ? `https://www.google.com/maps?q=${numLat},${numLng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(label)}`;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {hasCoords ? (
        <>
          {/* Map tile */}
          <div
            ref={mapRef}
            className="w-full"
            style={{ height: "220px" }}
            aria-label={`Map showing location of ${label}`}
          />
          {/* Directions footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={12} className="text-orange-400" />
              <span>{numLat.toFixed(5)}, {numLng.toFixed(5)}</span>
            </div>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Get Directions <ExternalLink size={11} />
            </a>
          </div>
        </>
      ) : (
        /* No coords — graceful fallback */
        <div className="flex flex-col items-center justify-center gap-3 py-10 bg-gray-50">
          <MapPin size={28} className="text-gray-300" />
          <p className="text-xs text-gray-400 text-center px-4">
            Map coordinates not set for this campus.
          </p>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
          >
            Search on Google Maps <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  );
}
