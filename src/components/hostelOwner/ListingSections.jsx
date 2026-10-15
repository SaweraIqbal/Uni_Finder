import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText } from 'lucide-react';

// ---------- Temporary data (replace with API response later) ----------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const INITIAL_LISTING = {
  security: {
    fee: '15000',
    types: ['guard', 'cctv'],
    advanceRent: false,
    refundPolicy: 'Refunded within 14 days after checkout, subject to inspection.',
  },
  service: { available: true, is247: false, start: '', end: '', guards: '', guardAge: '', guardContact: '' },
  mess: {
    available: true,
    frequency: 'two',
    charges: '',
    policy: 'optional',
    menuMode: 'skip', // 'skip' | 'photo' | 'manual'
    menuPhoto: '',
    menuManual: Object.fromEntries(DAYS.map((d) => [d, ''])),
  },
  amenities: {
    items: [
      { id: 'a1', name: 'Cupboard', amount: '' },
      { id: 'a2', name: 'Water Filter', amount: '' },
    ],
    fridgeCount: '',
    floorNumber: '',
  },
  facilities: [
    { id: 'f1', name: 'WiFi', amount: '' },
    { id: 'f2', name: 'Electricity Backup / Generator / UPS', amount: '' },
    { id: 'f3', name: 'AC / Cooler', amount: '' },
  ],
  otherCharges: [{ id: 'o1', name: 'Key replacement', amount: '500' }],
  policies: [
    { id: 'p1', category: 'Curfew / Gate Timing', text: 'Main gate closes at 11:00 PM on weekdays and midnight on weekends.' },
    { id: 'p2', category: 'Visitor Policy', text: 'Visitors are allowed in the common area from 10:00 AM to 8:00 PM.' },
  ],
  inquiry: '+92 300 1234567',
  photos: [
    { id: 'room', label: 'Per-Room Photos', verified: true, url: '' },
    { id: 'washroom', label: 'Washroom', verified: true, url: '' },
    { id: 'ac', label: 'AC/Cooler', verified: false, url: '' },
    { id: 'filter', label: 'Water Filter', verified: false, url: '' },
    { id: 'fridge', label: 'Refrigerator', verified: false, url: '' },
    { id: 'cupboard', label: 'Cupboard', verified: false, url: '' },
    { id: 'kitchen', label: 'Kitchen/Mess', verified: false, url: '' },
    { id: 'common', label: 'Common Area', verified: false, url: '' },
    { id: 'security', label: 'Security System', verified: false, url: '' },
    { id: 'generator', label: 'Generator/UPS', verified: false, url: '' },
    { id: 'exterior', label: 'Building Exterior', verified: false, url: '' },
    { id: 'parking', label: 'Parking Area', verified: false, url: '' },
    { id: 'fire', label: 'Fire Safety', verified: false, url: '' },
  ],
};

