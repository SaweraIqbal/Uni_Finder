import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CompareCampusesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedIds = [], filters = {} } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        <span className="text-6xl mb-6 block">📊</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Compare Campuses</h1>
        <p className="text-gray-500 mb-6">
          Comparison view coming soon. You selected {selectedIds.length} campus{selectedIds.length !== 1 ? "es" : ""}.
        </p>
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selected Campus IDs</p>
          <ul className="space-y-1">
            {selectedIds.map((id) => (
              <li key={id} className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></span>
                {id}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-all"
        >
          ← Back to Search
        </button>
      </div>
    </div>
  );
}