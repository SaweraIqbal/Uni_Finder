import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API, authHeaders } from "../../api/client";
import CampusRegShell from "../../components/campusReg/CampusRegShell";
import UploadTile from "../../components/campusReg/UploadTile";

const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function HostelRegistrationPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const campusHostel = role === "campus_hostel";
  const [campuses, setCampuses] = useState([]);
  const [campusesLoading, setCampusesLoading] = useState(campusHostel);
  const [campusesError, setCampusesError] = useState("");
  const [form, setForm] = useState({
    campus_id: "",
    name: "",
    address: "",
    gender: "boys",
    contact_phone: "",
  });
  const [documents, setDocuments] = useState({
    campus_authorization: null,
    owner_cnic: null,
    utility_bill: null,
    ownership_proof: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== role || !["hostel", "campus_hostel"].includes(role)) {
      navigate("/login", { replace: true });
      return;
    }
    if (!campusHostel) return;

    fetch(`${API}/api/campuses`)
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.message || "Could not load campuses.");
        setCampuses(Array.isArray(data) ? data : data.campuses || []);
      })
      .catch((error) => setCampusesError(error.message))
      .finally(() => setCampusesLoading(false));
  }, [campusHostel, navigate, role, user]);

  const setField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (campusHostel && !form.campus_id) {
      toast.error("Select the campus first.");
      return;
    }
    if (!form.name.trim() || !form.contact_phone.trim()) {
      toast.error("Enter the hostel name and contact number.");
      return;
    }
    if (!campusHostel && !form.address.trim()) {
      toast.error("Enter the hostel address.");
      return;
    }

    const requiredDocuments = campusHostel
      ? ["campus_authorization"]
      : ["owner_cnic", "utility_bill", "ownership_proof"];
    if (requiredDocuments.some((key) => !documents[key]?._file)) {
      toast.error("Upload each required verification document.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("gender", form.gender);
      body.append("contact_phone", form.contact_phone.trim());
      if (campusHostel) {
        body.append("campus_id", form.campus_id);
        body.append("campus_authorization", documents.campus_authorization._file);
      } else {
        body.append("address", form.address.trim());
        body.append("owner_cnic", documents.owner_cnic._file);
        body.append("utility_bill", documents.utility_bill._file);
        body.append("ownership_proof", documents.ownership_proof._file);
      }

      const response = await fetch(`${API}/api/hostels/register`, {
        method: "POST",
        headers: authHeaders(),
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Hostel registration failed.");

      toast.success("Hostel registration submitted for verification.");
      navigate("/hostel/registration-status", { replace: true, state: { hostelId: data.hostelId } });
    } catch (error) {
      toast.error(error.message || "Could not submit hostel registration.");
    } finally {
      setSubmitting(false);
    }
  };

  const upload = (key, label, hint) => (
    <UploadTile
      label={label}
      hint={hint}
      file={documents[key]}
      onChange={(file) => setDocuments((current) => ({ ...current, [key]: file }))}
      accept={DOCUMENT_ACCEPT}
      allowedTypes={DOCUMENT_TYPES}
      required
    />
  );

  return (
    <CampusRegShell panelLabel="Hostel Registration">
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-800">
            {campusHostel ? "Register a Campus Hostel" : "Register an Independent Hostel"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the basic hostel details and upload clear verification documents.
          </p>
        </div>

        <Section title={campusHostel ? "Campus and hostel details" : "Independent hostel details"}>
          {campusHostel && (
            <div>
              <label className={labelClass} htmlFor="campus_id">Campus</label>
              <select
                id="campus_id"
                name="campus_id"
                value={form.campus_id}
                onChange={setField}
                className={inputClass}
                disabled={campusesLoading || !!campusesError}
              >
                <option value="">{campusesLoading ? "Loading campuses..." : "Select campus"}</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {[campus.name, campus.university_name, campus.city].filter(Boolean).join(" - ")}
                  </option>
                ))}
              </select>
              {campusesError && <p className="mt-1 text-xs text-red-500">{campusesError}</p>}
              {!campusesLoading && !campusesError && campuses.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No campuses are available to select yet.</p>
              )}
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="name">Hostel name</label>
            <input id="name" name="name" value={form.name} onChange={setField} className={inputClass} maxLength={255} required />
          </div>

          {!campusHostel && (
            <div>
              <label className={labelClass} htmlFor="address">Full hostel address</label>
              <textarea id="address" name="address" value={form.address} onChange={setField} className={`${inputClass} resize-y`} rows={3} maxLength={2000} required />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="gender">Accommodation</label>
              <select id="gender" name="gender" value={form.gender} onChange={setField} className={inputClass}>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="contact_phone">Contact number</label>
              <input id="contact_phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={setField} className={inputClass} maxLength={50} required />
            </div>
          </div>
        </Section>

        <Section title="Verification documents">
          {campusHostel ? (
            <div>
              <p className="mb-3 text-sm text-slate-500">Upload the university authorization or campus hostel NOC.</p>
              {upload("campus_authorization", "Campus authorization / NOC", "PDF, JPG or PNG - max 10 MB")}
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">Upload the owner's CNIC, a recent utility bill, and proof of ownership (registry) or lease.</p>
              <div className="grid grid-cols-1 gap-4">
                {upload("owner_cnic", "Owner CNIC", "PDF, JPG or PNG - max 10 MB")}
                {upload("utility_bill", "Recent utility bill", "PDF, JPG or PNG - max 10 MB")}
                {upload("ownership_proof", "Property registry or lease", "PDF, JPG or PNG - max 10 MB")}
              </div>
            </>
          )}
        </Section>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <input type="checkbox" required className="mt-0.5 accent-orange-500" />
          <span>I confirm that the hostel information and uploaded documents are accurate and authorized for verification.</span>
        </label>

        <button
          type="submit"
          disabled={submitting || (campusHostel && (campusesLoading || campuses.length === 0))}
          className="w-full rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit for verification"}
        </button>
      </form>
    </CampusRegShell>
  );
}
