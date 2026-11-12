import { Building2, CheckCircle2, Clock, Eye, MapPin, ShieldCheck } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const money = (value) =>
  value == null ? null : `Rs ${Number(value).toLocaleString('en-US')}`;

function priceLabel(counts = {}) {
  const min = money(counts.rentMin);
  const max = money(counts.rentMax);
  if (!min) return 'Rent not set';
  if (!max || counts.rentMin === counts.rentMax) return min;
  return `${min} – ${max}`;
}

function amenityNames(listing) {
  const parse = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const amenities = parse(listing?.amenities, {});
  const inRoom = parse(amenities.inRoom, {});
  const facilities = parse(amenities.facilities, []);
  const names = [
    ...(Array.isArray(inRoom.items) ? inRoom.items : []),
    ...(Array.isArray(facilities) ? facilities : []),
  ]
    .map((item) => item?.name)
    .filter(Boolean);

  return [...new Set(names)].slice(0, 4);
}

const STATUS_COPY = {
  live: {
    label: 'Live',
    cls: 'bg-emerald-100 text-emerald-700',
    title: 'Your listing is live',
    text: 'This is exactly what students see on the UniFinder landing page.',
    icon: CheckCircle2,
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  pending_details: {
    label: 'Listing pending',
    cls: 'bg-orange-100 text-orange-700',
    title: 'Approved — not visible to students yet',
    text: 'Approval is complete. Complete the missing mandatory details to publish this listing.',
    icon: Clock,
    box: 'border-orange-200 bg-orange-50 text-orange-800',
  },
  pending_approval: {
    label: 'Approval pending',
    cls: 'bg-amber-100 text-amber-800',
    title: 'Waiting for approval',
    text: 'The public card will appear automatically after approval and completion.',
    icon: Clock,
    box: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-100 text-red-700',
    title: 'Listing not visible',
    text: 'Fix the reviewer notes and resubmit to make it public.',
    icon: Clock,
    box: 'border-red-200 bg-red-50 text-red-800',
  },
};

export default function ListingPreviewSection({
  hostel,
  completion,
  listing,
  photos = [],
  onNavigate,
}) {
  const status = STATUS_COPY[completion?.displayStatus] || STATUS_COPY.pending_approval;
  const StatusIcon = status.icon;
  const counts = completion?.counts || {};
  const isCampus = hostel?.hostel_type === 'university';
  const cover = photos.find((photo) => Number(photo.is_cover) === 1) || photos[0];
  const amenities = amenityNames(listing);
  const missing = completion?.missing || [];

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${status.box}`}>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/70">
          <StatusIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{status.title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
              {status.label}
            </span>
            {completion?.approvalStatus === 'approved' && completion?.displayStatus !== 'live' && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Approved
              </span>
            )}
          </div>
          <p className="mt-1 text-sm opacity-80">{status.text}</p>
          {missing.length > 0 && (
            <p className="mt-1 text-xs font-medium">
              {missing.length} required {missing.length === 1 ? 'detail' : 'details'} missing
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onNavigate(missing[0]?.nav || 'profile')}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          {missing.length ? 'Complete details' : 'Edit listing'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-52 bg-slate-100">
            {cover?.image_url ? (
              <img
                src={`${API}${cover.image_url}`}
                alt={hostel?.name || 'Hostel cover'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                <Building2 size={36} />
                <p className="text-xs font-medium">No photo uploaded yet</p>
              </div>
            )}

            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow ${
                isCampus ? 'bg-emerald-700' : 'bg-[#ff6a00]'
              }`}
            >
              {isCampus ? 'Campus Hostel' : 'Private Hostel'}
            </span>

            {listing?.gender && (
              <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold text-white shadow">
                {listing.gender === 'girls' ? 'Girls Hostel' : 'Boys Hostel'}
              </span>
            )}
          </div>

          <div className="p-5">
            <h3 className="text-lg font-bold text-slate-900">
              {hostel?.name || 'Your hostel name'}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={14} className="shrink-0 text-[#ff6a00]" />
              <span className="line-clamp-1">
                {isCampus
                  ? hostel?.campus_name || 'Campus not linked'
                  : hostel?.address || 'Address not set'}
              </span>
            </p>

            <p className="mt-3 text-xl font-extrabold text-[#ff6a00]">
              {priceLabel(counts)}
              {counts.rentMin != null && (
                <span className="text-[11px] font-normal text-slate-400">/mo</span>
              )}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {amenities.length ? (
                amenities.map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Amenities not added yet</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <span className="rounded-lg bg-slate-50 px-3 py-2">
                {counts.roomsCount ?? 0} rooms
              </span>
              <span className="rounded-lg bg-slate-50 px-3 py-2">
                {counts.seatsAvailable ?? 0} beds free
              </span>
            </div>

            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg border-2 border-orange-500 py-2.5 text-sm font-semibold text-orange-500 opacity-70"
            >
              View Details
            </button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Where this appears</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live listings appear in the hostel carousel on the UniFinder landing page.
              Pending listings stay hidden from students.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <Eye size={18} className="text-[#ff6a00]" />
              {completion?.isLive
                ? 'Visible in the public hostel carousel.'
                : 'Hidden until all required details are complete.'}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Required details</h2>
            <p className="mt-1 text-sm text-slate-500">
              {(completion?.profileChecks || []).length +
                (completion?.listingChecks || []).length -
                missing.length}{' '}
              of{' '}
              {(completion?.profileChecks || []).length +
                (completion?.listingChecks || []).length}{' '}
              complete
            </p>

            {missing.length === 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <ShieldCheck size={18} />
                Everything required is filled in.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {missing.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.nav)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left text-sm font-medium hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      {item.label}
                      <span className="text-xs font-semibold text-[#ff6a00]">Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
