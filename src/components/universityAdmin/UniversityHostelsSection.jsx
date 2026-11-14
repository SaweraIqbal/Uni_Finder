import { AlertCircle, LoaderCircle } from "lucide-react";
import PublicHostelsSection from "../hostel/PublicHostelsSection";
import { useUniversityAdmin } from "./UniversityAdminContext";

export default function UniversityHostelsSection() {
  const { university, loadingMe, meError, universityName } = useUniversityAdmin();
  const universityId = university?.id || university?.university_id;

  if (loadingMe) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Loading university hostels...
      </div>
    );
  }

  if (meError || !universityId) {
    return (
      <div role="alert" className="m-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        {meError || "The university account could not be identified, so its hostel list cannot be loaded."}
      </div>
    );
  }

  return (
    <PublicHostelsSection
      universityId={String(universityId)}
      title={`${universityName || university.name || "University"} hostels`}
      description="Published hostel listings associated with your university's campuses. This view is read-only."
    />
  );
}