// ---------- Shared bits ----------
const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-slate-50 disabled:text-slate-400';
const box = 'rounded-2xl border border-slate-200 bg-white';
const primaryBtn = 'rounded-xl bg-[#ff6a00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e65f00]';
const removeBtn = 'rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100';

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-xs font-medium text-slate-600">
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, title, subtitle }) {
  return (
    <div className={`${box} flex items-center justify-between gap-4 p-5`}>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#ff6a00]' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

function Segmented({ value, options, onChange, label, disabled }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
            value === o.value ? 'bg-white text-[#ff6a00] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder, id, disabled, ariaLabel }) {
  const display = value === '' ? '' : `Rs. ${Number(value).toLocaleString('en-US')}`;
  return (
    <input
      id={id}
      aria-label={ariaLabel}
      inputMode="numeric"
      className={input}
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
    />
  );
}

function TextField({ label, id, value, onChange, disabled, type = 'text', inputMode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} type={type} inputMode={inputMode} className={input} disabled={disabled} value={value}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ---------- B. Security & Fees ----------
const SECURITY_TYPES = [
  { id: 'biometric', label: 'Biometric' },
  { id: 'guard', label: 'Security Guard' },
  { id: 'cctv', label: 'CCTV' },
];

export function SecurityFees({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const toggleType = (id) =>
    set('types', value.types.includes(id) ? value.types.filter((t) => t !== id) : [...value.types, id]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="sec-fee">Security Fee</Label>
          <MoneyInput id="sec-fee" value={value.fee} onChange={(v) => set('fee', v)} placeholder="Rs. 0" />
        </div>
        <fieldset>
          <legend className="mb-2 block text-xs font-medium text-slate-600">Security Type</legend>
          <div className={`${box} flex flex-wrap gap-x-6 gap-y-2 px-4 py-3.5`}>
            {SECURITY_TYPES.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[#ff6a00]" checked={value.types.includes(t.id)}
                  onChange={() => toggleType(t.id)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`${box} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <p className="text-sm font-medium">Advance Rent</p>
          <p className="text-xs text-slate-500">Is advance rent required before move-in?</p>
        </div>
        <div className="w-44">
          <Segmented label="Advance rent required" value={value.advanceRent ? 'yes' : 'no'}
            onChange={(v) => set('advanceRent', v === 'yes')}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        </div>
      </div>

      <div>
        <Label htmlFor="sec-refund">Security Deposit Refund Policy</Label>
        <textarea id="sec-refund" rows={4} className={`${input} resize-y`} value={value.refundPolicy}
          onChange={(e) => set('refundPolicy', e.target.value)} />
      </div>
    </div>
  );
}

// ---------- C. Food Delivery / Guard Service ----------
export function ServiceSection({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const off = !value.available;
  const timeOff = off || value.is247;

  return (
    <div className="space-y-6">
      <Toggle checked={value.available} onChange={(v) => set('available', v)} title="Service available"
        subtitle="Guard and food-delivery receiving service" />
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="svc-247">Quick Timing</Label>
          <label className={`${box} flex cursor-pointer items-center gap-3 px-4 py-3.5 text-sm ${off ? 'opacity-60' : ''}`}>
            <input id="svc-247" type="checkbox" className="h-4 w-4 accent-[#ff6a00]" disabled={off}
              checked={value.is247} onChange={(e) => set('is247', e.target.checked)} />
            24/7 service
          </label>
        </div>
        <TextField label="Service Start Time" id="svc-start" type="time" value={value.start} disabled={timeOff}
          onChange={(v) => set('start', v)} />
        <TextField label="Service End Time" id="svc-end" type="time" value={value.end} disabled={timeOff}
          onChange={(v) => set('end', v)} />
        <TextField label="Number of Guards" id="svc-guards" type="number" value={value.guards} disabled={off}
          onChange={(v) => set('guards', v)} />
        <TextField label="Guard Age" id="svc-age" type="number" value={value.guardAge} disabled={off}
          onChange={(v) => set('guardAge', v)} />
        <TextField label="Guard Contact" id="svc-contact" type="tel" value={value.guardContact} disabled={off}
          onChange={(v) => set('guardContact', v)} />
      </div>
    </div>
  );
}

// ---------- D. Mess / Food ----------
export function MessSection({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const photoRef = useRef(null);
  const off = !value.available;

  const pickPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10 MB.');
    set('menuPhoto', file.name);
  };

  const modes = [
    { id: 'skip', label: 'Skip' },
    { id: 'photo', label: 'Upload Menu Photo' },
    { id: 'manual', label: 'Enter Manually' },
  ];

  return (
    <div className="space-y-6">
      <Toggle checked={value.available} onChange={(v) => set('available', v)} title="Mess available"
        subtitle="Prepared meals for residents" />

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label>Meal Frequency</Label>
          <Segmented label="Meal frequency" value={value.frequency} disabled={off} onChange={(v) => set('frequency', v)}
            options={[{ value: 'one', label: 'One-Time' }, { value: 'two', label: 'Two-Time' }, { value: 'three', label: 'Three-Time' }]} />
        </div>
        <div>
          <Label htmlFor="mess-charges">Mess Charges (optional)</Label>
          <MoneyInput id="mess-charges" value={value.charges} onChange={(v) => set('charges', v)} placeholder="Rs. 0" disabled={off} />
        </div>
        <div>
          <Label>Mess Charge Policy</Label>
          <Segmented label="Mess charge policy" value={value.policy} disabled={off} onChange={(v) => set('policy', v)}
            options={[{ value: 'mandatory', label: 'Mandatory' }, { value: 'optional', label: 'Optional' }]} />
        </div>
      </div>

      <div className={`${box} p-5 ${off ? 'opacity-60' : ''}`}>
        <h3 className="text-sm font-semibold">
          Weekly Menu <span className="font-normal text-slate-400">(optional)</span>
        </h3>
        <p className="text-xs text-slate-500">Skip this, upload one menu image, or enter meals manually.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {modes.map((m) => (
            <button key={m.id} type="button" disabled={off} aria-pressed={value.menuMode === m.id}
              onClick={() => (m.id === 'photo' ? (set('menuMode', 'photo'), photoRef.current?.click()) : set('menuMode', m.id))}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                value.menuMode === m.id ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {m.label}
            </button>
          ))}
          <input ref={photoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        {value.menuMode === 'photo' && (
          <p className="mt-3 text-sm text-slate-600">
            {value.menuPhoto ? `Selected: ${value.menuPhoto}` : 'No menu photo selected yet.'}
          </p>
        )}
        {value.menuMode === 'manual' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DAYS.map((d) => (
              <div key={d}>
                <Label htmlFor={`menu-${d}`}>{d}</Label>
                <input id={`menu-${d}`} className={input} placeholder="Breakfast, lunch, dinner"
                  value={value.menuManual[d]}
                  onChange={(e) => set('menuManual', { ...value.menuManual, [d]: e.target.value })} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- E / F. Included-or-priced lists ----------
function ChargeList({ items, onChange, addLabel, namePlaceholder, children }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const setAmount = (id, amount) => onChange(items.map((i) => (i.id === id ? { ...i, amount } : i)));
  const add = () => {
    if (!name.trim()) return toast.error('Enter a name first.');
    onChange([...items, { id: String(Date.now()), name: name.trim(), amount: '' }]);
    setName('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i.id} className={`${box} flex flex-wrap items-center gap-4 p-5`}>
          <div className="min-w-[160px] flex-1">
            <p className="text-sm font-semibold">{i.name}</p>
            <p className={`text-xs ${i.amount === '' ? 'text-emerald-600' : 'text-amber-700'}`}>
              {i.amount === '' ? 'Included' : 'Extra charge'}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Label htmlFor={`amt-${i.id}`}>Amount (optional)</Label>
            <MoneyInput id={`amt-${i.id}`} value={i.amount} onChange={(v) => setAmount(i.id, v)}
              placeholder="Leave blank if included" />
          </div>
          <button type="button" className={`${removeBtn} self-end`} onClick={() => onChange(items.filter((x) => x.id !== i.id))}>
            Remove
          </button>
        </div>
      ))}

      {adding ? (
        <div className={`${box} flex flex-wrap items-end gap-3 p-4`}>
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="new-item">Name</Label>
            <input id="new-item" autoFocus className={input} placeholder={namePlaceholder} value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <button type="button" className={primaryBtn} onClick={add}>Add</button>
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50"
            onClick={() => { setAdding(false); setName(''); }}>Cancel</button>
        </div>
      ) : (
        <button type="button" className={primaryBtn} onClick={() => setAdding(true)}>+ {addLabel}</button>
      )}

      {children}
    </div>
  );
}

export function AmenitiesSection({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <ChargeList items={value.items} onChange={(items) => set('items', items)} addLabel="Add Amenity" namePlaceholder="e.g. Study table">
      <div className="grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
        <TextField label="Refrigerator Count" id="am-fridge" type="number" value={value.fridgeCount}
          onChange={(v) => set('fridgeCount', v)} />
        <TextField label="Floor Number" id="am-floor" value={value.floorNumber} onChange={(v) => set('floorNumber', v)} />
      </div>
    </ChargeList>
  );
}

export function FacilitiesSection({ value, onChange }) {
  return <ChargeList items={value} onChange={onChange} addLabel="Add Facility" namePlaceholder="e.g. Laundry" />;
}

// ---------- G. Other Charges ----------
export function OtherChargesSection({ value, onChange }) {
  const patch = (id, k, v) => onChange(value.map((c) => (c.id === id ? { ...c, [k]: v } : c)));
  return (
    <div className="space-y-4">
      {value.map((c) => (
        <div key={c.id} className={`${box} flex flex-wrap items-end gap-4 p-5`}>
          <div className="min-w-[200px] flex-1">
            <Label htmlFor={`cn-${c.id}`}>Charge Name</Label>
            <input id={`cn-${c.id}`} className={input} value={c.name} onChange={(e) => patch(c.id, 'name', e.target.value)} />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor={`ca-${c.id}`}>Amount (optional)</Label>
            <MoneyInput id={`ca-${c.id}`} value={c.amount} onChange={(v) => patch(c.id, 'amount', v)} placeholder="Rs. 0" />
          </div>
          <button type="button" className={removeBtn} onClick={() => onChange(value.filter((x) => x.id !== c.id))}>Remove</button>
        </div>
      ))}
      <button type="button" className={primaryBtn}
        onClick={() => onChange([...value, { id: String(Date.now()), name: '', amount: '' }])}>
        + Add Charge
      </button>
    </div>
  );
}

// ---------- H. Policies & Rules ----------
const POLICY_CATEGORIES = [
  'Curfew / Gate Timing', 'Visitor Policy', 'Smoking / Alcohol', 'Guest Stay', 'Noise / Quiet Hours', 'Cleanliness', 'Other',
];

export function PoliciesSection({ value, onChange }) {
  const [draft, setDraft] = useState(null); // { id|null, category, text }

  const save = () => {
    if (!draft.text.trim()) return toast.error('Write the policy text first.');
    if (draft.id) onChange(value.map((p) => (p.id === draft.id ? { ...p, category: draft.category, text: draft.text.trim() } : p)));
    else onChange([...value, { id: String(Date.now()), category: draft.category, text: draft.text.trim() }]);
    setDraft(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {value.map((p) => (
          <article key={p.id} className={`${box} p-5`}>
            <span className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">{p.category}</span>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{p.text}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200"
                onClick={() => setDraft({ id: p.id, category: p.category, text: p.text })}>Edit</button>
              <button type="button" className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}>Remove</button>
            </div>
          </article>
        ))}
      </div>

      {draft ? (
        <div className={`${box} space-y-4 p-5`}>
          <div>
            <Label htmlFor="pol-cat">Category</Label>
            <select id="pol-cat" className={input} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {POLICY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="pol-text">Policy</Label>
            <textarea id="pol-text" rows={3} className={`${input} resize-y`} value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="button" className={primaryBtn} onClick={save}>{draft.id ? 'Update policy' : 'Add policy'}</button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50"
              onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className={primaryBtn} onClick={() => setDraft({ id: null, category: POLICY_CATEGORIES[0], text: '' })}>
          + Add Policy
        </button>
      )}
    </div>
  );
}

// ---------- I. Inquiry ----------
export function InquirySection({ value, onChange }) {
  return (
    <div className="max-w-xl">
      <Label htmlFor="inq-contact">Contact to Inquire (Phone / WhatsApp)</Label>
      <input id="inq-contact" type="tel" className={input} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ---------- J. Photo & Visual Evidence ----------
function PhotoTile({ photo, onPick }) {
  const ref = useRef(null);
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      <button type="button" aria-label={`Upload photo: ${photo.label}`} onClick={() => ref.current?.click()}
        className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100">
        {photo.url ? (
          <img src={photo.url} alt={photo.label} className="h-full w-full object-cover" />
        ) : (
          <FileText size={28} />
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-700">{photo.label}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${photo.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {photo.verified ? 'Verified' : 'Unverified'}
        </span>
      </div>
    </div>
  );
}

export function PhotosSection({ value, onChange }) {
  const pick = (id, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file.');
    if (file.size > 10 * 1024 * 1024) return toast.error('Image must be under 10 MB.');
    // A new upload needs review again, so it goes back to Unverified.
    onChange(value.map((p) => (p.id === id ? { ...p, url: URL.createObjectURL(file), verified: false } : p)));
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {value.map((p) => (
        <PhotoTile key={p.id} photo={p} onPick={(f) => pick(p.id, f)} />
      ))}
    </div>
  );
}