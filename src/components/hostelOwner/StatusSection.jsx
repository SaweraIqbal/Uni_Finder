import { useState } from 'react';
import { Check, Clock, CheckCircle2, XCircle } from 'lucide-react';

// Temporary data - replace with API response later
const DEFAULT_STATUS = {
  applicationId: 'UF-HST-02841',
  status: 'pending', // 'pending' | 'rejected' | 'live'
  currentStep: 1, // 0-based index of the step being reviewed
  typeChanged: true,
  rejectionNote: '',
};

const FLOWS = {
  campus: ['Submitted', 'Campus Approval', 'Super Admin Approval', 'Live'],
  private: ['Submitted', 'Super Admin Approval', 'Live'],
};

const TYPE_INFO = {
  campus: { label: 'Campus Hostel', reviewer: 'Campus Admin' },
  private: { label: 'Private Hostel', reviewer: 'Super Admin' },
};

const BANNERS = {
  pending: {
    icon: Clock,
    box: 'border-orange-100 bg-orange-50',
    iconBox: 'bg-orange-100 text-orange-700',
    title: 'Pending approval',
    text: 'Your listing is being reviewed. We\u2019ll notify you when the next decision is made.',
  },
  rejected: {
    icon: XCircle,
    box: 'border-red-200 bg-red-50',
    iconBox: 'bg-red-100 text-red-700',
    title: 'Approval rejected',
    text: 'Your listing needs changes. Update it and submit again.',
  },
  live: {
    icon: CheckCircle2,
    box: 'border-emerald-200 bg-emerald-50',
    iconBox: 'bg-emerald-100 text-emerald-700',
    title: 'Your hostel is live',
    text: 'Students can now find your hostel on UniFinder.',
  },
};

function Stepper({ steps, current, status }) {
  const allDone = status === 'live';
  return (
    <ol className="mt-8 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((label, i) => {
        const done = allDone || i < current;
        const active = !allDone && i === current;
        const rejected = active && status === 'rejected';
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="relative flex flex-col items-center text-center">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-5 h-1 w-full -translate-y-1/2 rounded-full ${
                  allDone || i < current ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold ${
                done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : rejected
                  ? 'border-red-500 bg-red-500 text-white ring-4 ring-red-100'
                  : active
                  ? 'border-[#ff6a00] bg-[#ff6a00] text-white ring-4 ring-orange-100'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {done ? <Check size={18} /> : i + 1}
            </span>
            <span className={`mt-3 px-1 text-xs sm:text-sm ${active || done ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function StatusSection({ data = DEFAULT_STATUS, initialType = 'campus' }) {
  const [type, setType] = useState(initialType);
  const steps = FLOWS[type];
  const banner = BANNERS[data.status] ?? BANNERS.pending;
  const BannerIcon = banner.icon;
  // Private flow is one step shorter, so keep the current step inside the list.
  const current = Math.min(data.currentStep, steps.length - 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div role="radiogroup" aria-label="Hostel type" className="flex rounded-xl bg-slate-100 p-1">
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={type === key}
              onClick={() => setType(key)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium ${
                type === key ? 'bg-white text-[#ff6a00] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold">Approval journey</h2>
        <p className="text-sm text-slate-500">Application ID · {data.applicationId}</p>
        <Stepper steps={steps} current={current} status={data.status} />
      </section>

      <div className={`flex items-center gap-4 rounded-2xl border p-5 ${banner.box}`}>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${banner.iconBox}`}>
          <BannerIcon size={20} />
        </div>
        <div>
          <h3 className="font-semibold">{banner.title}</h3>
          <p className="text-sm text-slate-600">{banner.text}</p>
          {data.status === 'rejected' && data.rejectionNote && (
            <p className="mt-1 text-sm text-red-700">Reviewer note: {data.rejectionNote}</p>
          )}
        </div>
      </div>

      {data.typeChanged && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold">Listing type changed</h3>
          <p className="mt-1 text-sm text-slate-700">
            Listing type changed to {TYPE_INFO[type].label} — resubmitted for {TYPE_INFO[type].reviewer} review.
          </p>
        </div>
      )}
    </div>
  );
}