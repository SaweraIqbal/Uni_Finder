// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import heroVideo from "../assets/video2.mp4";
// import SearchBar from "../components/SearchBar";
// import ShimmerCard from "../components/ShimmerCard";
// import AdvancedFilters from "../components/AdvancedFilters";
// import { searchCampuses, campusImage } from "../api/campus";
// import { fileUrl } from "../api/client";

// const DEFAULT_FILTERS = {
//   admissionStatus: "",
//   genderType: [],
//   minMarks: 50,
//   minFee: 0,
//   maxFee: 1000000,
//   entryTests: [],
//   hostelAvailable: false,
// };

// const feeNumber = (fee) => {
//   const digits = String(fee || "").replace(/[^0-9]/g, "");
//   return digits ? parseInt(digits, 10) : null;
// };

// export default function ExplorePage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const initial = location.state || {};

//   const [searchValues, setSearchValues] = useState({
//     program: initial.program || "",
//     city: initial.city || "",
//     university: initial.university || "",
//   });
//   const [filters, setFilters] = useState(DEFAULT_FILTERS);
//   const [campuses, setCampuses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     const s = location.state || {};
//     setSearchValues({
//       program: s.program || "",
//       city: s.city || "",
//       university: s.university || "",
//     });
//   }, [location.state]);

//   useEffect(() => {
//     let active = true;
//     (async () => {
//       setLoading(true);
//       try {
//         const data = await searchCampuses(searchValues);
//         if (active) setCampuses(Array.isArray(data) ? data : []);
//       } catch {
//         if (active) setCampuses([]);
//       } finally {
//         if (active) setLoading(false);
//       }
//     })();
//     return () => {
//       active = false;
//     };
//   }, [searchValues.program, searchValues.city, searchValues.university]);

//   const filtered = campuses.filter((c) => {
//     const fee = feeNumber(c.fee);
//     if (fee !== null && (fee < filters.minFee || fee > filters.maxFee))
//       return false;
//     return true;
//   });

//   const activeFilters = [
//     searchValues.program && `Program: ${searchValues.program}`,
//     searchValues.city && `City: ${searchValues.city}`,
//     searchValues.university && `University: ${searchValues.university}`,
//   ].filter(Boolean);

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
//         <video
//           autoPlay
//           loop
//           muted
//           playsInline
//           preload="auto"
//           className="absolute w-full h-full object-cover"
//         >
//           <source src={heroVideo} type="video/mp4" />
//         </video>
//         <div className="absolute inset-0 bg-black bg-opacity-50"></div>
//         <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-white">
//           <div className="text-center max-w-3xl mx-auto mb-10">
//             <h2 className="text-4xl md:text-5xl font-bold mb-4">
//               Explore Campuses Across Pakistan
//             </h2>
//             <p className="text-lg">
//               Search campuses by program, city and university.
//             </p>
//           </div>
//           <SearchBar
//             searchValues={searchValues}
//             onSearchChange={setSearchValues}
//             resultsPath="/explore"
//           />
//         </div>
//       </section>
//       <section className="max-w-7xl mx-auto px-6 py-10">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//           <div className="lg:col-span-1">
//             <AdvancedFilters
//               filters={filters}
//               setFilters={setFilters}
//               onResetAll={() => setFilters(DEFAULT_FILTERS)}
//             />
//           </div>
//           <div className="lg:col-span-3">
//             <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
//               <p className="text-sm text-gray-500">
//                 Showing{" "}
//                 <span className="font-semibold text-gray-700">
//                   {filtered.length}
//                 </span>{" "}
//                 {filtered.length === 1 ? "campus" : "campuses"}
//               </p>
//               <div className="flex flex-wrap gap-2">
//                 {activeFilters.map((f) => (
//                   <span
//                     key={f}
//                     className="text-[11px] bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full"
//                   >
//                     {f}
//                   </span>
//                 ))}
//               </div>
//             </div>

//             {loading ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
//                 {Array.from({ length: 6 }).map((_, i) => (
//                   <ShimmerCard key={i} />
//                 ))}
//               </div>
//             ) : filtered.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-20 text-center">
//                 <span className="text-5xl mb-4">🔍</span>
//                 <h3 className="text-lg font-semibold text-gray-700 mb-1">
//                   No campuses found
//                 </h3>
//                 <p className="text-sm text-gray-400">
//                   Try a different city, university or program.
//                 </p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
//                 {filtered.map((c) => (
//                   <div
//                     key={c.id}
//                     className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
//                   >

//                     <div className="relative h-40 overflow-hidden">
//                       <img
//                         src={campusImage(c, fileUrl)}
//                         alt={c.name}
//                         className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
//                       />
//                       <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold text-white bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full">
//                         {c.university_name || "University"}
//                       </span>
//                     </div>

//                     <div className="p-5">
//                       <h3 className="font-semibold text-[15px] text-gray-900 mb-1">
//                         {c.name}
//                       </h3>
//                       {c.city && (
//                         <p className="text-xs text-gray-400 mb-2">📍 {c.city}</p>
//                       )}
//                       {c.history && (
//                         <p className="text-xs text-gray-500 mb-3 line-clamp-2">
//                           {c.history}
//                         </p>
//                       )}

//                       <div className="flex items-center justify-between text-xs mb-4">
//                         <span className="text-gray-400">{c.duration || ""}</span>
//                         {c.fee && (
//                           <span className="font-medium text-orange-600">
//                             {c.fee}
//                           </span>
//                         )}
//                       </div>

//                       <button
//                         onClick={() => navigate(`/campus?id=${c.id}`)}
//                         className="w-full py-2 text-xs font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95"
//                       >
//                         View details
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }
