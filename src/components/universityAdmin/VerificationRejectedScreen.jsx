import React from "react";

export default function VerificationRejectedScreen({
  verification,
  onResubmit,
}) {
  return (
    <div>
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mx-auto mb-4">
          ❌
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Verification Rejected
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
          Unfortunately your request for{" "}
          <span className="font-semibold text-gray-700">
            {verification?.university_name}
          </span>{" "}
          was not approved.
        </p>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mt-4">
        <p className="text-sm text-red-500 font-medium mb-1">Reason</p>
        <p className="text-red-700 text-sm leading-relaxed">
          {verification?.reject_reason || "Not specified."}
        </p>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onResubmit}
          className="bg-[#c88410] hover:bg-[#a66d0d] text-white px-6 py-3 rounded-xl font-medium transition"
        >
          Re-submit Application
        </button>
      </div>
    </div>
  );
}
