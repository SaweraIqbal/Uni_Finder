// import React, { useState } from "react";
// import {
//   FiStar,
//   FiThumbsUp,
//   FiMessageSquare,
//   FiPlus,
//   FiCheckCircle,
//   FiX
// } from "react-icons/fi";
// import { toast } from "react-toastify";

// const initialReviews = [
//   {
//     id: 1,
//     name: "Ahmed Raza",
//     role: "BS CS Student at FAST-NUCES Lahore",
//     tag: "CS Students",
//     rating: 5,
//     text: "UniFinder completely changed how I approached my university admission. The side-by-side comparison tool saved me days of spreadsheet research, and finding a verified hostel near FAST campus was a lifesaver!",
//     avatar: "https://ui-avatars.com/api/?name=Ahmed+Raza&background=f97316&color=fff",
//     likes: 34,
//     verified: true,
//     date: "2 weeks ago"
//   },
//   {
//     id: 2,
//     name: "Fatima Khan",
//     role: "BBA Student at LUMS",
//     tag: "Business Students",
//     rating: 5,
//     text: "As an out-of-city student coming from Faisalabad to Lahore, finding a safe and clean hostel was my parents' biggest concern. The audited hostels on UniFinder gave us complete peace of mind before moving.",
//     avatar: "https://ui-avatars.com/api/?name=Fatima+Khan&background=f97316&color=fff",
//     likes: 49,
//     verified: true,
//     date: "1 month ago"
//   },
//   {
//     id: 3,
//     name: "Bilal Ahmed",
//     role: "Electrical Eng. Student at NUST Islamabad",
//     tag: "Hostelites",
//     rating: 5,
//     text: "The budget and aggregate calculator was spot on! I knew exactly what my 4-year degree would cost down to mess fees. Highly recommend to every intermediate & A-level student across Pakistan.",
//     avatar: "https://ui-avatars.com/api/?name=Bilal+Ahmed&background=f97316&color=fff",
//     likes: 28,
//     verified: true,
//     date: "3 weeks ago"
//   }
// ];

// const tags = ["All Reviews", "CS Students", "Business Students", "Hostelites"];

// export default function Reviews() {
//   const [reviewsList, setReviewsList] = useState(initialReviews);
//   const [selectedTag, setSelectedTag] = useState("All Reviews");
//   const [likedReviews, setLikedReviews] = useState({});

//   // Review Modal State
//   const [showReviewModal, setShowReviewModal] = useState(false);
//   const [newReviewName, setNewReviewName] = useState("");
//   const [newReviewRole, setNewReviewRole] = useState("");
//   const [newReviewText, setNewReviewText] = useState("");
//   const [newReviewRating, setNewReviewRating] = useState(5);

//   const handleLike = (id) => {
//     setLikedReviews((prev) => {
//       const isAlreadyLiked = prev[id];
//       const newStatus = !isAlreadyLiked;

//       setReviewsList((list) =>
//         list.map((r) =>
//           r.id === id ? { ...r, likes: r.likes + (newStatus ? 1 : -1) } : r
//         )
//       );

//       toast.info(newStatus ? "👍 Marked as helpful review" : "Unliked review");
//       return { ...prev, [id]: newStatus };
//     });
//   };

//   const handleAddReview = (e) => {
//     e.preventDefault();
//     if (!newReviewName || !newReviewText) {
//       toast.error("Please fill in your name and review");
//       return;
//     }

//     const createdReview = {
//       id: Date.now(),
//       name: newReviewName,
//       role: newReviewRole || "Student",
//       tag: "CS Students",
//       rating: Number(newReviewRating),
//       text: newReviewText,
//       avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newReviewName)}&background=f97316&color=fff`,
//       likes: 1,
//       verified: true,
//       date: "Just now"
//     };

//     setReviewsList([createdReview, ...reviewsList]);
//     setShowReviewModal(false);
//     setNewReviewName("");
//     setNewReviewRole("");
//     setNewReviewText("");
//     toast.success("🎉 Thank you! Your review has been published.");
//   };

//   const filteredReviews = selectedTag === "All Reviews"
//     ? reviewsList
//     : reviewsList.filter((r) => r.tag === selectedTag);

//   return (
//     <section id="reviews" className="bg-gradient-to-b from-gray-50/70 via-white to-gray-50/70 py-24 relative">
//       <div className="max-w-7xl mx-auto px-6">

//         {/* Header */}
//         <div className="text-center mb-12">
//           <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full mb-4">
//             <FiMessageSquare className="w-3.5 h-3.5" />
//             Verified Student Feedback
//           </span>
//           <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
//             What Students <span className="text-orange-500">Say About UniFinder</span>
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto text-base">
//             Over 25,000 students trust UniFinder for university admissions, fee calculations, and hostel reservations.
//           </p>
//         </div>

