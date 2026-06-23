import React from "react";

export default function AdvancedFilters({ filters, setFilters, onResetAll }) {
  const handleAdmissionChange = (status) =>
    setFilters((prev) => ({ ...prev, admissionStatus: status }));

  const handleGenderChange = (gender) =>
    setFilters((prev) => ({
      ...prev,
      genderType: prev.genderType.includes(gender)
        ? prev.genderType.filter((g) => g !== gender)
        : [...prev.genderType, gender],
    }));

  const handleEntryTestChange = (test) =>
    setFilters((prev) => ({
      ...prev,
      entryTests: prev.entryTests.includes(test)
        ? prev.entryTests.filter((t) => t !== test)
        : [...prev.entryTests, test],
    }));

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
        <button
          onClick={onResetAll}
          className="text-sm text-orange-500 hover:underline"
        >
          Reset All
        </button>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Admission Status</h4>
        <div className="flex gap-1 flex-wrap">
          {[
            { label: "🟢 Open", value: "open" },
            { label: "⚪ Closed", value: "closed" },
            { label: "🔵 Coming", value: "coming" },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => handleAdmissionChange(status.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition ${
                filters.admissionStatus === status.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Campus Gender Type</h4>
        <div className="space-y-2">
          {["Co-Education", "Women Only", "Men Only"].map((gender) => (
            <label
              key={gender}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.genderType.includes(gender)}
                onChange={() => handleGenderChange(gender)}
                className="w-3.5 h-3.5 accent-orange-500"
              />
              <span className="text-sm text-gray-600">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Minimum Marks: {filters.minMarks}%
        </h4>
        <input
          type="range"
          min="50"
          max="100"
          value={filters.minMarks}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minMarks: parseInt(e.target.value),
            }))
          }
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Tuition Fee Range (PKR)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min Fee"
            value={filters.minFee === 0 ? "" : filters.minFee}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minFee: e.target.value === "" ? 0 : parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
          />
          <input
            type="number"
            placeholder="Max Fee"
            value={filters.maxFee === 1000000 ? "" : filters.maxFee}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxFee:
                  e.target.value === "" ? 1000000 : parseInt(e.target.value),
              }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">
          Entry Test Requirement
        </h4>
        <div className="space-y-2">
          {[
            "No Test Required",
            "ECAT",
            "MDCAT",
            "NAT",
            "GAT",
            "NTS",
            "University Own Test",
          ].map((test) => (
            <label key={test} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.entryTests.includes(test)}
                onChange={() => handleEntryTestChange(test)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-gray-700 text-sm">{test}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-700 mb-3">Hostel Availability</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hostelAvailable}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                hostelAvailable: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-gray-700">Hostel Available</span>
        </label>
      </div>
    </div>
  );
}
