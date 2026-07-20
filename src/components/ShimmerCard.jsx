import React from "react";

export default function ShimmerCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="h-40 shimmer" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 rounded shimmer w-3/4" />
        <div className="h-3 rounded shimmer w-1/2" />
        <div className="h-3 rounded shimmer w-3/5" />
        <hr className="border-t border-gray-100 my-2" />
        <div className="h-3 rounded shimmer w-2/5" />
        <div className="h-9 rounded-lg shimmer w-full mt-1" />
      </div>
    </div>
  );
}
