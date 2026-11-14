/**
 * ProfileReadinessCard — per-pathway progress rings + missing-items checklist.
 * Informational only. No edit mode.
 */
import { useMemo } from "react";
import ProgressRing from "../ProgressRing";
import { LEVELS, buildReadinessChecklist, computeCompletenessFromChecklist } from "../../../config/profileRequirements";

export default function ProfileReadinessCard({ profileData, activeLevel }) {
  // Build checklists for all 5 levels
  const levelData = useMemo(() =>
    LEVELS.map((level) => {
      const checklist = buildReadinessChecklist(level, profileData);
      const pct       = computeCompletenessFromChecklist(checklist, level);
      const missing   = checklist.filter((i) => !i.done);
      return { level, checklist, pct, missing };
    }),
    [profileData]
  );

  const active = levelData.find((d) => d.level === activeLevel) || levelData[0];

  return (
    <section id="readiness" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">Profile Readiness</h2>
        <p className="mt-1 text-xs text-slate-500">
          Shows how complete your profile is for each admission pathway.
        </p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Rings row — all 5 levels */}
        <div className="grid grid-cols-5 gap-3">
          {levelData.map(({ level, pct }) => (
            <div key={level} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors
              ${level === activeLevel ? "bg-orange-50 border border-orange-200" : ""}`}>
              <ProgressRing percentage={pct} size={56} strokeWidth={5} />
              <span className={`text-xs font-semibold ${level === activeLevel ? "text-orange-600" : "text-slate-600"}`}>
                {level}
              </span>
            </div>
          ))}
        </div>

        {/* Missing items for active level */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Missing for {activeLevel}
            {active.missing.length === 0 && (
              <span className="ml-2 text-green-600 font-normal text-xs">— All complete 🎉</span>
            )}
          </h3>

          {active.missing.length > 0 && (
            <ul className="space-y-2">
              {active.missing.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span className="text-slate-700 truncate">{item.label}</span>
                  </div>
                  <a
                    href={`#${item.section}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.section)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs text-orange-600 hover:underline flex-shrink-0"
                  >
                    {item.sectionLabel} →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Full checklist for active level */}
        <details className="group">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
            Show full checklist for {activeLevel} ({active.checklist.filter((i) => i.done).length}/{active.checklist.length} done)
          </summary>
          <ul className="mt-3 space-y-1.5">
            {active.checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                {item.done ? (
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-3.5 h-3.5 border border-slate-300 rounded-full flex-shrink-0" />
                )}
                <span className={item.done ? "text-slate-400 line-through" : ""}>{item.label}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
