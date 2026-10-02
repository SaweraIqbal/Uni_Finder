import React from "react";

export default function VerificationPendingScreen({
  verification,
  checking,
  onRefresh,
}) {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-4">
        ⏳
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Application Under Review
      </h1>
      <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
        Thank you! Your verification request for{" "}
        <span className="font-semibold text-gray-700">
          {verification?.university_name}
        </span>{" "}
        has been submitted and is being reviewed by our SuperAdmin.
      </p>
      <p className="text-gray-400 text-xs leading-relaxed max-w-md mx-auto mt-3">
        You'll be notified at{" "}
        <span className="font-medium text-gray-500">
          {verification?.official_email || "your email"}
        </span>{" "}
        once a decision is made. As soon as you're approved, this page
        automatically becomes your full University Admin Dashboard.
      </p>
      <button
        onClick={onRefresh}
        disabled={checking}
        className="mt-6 text-sm px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium disabled:opacity-60 transition"
      >
        {checking ? "Checking…" : "Check Status"}
      </button>
      <p className="text-xs text-gray-300 mt-3">
        We also re-check automatically every minute.
      </p>
    </div>
  );
}
