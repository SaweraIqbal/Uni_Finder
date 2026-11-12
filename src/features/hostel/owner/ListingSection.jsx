
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ListChecks,
  ChevronDown,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

import {
  INITIAL_LISTING,
  SecurityFees,
  ServiceSection,
  MessSection,
  AmenitiesSection,
  FacilitiesSection,
  OtherChargesSection,
  PoliciesSection,
  InquirySection,
} from "./ListingSections";

const API = "http://localhost:5000";

const SECTIONS = [
  { id: "A", title: "Room Inventory" },
  { id: "B", title: "Security & Fees" },
  { id: "C", title: "Food Delivery / Guard Service" },
  { id: "D", title: "Mess / Food" },
  { id: "E", title: "In-Room Amenities" },
  { id: "F", title: "Facilities & Utility Charges" },
  { id: "G", title: "Other Charges" },
  { id: "H", title: "Policies & Rules" },
  { id: "I", title: "Inquiry" },
  { id: "J", title: "Photo & Visual Evidence" },
];

const TYPES = ["1-Seater", "2-Seater", "3-Seater", "4-Seater"];
const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-orange-200";
const primary =
  "rounded-xl bg-[#ff6a00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65f00] disabled:opacity-50";

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-US")}`;

const capacity = (type) => {
  const n = parseInt(type, 10);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

const emptyListing = () =>
  typeof structuredClone === "function"
    ? structuredClone(INITIAL_LISTING)
    : JSON.parse(JSON.stringify(INITIAL_LISTING));

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

async function request(path, options = {}) {
  const token = sessionStorage.getItem("token");

  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }

  const isForm = options.body instanceof FormData;

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(!isForm && options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function AccordionCard({ id, title, open, onToggle, children }) {
  return (
    <section className={card}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff6a00] font-semibold text-white">
          {id}
        </span>
        <span className="flex-1 font-semibold">{title}</span>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-6">
          {children}
        </div>
      )}
    </section>
  );
}

