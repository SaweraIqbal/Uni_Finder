import { useCallback, useEffect, useRef, useState } from "react";

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCountUp(target, duration = 1500, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    const frames = Math.round(duration / (1000 / 60));
    const inc = target / frames;
    let cur = 0,
      raf;
    const tick = () => {
      cur += inc;
      if (cur < target) {
        setValue(Math.ceil(cur));
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);
  return value;
}

function useCountdown(deadlineMs) {
  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");
  const calc = useCallback(() => {
    const d = Math.max(0, deadlineMs - Date.now());
    return {
      d: pad(Math.floor(d / 86400000)),
      h: pad(Math.floor((d % 86400000) / 3600000)),
      m: pad(Math.floor((d % 3600000) / 60000)),
      s: pad(Math.floor((d % 60000) / 1000)),
    };
  }, [deadlineMs]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

const IconSchool = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4" />
  </svg>
);

const IconUsers = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3" />
    <path d="M8 11c-1.657 0-3-1.343-3-3s1.343-3 3-3" />
    <path d="M12 13c2.761 0 5 1.567 5 3.5V18H7v-1.5C7 14.567 9.239 13 12 13z" />
    <path d="M19 14c1.5.5 3 1.5 3 3v1h-3" />
    <path d="M5 14c-1.5.5-3 1.5-3 3v1h3" />
    <circle cx="12" cy="7" r="3" />
  </svg>
);

const IconCreditCard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const tileBase = "transition-all duration-500 ease-out";

const tileReveal = (visible, delay = 0) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0)" : "translateY(14px)",
  transitionDelay: `${delay}ms`,
});

const DEADLINE = Date.now() + 12 * 86400000 + 8 * 3600000 + 45 * 60000;

export default function BentoStats({ heroImage, onApply }) {
  const [wrapRef, wrapVisible] = useReveal(0.1);
  const fillRef = useRef(null);

  const programs = useCountUp(42, 1400, wrapVisible);
  const students = useCountUp(12500, 1600, wrapVisible);
  const time = useCountdown(DEADLINE);

  useEffect(() => {
    if (wrapVisible && fillRef.current) {
      setTimeout(() => {
        fillRef.current.style.width = "85%";
      }, 200);
    }
  }, [wrapVisible]);

  const cdSegments = [
    { val: time.d, lbl: "Days" },
    { val: time.h, lbl: "Hrs" },
    { val: time.m, lbl: "Min" },
    { val: time.s, lbl: "Sec" },
  ];

  const card =
    "bg-white border border-slate-200/70 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md";

  return (
    <div
      ref={wrapRef}
      className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 lg:px-12"
      style={{ marginTop: "-48px" }}
    >

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

        <div
          className={`${tileBase} ${card} overflow-hidden shadow-md`}
          style={{ ...tileReveal(wrapVisible, 0), minHeight: "130px" }}
          role="img"
          aria-label="Campus aerial photo"
        >
          <img
            src={heroImage}
            alt="Campus aerial"
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ minHeight: "130px" }}
          />
        </div>

        <div
          className={`${tileBase} ${card} shadow-md flex flex-col items-center justify-center text-center p-4 gap-1.5`}
          style={tileReveal(wrapVisible, 60)}
          role="article"
          aria-label="Total programs: 42"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
            <IconSchool />
          </div>
          <div className="text-[22px] font-bold leading-none text-orange-500 tabular-nums tracking-tight">
            {programs.toLocaleString()}
          </div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
            Total programs
          </p>
        </div>

        <div
          className={`${tileBase} ${card} shadow-md flex flex-col items-center justify-center text-center p-4 gap-1.5`}
          style={tileReveal(wrapVisible, 120)}
          role="article"
          aria-label="Total students: 12,500"
        >
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
            <IconUsers />
          </div>
          <div className="text-[22px] font-bold leading-none text-orange-500 tabular-nums tracking-tight">
            {students.toLocaleString()}
          </div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
            Total students
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div
          className={`${tileBase} ${card} sm:col-span-2 p-4`}
          style={tileReveal(wrapVisible, 180)}
          role="article"
        >

          <div className="flex justify-between items-start mb-3 gap-2">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-orange-500 mb-0.5">
                Top rated program
              </p>
              <h3 className="text-[14px] font-bold text-slate-800 leading-tight">
                Computer Science &amp; Engineering
              </h3>
            </div>
            <span className="flex-shrink-0 bg-orange-50 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
              BS Level
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-3.5">
            {[
              { icon: <IconCreditCard />, text: "$15k / year" },
              { icon: <IconCalendar />, text: "4 years duration" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1 text-[12px] text-slate-500"
              >
                <span className="text-orange-500">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-medium">
                Seats availability
              </span>
              <span className="text-orange-500 font-semibold">85% full</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                ref={fillRef}
                className="h-full bg-orange-500 rounded-full"
                style={{
                  width: "0%",
                  transition: "width 1.3s cubic-bezier(.4,0,.2,1)",
                }}
                role="progressbar"
                aria-valuenow={85}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="85% of seats filled"
              />
            </div>
          </div>
        </div>

        <div
          className={`${tileBase} bg-orange-500 rounded-2xl p-4 flex flex-col justify-between
            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25`}
          style={tileReveal(wrapVisible, 240)}
          role="article"
        >
          <div>
            <h3 className="text-[13px] font-bold text-white mb-1">
              Spring 2025 admissions
            </h3>
            <p className="text-[11px] text-white/75 leading-relaxed">
              Secure your future at the world's most innovative campus.
            </p>
          </div>

          <div>

            <div
              className="flex items-center gap-1 my-2.5 overflow-x-auto"
              aria-label="Time remaining"
            >
              {cdSegments.map(({ val, lbl }, i) => (
                <div
                  key={lbl}
                  className="flex items-center gap-1 flex-shrink-0"
                >
                  <div className="text-center">
                    <div className="text-[15px] font-bold text-white leading-none tabular-nums">
                      {val}
                    </div>
                    <div className="text-[8px] text-white/60 uppercase tracking-wide">
                      {lbl}
                    </div>
                  </div>
                  {i < cdSegments.length - 1 && (
                    <span
                      className="text-[12px] text-white/40 pb-2 flex-shrink-0"
                      aria-hidden="true"
                    >
                      :
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onApply?.()}
              className="group w-full py-2 bg-white text-orange-500 font-bold text-[12px] rounded-xl
                flex items-center justify-center gap-1.5
                hover:bg-white/90 active:scale-[.98] transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white
                focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
            >
              Apply for admission
              <span className="transition-transform duration-150 group-hover:translate-x-0.5 flex-shrink-0">
                <IconArrowRight />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
