import { useState } from "react";

const BusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="22" height="16" rx="2" /><path d="M1 9h22M8 3v6M16 3v6" />
    <circle cx="7" cy="23" r="1" /><circle cx="17" cy="23" r="1" /><path d="M5 19v4M19 19v4" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDownIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`text-orange-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ROUTES = [
  { id: 1, name: "Route 1", from: "Gulberg Terminal", to: "UCP Campus", stopCount: 6, eta: "~35 mins", stops: ["Gulberg Terminal","Liberty Market","Main Boulevard","Canal Bank","Ferozepur Road","UCP Campus"] },
  { id: 2, name: "Route 2", from: "Johar Town", to: "UCP Campus", stopCount: 5, eta: "~25 mins", stops: ["Johar Town","Emporium Mall","Wapda Town","Valencia","UCP Campus"] },
  { id: 3, name: "Route 3", from: "Model Town", to: "UCP Campus", stopCount: 7, eta: "~40 mins", stops: ["Model Town","Kalma Chowk","Muslim Town","Faisal Town","Township","Khokhar Chowk","UCP Campus"] },
];

export default function CampusTransport() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Campus Transport</h2>
        <p className="text-sm text-gray-500 mt-1">Explore available bus routes connecting this campus to major areas of the city.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-5 py-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0"><BusIcon /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Transport Fee</p>
            <p className="text-sm font-bold text-gray-800">PKR 3,500 <span className="font-medium text-slate-400">/ month</span></p>
          </div>
        </div>
        <span className="text-xs text-slate-500 bg-white border border-orange-100 rounded-full px-3 py-1.5 self-start sm:self-auto">Flat rate applies to all routes.</span>
      </div>

      <div className="space-y-3">
        {ROUTES.map((route) => {
          const open = openId === route.id;
          return (
            <div key={route.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200 ${
              open ? "border-orange-200 shadow-md" : "border-gray-200 hover:border-orange-100 hover:shadow-md"
            }`}>
              <button type="button" onClick={() => setOpenId(open ? null : route.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left" aria-expanded={open}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  open ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-500"
                }`}><MapPinIcon /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">{route.name}</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {route.from} <span className="text-slate-400 font-medium">&#8594;</span> {route.to}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{route.stopCount} Stops &middot; {route.eta}</p>
                </div>
                <ChevronDownIcon open={open} />
              </button>

              <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <ol className="px-5 pb-4 pt-0 space-y-0 border-t border-gray-100 mx-5 mt-0">
                    {route.stops.map((stop, i) => {
                      const last = i === route.stops.length - 1;
                      return (
                        <li key={stop} className="flex gap-3">
                          <div className="flex flex-col items-center w-4 pt-3">
                            <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${last ? "bg-orange-500 border-orange-500" : "bg-white border-orange-400"}`} />
                            {!last && <span className="flex-1 w-px bg-orange-200 mt-1" />}
                          </div>
                          <div className={`text-sm text-gray-600 pt-2 ${last ? "pb-1 font-semibold text-gray-800" : "pb-3"}`}>
                            {stop}
                            {i === 0 && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-orange-500">Source</span>}
                            {last && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-orange-500">Destination</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}