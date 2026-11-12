import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  User,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { API, fileUrl } from "../../../shared/api/client";
import GoogleMapPreview from "../../../shared/components/GoogleMapPreview";

const money = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `Rs ${amount.toLocaleString("en-PK")}`;
};

const rentRange = (hostel) => {
  const min = money(hostel.rentMin);
  const max = money(hostel.rentMax);
  if (!min) return "Rent on request";
  if (!max || hostel.rentMin === hostel.rentMax) return min;
  return `${min} – ${max}`;
};

const GENDER_LABEL = {
  boys: "Boys Hostel",
  girls: "Girls Hostel",
  both: "Boys & Girls Hostel",
};

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    orange: "bg-orange-500 text-white",
    emerald: "bg-emerald-600 text-white",
    soft: "bg-orange-50 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        {Icon && <Icon size={18} className="text-[#ff6a00]" />}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Gallery({ photos, name }) {
  const [active, setActive] = useState(0);
  const current = photos[active];

  if (!photos.length) {
    return (
      <div className="grid h-64 w-full place-items-center rounded-2xl bg-gradient-to-br from-orange-50 via-slate-50 to-slate-100 text-slate-400 sm:h-80">
        <div className="flex flex-col items-center gap-2">
          <Building2 size={44} />
          <span className="text-sm font-medium">No photos uploaded yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-100 sm:h-80">
        <img
          src={fileUrl(current.url)}
          alt={current.caption || name}
          className="h-full w-full object-cover"
        />
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {photos.length}
          </span>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id || index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                index === active
                  ? "border-orange-500"
                  : "border-transparent hover:border-orange-200"
              }`}
            >
              <img
                src={fileUrl(photo.url)}
                alt={photo.caption || ""}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuList({ menu }) {
  if (menu == null) return null;
  if (typeof menu === "string") {
    return <p className="whitespace-pre-line text-sm text-slate-600">{menu}</p>;
  }
  const entries = Object.entries(menu).filter(([, value]) => value);
  if (!entries.length) return null;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {entries.map(([day, value]) => (
        <li key={day} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
          <span className="w-24 shrink-0 font-semibold capitalize text-slate-700">
            {day}
          </span>
          <span className="text-slate-600">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-[#ff6a00]" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:border-orange-200">
      {content}
    </a>
  ) : (
    content
  );
}

export default function HostelDetailPage() {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/api/hostels/public/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Could not load this hostel.");
        }
        return data.hostel;
      })
      .then((row) => {
        if (!cancelled) setHostel(row);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load this hostel.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-5 py-10">
        <div className="h-64 rounded-2xl bg-slate-100 sm:h-80" />
        <div className="mt-6 h-8 w-1/2 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-72 rounded-2xl bg-slate-100" />
          <div className="h-72 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Building2 className="mx-auto text-slate-300" size={44} />
        <h1 className="mt-4 text-xl font-bold text-slate-800">
          Hostel not available
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error || "This listing is not public right now."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6a00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e65f00]"
        >
          <ArrowLeft size={16} /> Back to hostels
        </Link>
      </div>
    );
  }

  const genderLabel = GENDER_LABEL[String(hostel.gender || "").toLowerCase()];
  const hasCoords =
    Number.isFinite(Number(hostel.lat)) && Number.isFinite(Number(hostel.lng));
  const hasCampusCoords =
    Number.isFinite(Number(hostel.campusLat)) && Number.isFinite(Number(hostel.campusLng));
  const mapsLink = hasCoords
    ? `https://www.google.com/maps?q=${hostel.lat},${hostel.lng}`
    : null;
  const directionsLink = hasCampusCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${hostel.campusLat},${hostel.campusLng}${
        hasCoords ? `&origin=${hostel.lat},${hostel.lng}` : ""
      }&travelmode=driving`
    : mapsLink;
  const menuEntries =
    hostel.mess?.menu && typeof hostel.mess.menu === "object"
      ? Object.entries(hostel.mess.menu).filter(([, value]) => value)
      : [];
  const hasMess =
    hostel.mess &&
    (hostel.mess.available != null ||
      hostel.mess.charges ||
      hostel.mess.menuPhoto ||
      menuEntries.length);
  const hasFees =
    hostel.securityFee ||
    hostel.securityTypes?.length ||
    hostel.otherFees?.length;
  const mainContact = hostel.inquiryNumber || hostel.contactPhone || hostel.ownerContact;

  return (
    <div className="bg-slate-50 pb-16">
      <div className="mx-auto max-w-6xl px-5 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#ff6a00]"
        >
          <ArrowLeft size={16} /> Back to hostels
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Gallery photos={hostel.photos || []} name={hostel.name} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={hostel.isCampus ? "emerald" : "orange"}>
                  <Building2 size={12} /> {hostel.typeLabel}
                </Badge>
                {genderLabel && <Badge tone="slate">{genderLabel}</Badge>}
                {hostel.nearbyDistance && (
                  <Badge tone="soft">
                    <Navigation size={12} /> {hostel.nearbyDistance}
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {hostel.name}
              </h1>
              <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#ff6a00]" />
                <span>
                  {hostel.address || hostel.campusName || "Address not provided"}
                  {hostel.campusName && (
                    <span className="block text-xs text-slate-400">
                      <GraduationCap size={11} className="mr-1 inline" />
                      {hostel.campusName}
                      {hostel.campusCity ? `, ${hostel.campusCity}` : ""}
                    </span>
                  )}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Monthly rent",
                  value: rentRange(hostel),
                  icon: Wallet,
                },
                {
                  label: "Total rooms",
                  value: hostel.roomsCount || "—",
                  icon: BedDouble,
                },
                {
                  label: "Total seats",
                  value: hostel.totalSeats ?? "—",
                  icon: Users,
                },
                {
                  label: "Beds free",
                  value: hostel.seatsAvailable ?? "—",
                  icon: CheckCircle2,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <Icon size={16} className="text-[#ff6a00]" />
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {hostel.description && (
              <Section icon={Building2} title="About this hostel">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {hostel.description}
                </p>
              </Section>
            )}

            {hostel.rooms?.length > 0 && (
              <Section icon={BedDouble} title="Rooms & monthly rent">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Room type</th>
                        <th className="px-4 py-3">Rooms</th>
                        <th className="px-4 py-3">Beds / room</th>
                        <th className="px-4 py-3">Beds free</th>
                        <th className="px-4 py-3">Monthly rent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hostel.rooms.map((room, index) => (
                        <tr key={room.id || index}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {room.type || room.room_type || "Room"}
                            </p>
                            {room.description && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {room.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {room.totalRooms ?? room.rooms ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {room.bedsPerRoom ?? room.beds ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {room.availableBeds ?? room.available ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#ff6a00]">
                            {money(room.monthlyRent ?? room.rent) || "On request"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {hostel.amenities?.length > 0 && (
              <Section icon={CheckCircle2} title="Amenities & facilities">
                <div className="flex flex-wrap gap-2">
                  {hostel.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                    >
                      <CheckCircle2 size={12} /> {amenity}
                    </span>
                  ))}
                </div>
                {hostel.facilities?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hostel.facilities.map((facility, index) => (
                      <span
                        key={`${facility.name}-${index}`}
                        className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                      >
                        {facility.name}
                        {facility.amount ? ` · Rs ${Number(facility.amount).toLocaleString("en-PK")}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {hasMess && (
              <Section icon={Utensils} title="Mess & food">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Mess available
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {hostel.mess.available === true
                        ? "Yes"
                        : hostel.mess.available === false
                          ? "No"
                          : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Mess charges
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {money(hostel.mess.charges) || hostel.mess.charges || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Menu photo
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {hostel.mess.menuPhoto ? "Available" : "—"}
                    </p>
                  </div>
                </div>
                {menuEntries.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Weekly menu
                    </p>
                    <MenuList menu={Object.fromEntries(menuEntries)} />
                  </div>
                )}
                {hostel.mess.menuPhoto && (
                  <a
                    href={fileUrl(hostel.mess.menuPhoto)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff6a00] hover:underline"
                  >
                    <ExternalLink size={14} /> View mess menu photo
                  </a>
                )}
              </Section>
            )}

            {hasFees && (
              <Section icon={ShieldCheck} title="Security & other charges">
                <div className="flex flex-wrap gap-3">
                  {hostel.securityFee && (
                    <div className="rounded-xl border border-slate-100 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Security deposit
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {money(hostel.securityFee) || hostel.securityFee}
                      </p>
                    </div>
                  )}
                  {hostel.securityTypes?.map((type) => (
                    <div
                      key={type}
                      className="rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Accepted as
                      </p>
                      <p className="mt-1 text-sm font-bold capitalize text-slate-800">
                        {type}
                      </p>
                    </div>
                  ))}
                  {hostel.otherFees?.map((fee, index) => (
                    <div
                      key={`${fee.label}-${index}`}
                      className="rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold capitalize text-slate-400">
                        {fee.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {money(fee.amount) || fee.amount || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {hostel.rules?.length > 0 && (
              <Section icon={ShieldCheck} title="Hostel rules & policies">
                <ul className="space-y-2">
                  {hostel.rules.map((rule, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-[#ff6a00]"
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section icon={MapPin} title="Location">
              <div className="relative overflow-hidden rounded-xl border border-slate-100">
                <GoogleMapPreview
                  lat={hasCoords ? hostel.lat : ""}
                  lng={hasCoords ? hostel.lng : ""}
                  zoom={hasCoords ? 16 : 5}
                  className="h-64 w-full"
                  title={`${hostel.name} location`}
                />
                {directionsLink && (
                  <a
                    href={directionsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-10 flex items-end justify-end bg-transparent p-3"
                    aria-label={`Open directions from ${hostel.name} to ${hostel.campusName || "campus"}`}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur-sm">
                      <Navigation size={12} className="text-[#ff6a00]" />
                      {hostel.campusName ? `Directions to ${hostel.campusName}` : "Get directions"}
                    </span>
                  </a>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  {hostel.floors && (
                    <p className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#ff6a00]" />
                      {hostel.floors} {Number(hostel.floors) === 1 ? "floor" : "floors"}
                    </p>
                  )}
                  {hostel.checkIn && (
                    <p className="mt-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#ff6a00]" /> Check-in: {hostel.checkIn}
                    </p>
                  )}
                  {hostel.checkOut && (
                    <p className="mt-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#ff6a00]" /> Check-out: {hostel.checkOut}
                    </p>
                  )}
                </div>
                {directionsLink && (
                  <a
                    href={directionsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#ff6a00] px-4 py-2 text-sm font-semibold text-[#ff6a00] hover:bg-[#ff6a00] hover:text-white"
                  >
                    <Navigation size={15} />
                    {hasCampusCoords ? "Directions to campus" : "Open in Google Maps"}
                  </a>
                )}
              </div>
            </Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Monthly rent
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#ff6a00]">
                {rentRange(hostel)}
                {money(hostel.rentMin) && (
                  <span className="text-xs font-normal text-slate-400">/month</span>
                )}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <span className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                  {hostel.roomsCount || 0} rooms
                </span>
                <span className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                  {hostel.seatsAvailable ?? 0} beds free
                </span>
              </div>

              <div className="mt-5 space-y-2">
                {mainContact ? (
                  <a
                    href={`tel:${mainContact}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6a00] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e65f00]"
                  >
                    <Phone size={16} /> Call to book a visit
                  </a>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-800">
                    Contact number not published yet.
                  </p>
                )}
                {hostel.contactEmail && (
                  <a
                    href={`mailto:${hostel.contactEmail}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Mail size={16} /> Email the hostel
                  </a>
                )}
              </div>

              {mainContact && (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Phone size={12} /> {mainContact}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <User size={16} className="text-[#ff6a00]" /> Contact details
              </h2>
              <div className="mt-3 space-y-2">
                <InfoRow icon={User} label="Owner" value={hostel.ownerName} />
                <InfoRow
                  icon={Phone}
                  label="Owner contact"
                  value={hostel.ownerContact}
                  href={hostel.ownerContact ? `tel:${hostel.ownerContact}` : undefined}
                />
                <InfoRow icon={User} label="Warden" value={hostel.wardenName} />
                <InfoRow
                  icon={Phone}
                  label="Warden contact"
                  value={hostel.wardenContact}
                  href={hostel.wardenContact ? `tel:${hostel.wardenContact}` : undefined}
                />
                <InfoRow icon={Mail} label="Email" value={hostel.contactEmail} />
              </div>
              {!hostel.ownerName &&
                !hostel.ownerContact &&
                !hostel.wardenName &&
                !hostel.wardenContact &&
                !hostel.contactEmail && (
                  <p className="mt-2 text-sm text-slate-400">
                    The owner has not published contact details.
                  </p>
                )}
            </div>

            <div className="rounded-2xl bg-[#0f1729] p-6 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={16} className="text-[#ff6a00]" />
                Verified on UniFinder
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                This hostel is approved by UniFinder. Visit the hostel in person and
                confirm the rent and security terms before paying anything.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
