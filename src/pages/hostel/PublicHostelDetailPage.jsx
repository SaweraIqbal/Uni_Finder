import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  MapPin,
  Phone,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { API, fileUrl } from "../../api/client";

const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `Rs ${amount.toLocaleString("en-PK")}`
    : "On request";
};

const GENDER_LABELS = {
  boys: "Boys hostel",
  girls: "Girls hostel",
  both: "Boys & girls hostel",
};

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Icon size={18} className="text-orange-500" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

export default function PublicHostelDetailPage() {
  const { id } = useParams();
  const [hostel, setHostel] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedId, setLoadedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/hostels/public/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not load this hostel.");
        return data.hostel;
      })
      .then((data) => {
        setHostel(data || null);
        setActivePhoto(0);
        setError("");
        setLoadedId(id);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Could not load this hostel.");
          setLoadedId(id);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  if (loading || loadedId !== id) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-5 py-10">
        <div className="h-72 rounded-2xl bg-slate-100" />
        <div className="mt-6 h-8 w-1/2 rounded bg-slate-100" />
        <div className="mt-8 h-64 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Building2 className="mx-auto text-slate-300" size={44} />
        <h1 className="mt-4 text-xl font-bold text-slate-800">Hostel not available</h1>
        <p role="alert" className="mt-2 text-sm text-slate-500">{error || "This listing is not public."}</p>
        <Link to="/homepage" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          <ArrowLeft size={16} /> Back to student dashboard
        </Link>
      </div>
    );
  }

  const photos = Array.isArray(hostel.photos) ? hostel.photos : [];
  const currentPhoto = photos[activePhoto];
  const amenities = [...new Set([...(hostel.amenities || []), ...(hostel.inRoomItems || [])])];
  const mapUrl = Number.isFinite(Number(hostel.lat)) && Number.isFinite(Number(hostel.lng))
    ? `https://www.google.com/maps?q=${hostel.lat},${hostel.lng}`
    : null;
  const phone = hostel.inquiryNumber || hostel.contactPhone || hostel.ownerContact;
  const rent = hostel.rentMin
    ? `${money(hostel.rentMin)}${hostel.rentMax && hostel.rentMax !== hostel.rentMin ? ` – ${money(hostel.rentMax)}` : ""} / month`
    : "Rent on request";

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Link to="/homepage" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600">
          <ArrowLeft size={16} /> Back to student dashboard
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="relative grid h-64 place-items-center overflow-hidden rounded-2xl bg-slate-200 sm:h-80">
              {currentPhoto ? (
                <img
                  src={fileUrl(currentPhoto.url)}
                  alt={currentPhoto.caption || hostel.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 size={48} className="text-slate-400" />
              )}
              {photos.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-semibold text-white">
                  {activePhoto + 1} / {photos.length}
                </span>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id || index}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    aria-label={`Show hostel photo ${index + 1}`}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${index === activePhoto ? "border-orange-500" : "border-transparent"}`}
                  >
                    <img src={fileUrl(photo.url)} alt={photo.caption || ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{hostel.typeLabel}</span>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{hostel.name}</h1>
            <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-orange-500" />
              <span>{hostel.address || hostel.campusName || "Address not provided"}{hostel.campusName && <span className="block text-xs text-slate-400">{hostel.campusName}{hostel.campusCity ? `, ${hostel.campusCity}` : ""}</span>}</span>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Monthly rent", value: rent, Icon: Wallet },
                { label: "Rooms", value: hostel.roomsCount ?? "—", Icon: BedDouble },
                { label: "Total beds", value: hostel.totalSeats ?? "—", Icon: Users },
                { label: "Beds available", value: hostel.seatsAvailable ?? "—", Icon: CheckCircle2 },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <Icon size={16} className="text-orange-500" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {GENDER_LABELS[String(hostel.gender || "").toLowerCase()] && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{GENDER_LABELS[String(hostel.gender).toLowerCase()]}</span>
              )}
              {hostel.nearbyDistance && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{hostel.nearbyDistance} from campus</span>}
            </div>
            {phone && (
              <a href={`tel:${phone}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600">
                <Phone size={16} /> Contact hostel
              </a>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <MapPin size={16} /> View on map
              </a>
            )}
          </aside>
        </section>

        {hostel.description && (
          <Section title="About this hostel" icon={Building2}>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{hostel.description}</p>
          </Section>
        )}

        {hostel.rooms?.length > 0 && (
          <Section title="Rooms and monthly rent" icon={BedDouble}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>{["Room type", "Rooms", "Beds / room", "Beds free", "Monthly rent"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hostel.rooms.map((room, index) => (
                    <tr key={room.id || index}>
                      <td className="px-3 py-3 font-semibold text-slate-800">{room.type || room.room_type || "Room"}{room.description && <span className="block text-xs font-normal text-slate-500">{room.description}</span>}</td>
                      <td className="px-3 py-3">{room.totalRooms ?? room.total_rooms ?? room.rooms ?? "—"}</td>
                      <td className="px-3 py-3">{room.bedsPerRoom ?? room.beds_per_room ?? room.beds ?? "—"}</td>
                      <td className="px-3 py-3">{room.availableBeds ?? room.available_beds ?? room.available ?? "—"}</td>
                      <td className="px-3 py-3 font-semibold text-orange-600">{money(room.monthlyRent ?? room.monthly_rent ?? room.rent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {amenities.length > 0 && (
          <Section title="Amenities and facilities" icon={CheckCircle2}>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => <span key={amenity} className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">{amenity}</span>)}
            </div>
            {hostel.facilities?.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {hostel.facilities.map((facility, index) => (
                  <p key={`${facility.name}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {facility.name}{facility.amount ? ` · ${money(facility.amount)}` : ""}
                  </p>
                ))}
              </div>
            )}
          </Section>
        )}

        {hostel.mess && (
          <Section title="Mess and food" icon={Utensils}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mess available" value={hostel.mess.available === true ? "Yes" : hostel.mess.available === false ? "No" : null} />
              <Field label="Charges" value={hostel.mess.charges ? money(hostel.mess.charges) : null} />
            </div>
            {hostel.mess.menu && (
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Menu</p>
                {typeof hostel.mess.menu === "string"
                  ? <p className="whitespace-pre-line text-sm text-slate-600">{hostel.mess.menu}</p>
                  : <div className="space-y-2 text-sm">{Object.entries(hostel.mess.menu).filter(([, value]) => value).map(([day, value]) => <p key={day}><strong className="capitalize">{day}: </strong>{Array.isArray(value) ? value.join(", ") : String(value)}</p>)}</div>}
              </div>
            )}
            {hostel.mess.menuPhoto && (
              <img src={fileUrl(hostel.mess.menuPhoto)} alt={`${hostel.name} mess menu`} className="mt-3 max-h-80 rounded-xl object-contain" />
            )}
          </Section>
        )}

        {(hostel.securityFee || hostel.securityTypes?.length || hostel.otherFees?.length) && (
          <Section title="Fees" icon={Wallet}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Security fee" value={hostel.securityFee ? money(hostel.securityFee) : null} />
              <Field label="Security type" value={hostel.securityTypes?.join(", ")} />
              {hostel.otherFees?.map((fee, index) => <Field key={`${fee.label}-${index}`} label={fee.label} value={fee.amount ? money(fee.amount) : null} />)}
            </div>
          </Section>
        )}

        {hostel.rules?.length > 0 && (
          <Section title="Hostel rules" icon={CheckCircle2}>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              {hostel.rules.map((rule, index) => <li key={`${rule}-${index}`}>{rule}</li>)}
            </ul>
          </Section>
        )}

        <Section title="Contact and management" icon={Phone}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Owner" value={hostel.ownerName} />
            <Field label="Owner contact" value={hostel.ownerContact} />
            <Field label="Warden" value={hostel.wardenName} />
            <Field label="Warden contact" value={hostel.wardenContact} />
            <Field label="Hostel contact" value={hostel.contactPhone} />
            <Field label="Contact email" value={hostel.contactEmail} />
            <Field label="Check-in time" value={hostel.checkIn} />
            <Field label="Check-out time" value={hostel.checkOut} />
            <Field label="Floors" value={hostel.floors} />
          </div>
        </Section>
      </div>
    </div>
  );
}
