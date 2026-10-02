import { useEffect, useMemo, useState } from "react";

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const CATEGORIES = ["Government", "Need-Based", "Merit-Based", "Sports Quota"];
const SCHOLARSHIPS = [
  { id: 1, category: "Government", title: "CM Honhaar Undergraduate Scholarship", short: "A provincial government initiative aiming to support exceptionally bright students across Punjab by covering full academic expenses.", description: "The Chief Minister Honhaar Undergraduate Scholarship is a provincial program that covers tuition and related academic expenses for high-achieving students enrolled in eligible undergraduate programs. Recipients are selected on academic merit and continued funding depends on maintaining the required CGPA each semester.", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: 2, category: "Government", title: "Benazir Undergraduate Scholarship Project", short: "Federal flagship scholarship designed to provide equal opportunities to talented students from low-income families across the nation.", description: "This federal scholarship supports undergraduate students from low-income households. It typically covers tuition and a modest stipend so that financial constraints do not interrupt degree completion. Eligibility is based on household income documentation and academic standing.", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: 3, category: "Government", title: "PEEF Scholarship", short: "Punjab Educational Endowment Fund provides vital financial assistance to talented and deserving students to pursue quality higher education.", description: "PEEF scholarships are awarded to academically talented students who demonstrate financial need. The award helps cover tuition and related costs for undergraduate and selected postgraduate programs at partner institutions." },
  { id: 4, category: "Merit-Based", title: "Admission Merit Slabs", short: "Institutional scholarships awarded automatically at the time of admission based on previous academic performance and entry test scores.", description: "Merit slabs are applied at admission. Students with stronger intermediate / A-level results and entry-test scores receive a percentage tuition waiver for the first semester, which may continue if CGPA thresholds are met.", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: 5, category: "Merit-Based", title: "Rector's Honor Roll", short: "Highly competitive semester-by-semester waiver granted to the top percentage of students maintaining an exceptional CGPA.", description: "Students who finish in the top academic percentile of their program each semester are placed on the Rector's Honor Roll and receive a tuition waiver for the following term. Rankings are recalculated every semester." },
  { id: 6, category: "Need-Based", title: "HEC Need-Based Scholarship", short: "Comprehensive financial aid ensuring that financial constraints do not hinder academically capable students from accessing higher education.", description: "HEC Need-Based Scholarships assist capable students who cannot meet university fees. Applicants submit income evidence and academic records. Awards may cover full or partial tuition depending on assessed need.", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { id: 7, category: "Need-Based", title: "NTS CSR Grant", short: "Corporate Social Responsibility initiative providing targeted assistance to marginalized students demonstrating clear financial need.", description: "The NTS CSR Grant is a targeted need-based award for students from marginalized backgrounds. It is intended as a one-time or renewable grant toward semester fees after a simple needs assessment." },
  { id: 8, category: "Sports Quota", title: "Sports & Talent Quota", short: "Reserved seats and fee waivers for students who have demonstrated exceptional ability in recognized national or provincial level sports.", description: "Athletes with verified national or provincial achievements may apply under the Sports & Talent Quota. Benefits can include reserved seats, partial fee waivers, and access to campus sports facilities, subject to continued participation and academic eligibility.", pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
];

function categoryStyle(category) {
  if (category === "Government") return "bg-sky-50 text-sky-600 border-sky-100";
  if (category === "Merit-Based") return "bg-violet-50 text-violet-600 border-violet-100";
  if (category === "Need-Based") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  return "bg-orange-50 text-orange-600 border-orange-100";
}

export default function Scholarships() {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(CATEGORIES.map((c) => [c, true])));
  const [selected, setSelected] = useState(null);
  const visible = useMemo(() => SCHOLARSHIPS.filter((s) => enabled[s.category]), [enabled]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [selected]);

  const toggle = (cat) => setEnabled((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Scholarships</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">Explore government, merit-based, need-based, and sports quota scholarships available to students at this campus.</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 mb-6 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Filter:</span>
        {CATEGORIES.map((cat) => (
          <label key={cat} className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none hover:text-orange-500 transition-colors">
            <input type="checkbox" checked={!!enabled[cat]} onChange={() => toggle(cat)} className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 accent-orange-500 cursor-pointer" />
            {cat}
          </label>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-14 text-sm text-gray-400">No scholarships match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((s) => (
            <article key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col hover:shadow-md hover:border-orange-100 hover:-translate-y-0.5 transition-all duration-300">
              <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyle(s.category)}`}>{s.category}</span>
              <h3 className="text-sm font-bold text-gray-800 mt-3">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed flex-1">{s.short}</p>
              <button type="button" onClick={() => setSelected(s)}
                className="self-end mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 inline-flex items-center gap-1 hover:gap-2 transition-all duration-200">
                Learn More <ArrowRightIcon />
              </button>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15, 23, 42, 0.45)" }} onClick={() => setSelected(null)}>
          <div className="relative bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="scholarship-title">
            <button type="button" onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 hover:scale-110 transition-all duration-200" aria-label="Close">
              <CloseIcon />
            </button>
            <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyle(selected.category)}`}>{selected.category}</span>
            <h3 id="scholarship-title" className="text-lg font-bold text-gray-800 mt-3 pr-8">{selected.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{selected.description}</p>
            {selected.pdf && (
              <a href={selected.pdf} target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-300 text-sm font-semibold text-orange-500 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200">
                <DownloadIcon /> Download PDF
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}