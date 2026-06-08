import React from "react";

export default function ShimmerCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="h-40 bg-gray-200 animate-pulse" />
      <div className="p-3.5 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
        <hr className="border-t border-gray-100 my-2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/5" />
        <div className="h-3.5 bg-orange-100 rounded animate-pulse w-1/2" />
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-full mt-1" />
      </div>
    </div>
  );
}
