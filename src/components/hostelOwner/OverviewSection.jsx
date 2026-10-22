import {
  Clock,
  FileText,
  BedDouble,
  Users,
  Check,
  ChevronRight,
  PencilLine,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const STATUS = {
  draft: {
    listing: 'Draft',
    banner: 'bg-slate-50 border-slate-200',
    iconBox: 'bg-slate-100 text-slate-600',
    pill: 'bg-slate-200 text-slate-700',
    pillText: 'Not submitted',
    title: 'Listing not submitted',
    text: 'Finish your setup and submit your hostel for campus approval.',
    icon: Clock,
  },
  under_review: {
    listing: 'Under review',
    banner: 'bg-amber-50 border-amber-200',
    iconBox: 'bg-amber-100 text-amber-700',
    pill: 'bg-amber-200 text-amber-800',
    pillText: 'In review',
    title: 'Pending Campus Approval',
    text: 'Your profile is with the university verification team. Reviews usually take 2–3 working days.',
    icon: Clock,
  },
  approved: {
    listing: 'Approved',
    banner: 'bg-emerald-50 border-emerald-200',
    iconBox: 'bg-emerald-100 text-emerald-700',
    pill: 'bg-emerald-200 text-emerald-800',
    pillText: 'Live',
    title: 'Your hostel is live',
    text: 'Students can now find your hostel on UniFinder.',
    icon: CheckCircle2,
  },
  rejected: {
    listing: 'Changes needed',
    banner: 'bg-red-50 border-red-200',
    iconBox: 'bg-red-100 text-red-700',
    pill: 'bg-red-200 text-red-800',
    pillText: 'Rejected',
    title: 'Approval was rejected',
    text: 'Check the reviewer notes in Status Tracking, fix the issues and resubmit.',
    icon: XCircle,
  },
};

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className={`${card} p-5`}>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#ff6a00]">
        <Icon size={18} />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function OverviewSection({ data, onNavigate }) {
  const s = STATUS[data.status] ?? STATUS.draft;
  const StatusIcon = s.icon;

  const doneCount = data.setup.filter((i) => i.done).length;
  const completeness = Math.round((doneCount / data.setup.length) * 100);
  // Design shows 75% with 2 of 3 steps done; use a real value once the API sends it.
  const shownCompleteness = data.completeness ?? completeness;
  const completenessLabel =
    shownCompleteness >= 100 ? 'Complete' : shownCompleteness >= 60 ? 'Good' : 'Getting started';

  return (
    <div className="space-y-8">
      {/* Status banner */}
      <div className={`flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${s.banner}`}>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.iconBox}`}>
          <StatusIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{s.title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.pill}`}>
              {s.pillText}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{s.text}</p>
        </div>
        <button
          onClick={() => onNavigate('status')}
          className="flex items-center gap-1 text-sm font-medium text-amber-900 hover:underline"
        >
          Track status <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-lg font-semibold">At a glance</h2>
        <p className="text-sm text-slate-500">Your hostel listing today.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={FileText} label="Listing Status" value={s.listing} hint="Track application" />
          <StatCard
            icon={BedDouble}
            label="Rooms Listed"
            value={data.roomsListed}
            hint={`Across ${data.roomTypes} room types`}
          />
          <StatCard
            icon={Users}
            label="Seats Available"
            value={data.seatsAvailable}
            hint={`Of ${data.totalSeats} total seats`}
          />

          <div className="relative rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#ff6a00] shadow-sm">
                <Check size={18} />
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700">
                {completenessLabel}
              </span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">Profile Completeness</p>
            <p className="mt-1 text-2xl font-bold">{shownCompleteness}%</p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100"
              role="progressbar"
              aria-valuenow={shownCompleteness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
            >
              <div
                className="h-full rounded-full bg-[#ff6a00]"
                style={{ width: `${shownCompleteness}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Setup + CTA */}
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className={`${card} p-6`}>
          <h2 className="font-semibold">Complete your setup</h2>
          <p className="text-sm text-slate-500">Finish the remaining steps before final approval.</p>

          <ul className="mt-4 divide-y divide-slate-100">
            {data.setup.map((item, i) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.nav)}
                  className="flex w-full items-center gap-4 py-4 text-left"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      item.done ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.done ? <Check size={16} /> : i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col rounded-2xl bg-[#0f1729] p-6 text-white">
          <PencilLine size={20} className="text-[#ff6a00]" />
          <h2 className="mt-4 font-semibold">Keep availability fresh</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Accurate room and seat availability helps students decide faster.
          </p>
          <button
            onClick={() => onNavigate('listing')}
            className="mt-6 w-fit rounded-xl bg-[#ff6a00] px-4 py-2.5 text-sm font-semibold hover:bg-[#e65f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Manage listing
          </button>
        </div>
      </section>
    </div>
  );
}