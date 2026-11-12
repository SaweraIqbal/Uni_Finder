import {
  Accessibility,
  Armchair,
  BriefcaseMedical,
  Bus,
  CarFront,
  CreditCard,
  Dumbbell,
  FlaskConical,
  Landmark,
  Library,
  MoonStar,
  Monitor,
  ShieldCheck,
  Theater,
  Trophy,
  Utensils,
  Wifi,
} from "lucide-react";

const FACILITY_OPTIONS = [
  { id: "wifi", label: "WiFi", Icon: Wifi },
  { id: "library", label: "Library", Icon: Library },
  { id: "comp_labs", label: "Computer Labs", Icon: Monitor },
  { id: "sci_labs", label: "Science Labs", Icon: FlaskConical },
  { id: "cafeteria", label: "Cafeteria", Icon: Utensils },
  { id: "prayer", label: "Prayer Area", Icon: MoonStar },
  { id: "sports", label: "Sports Grounds", Icon: Trophy },
  { id: "gym", label: "Gym", Icon: Dumbbell },
  { id: "transport", label: "Transport", Icon: Bus },
  { id: "medical", label: "Medical Room", Icon: BriefcaseMedical },
  { id: "parking", label: "Parking", Icon: CarFront },
  { id: "atm", label: "ATM", Icon: CreditCard },
  { id: "auditorium", label: "Auditorium", Icon: Theater },
  { id: "cctv", label: "Security & CCTV", Icon: ShieldCheck },
  { id: "disability", label: "Disability Access", Icon: Accessibility },
  { id: "lounges", label: "Student Lounges", Icon: Armchair },
  { id: "bank", label: "Bank", Icon: Landmark },
];

export default function CampusFacilities({ facilities }) {
  const selectedIds = new Set(facilities?.selected_ids || []);
  const selectedFacilities = FACILITY_OPTIONS.filter((item) => selectedIds.has(item.id));
  const environment = [
    ["Dress Code", facilities?.dress_code],
    ["Class Timings", facilities?.class_timings],
    ["Attendance Policy", facilities?.attendance_policy],
    ["Discipline & Anti-Ragging Policy", facilities?.discipline_policy],
  ].filter(([, value]) => value?.trim());

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 lg:px-8 py-10 space-y-10">
      <section>
        <h2 className="text-xl font-bold text-gray-800">Campus Facilities</h2>
        {selectedFacilities.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
            {selectedFacilities.map(({ id, label, Icon }) => (
              <div key={id} className="flex items-center gap-3 border-b border-gray-200 py-4">
                <Icon className="w-5 h-5 text-slate-600 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-3">No facilities have been listed by this campus.</p>
        )}
      </section>

      {environment.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3">Campus Environment</h2>
          <dl className="divide-y divide-gray-100 border-y border-gray-200">
            {environment.map(([label, value]) => (
              <div key={label} className="py-3 grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-700 whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}