import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, fileUrl } from "../api/client";
import { campusImage } from "../api/campus";

export default function UniversityCampuses({ universityId }) {
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState([]);

  useEffect(() => {
    if (!universityId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/campuses/university/${universityId}`);
        const data = await res.json();
        setCampuses(Array.isArray(data) ? data : []);
      } catch {

      }
    })();
  }, [universityId]);

  if (!campuses.length) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
          Locations
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Campuses</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campuses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200/70 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >

              <div className="relative h-36 overflow-hidden">
                <img
                  src={campusImage(c, fileUrl)}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-800 mb-1">{c.name}</h3>
                {c.city && <p className="text-sm text-slate-500 mb-2">📍 {c.city}</p>}
                {c.history && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-3">{c.history}</p>
                )}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-slate-400">{c.duration || ""}</span>
                  {c.fee && <span className="font-medium text-orange-600">{c.fee}</span>}
                </div>
                <button
                  onClick={() => navigate(`/campus?id=${c.id}`)}
                  className="w-full py-2 text-xs font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
