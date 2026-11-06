import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchCampusesForProgram } from "../api/university";

function ProgramSearchResults() {
  const [searchParams] = useSearchParams();
  const program = searchParams.get("program") || "";
  const level = searchParams.get("level") || "";
  const queryKey = `${program}|${level}`;
  const [state, setState] = useState({ queryKey: "", rows: [], error: "" });

  useEffect(() => {
    let active = true;
    searchCampusesForProgram({ program, level })
      .then((rows) => {
        if (active) setState({ queryKey, rows, error: "" });
      })
      .catch((error) => {
        if (active) setState({ queryKey, rows: [], error: error.message });
      });

    return () => {
      active = false;
    };
  }, [program, level, queryKey]);
  const loading = state.queryKey !== queryKey;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm font-semibold text-orange-600 hover:underline">
          Back to search
        </Link>
        <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
          Campuses offering {program || "this program"}
        </h1>
        {level && <p className="mt-1 text-sm text-gray-500">{level}</p>}

        {loading && <p className="mt-8 text-gray-600" role="status">Loading campuses...</p>}
        {!loading && state.error && <p className="mt-8 text-red-600" role="alert">{state.error}</p>}
        {!loading && !state.error && state.rows.length === 0 && (
          <p className="mt-8 rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No active campus offerings were found for this program.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {!loading && state.rows.map((row) => (
            <li key={`${row.campus_id}-${row.program_name}-${row.level || ""}`} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{row.campus_name}</h2>
                  <p className="mt-1 text-sm text-gray-600">{row.university_name}</p>
                  {row.city && <p className="mt-1 text-sm text-gray-500">{row.city}</p>}
                  <p className="mt-2 text-sm text-gray-700">{row.label}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:min-w-56">
                  <dt className="text-gray-500">Fee</dt>
                  <dd className="font-medium text-gray-900">{row.fee || "Not listed"}</dd>
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium text-gray-900">{row.duration || "Not listed"}</dd>
                  <dt className="text-gray-500">Shifts</dt>
                  <dd className="font-medium text-gray-900">{row.shifts || "Not listed"}</dd>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default ProgramSearchResults;
