import {
  Building2,
  LayoutGrid,
  ListChecks,
  Eye,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'profile', label: 'Hostel Profile', icon: Building2 },
  { id: 'listing', label: 'Listing Management', icon: ListChecks },
  { id: 'preview', label: 'Listing Preview', icon: Eye },
];

const APPROVAL_BADGES = {
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  pending_admin: { label: 'Approval pending', cls: 'bg-amber-100 text-amber-800' },
  pending_campus: { label: 'Approval pending', cls: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
};

const LIVE_BADGES = {
  live: { label: 'Live', cls: 'bg-emerald-600 text-white' },
  pending_details: { label: 'Listing pending', cls: 'bg-orange-100 text-orange-700' },
  pending_approval: { label: 'Not live', cls: 'bg-slate-100 text-slate-600' },
  rejected: { label: 'Not live', cls: 'bg-slate-100 text-slate-600' },
};

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function HostelOwnerLayout({
  active,
  onNavigate,
  onSignOut,
  owner,
  title,
  status,
  approvalStatus,
  children,
}) {
  const liveBadge = LIVE_BADGES[status] || LIVE_BADGES.pending_approval;
  const approvalBadge =
    APPROVAL_BADGES[approvalStatus || 'pending_admin'] || APPROVAL_BADGES.pending_admin;

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">

      <aside className="hidden h-full w-[260px] shrink-0 flex-col overflow-y-auto bg-[#0f1729] px-5 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-1">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6a00]">
            <Building2 size={20} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">UniFinder</p>
            <p className="text-xs text-slate-400">Hostel Owner Portal</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1.5" aria-label="Hostel owner">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? 'bg-[#ff6a00] text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10">
              <HelpCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Need help?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Our partner support team is here for you.
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">

        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">Hostel Owner Dashboard</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{title}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${approvalBadge.cls}`}
                >
                  {approvalBadge.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${liveBadge.cls}`}
                >
                  {liveBadge.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">{owner.name}</p>
                <p className="text-xs text-slate-500">{owner.hostelName}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                {initials(owner.name)}
              </div>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-5 pb-3 lg:hidden" aria-label="Hostel owner">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                  active === id
                    ? 'bg-[#ff6a00] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={onSignOut}
              className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600"
            >
              Sign out
            </button>
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}