function RoomDialog({ room, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    room_type: room?.room_type || "1-Seater",
    total_rooms: room?.total_rooms ?? "",
    beds_per_room: room?.beds_per_room ?? 1,
    available_beds: room?.available_beds ?? "",
    monthly_rent: room?.monthly_rent ?? "",
    description: room?.description || "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "room_type"
        ? { beds_per_room: capacity(value) }
        : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      room_type: form.room_type.trim(),
      total_rooms: Number(form.total_rooms),
      beds_per_room: Number(form.beds_per_room),
      available_beds: Number(form.available_beds),
      monthly_rent: Number(form.monthly_rent),
      description: form.description,
    };

    if (!payload.room_type) {
      return setError("Room type required.");
    }

    if (
      !Number.isInteger(payload.total_rooms) ||
      payload.total_rooms < 1 ||
      !Number.isInteger(payload.beds_per_room) ||
      payload.beds_per_room < 1
    ) {
      return setError("Enter valid room and bed counts.");
    }

    const maxBeds = payload.total_rooms * payload.beds_per_room;

    if (
      form.available_beds === "" ||
      !Number.isInteger(payload.available_beds) ||
      payload.available_beds < 0 ||
      payload.available_beds > maxBeds
    ) {
      return setError(`Available beds must be between 0 and ${maxBeds}.`);
    }

    if (
      form.monthly_rent === "" ||
      !Number.isFinite(payload.monthly_rent) ||
      payload.monthly_rent < 0
    ) {
      return setError("Enter valid monthly rent.");
    }

    setError("");

    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {room ? "Edit Room" : "Add Room"}
          </h3>
          <button type="button" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Room Type
            <select
              className={input}
              value={form.room_type}
              onChange={(e) => set("room_type", e.target.value)}
            >
              {!TYPES.includes(form.room_type) && (
                <option value={form.room_type}>{form.room_type}</option>
              )}
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          {[
            ["total_rooms", "Total Rooms"],
            ["beds_per_room", "Beds Per Room"],
            ["available_beds", "Available Beds"],
            ["monthly_rent", "Monthly Rent (Rs.)"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              {label}
              <input
                type="number"
                min={key === "beds_per_room" || key === "total_rooms" ? 1 : 0}
                className={input}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
        </div>

        <label className="mt-4 block text-sm">
          Description
          <textarea
            rows={3}
            className={input}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border px-5 py-3 text-sm"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primary}>
            {saving ? "Saving..." : room ? "Update Room" : "Add Room"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoomInventory({ rooms, loading, onAdd, onEdit, onDelete, busy }) {
  const totalRooms = rooms.reduce(
    (sum, room) => sum + Number(room.total_rooms || 0),
    0
  );

  const totalSeats = rooms.reduce(
    (sum, room) =>
      sum +
      Number(room.total_rooms || 0) *
        Number(room.beds_per_room || 0),
    0
  );

  const freeSeats = rooms.reduce(
    (sum, room) => sum + Number(room.available_beds || 0),
    0
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">
            {totalRooms} rooms · {totalSeats} seats
          </p>
          <p className="text-sm text-slate-500">
            {freeSeats} available beds
          </p>
        </div>
        <button className={primary} onClick={onAdd} disabled={busy}>
          Add Room
        </button>
      </div>

      {loading ? (
        <p className="mt-5 text-slate-500">Loading rooms...</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "Room Type",
                  "Monthly Rent",
                  "Rooms",
                  "Beds / Room",
                  "Free Beds",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-4">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-4 py-4 font-medium">
                    {room.room_type}
                  </td>
                  <td className="px-4 py-4">
                    {money(room.monthly_rent)}
                  </td>
                  <td className="px-4 py-4">{room.total_rooms}</td>
                  <td className="px-4 py-4">{room.beds_per_room}</td>
                  <td className="px-4 py-4 font-semibold text-emerald-600">
                    {room.available_beds}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => onEdit(room)}
                        disabled={busy}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => onDelete(room)}
                        disabled={busy}
                        className="text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!rooms.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No rooms added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function PhotoManager({ photos, onUpload, onDelete, busy }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return toast.error("Select an image first.");

    try {
      await onUpload(file, caption);
      setFile(null);
      setCaption("");
      event.target.reset();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={input}
        />

        <input
          className={input}
          placeholder="Photo caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <button type="submit" className={primary} disabled={busy}>
          <Upload size={16} className="mr-2 inline" />
          {busy ? "Uploading..." : "Upload Photo"}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-xl border">
            <img
              src={`${API}${photo.image_url}`}
              alt={photo.caption || "Hostel photo"}
              className="h-40 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <p className="truncate text-sm">
                {photo.caption || "Hostel photo"}
              </p>
              <button
                type="button"
                onClick={() => onDelete(photo)}
                disabled={busy}
                className="text-red-600"
                aria-label="Delete photo"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!photos.length && (
        <p className="text-sm text-slate-500">
          No hostel photos uploaded yet.
        </p>
      )}
    </div>
  );
}

export default function ListingSection({ hostelId }) {
  const [rooms, setRooms] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [listing, setListing] = useState(emptyListing);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState("A");
  const [roomDialog, setRoomDialog] = useState(null);
  const [loadError, setLoadError] = useState("");

  const base = `/api/hostels/${hostelId}`;

  const loadData = useCallback(async () => {
    if (!hostelId) return;

    setLoading(true);
    setLoadError("");

    try {
      const [roomsData, listingData, photosData] = await Promise.all([
        request(`${base}/rooms`),
        request(`${base}/listing`),
        request(`${base}/photos`),
      ]);

      setRooms(roomsData.rooms || []);
      setPhotos(photosData.photos || []);

      const saved = listingData.listing;

      if (saved) {
        const fees = parseJSON(saved.additional_fees, {});
        const amenities = parseJSON(saved.amenities, {});
        const mess = parseJSON(saved.mess_details, {});

        setListing({
          ...emptyListing(),
          security: fees.security ?? INITIAL_LISTING.security,
          service: fees.service ?? INITIAL_LISTING.service,
          mess: mess.mess ?? INITIAL_LISTING.mess,
          amenities:
            amenities.inRoom ?? INITIAL_LISTING.amenities,
          facilities:
            amenities.facilities ?? INITIAL_LISTING.facilities,
          otherCharges:
            fees.otherCharges ?? INITIAL_LISTING.otherCharges,
          policies: parseJSON(
            saved.hostel_rules,
            INITIAL_LISTING.policies
          ),
          inquiry:
            fees.inquiry ?? INITIAL_LISTING.inquiry,
          photos: INITIAL_LISTING.photos,
        });
      } else {
        setListing(emptyListing());
      }
    } catch (err) {
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [base, hostelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const update = (key) => (value) => {
    setListing((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveRoom = async (payload) => {
    setBusy(true);

    try {
      const editing = roomDialog?.room;

      await request(
        editing
          ? `${base}/rooms/${editing.id}`
          : `${base}/rooms`,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const result = await request(`${base}/rooms`);
      setRooms(result.rooms || []);
      setRoomDialog(null);

      toast.success(
        editing ? "Room updated successfully" : "Room added successfully"
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteRoom = async (room) => {
    if (!window.confirm(`Delete ${room.room_type}?`)) return;

    setBusy(true);

    try {
      await request(`${base}/rooms/${room.id}`, {
        method: "DELETE",
      });

      setRooms((previous) =>
        previous.filter((item) => item.id !== room.id)
      );

      toast.success("Room deleted successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveListing = async () => {
    setSaving(true);

    try {
      const payload = {
        additional_fees: {
          security: listing.security,
          service: listing.service,
          otherCharges: listing.otherCharges,
          inquiry: listing.inquiry,
        },
  mess_details: {
  mess: listing.mess,
},
        amenities: {
          inRoom: listing.amenities,
          facilities: listing.facilities,
        },
        hostel_rules: JSON.stringify(listing.policies),
      };

      await request(`${base}/listing`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("Listing saved successfully in database");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };



const uploadPhoto = async (file, caption = "") => {
  if (!file) return null;

  setBusy(true);

  try {
    const formData = new FormData();

    formData.append("photo", file);
    formData.append("caption", caption || "Hostel Photo");

    const response = await fetch(
      `http://localhost:5000/api/hostels/${hostelId}/photos`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Upload failed");
    }

    toast.success("Photo uploaded successfully");

    return result.image_url;

  } catch (error) {
    console.error("Photo upload error:", error);
    toast.error(error.message || "Photo upload failed");
    return null;

  } finally {
    setBusy(false);
  }
};


  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;

    setBusy(true);

    try {
      await request(`${base}/photos/${photo.id}`, {
        method: "DELETE",
      });

      setPhotos((previous) =>
        previous.filter((item) => item.id !== photo.id)
      );

      toast.success("Photo deleted successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderBody = (id) => {
    switch (id) {
      case "A":
        return (
          <RoomInventory
            rooms={rooms}
            loading={loading}
            busy={busy}
            onAdd={() => setRoomDialog({ room: null })}
            onEdit={(room) => setRoomDialog({ room })}
            onDelete={deleteRoom}
          />
        );

      case "B":
        return (
          <SecurityFees
            value={listing.security}
            onChange={update("security")}
          />
        );

      case "C":
        return (
          <ServiceSection
            value={listing.service}
            onChange={update("service")}
          />
        );

      case "D":
        return (
       <MessSection
  value={listing.mess}
  onChange={update("mess")}
  onUploadPhoto={uploadPhoto}
/>
        );

      case "E":
        return (
          <AmenitiesSection
            value={listing.amenities}
            onChange={update("amenities")}
          />
        );

      case "F":
        return (
          <FacilitiesSection
            value={listing.facilities}
            onChange={update("facilities")}
          />
        );

      case "G":
        return (
          <OtherChargesSection
            value={listing.otherCharges}
            onChange={update("otherCharges")}
          />
        );

      case "H":
        return (
          <PoliciesSection
            value={listing.policies}
            onChange={update("policies")}
          />
        );

      case "I":
        return (
          <InquirySection
            value={listing.inquiry}
            onChange={update("inquiry")}
          />
        );

      case "J":
        return (
          <PhotoManager
            photos={photos}
            busy={busy}
            onUpload={uploadPhoto}
            onDelete={deletePhoto}
          />
        );

      default:
        return null;
    }
  };

  if (!hostelId) {
    return (
      <p className="rounded-xl bg-amber-50 p-4">
        Please select a hostel first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-[#0f1729] p-6 text-white">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff6a00]">
          <ListChecks size={20} />
        </div>

        <div>
          <h2 className="font-semibold">
            Manage every part of your listing
          </h2>
          <p className="text-sm text-slate-400">
            Manage rooms, listing details and photos.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
          <button
            type="button"
            onClick={loadData}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className={`${card} p-6 text-slate-500`}>
          Loading listing data...
        </div>
      ) : (
        <>
          {SECTIONS.map((section) => (
            <AccordionCard
              key={section.id}
              id={section.id}
              title={section.title}
              open={openId === section.id}
              onToggle={() =>
                setOpenId(
                  openId === section.id ? null : section.id
                )
              }
            >
              {renderBody(section.id)}
            </AccordionCard>
          ))}

          <div className={`${card} sticky bottom-4 z-10 flex justify-end p-4 shadow-lg`}>
            <button
              type="button"
              onClick={saveListing}
              disabled={saving || busy}
              className={primary}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}

      {roomDialog !== null && (
        <RoomDialog
          room={roomDialog.room}
          saving={busy}
          onClose={() => setRoomDialog(null)}
          onSave={saveRoom}
        />
      )}
    </div>
  );
}
