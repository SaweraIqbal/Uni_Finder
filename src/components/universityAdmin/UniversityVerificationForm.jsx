import { useEffect, useMemo, useRef, useState } from "react";
import { getUniversities, submitUniversityVerification } from "../../api/verification";

const DESIGNATIONS = [
  "Vice Chancellor / Rector",
  "Registrar",
  "Deputy Registrar",
  "Assistant Registrar",
  "Controller of Examinations",
  "Director ORIC",
  "Director QEC",
  "Deputy/Assistant Director (QEC/ORIC)",
  "Focal Person (HEC)",
  "Other",
];
const PUBLIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.com", "mail.com", "zoho.com",
  "yandex.com", "qq.com",
]);
const EMAIL_ERROR = "Please enter a valid email address.";
const PUBLIC_EMAIL_ERROR =
  "Please use your official university email (Gmail/Yahoo/Hotmail are not accepted).";
const PHONE_ERROR =
  "Please enter a valid Pakistani mobile number (e.g., +92 300 1234567).";
const LETTER_ERROR = "Only PDF, JPG or PNG files up to 5 MB are allowed.";
const DOMAIN_LETTER_ERROR =
  "An authorization letter is required because your email domain could not be verified.";
const UNIVERSITY_RACE_ERROR =
  "This university was just registered by another user. Please contact support.";
