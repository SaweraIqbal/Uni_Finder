import {
  Building2,
  Eye,
  Image,
  BedDouble,
  Check,
  ChevronRight,
  PencilLine,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

const STATUS = {
  live: {
    banner: 'bg-emerald-50 border-emerald-200',
    iconBox: 'bg-emerald-100 text-emerald-700',
    pill: 'bg-emerald-200 text-emerald-800',
    pillText: 'Live',
    title: 'Your hostel is live',
    text: 'Students can now find your hostel on UniFinder.',
    icon: CheckCircle2,
  },
  pending_details: {
    banner: 'bg-orange-50 border-orange-200',
    iconBox: 'bg-orange-100 text-orange-700',
    pill: 'bg-orange-200 text-orange-800',
    pillText: 'Listing pending',
    title: 'Your hostel is approved',
    text: 'Approval is complete. Your listing will go live automatically once the remaining mandatory details are filled.',
    icon: Clock,
  },
  pending_approval: {
    banner: 'bg-amber-50 border-amber-200',
    iconBox: 'bg-amber-100 text-amber-700',
    pill: 'bg-amber-200 text-amber-800',
    pillText: 'Approval pending',
    title: 'Pending approval',
    text: 'Your hostel is waiting for review. You can keep editing and saving while you wait.',
    icon: Clock,
  },
  rejected: {
    banner: 'bg-red-50 border-red-200',
    iconBox: 'bg-red-100 text-red-700',
    pill: 'bg-red-200 text-red-800',
    pillText: 'Rejected',
    title: 'Changes needed',
    text: 'Fix the reviewer notes, complete the required details and resubmit.',
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

function ReadinessCard({ data }) {
  const percent = data.completeness ?? 0;
  const label =
    percent >= 100 ? 'Complete' : percent >= 60 ? 'Almost there' : 'Getting started';

  return (
    <div className="relative rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#ff6a00] shadow-sm">
          <Check size={18} />
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-700">
          {label}
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">Listing readiness</p>
      <p className="mt-1 text-2xl font-bold">{percent}%</p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-orange-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Listing readiness"
      >
        <div
          className="h-full rounded-full bg-[#ff6a00] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Profile {data.profileCompleteness ?? 0}% · Listing {data.listingCompleteness ?? 0}%
      </p>
    </div>
  );
}

export default function OverviewSection({ data, onNavigate }) {
  const s = STATUS[data.status] ?? STATUS.pending_approval;
  const StatusIcon = s.icon;
  const isCampus = data.hostelType === 'campus';
  const counts = data.counts ?? {};
  const missing = data.missing ?? [];
  const totalChecks = data.totalChecks ?? 0;

  const bannerText =
    data.status === 'pending_approval' && data.reviewerLabel
      ? `Waiting for review by ${data.reviewerLabel}. You can keep editing and saving while you wait.`
      : data.status === 'rejected' && data.rejectionReason
        ? `${s.text} Reason: ${data.rejectionReason}`
        : data.status === 'pending_details'
          ? `${s.text} ${missing.length} required ${missing.length === 1 ? 'detail is' : 'details are'} still missing.`
          : s.text;

  return (
    <div className="space-y-8">

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
          <p className="mt-1 text-sm text-slate-600">{bannerText}</p>
        </div>
        <button
          onClick={() => onNavigate('preview')}
          className="flex items-center gap-1 text-sm font-medium text-slate-800 hover:underline"
        >
          See public preview <ChevronRight size={16} />
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Hostel snapshot</h2>
        <p className="text-sm text-slate-500">
          {isCampus
            ? 'Campus hostel details students will see.'
            : 'Independent hostel details students will see.'}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isCampus ? (
            <StatCard
              icon={Building2}
              label="Affiliated Campus"
              value={data.campusName || 'Not set'}
              hint={data.campusName ? 'Campus-linked listing' : 'Select a campus in profile'}
            />
          ) : (
            <StatCard
              icon={Eye}
              label="Listing Visibility"
              value={data.status === 'live' ? 'Live' : 'Pending'}
              hint={
                data.status === 'live'
                  ? 'Students can find this hostel'
                  : 'Not visible until details are complete'
              }
            />
          )}

          <StatCard
            icon={BedDouble}
            label="Rooms & Seats"
            value={counts.roomsCount ?? 0}
            hint={`${counts.totalSeats ?? 0} total seats · ${counts.seatsAvailable ?? 0} free`}
          />

          <StatCard
            icon={Image}
            label="Photos"
            value={counts.photosCount ?? 0}
            hint={
              (counts.photosCount ?? 0) > 0
                ? 'Shown on your public card'
                : 'At least 1 photo is required'
            }
          />

          <ReadinessCard data={data} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className={`${card} p-6`}>
          <h2 className="font-semibold">Required details</h2>
          <p className="text-sm text-slate-500">
            Your listing stays hidden from students until these mandatory profile and listing details are complete.
          </p>

          {missing.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {missing.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.nav)}
                    className="flex w-full items-center gap-4 py-3.5 text-left"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700">
                      <PencilLine size={15} />
                    </span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <span className="text-xs font-medium text-[#ff6a00]">Add</span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 size={18} />
              All mandatory details are complete.
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              {totalChecks - missing.length} of {totalChecks} required details complete
            </p>
            <button
              onClick={() => onNavigate(missing[0]?.nav || 'profile')}
              className="text-sm font-semibold text-[#ff6a00] hover:underline"
            >
              {missing.length ? 'Complete details' : 'Review profile'}
            </button>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-[#0f1729] p-6 text-white">
          <PencilLine size={20} className="text-[#ff6a00]" />
          <h2 className="mt-4 font-semibold">
            {data.status === 'live' ? 'See what students see' : 'Finish to go live'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {data.status === 'live'
              ? 'Open your public listing preview to check the card, price range and amenities.'
              : 'Complete the remaining mandatory details to publish your hostel on UniFinder.'}
          </p>
          <button
            onClick={() =>
              onNavigate(
                data.status === 'live' ? 'preview' : missing[0]?.nav || 'profile'
              )
            }
            className="mt-6 w-fit rounded-xl bg-[#ff6a00] px-4 py-2.5 text-sm font-semibold hover:bg-[#e65f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {data.status === 'live' ? 'Preview listing' : 'Complete details'}
          </button>
        </div>
      </section>
    </div>
  );
}
