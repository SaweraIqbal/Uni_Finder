import { useState } from "react";
import { Bus, ChevronDown, MapPin } from "lucide-react";

export default function CampusTransport({ facilities }) {
  const [openId, setOpenId] = useState(null);
  const routes = Array.isArray(facilities?.transport_routes) ? facilities.transport_routes : [];
  const fee = facilities?.transport_fee;

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Campus Transport</h2>
        <p className="text-sm text-gray-500 mt-1">Routes and fees provided by this campus.</p>
      </div>

      {fee && (
        <div className="flex items-center gap-3 border-y border-gray-200 py-4 mb-5">
          <Bus className="w-5 h-5 text-slate-600" aria-hidden="true" />
          <div>
            <p className="text-xs text-gray-500">Transport Fee</p>
            <p className="text-sm font-semibold text-gray-800">Rs. {fee} / month</p>
          </div>
        </div>
      )}

      {routes.length ? (
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {routes.map((route, index) => {
            const stops = (route.stops || []).map((stop) => typeof stop === "string" ? stop : stop.name).filter(Boolean);
            const routeId = route.id || `${route.name}-${index}`;
            const open = openId === routeId;
            return (
              <section key={routeId}>
                <button type="button" onClick={() => setOpenId(open ? null : routeId)} aria-expanded={open}
                  className="w-full flex items-center gap-3 py-4 text-left">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800">{route.name || `Route ${index + 1}`}</span>
                    <span className="block text-xs text-gray-500 mt-1">{stops.length ? `${stops[0]} to ${stops[stops.length - 1]}` : "Route stops not listed"}</span>
                  </span>
                  {route.duration && <span className="text-xs text-gray-500">{route.duration}</span>}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {open && stops.length > 0 && (
                  <ol className="ml-7 mb-4 border-l border-gray-200 pl-4 space-y-2">
                    {stops.map((stop, stopIndex) => <li key={`${stop}-${stopIndex}`} className="text-sm text-gray-600">{stop}</li>)}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 border-y border-gray-200 py-5">No transport routes have been added by this campus.</p>
      )}
    </div>
  );
}