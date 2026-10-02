import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const GROWTH_DATA = [
  { month: "Apr", universities: 3, campuses: 11, programs: 28 },
  { month: "May", universities: 3, campuses: 13, programs: 30 },
  { month: "Jun", universities: 4, campuses: 14, programs: 33 },
  { month: "Jul", universities: 4, campuses: 16, programs: 35 },
  { month: "Aug", universities: 5, campuses: 17, programs: 37 },
  { month: "Sep", universities: 5, campuses: 18, programs: 38 },
];

const CITY_DATA = [
  { city: "Lahore", campuses: 6 },
  { city: "Islamabad", campuses: 5 },
  { city: "Karachi", campuses: 3 },
  { city: "Faisalabad", campuses: 2 },
  { city: "Attock", campuses: 1 },
  { city: "Multan", campuses: 1 },
];

const FIELD_DATA = [
  { name: "Computer Science", value: 14, color: "#f97316" },
  { name: "Engineering", value: 8, color: "#3b82f6" },
  { name: "Business", value: 7, color: "#8b5cf6" },
  { name: "Medicine", value: 4, color: "#10b981" },
  { name: "Arts & Design", value: 3, color: "#f59e0b" },
  { name: "Other", value: 2, color: "#94a3b8" },
];

const PIPELINE_DATA = [
  { category: "Universities", pending: 3, approved: 47, rejected: 5 },
  { category: "Campuses", pending: 4, approved: 14, rejected: 2 },
  { category: "Programs", pending: 5, approved: 29, rejected: 3 },
  { category: "Hostels", pending: 5, approved: 11, rejected: 1 },
];

const TOOLTIP_STYLE = {
  borderRadius: "10px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontSize: "12px",
};

export default function Analytics({ onNavigate }) {
  const STAT_CARDS = [
    {
      label: "Universities",
      value: 5,
      color: "text-slate-800",
      screen: "profiles",
    },
    {
      label: "Campuses",
      value: 18,
      color: "text-orange-500",
      screen: "campus-approvals",
    },
    {
      label: "Hostels",
      value: 11,
      color: "text-blue-500",
      screen: "hostel-approvals",
    },
    {
      label: "Students",
      value: "94.2K",
      color: "text-emerald-600",
      screen: null,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Analytics
        </h1>
        <p className="text-gray-500 text-[15px] mt-1">
          Platform-wide metrics, growth trends, and approval pipeline health
        </p>
      </div>

      {/* Clickable Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <button
            key={s.label}
            onClick={() => s.screen && onNavigate?.(s.screen)}
            disabled={!s.screen}
            className={`bg-white rounded-2xl shadow-sm p-6 text-left hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-orange-400 ${
              s.screen ? "cursor-pointer hover:shadow-md" : "cursor-default"
            }`}
          >
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            {s.screen && (
              <p className="text-orange-400 text-xs mt-2 font-medium">
                View all →
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-slate-800 font-semibold text-sm mb-1">
            Growth Over Time
          </h3>
          <p className="text-gray-400 text-xs mb-5">
            Universities, campuses &amp; programs — last 6 months
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
              <Line
                type="monotone"
                dataKey="universities"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
                name="Universities"
              />
              <Line
                type="monotone"
                dataKey="campuses"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                name="Campuses"
              />
              <Line
                type="monotone"
                dataKey="programs"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Programs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-slate-800 font-semibold text-sm mb-1">
            Campuses by City
          </h3>
          <p className="text-gray-400 text-xs mb-5">
            Geographic distribution of registered campuses
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CITY_DATA} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="city"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="campuses"
                fill="#f97316"
                radius={[6, 6, 0, 0]}
                name="Campuses"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-slate-800 font-semibold text-sm mb-1">
            Programs by Field
          </h3>
          <p className="text-gray-400 text-xs mb-5">
            Distribution across academic fields
          </p>
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-auto shrink-0">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={FIELD_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {FIELD_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              {FIELD_DATA.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    <span className="text-xs text-slate-600 truncate">
                      {f.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 ml-2">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-slate-800 font-semibold text-sm mb-1">
            Approval Pipeline Health
          </h3>
          <p className="text-gray-400 text-xs mb-5">
            Pending, approved, and rejected per entity type
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PIPELINE_DATA} layout="vertical" barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar
                dataKey="pending"
                fill="#f97316"
                radius={[0, 4, 4, 0]}
                name="Pending"
              />
              <Bar
                dataKey="approved"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                name="Approved"
              />
              <Bar
                dataKey="rejected"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
                name="Rejected"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