//         {/* Rating Summary Bar & Actions */}
//         <div className="bg-white border border-gray-200/80 p-6 rounded-3xl shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
//           <div className="flex items-center gap-4">
//             <div className="text-4xl font-extrabold text-slate-900">4.9</div>
//             <div>
//               <div className="flex items-center gap-1 text-amber-400">
//                 {[...Array(5)].map((_, i) => (
//                   <FiStar key={i} className="w-5 h-5 fill-amber-400" />
//                 ))}
//               </div>
//               <p className="text-xs text-gray-500 mt-1 font-semibold">
//                 Based on 10,000+ Verified Student Reviews
//               </p>
//             </div>
//           </div>

//           {/* Tags */}
//           <div className="flex flex-wrap items-center gap-2">
//             {tags.map((t) => (
//               <button
//                 key={t}
//                 onClick={() => setSelectedTag(t)}
//                 className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
//                   selectedTag === t
//                     ? "bg-slate-900 text-white"
//                     : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
//                 }`}
//               >
//                 {t}
//               </button>
//             ))}
//           </div>

//           <button
//             onClick={() => setShowReviewModal(true)}
//             className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-2 whitespace-nowrap"
//           >
//             <FiPlus className="w-4 h-4" />
//             <span>Write a Review</span>
//           </button>
//         </div>

//         {/* Reviews Grid */}
//         <div className="grid md:grid-cols-3 gap-8">
//           {filteredReviews.map((review) => {
//             const isLiked = likedReviews[review.id];
//             return (
//               <div
//                 key={review.id}
//                 className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-1"
//               >
//                 <div>
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center gap-1 text-amber-400">
//                       {[...Array(review.rating)].map((_, i) => (
//                         <FiStar key={i} className="w-4 h-4 fill-amber-400" />
//                       ))}
//                     </div>
//                     <span className="text-[11px] font-bold text-gray-400">{review.date}</span>
//                   </div>

//                   <p className="text-sm text-gray-700 leading-relaxed font-normal mb-6 italic">
//                     "{review.text}"
//                   </p>
//                 </div>

//                 <div>
//                   <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
//                     <img
//                       src={review.avatar}
//                       alt={review.name}
//                       className="w-11 h-11 rounded-full object-cover border-2 border-orange-200"
//                     />
//                     <div className="flex-1 min-w-0">
//                       <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1">
//                         {review.name}
//                         {review.verified && (
//                           <FiCheckCircle className="text-orange-500 w-3.5 h-3.5 flex-shrink-0" />
//                         )}
//                       </h4>
//                       <p className="text-xs text-gray-500 truncate font-medium">{review.role}</p>
//                     </div>
//                   </div>

//                   {/* Interactive Like Counter */}
//                   <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-2">
//                     <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
//                       ✓ Verified Student
//                     </span>

//                     <button
//                       onClick={() => handleLike(review.id)}
//                       className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-semibold ${
//                         isLiked
//                           ? "bg-orange-100 text-orange-600 font-bold"
//                           : "bg-gray-100 hover:bg-gray-200 text-gray-600"
//                       }`}
//                     >
//                       <FiThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-orange-500" : ""}`} />
//                       <span>{review.likes} Helpful</span>
//                     </button>
//                   </div>
//                 </div>

//               </div>
//             );
//           })}
//         </div>

//       </div>

//       {/* Write Review Interactive Modal */}
//       {showReviewModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
//           <div className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-orange-100">
//             <button
//               onClick={() => setShowReviewModal(false)}
//               className="absolute top-5 right-5 text-gray-400 hover:text-slate-800 bg-gray-100 p-2 rounded-full transition"
//             >
//               <FiX className="w-5 h-5" />
//             </button>

//             <h3 className="text-xl font-bold text-slate-900 mb-1">
//               Share Your UniFinder Experience
//             </h3>
//             <p className="text-xs text-gray-500 mb-6">
//               Help fellow students make smart university & hostel choices.
//             </p>

//             <form onSubmit={handleAddReview} className="space-y-4">
//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name</label>
//                 <input
//                   type="text"
//                   required
//                   value={newReviewName}
//                   onChange={(e) => setNewReviewName(e.target.value)}
//                   placeholder="e.g. Sara Malik"
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1">University & Program</label>
//                 <input
//                   type="text"
//                   value={newReviewRole}
//                   onChange={(e) => setNewReviewRole(e.target.value)}
//                   placeholder="e.g. BS CS Student at FAST Lahore"
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1">Rating</label>
//                 <select
//                   value={newReviewRating}
//                   onChange={(e) => setNewReviewRating(e.target.value)}
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-500"
//                 >
//                   <option value="5">⭐⭐⭐⭐⭐ (5/5) Excellent</option>
//                   <option value="4">⭐⭐⭐⭐ (4/5) Very Good</option>
//                   <option value="3">⭐⭐⭐ (3/5) Average</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1">Your Review</label>
//                 <textarea
//                   rows="3"
//                   required
//                   value={newReviewText}
//                   onChange={(e) => setNewReviewText(e.target.value)}
//                   placeholder="How did UniFinder help you with your university search or hostel booking?"
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition text-sm"
//               >
//                 Submit Review
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }
