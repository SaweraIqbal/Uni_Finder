import { useEffect, useRef, useState } from "react";

/* ── SVG icons ── */
function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

const TILE_DEFS = [
  {
    key: "website",
    label: "Website",
    icon: <IconGlobe />,
    getHref: (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`),
    btnLabel: "Visit Website",
    btnIcon: <IconArrow />,
    ariaVerb: "Visit",
  },
  {
    key: "admissions_email",
    label: "Admissions Email",
    icon: <IconMail />,
    getHref: (v) => `mailto:${v}`,
    btnLabel: "Send Email",
    btnIcon: null,
    ariaVerb: "Email",
  },
  {
    key: "admissions_phone",
    label: "Admissions Phone",
    icon: <IconPhone />,
    getHref: (v) => `tel:${v.replace(/\s/g, "")}`,
    btnLabel: "Call Now",
    btnIcon: null,
    ariaVerb: "Call",
  },
];

function ContactTile({ def, value, delay, isVisible }) {
  if (!value) {
    // render a greyed-out placeholder so the layout stays 3-col
    return (
      <div
        className={`flex flex-col items-center text-center gap-3 p-5 transition-all duration-500
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: `${delay}ms` }}
        aria-label={`${def.label} not available`}
      >
        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
          {def.icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            {def.label}
          </p>
          <p className="text-sm text-slate-300 italic">Not provided</p>
        </div>
        <span className="mt-auto px-4 py-1.5 text-xs text-slate-300 border border-slate-200 rounded-lg cursor-not-allowed select-none">
          {def.btnLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center text-center gap-3 p-5 transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Orange icon circle */}
      <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
        {def.icon}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          {def.label}
        </p>
        <p className="text-sm font-medium text-slate-700 break-all">{value}</p>
      </div>

      {/* Action button */}
      <a
        href={def.getHref(value)}
        target={def.key === "website" ? "_blank" : undefined}
        rel={def.key === "website" ? "noopener noreferrer" : undefined}
        aria-label={`${def.ariaVerb} ${value}`}
        className="
          mt-auto inline-flex items-center gap-1.5
          px-4 py-1.5 rounded-lg text-xs font-semibold
          border border-orange-500 text-orange-500
          hover:bg-orange-500 hover:text-white
          transition-all duration-150 active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
        "
      >
        {def.btnLabel}
        {def.btnIcon}
      </a>
    </div>
  );
}

export default function ContactAdmissions({ university }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Resolve values — prefer profile fields, fall back to legacy columns
  const website  = university?.website_url  ?? university?.website  ?? null;
  const email    = university?.admissions_email ?? university?.email ?? null;
  const phone    = university?.admissions_phone ?? university?.phone ?? null;
  const values   = { website, admissions_email: email, admissions_phone: phone };

  return (
    <section
      ref={sectionRef}
      className="py-10 bg-gray-50"
      aria-labelledby="contact-admissions-title"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={`
            bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden
            transition-all duration-500
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          {/* Card header */}
          <div className="px-6 pt-6 pb-3">
            <h2
              id="contact-admissions-title"
              className="text-xl font-semibold text-slate-800"
            >
              Contact &amp; Admissions
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Reach the university&apos;s admissions office directly
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 mx-6" />

          {/* 3-column tile grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {TILE_DEFS.map((def, i) => (
              <ContactTile
                key={def.key}
                def={def}
                value={values[def.key]}
                delay={i * 80}
                isVisible={isVisible}
              />
            ))}
          </div>

          {/* Footer caption */}
          <div className="px-6 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              For campus-specific contact details, see each campus page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
