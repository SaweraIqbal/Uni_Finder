/**
 * CampusRegistrationStatusPage.jsx  —  /campus/registration-status
 *
 * Renders one of four state cards (pending / rejected / resubmission_requested /
 * approved) driven entirely by the real DB record from /api/campus-registrations/mine.
 * Shows a loading skeleton while the context fetches, redirects to /campus/register
 * if no record is found.
 */
import { useEffect }    from "react";
import { useNavigate }  from "react-router-dom";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Mail,
} from "lucide-react";

import CampusRegShell            from "../components/campusReg/CampusRegShell";
import { useCampusRegistration } from "../context/CampusRegistrationContext";

/* ─── date formatter ─────────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return String(iso); }
}

/* ─── 3-step timeline ────────────────────────────────────────────────────── */
// step.state: "done" | "current" | "future"
function Timeline({ steps }) {
  return (
    <ol className="flex flex-col gap-0 my-5">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
                ${step.state === "done"    ? "bg-green-500 border-green-500"
                : step.state === "current" ? "bg-amber-50 border-amber-500"
                :                           "bg-white border-gray-200"}`}>
                {step.state === "done"
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : step.state === "current"
                  ? <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  : <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />}
              </div>
              {!last && (
                <div className={`w-0.5 flex-1 mt-0.5 mb-0.5
                  ${step.state === "done" ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
            <div className="pb-5 pt-1 min-w-0">
              <p className={`text-sm font-medium
                ${step.state === "done"    ? "text-green-700"
                : step.state === "current" ? "text-amber-700"
                :                           "text-slate-400"}`}>
                {step.label}
              </p>
              {step.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{step.sub}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─── loading skeleton ───────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-5 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
      <div className="space-y-2">
        {[1,2,3].map((n) => <div key={n} className="h-3 bg-gray-100 rounded" style={{width:`${90 - n*15}%`}} />)}
      </div>
    </div>
  );
}

/* ─── shared status card wrapper ─────────────────────────────────────────── */
function StatusCard({ iconBg, icon: Icon, iconColor, pillLabel, pillStyle, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1 ${pillStyle}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {pillLabel}
          </span>
          <h3 className="text-base font-semibold text-slate-800 mt-0.5">{title}</h3>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function CampusRegistrationStatusPage() {
  const navigate = useNavigate();
  const { registration: reg, status, loading, STATUSES } = useCampusRegistration();

  // If loading finished and there's no record, redirect to register
  useEffect(() => {
    if (!loading && !reg && status === STATUSES.NEW) {
      navigate("/campus/register", { replace: true });
    }
  }, [loading, reg, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const uniName  = reg?.universityName || "the university";
  const subDate  = fmtDate(reg?.submittedAt);

  /* ── timeline configs ─────────────────────────────────────────────────── */
  const timelines = {
    [STATUSES.PENDING]: [
      { label: "Submitted",                state: "done",    sub: subDate },
      { label: "University verification",  state: "current", sub: `Awaiting ${uniName}` },
      { label: "Campus live on UniFinder", state: "future" },
    ],
    [STATUSES.REJECTED]: [
      { label: "Submitted",                state: "done",    sub: subDate },
      { label: "University verification",  state: "current", sub: "Action required" },
      { label: "Campus live on UniFinder", state: "future" },
    ],
    [STATUSES.RESUBMISSION_REQUESTED]: [
      { label: "Submitted",                state: "done",    sub: subDate },
      { label: "University verification",  state: "current", sub: "Additional info required" },
      { label: "Campus live on UniFinder", state: "future" },
    ],
    [STATUSES.APPROVED]: [
      { label: "Submitted",                state: "done" },
      { label: "University verification",  state: "done",    sub: `Approved by ${uniName}` },
      { label: "Campus live on UniFinder", state: "done" },
    ],
  };

  /* ── 4 state cards ────────────────────────────────────────────────────── */
  const renderCard = () => {
    if (loading || !reg) return <Skeleton />;

    // ── PENDING ──────────────────────────────────────────────────────────
    if (status === STATUSES.PENDING) {
      return (
        <StatusCard
          iconBg="bg-orange-50" icon={Clock} iconColor="text-orange-500"
          pillLabel="Pending Review" pillStyle="bg-amber-100 text-amber-700"
          title="Pending University Review"
        >
          <p className="text-sm text-slate-600">
            Your request has been sent to{" "}
            <span className="font-medium text-slate-800">{uniName}</span>.
            You'll receive an update once a decision is made.
          </p>
          <p className="text-xs text-slate-400 mt-1">Submitted: {subDate}</p>
          <Timeline steps={timelines[STATUSES.PENDING]} />
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Withdraw — disabled; no endpoint yet */}
            <div className="relative group">
              <button type="button" disabled
                className="flex items-center gap-2 border border-gray-200 text-sm font-medium
                           px-4 py-2 rounded-xl text-slate-400 bg-gray-50 cursor-not-allowed opacity-60">
                Withdraw Request
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 text-center
                              text-xs bg-slate-800 text-white px-2 py-1.5 rounded-lg pointer-events-none
                              opacity-0 group-hover:opacity-100 transition-opacity">
                Not available yet
              </div>
            </div>
          </div>
        </StatusCard>
      );
    }

    // ── REJECTED ─────────────────────────────────────────────────────────
    if (status === STATUSES.REJECTED) {
      const rej = reg.rejection || {};
      return (
        <StatusCard
          iconBg="bg-red-100" icon={XCircle} iconColor="text-red-500"
          pillLabel="Rejected" pillStyle="bg-red-100 text-red-700"
          title="Registration Rejected"
        >
          {/* Rejection reason block — always shown with both reason + note */}
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Reason</span>
              {rej.reason && (
                <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {rej.reason}
                </span>
              )}
            </div>
            {rej.note && (
              <p className="text-sm text-red-700 leading-relaxed">{rej.note}</p>
            )}
            {!rej.reason && !rej.note && (
              <p className="text-sm text-red-500 italic">No reason provided by reviewer.</p>
            )}
          </div>
          <Timeline steps={timelines[STATUSES.REJECTED]} />
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button type="button" onClick={() => navigate("/campus/register")}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98]
                         text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all
                         focus:outline-none focus:ring-2 focus:ring-orange-400">
              Resubmit with Corrections <ArrowRight className="w-4 h-4" />
            </button>
            <a href="mailto:support@unifinder.pk"
              className="flex items-center gap-2 border border-gray-200 text-slate-700 hover:bg-gray-50
                         font-medium text-sm px-4 py-2.5 rounded-xl transition-colors">
              <Mail className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </StatusCard>
      );
    }

    // ── RESUBMISSION REQUESTED ────────────────────────────────────────────
    if (status === STATUSES.RESUBMISSION_REQUESTED) {
      const docs = reg.resubmission?.requiredDocs || [];
      return (
        <StatusCard
          iconBg="bg-amber-50" icon={AlertTriangle} iconColor="text-amber-500"
          pillLabel="Resubmission Requested" pillStyle="bg-amber-100 text-amber-700"
          title="Additional Information Required"
        >
          <p className="text-sm text-slate-600">
            The University Admin requires the following before approving:
          </p>
          {docs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {docs.map((d) => (
                <span key={d}
                  className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700
                             text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{d}
                </span>
              ))}
            </div>
          )}
          {reg.resubmission?.note && (
            <p className="mt-3 text-sm text-slate-600 italic">"{reg.resubmission.note}"</p>
          )}
          <Timeline steps={timelines[STATUSES.RESUBMISSION_REQUESTED]} />
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button type="button" onClick={() => navigate("/campus/register")}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98]
                         text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all
                         focus:outline-none focus:ring-2 focus:ring-orange-400">
              Update &amp; Resubmit <ArrowRight className="w-4 h-4" />
            </button>
            <a href="mailto:support@unifinder.pk"
              className="flex items-center gap-2 border border-gray-200 text-slate-700 hover:bg-gray-50
                         font-medium text-sm px-4 py-2.5 rounded-xl transition-colors">
              <Mail className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </StatusCard>
      );
    }

    // ── APPROVED ─────────────────────────────────────────────────────────
    if (status === STATUSES.APPROVED) {
      return (
        <StatusCard
          iconBg="bg-green-100" icon={CheckCircle2} iconColor="text-green-600"
          pillLabel="Approved" pillStyle="bg-green-100 text-green-700"
          title="Your campus is live on UniFinder!"
        >
          <p className="text-sm text-slate-600">
            Congratulations!{" "}
            <span className="font-medium text-slate-800">
              {reg.officialName || "Your campus"}
            </span>{" "}
            has been approved by{" "}
            <span className="font-medium text-slate-800">{uniName}</span> and is
            now visible to students.
          </p>
          <Timeline steps={timelines[STATUSES.APPROVED]} />
          {/* TODO: real apps gate dashboard access here — check status === "approved" before routing */}
          <button type="button" onClick={() => navigate("/campus/dashboard")}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98]
                       text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all mt-2
                       focus:outline-none focus:ring-2 focus:ring-orange-400">
            Go to Campus Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </StatusCard>
      );
    }

    // fallback
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400">
        <p className="text-sm">No registration found.</p>
        <button type="button" onClick={() => navigate("/campus/register")}
          className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium underline">
          Register a campus →
        </button>
      </div>
    );
  };

  return (
    <CampusRegShell>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Registration Status</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track the progress of your campus registration request.
          </p>
        </div>
        {renderCard()}
      </div>
    </CampusRegShell>
  );
}
