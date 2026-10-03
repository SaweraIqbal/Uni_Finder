import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ListChecks, ChevronDown, ChevronRight, X } from 'lucide-react';
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
  PhotosSection,
} from './ListingSections';

// Temporary data - replace with API response later
const DEFAULT_ROOMS = [
  { id: 1, type: '1-Seater', washroom: 'Attached', price: 22000, rooms: 4, free: 2, resident: 'Student' },
  { id: 2, type: '2-Seater', washroom: 'Attached', price: 16500, rooms: 8, free: 7, resident: 'Mixed' },
  { id: 3, type: '3-Seater', washroom: 'Without', price: 12000, rooms: 7, free: 4, resident: 'Student' },
  { id: 4, type: '4-Seater', washroom: 'Without', price: 9500, rooms: 5, free: 9, resident: 'Job-Holder' },
];

const SECTIONS = [
  { id: 'A', title: 'Room Inventory' },
  { id: 'B', title: 'Security & Fees' },
  { id: 'C', title: 'Food Delivery / Guard Service' },
  { id: 'D', title: 'Mess / Food' },
  { id: 'E', title: 'In-Room Amenities' },
  { id: 'F', title: 'Facilities & Utility Charges' },
  { id: 'G', title: 'Other Charges' },
  { id: 'H', title: 'Policies & Rules' },
  { id: 'I', title: 'Inquiry' },
  { id: 'J', title: 'Photo & Visual Evidence' },
];

const TYPES = ['1-Seater', '2-Seater', '3-Seater', '4-Seater'];
const WASHROOMS = ['Attached', 'Without'];
const RESIDENTS = ['Student', 'Mixed', 'Job-Holder'];

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-orange-200';

const capacity = (type) => parseInt(type, 10) || 1;
const money = (n) => `Rs. ${Number(n).toLocaleString('en-US')}`;

function AccordionCard({ id, title, open, onToggle, children }) {
  return (
    <section className={card}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff6a00] font-semibold text-white">
          {id}
        </span>
        <span className="flex-1 font-semibold">{title}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open && (
        <div id={`panel-${id}`} className="border-t border-slate-100 p-6">
          {children}
        </div>
      )}
    </section>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      <span className="mb-2 block">{label}</span>
      <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0 }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      <span className="mb-2 block">{label}</span>
      <input type="number" min={min} className={input} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function AddRoomDialog({ onClose, onAdd }) {
  const [f, setF] = useState({ type: '1-Seater', washroom: 'Attached', price: '', rooms: '', free: '', resident: 'Student' });
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    const price = Number(f.price);
    const rooms = Number(f.rooms);
    const free = Number(f.free);
    if (!(price > 0)) return setError('Enter a price per seat.');
    if (!(rooms >= 1)) return setError('Enter at least 1 room.');
    if (!(free >= 0) || f.free === '') return setError('Enter the free seats.');
    if (free > rooms * capacity(f.type))
      return setError(`Free seats cannot exceed ${rooms * capacity(f.type)} (rooms × seats per room).`);
    onAdd({ id: Date.now(), type: f.type, washroom: f.washroom, price, rooms, free, resident: f.resident });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Add room"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add room</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField label="Type" value={f.type} options={TYPES} onChange={set('type')} />
          <SelectField label="Washroom" value={f.washroom} options={WASHROOMS} onChange={set('washroom')} />
          <NumberField label="Price / seat (Rs.)" value={f.price} onChange={set('price')} min={1} />
          <NumberField label="Rooms" value={f.rooms} onChange={set('rooms')} min={1} />
          <NumberField label="Available / free seats" value={f.free} onChange={set('free')} />
          <SelectField label="Resident" value={f.resident} options={RESIDENTS} onChange={set('resident')} />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="rounded-xl bg-[#ff6a00] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e65f00]">
            Add room
          </button>
        </div>
      </form>
    </div>
  );
}

function RoomInventory({ rooms, onAddClick }) {
  const totalRooms = rooms.reduce((s, r) => s + r.rooms, 0);
  const totalSeats = rooms.reduce((s, r) => s + r.rooms * capacity(r.type), 0);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">
            {totalRooms} rooms · {totalSeats} seats
          </p>
          <p className="text-sm text-slate-500">Pricing and free seats are tracked per configuration.</p>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded-xl bg-[#ff6a00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65f00]"
        >
          Add room
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Type', 'Washroom', 'Price / seat', 'Rooms', 'Available / free seats', 'Resident'].map((h) => (
                <th key={h} scope="col" className="px-5 py-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-4 font-medium">{r.type}</td>
                <td className="px-5 py-4">{r.washroom}</td>
                <td className="px-5 py-4">{money(r.price)}</td>
                <td className="px-5 py-4">{r.rooms}</td>
                <td className="px-5 py-4 font-semibold text-emerald-600">{r.free}</td>
                <td className="px-5 py-4">{r.resident}</td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  No rooms added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ListingSection({ initialRooms = DEFAULT_ROOMS }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [openId, setOpenId] = useState('A');
  const [showAdd, setShowAdd] = useState(false);
  const [listing, setListing] = useState(INITIAL_LISTING);
  const update = (key) => (val) => setListing((l) => ({ ...l, [key]: val }));

  const renderBody = (id) => {
    switch (id) {
      case 'A':
        return <RoomInventory rooms={rooms} onAddClick={() => setShowAdd(true)} />;
      case 'B':
        return <SecurityFees value={listing.security} onChange={update('security')} />;
      case 'C':
        return <ServiceSection value={listing.service} onChange={update('service')} />;
      case 'D':
        return <MessSection value={listing.mess} onChange={update('mess')} />;
      case 'E':
        return <AmenitiesSection value={listing.amenities} onChange={update('amenities')} />;
      case 'F':
        return <FacilitiesSection value={listing.facilities} onChange={update('facilities')} />;
      case 'G':
        return <OtherChargesSection value={listing.otherCharges} onChange={update('otherCharges')} />;
      case 'H':
        return <PoliciesSection value={listing.policies} onChange={update('policies')} />;
      case 'I':
        return <InquirySection value={listing.inquiry} onChange={update('inquiry')} />;
      default:
        return <PhotosSection value={listing.photos} onChange={update('photos')} />;
    }
  };

  const handleSave = () => {
    // TODO: send rooms and the other sections to the API
    toast.success('Changes saved as draft.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl bg-[#0f1729] p-6 text-white">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ff6a00]">
          <ListChecks size={20} />
        </div>
        <div>
          <h2 className="font-semibold">Manage every part of your listing</h2>
          <p className="text-sm text-slate-400">Expand a section to update details. Changes save as a draft.</p>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <AccordionCard
          key={s.id}
          id={s.id}
          title={s.title}
          open={openId === s.id}
          onToggle={() => setOpenId(openId === s.id ? null : s.id)}
        >
          {renderBody(s.id)}
        </AccordionCard>
      ))}

      {/* Sticky save bar */}
      <div className={`${card} sticky bottom-4 z-10 flex justify-end p-4 shadow-lg`}>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#ff6a00] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e65f00]"
        >
          Save changes
        </button>
      </div>

      {showAdd && (
        <AddRoomDialog
          onClose={() => setShowAdd(false)}
          onAdd={(room) => {
            setRooms((r) => [...r, room]);
            setShowAdd(false);
            toast.success('Room added. Click Save changes to keep it.');
          }}
        />
      )}
    </div>
  );
}