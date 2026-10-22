import { useMemo, useState } from "react";

export default function Scholarships({ scholarships = [] }) {
  const [selectedType, setSelectedType] = useState("All");
  const types = useMemo(() => ["All", ...new Set(scholarships.map((item) => item.type).filter(Boolean))], [scholarships]);
  const visible = useMemo(
    () => selectedType === "All" ? scholarships : scholarships.filter((item) => item.type === selectedType),
    [scholarships, selectedType],
  );

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Scholarships</h2>
        <p className="text-sm text-gray-500 mt-1">Funding programs published by this campus.</p>
      </div>

      {scholarships.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5" aria-label="Filter scholarships by type">
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setSelectedType(type)}
              aria-pressed={selectedType === type}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${selectedType === type ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"}`}>
              {type}
            </button>
          ))}
        </div>
      )}

      {visible.length ? (
        <div className="divide-y divide-gray-100 border-y border-gray-200">
          {visible.map((item, index) => (
            <article key={`${item.name}-${index}`} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                <div className="flex items-center gap-2">
                  {item.type && <span className="text-xs text-gray-500">{item.type}</span>}
                  {item.coverage && <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">{item.coverage}</span>}
                </div>
              </div>
              {item.criteria && <p className="text-sm text-gray-600 mt-2">{item.criteria}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-gray-500">No scholarships have been published by this campus.</p>
      )}
    </div>
  );
}