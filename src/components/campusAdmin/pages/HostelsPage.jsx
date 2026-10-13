import { HotelIcon } from "lucide-react";

export default function HostelsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
        <HotelIcon className="w-7 h-7 text-orange-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-700">Hostels — Coming Soon</h2>
      <p className="text-sm text-slate-400 max-w-xs">
        Campus hostel management will be available in a future update.
      </p>
    </div>
  );
}
