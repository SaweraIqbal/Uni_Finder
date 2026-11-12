import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe, Mail, Phone } from "lucide-react";

function IconGlobe() {
  return (
    <Globe size={20} aria-hidden="true" />
  );
}
function IconMail() {
  return (
    <Mail size={20} aria-hidden="true" />
  );
}
function IconPhone() {
  return (
    <Phone size={20} aria-hidden="true" />
  );
}
function IconArrow() {
  return (
    <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden="true" />
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

      <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
        {def.icon}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          {def.label}
        </p>
        <p className="text-sm font-medium text-slate-700 break-all">{value}</p>
      </div>

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

          <div className="h-px bg-slate-100 mx-6" />

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
