import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Navigation, X, Check } from "lucide-react";
import MapPicker from "./MapPicker";

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const PK_CENTER = { lat: 30.3753, lng: 69.3451 };

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__uniFinderGoogleMapsReady";
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error("Could not load Google Maps."));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function pinIcon(maps) {
  return {
    path: "M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
    fillColor: "#f97316",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 1.8,
    anchor: new maps.Point(12, 24),
  };
}

function moveMarker(maps, map, markerRef, la, ln, setLat, setLng) {
  if (!map) return;

  if (markerRef.current) {
    markerRef.current.setPosition({ lat: la, lng: ln });
  } else {
    const marker = new maps.Marker({
      map,
      position: { lat: la, lng: ln },
      draggable: true,
      icon: pinIcon(maps),
    });
    marker.addListener("dragend", (event) => {
      setLat(event.latLng.lat().toFixed(6));
      setLng(event.latLng.lng().toFixed(6));
    });
    markerRef.current = marker;
  }

  map.panTo({ lat: la, lng: ln });
}

function GooglePicker({ lat, lng, autoLocate = false, onConfirm, onClose }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapsRef = useRef(null);

  const initLat = parseFloat(lat);
  const initLng = parseFloat(lng);
  const hasInit = Number.isFinite(initLat) && Number.isFinite(initLng);

  const [inputLat, setInputLat] = useState(hasInit ? String(lat) : "");
  const [inputLng, setInputLng] = useState(hasInit ? String(lng) : "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);

  const locateWithGps = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const la = position.coords.latitude;
        const ln = position.coords.longitude;
        setInputLat(la.toFixed(6));
        setInputLng(ln.toFixed(6));
        moveMarker(mapsRef.current, mapRef.current, markerRef, la, ln, setInputLat, setInputLng);
        mapRef.current?.setZoom(16);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === 1
            ? "Location access denied. Allow location in browser settings."
            : "Could not get your location. Try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps(GOOGLE_KEY)
      .then((maps) => {
        if (cancelled || !mapNodeRef.current) return;

        mapsRef.current = maps;
        const center = hasInit ? { lat: initLat, lng: initLng } : PK_CENTER;
        const map = new maps.Map(mapNodeRef.current, {
          center,
          zoom: hasInit ? 15 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        map.addListener("click", (event) => {
          const la = event.latLng.lat();
          const ln = event.latLng.lng();
          setInputLat(la.toFixed(6));
          setInputLng(ln.toFixed(6));
          moveMarker(maps, map, markerRef, la, ln, setInputLat, setInputLng);
        });

        mapRef.current = map;

        if (hasInit) {
          moveMarker(maps, map, markerRef, initLat, initLng, setInputLat, setInputLng);
        }

        if (autoLocate) locateWithGps();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) {
    return (
      <MapPicker
        lat={inputLat}
        lng={inputLng}
        autoLocate={autoLocate}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
  }

  const handleManualChange = (nextLat, nextLng) => {
    setInputLat(nextLat);
    setInputLng(nextLng);

    const la = parseFloat(nextLat);
    const ln = parseFloat(nextLng);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      moveMarker(mapsRef.current, mapRef.current, markerRef, la, ln, setInputLat, setInputLng);
    }
  };

  const handleConfirm = () => {
    const la = parseFloat(inputLat);
    const ln = parseFloat(inputLng);

    if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
      setError("Please click on the map or type valid coordinates.");
      return;
    }

    onConfirm(inputLat, inputLng);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            <h2 className="text-sm font-bold text-gray-800">Pick Location on Google Maps</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100"
            aria-label="Close map picker"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={mapNodeRef} className="flex-1" style={{ minHeight: "360px" }} />

        <div className="space-y-3 border-t border-gray-100 px-5 py-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">{error}</p>}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLat}
                onChange={(event) => handleManualChange(event.target.value, inputLng)}
                placeholder="e.g. 33.7215"
                className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={inputLng}
                onChange={(event) => handleManualChange(inputLat, event.target.value)}
                placeholder="e.g. 73.0431"
                className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <button
              type="button"
              onClick={locateWithGps}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-500 disabled:opacity-50"
            >
              <Navigation size={14} className={locating ? "animate-spin" : ""} />
              {locating ? "Detecting…" : "My Location"}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <Check size={14} />
              Confirm Location
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Click the map to drop a pin, drag it to adjust, or type coordinates directly.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function GoogleMapPicker(props) {
  if (GOOGLE_KEY) return <GooglePicker {...props} />;
  return (
    <MapPicker
      lat={props.lat}
      lng={props.lng}
      autoLocate={props.autoLocate}
      onConfirm={props.onConfirm}
      onClose={props.onClose}
    />
  );
}
