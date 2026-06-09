import { useEffect, useState } from "react";
import { listPrograms } from "../api/university";

// Public "Programs offered" section on the university detail page.
// Renders nothing if the university has no programs yet.
export default function UniversityPrograms({ universityId }) {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    if (!universityId) return;
    (async () => {
      const data = await listPrograms(universityId);
      setPrograms(Array.isArray(data) ? data : []);
    })();
  }, [universityId]);

  if (!programs.length) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
          Academics
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Programs offered</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200/70 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                {p.level && (
                  <span className="text-[11px] font-medium bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                    {p.level}
                  </span>
                )}
              </div>
              {p.description && (
                <p className="text-sm text-slate-500 mb-3">{p.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{p.duration || ""}</span>
                {p.fee && <span className="font-medium text-orange-600">{p.fee}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