const NAME_CHARS = /^[A-Za-z .'-]+$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#c88410] focus:bg-white focus:ring-2 focus:ring-[#c88410]/20";

const normalizedName = (value) => value.trim().replace(/\s+/g, " ");

function normalizePhone(value) {
  const input = value.trim();
  if (!/^\+?[\d -]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (!digits.startsWith("92")) digits = `92${digits}`;
  const result = `+${digits}`;
  return /^\+923\d{9}$/.test(result) ? result : null;
}

function validEmail(value) {
  const email = value.trim();
  const [local, domain] = email.split("@");
  if (
    email.length > 254 ||
    !local ||
    local.length > 64 ||
    !EMAIL_RE.test(email) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return { error: EMAIL_ERROR };
  }
  if (PUBLIC_DOMAINS.has(domain.toLowerCase())) return { error: PUBLIC_EMAIL_ERROR };
  return { domain: domain.toLowerCase(), email: `${local}@${domain.toLowerCase()}` };
}

function domainStatus(email, university) {
  if (!email.trim() || !university) return null;
  const result = validEmail(email);
  if (result.error) return null;
  const official = String(university.oric_domain || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  if (!official || official === "*") return "unknown";
  return result.domain === official ||
    result.domain.endsWith(`.${official}`) ||
    official.endsWith(`.${result.domain}`)
    ? "match"
    : "mismatch";
}

function nameError(value, min, max, requireTwoWords = false) {
  const name = normalizedName(value);
  return name.length >= min &&
    name.length <= max &&
    NAME_CHARS.test(name) &&
    (!requireTwoWords || name.split(" ").length >= 2);
}

export default function UniversityVerificationForm({
  uid,
  defaultName = "",
  defaultEmail = "",
  existing = null,
  onCancel,
}) {
  const fileRef = useRef(null);
  const fieldRefs = useRef({});
  const dropRef = useRef(null);
  const [universities, setUniversities] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(true);
  const [fullName, setFullName] = useState(existing?.full_name || defaultName || "");
  const [designation, setDesignation] = useState(
    existing?.designation && !DESIGNATIONS.includes(existing.designation)
      ? "Other"
      : existing?.designation || "",
  );
  const [otherDesignation, setOtherDesignation] = useState(
    existing?.designation_other ||
      (existing?.designation && !DESIGNATIONS.includes(existing.designation)
        ? existing.designation
        : ""),
  );
  const [universityId, setUniversityId] = useState(existing?.university_id || "");
  const [officialEmail, setOfficialEmail] = useState(
    existing?.official_email || defaultEmail || "",
  );
  const [phone, setPhone] = useState(existing?.phone || "");
  const [letter, setLetter] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    getUniversities()
      .then((list) => {
        if (alive) setUniversities(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setLoadError("Could not load the university list. Please refresh and try again.");
      })
      .finally(() => {
        if (alive) setLoadingUnis(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const selectedUniversity = useMemo(
    () => universities.find((university) => String(university.id) === String(universityId)),
    [universities, universityId],
  );
  const emailCheck = validEmail(officialEmail);
  const emailDomainState = domainStatus(officialEmail, selectedUniversity);

  // LOE is required when: domain mismatch/unknown, Other designation,
  // previously_rejected university, or this is a resubmission (existing rejected app)
  const needsLetter =
    designation === "Other" ||
    emailDomainState === "unknown" ||
    emailDomainState === "mismatch" ||
    Boolean(selectedUniversity?.previously_rejected) ||
    Boolean(existing);

  // A university is "unavailable" when registered or in-process
  const selectedState = selectedUniversity?.state || (selectedUniversity?.claimed ? "registered" : "available");
  const selectedIsClaimed = selectedState === "registered" || selectedState === "in_process";
  const visibleUniversities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return universities;
    return universities
      .map((university) => {
        const name = String(university.name || "").toLowerCase();
        const rank = String(university.hec_rank || university.rank || "").toLowerCase();
        const index = name.indexOf(term);
        const rankMatch = rank.includes(term);
        return { university, index, rankMatch };
      })
      .filter(({ index, rankMatch }) => index >= 0 || rankMatch)
      .sort((a, b) => {
        const aPriority = a.index === 0 ? 0 : a.index > 0 ? 1 : 2;
        const bPriority = b.index === 0 ? 0 : b.index > 0 ? 1 : 2;
        return aPriority - bPriority || a.university.name.localeCompare(b.university.name);
      })
      .map(({ university }) => university);
  }, [universities, search]);

  const validateField = (field) => {
    const errors = {};
    if (field === "full_name" && !nameError(fullName, 3, 70, true)) {
      errors.full_name =
        "Please enter your full name (first and last name), letters only.";
    }
    if (field === "designation" && !DESIGNATIONS.includes(designation)) {
      errors.designation = "Please select your designation.";
    }
    if (
      field === "designation_other" &&
      designation === "Other" &&
      !nameError(otherDesignation, 3, 60)
    ) {
      errors.designation_other = "Please specify a valid designation.";
    }
    if (
      field === "university_id" &&
      (!selectedUniversity || selectedIsClaimed)
    ) {
      const uniState = selectedUniversity?.state || (selectedUniversity?.claimed ? "registered" : null);
      errors.university_id = uniState === "registered"
        ? "This university is already registered. Contact support if you need access."
        : uniState === "in_process"
        ? "University registration is currently in process. Please try again later."
        : !selectedUniversity
        ? "Please select your university from the list."
        : UNIVERSITY_RACE_ERROR;
    }
    if (field === "official_email" && emailCheck.error) {
      errors.official_email = emailCheck.error;
    }
    if (field === "phone" && !normalizePhone(phone)) errors.phone = PHONE_ERROR;
    if (field === "authorization_letter" && needsLetter && !letter) {
      errors.authorization_letter = DOMAIN_LETTER_ERROR;
    } else if (field === "authorization_letter" && letter && !isValidLetter(letter)) {
      errors.authorization_letter = LETTER_ERROR;
    }
    if (field === "confirmation" && !confirmed) {
      errors.confirmation = "Please confirm to continue.";
    }
    return errors[field] || "";
  };

  const clearServerError = (field) => {
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (touched.official_email) validateField("official_email");
    if (touched.authorization_letter) validateField("authorization_letter");
    // Domain status is derived from the current email and selected university.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId, designation, officialEmail, letter]);

  const blurField = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
    clearServerError(field);
    validateField(field);
  };

  const chooseUniversity = (university) => {
    const uniState = university.state || (university.claimed ? "registered" : "available");
    if (uniState === "registered") {
      setServerErrors((current) => ({
        ...current,
        university_id:
          "This university is already registered. Contact support if you need access.",
      }));
      setTouched((current) => ({ ...current, university_id: true }));
      return;
    }
    if (uniState === "in_process") {
      setServerErrors((current) => ({
        ...current,
        university_id:
          "University registration is currently in process. Please try again later.",
      }));
      setTouched((current) => ({ ...current, university_id: true }));
      return;
    }
    setUniversityId(String(university.id));
    setSearch("");
    setPickerOpen(false);
    setTouched((current) => ({ ...current, university_id: true }));
    setServerErrors((current) => {
      const next = { ...current };
      delete next.university_id;
      return next;
    });
  };

  const setFile = (file) => {
    if (!file) return;
    if (!isValidLetter(file)) {
      setLetter(null);
      setTouched((current) => ({ ...current, authorization_letter: true }));
      setServerErrors((current) => ({ ...current, authorization_letter: LETTER_ERROR }));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setLetter(file);
    setTouched((current) => ({ ...current, authorization_letter: true }));
    setServerErrors((current) => {
      const next = { ...current };
      delete next.authorization_letter;
      return next;
    });
  };

  const errors = {
    ...(touched.full_name ? { full_name: validateField("full_name") } : {}),
    ...(touched.designation ? { designation: validateField("designation") } : {}),
    ...(touched.designation_other
      ? { designation_other: validateField("designation_other") }
      : {}),
    ...(touched.university_id ? { university_id: validateField("university_id") } : {}),
    ...(touched.official_email
      ? { official_email: validateField("official_email") }
      : {}),
    ...(touched.phone ? { phone: validateField("phone") } : {}),
    ...(touched.authorization_letter
      ? { authorization_letter: validateField("authorization_letter") }
      : {}),
    ...(touched.confirmation ? { confirmation: validateField("confirmation") } : {}),
    ...serverErrors,
  };

  const setFieldRef = (field) => (element) => {
    fieldRefs.current[field] = element;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const fields = [
      "full_name",
      "designation",
      ...(designation === "Other" ? ["designation_other"] : []),
      "university_id",
      "official_email",
      "phone",
      "authorization_letter",
      "confirmation",
    ];
    setTouched(Object.fromEntries(fields.map((field) => [field, true])));
    const nextErrors = {};
    for (const field of fields) {
      const error = validateField(field);
      if (error) nextErrors[field] = error;
    }
    if (Object.keys(nextErrors).length) {
      const firstError = fields.find((field) => nextErrors[field]);
      fieldRefs.current[firstError]?.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldRefs.current[firstError]?.focus?.();
      return;
    }

    const payload = new FormData();
    payload.append("userId", uid || "");
    payload.append("full_name", normalizedName(fullName));
    payload.append("designation", designation);
    payload.append(
      "designation_other",
      designation === "Other" ? normalizedName(otherDesignation) : "",
    );
    payload.append("university_id", universityId);
    payload.append("official_email", emailCheck.email);
    payload.append("phone", normalizePhone(phone));
    payload.append("confirmation", String(confirmed));
    if (letter) payload.append("authorization_letter", letter);

    setSubmitting(true);
    setUploadProgress(0);
    try {
      const result = await submitUniversityVerification(payload, setUploadProgress);
      setReceipt(result.referenceNo);
    } catch (error) {
      if (error?.fieldErrors) {
        setServerErrors(error.fieldErrors);
        const first = fields.find((field) => error.fieldErrors[field]);
        if (first) {
          setTouched((current) => ({ ...current, [first]: true }));
          fieldRefs.current[first]?.scrollIntoView({ behavior: "smooth", block: "center" });
          fieldRefs.current[first]?.focus?.();
        }
      } else {
        setServerErrors({ form: error?.message || "Could not submit your application. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section className="rounded-2xl border border-green-100 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">✓</div>
        <h1 className="text-2xl font-bold text-gray-800">Application received</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Please verify the email address you entered using the link we sent. Your application
          will enter review after you click that link.
        </p>
        <p className="mt-5 text-sm text-gray-600">Your reference number</p>
        <p className="mt-1 text-xl font-bold tracking-wide text-gray-900">{receipt}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500">
          Our team will verify your details within 2–3 working days after email verification.
          You will receive an invite link on your official email once approved.
        </p>
      </section>
    );
  }

  const fieldError = (name) => errors[name] && (
    <p className="mt-1.5 text-xs text-red-600" role="alert">{errors[name]}</p>
  );

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
          {existing ? "Re-submit Verification" : "University Admin Verification"}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          Verify your email address first. Your application enters the review queue only after
          you click the confirmation link sent to that address.
        </p>
      </div>

      <Field label="Full Name" required error={fieldError("full_name")}>
        <input
          ref={setFieldRef("full_name")}
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            clearServerError("full_name");
            if (touched.full_name) validateField("full_name");
          }}
          onBlur={() => blurField("full_name")}
          placeholder="e.g. Ahmed Raza"
          className={INPUT_CLS}
          aria-invalid={Boolean(errors.full_name)}
        />
      </Field>

      <Field label="Designation" required error={fieldError("designation")}>
        <select
          ref={setFieldRef("designation")}
          value={designation}
          onChange={(event) => {
            setDesignation(event.target.value);
            clearServerError("designation");
            setTouched((current) => ({ ...current, designation: true }));
          }}
          onBlur={() => blurField("designation")}
          className={INPUT_CLS}
          aria-invalid={Boolean(errors.designation)}
        >
          <option value="">Select your designation</option>
          {DESIGNATIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </Field>

      {designation === "Other" && (
        <Field label="Specify designation" required error={fieldError("designation_other")}>
          <input
            ref={setFieldRef("designation_other")}
            type="text"
            value={otherDesignation}
            onChange={(event) => {
              setOtherDesignation(event.target.value);
              clearServerError("designation_other");
              if (touched.designation_other) validateField("designation_other");
            }}
            onBlur={() => blurField("designation_other")}
            placeholder="Specify your designation"
            className={INPUT_CLS}
            aria-invalid={Boolean(errors.designation_other)}
          />
        </Field>
      )}

      <Field label="University" required error={fieldError("university_id")}>
        <div className="relative">
          <input
            ref={setFieldRef("university_id")}
            type="text"
            role="combobox"
            aria-expanded={pickerOpen}
            aria-controls="university-options"
            aria-autocomplete="list"
            value={pickerOpen ? search : selectedUniversity?.name || ""}
            placeholder={loadingUnis ? "Loading universities…" : "Search universities"}
            disabled={loadingUnis || Boolean(loadError)}
            onChange={(event) => {
              setSearch(event.target.value);
              setPickerOpen(true);
              setUniversityId("");
              clearServerError("university_id");
              if (touched.university_id) validateField("university_id");
            }}
            onFocus={() => {
              setSearch("");
              setPickerOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setPickerOpen(false), 120);
              blurField("university_id");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setPickerOpen(false);
              if (event.key === "Enter" && visibleUniversities[0] && !visibleUniversities[0].claimed) {
                event.preventDefault();
                chooseUniversity(visibleUniversities[0]);
              }
            }}
            className={INPUT_CLS}
            aria-invalid={Boolean(errors.university_id)}
          />
          {pickerOpen && !loadingUnis && !loadError && (
            <ul
              id="university-options"
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              {visibleUniversities.length ? visibleUniversities.map((university) => {
                const uniState = university.state || (university.claimed ? "registered" : "available");
                const isUnavailable = uniState === "registered" || uniState === "in_process";
                const stateTag =
                  uniState === "registered"
                    ? { label: "✓ Registered", cls: "text-emerald-700 bg-emerald-50" }
                    : uniState === "in_process"
                    ? { label: "Registration in process", cls: "text-amber-700 bg-amber-50" }
                    : null;
                return (
                  <li key={university.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={String(university.id) === String(universityId)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseUniversity(university)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm
                        ${isUnavailable
                          ? "cursor-not-allowed bg-gray-50 text-gray-400"
                          : "hover:bg-amber-50 text-gray-800"
                        }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{university.name}</span>
                        <span className="text-xs text-gray-500">
                          Rank {university.hec_rank || university.rank || "—"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {university.university_type || university.type || "University"}
                        </span>
                        {stateTag && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stateTag.cls}`}>
                            {stateTag.label}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              }) : (
                <li className="px-3 py-3 text-sm text-gray-500">No universities found.</li>
              )}
            </ul>
          )}
        </div>
        {loadError && <p className="mt-2 text-xs text-red-600">{loadError}</p>}
        {selectedUniversity?.previously_rejected && (
          <p className="mt-2 text-xs text-amber-700 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            ⚠️ This university was previously rejected — an authorization letter is mandatory.
          </p>
        )}
        <a href="mailto:support@unifinder.pk" className="mt-2 inline-block text-xs text-orange-700 underline">
          Can&apos;t find your university? Contact us
        </a>
      </Field>

      <Field label="Official Email" required error={fieldError("official_email")}>
        <input
          ref={setFieldRef("official_email")}
          type="email"
          autoComplete="email"
          maxLength={254}
          value={officialEmail}
          onChange={(event) => {
            setOfficialEmail(event.target.value);
            clearServerError("official_email");
            if (touched.official_email) validateField("official_email");
          }}
          onBlur={() => blurField("official_email")}
          placeholder="name@university.edu.pk"
          className={INPUT_CLS}
          aria-invalid={Boolean(errors.official_email)}
        />
        {emailDomainState === "match" && (
          <p className="mt-2 text-xs text-green-700">✅ Domain matches official university records</p>
        )}
        {emailDomainState === "unknown" && (
          <p className="mt-2 text-xs text-amber-700">⚠️ We could not verify this domain — an authorization letter is required</p>
        )}
        {emailDomainState === "mismatch" && (
          <p className="mt-2 text-xs text-amber-700">
            ⚠️ This domain does not match our records for {selectedUniversity?.name} — an authorization letter is required
          </p>
        )}
      </Field>

      <Field
        label="Authorization Letter"
        required={needsLetter}
        hint={!needsLetter
          ? "Optional — upload a letter of authorization if available. Required when your email domain cannot be verified."
          : undefined}
        error={fieldError("authorization_letter")}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={(event) => setFile(event.target.files?.[0])}
          onBlur={() => blurField("authorization_letter")}
          aria-invalid={Boolean(errors.authorization_letter)}
        />
        <div
          ref={dropRef}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setFile(event.dataTransfer.files?.[0]);
          }}
          className="rounded-xl"
        >
          {letter ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <span className="min-w-0 truncate text-sm text-gray-700">{letter.name}</span>
              <button
                ref={setFieldRef("authorization_letter")}
                type="button"
                onClick={() => {
                  setLetter(null);
                  setUploadProgress(0);
                  if (fileRef.current) fileRef.current.value = "";
                  if (needsLetter) blurField("authorization_letter");
                }}
                className="shrink-0 text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              ref={setFieldRef("authorization_letter")}
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-center transition hover:border-[#c88410] hover:bg-amber-50/40"
            >
              <span className="mb-1 block text-2xl">📎</span>
              <span className="block text-sm font-medium text-gray-600">Drag a file here or click to browse</span>
              <span className="mt-1 block text-xs text-gray-400">PDF, JPG or PNG · 10 KB–5 MB</span>
            </button>
          )}
          {submitting && letter && (
            <div className="mt-3" aria-live="polite">
              <div className="h-1.5 overflow-hidden rounded bg-gray-100">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="mt-1 text-right text-xs text-gray-500">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>
      </Field>

      <Field label="Phone" required error={fieldError("phone")} hint="Pakistani mobile number">
        <input
          ref={setFieldRef("phone")}
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            clearServerError("phone");
            if (touched.phone) validateField("phone");
          }}
          onBlur={() => blurField("phone")}
          placeholder="+92 300 1234567"
          className={INPUT_CLS}
          aria-invalid={Boolean(errors.phone)}
        />
      </Field>

      <div className="mt-6">
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            ref={setFieldRef("confirmation")}
            type="checkbox"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              setTouched((current) => ({ ...current, confirmation: true }));
              setServerErrors((current) => {
                const next = { ...current };
                delete next.confirmation;
                return next;
              });
            }}
            onBlur={() => blurField("confirmation")}
            className="mt-0.5 h-4 w-4 accent-orange-600"
            aria-invalid={Boolean(errors.confirmation)}
          />
          <span>
            I confirm I am the authorized representative of this university and the information provided is accurate.
          </span>
        </label>
        {fieldError("confirmation")}
      </div>

      {errors.form && <p className="mt-4 text-sm text-red-600" role="alert">{errors.form}</p>}

      <div className="mt-8 flex items-center gap-3 border-t border-gray-100 pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || loadingUnis || Boolean(loadError)}
          className="flex-1 rounded-xl bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit for Verification"}
        </button>
      </div>
    </form>
  );
}

function isValidLetter(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["pdf", "png", "jpg", "jpeg"].includes(extension) &&
    file.size >= 10 * 1024 &&
    file.size <= 5 * 1024 * 1024;
}

function Field({ label, required, hint, error, children }) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-gray-400">{hint}</p>}
      {children}
      {error}
    </div>
  );
}
