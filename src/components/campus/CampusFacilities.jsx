import { useState } from "react";

const FACILITIES = [
  { id: "labs", title: "State-of-the-Art Labs", description: "Equipped with high-end hardware for research & development", span: "sm:col-span-2 sm:row-span-2 min-h-[220px]", images: ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&auto=format&fit=crop","https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop","https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900&auto=format&fit=crop"] },
  { id: "library", title: "Digital Library (24/7)", description: "Access to e-resources and quiet study zones", span: "min-h-[160px]", images: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=700&auto=format&fit=crop"] },
  { id: "sports", title: "Sports Complex", description: "Indoor and outdoor facilities for cricket, football and more", span: "min-h-[160px]", images: ["https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=700&auto=format&fit=crop","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700&auto=format&fit=crop"] },
  { id: "mosque", title: "Mosque & Prayer Areas", description: "Dedicated spacious area for daily prayers", span: "min-h-[160px]", images: ["https://images.unsplash.com/photo-1564769625392-651b0b0c0b8b?w=700&auto=format&fit=crop"] },
  { id: "cafeteria", title: "Cafeteria", description: "Multi-cuisine food court with fresh, hygienic meals", span: "sm:col-span-2 min-h-[160px]", images: ["https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&auto=format&fit=crop","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&auto=format&fit=crop"] },
];

function FacilityCard({ facility }) {
  const [index, setIndex] = useState(0);
  const img = facility.images[index];
  const multi = facility.images.length > 1;

  return (
    <article className={`relative rounded-2xl overflow-hidden min-h-[160px] h-full ${facility.span} group cursor-default`}>
      <img src={img} alt={facility.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0) 70%)" }} />
      <div className="absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-orange-400/40 rounded-2xl transition-all duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-sm font-bold leading-snug drop-shadow">{facility.title}</h3>
        <p className="text-xs text-white/80 mt-0.5">{facility.description}</p>
        {multi && (
          <div className="flex items-center gap-1.5 mt-2">
            {facility.images.map((_, i) => (
              <button key={i} type="button" aria-label={`Show image ${i + 1} of ${facility.title}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? "w-3.5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function CampusFacilities() {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Campus Facilities</h2>
        <p className="text-sm text-gray-500 mt-1">A look at the facilities and amenities available to students on campus.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:auto-rows-[160px]">
        {FACILITIES.map((f) => (<FacilityCard key={f.id} facility={f} />))}
        <article className="rounded-2xl border border-sky-100 bg-sky-50/80 px-5 py-8 flex flex-col items-center justify-center text-center min-h-[140px] group hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-md transition-all duration-300 cursor-default">
          <div className="w-11 h-11 rounded-xl bg-white border border-sky-100 group-hover:border-orange-200 text-orange-500 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-800">Medical Bay</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">On-campus first aid and emergency medical services</p>
        </article>
      </div>
    </div>
  );
}