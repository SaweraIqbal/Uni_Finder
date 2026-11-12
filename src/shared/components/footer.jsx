import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white mt-16">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">

      
        <div>
          <h2 className="text-orange-500 text-2xl font-bold mb-4">
            UniFinder
          </h2>
          <p className="text-gray-400 text-sm leading-7">
            Helping students choose the right university, program, and career path with smart guidance and AI support.
          </p>
        </div>

 
        <div>
          <h3 className="font-semibold text-lg mb-4 text-white">Support</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">
                Student Guidance
            </li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Admission Help</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Contact Support</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Scholarship Info</li>
          </ul>
        </div>

      
        <div>
          <h3 className="font-semibold text-lg mb-4 text-white">Discover</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Top Universities</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Programs Comparison</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Career Paths</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Scholarships</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Guides & Articles</li>
          </ul>
        </div>

      
        <div>
          <h3 className="font-semibold text-lg mb-4 text-white">Company</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">About Us</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Privacy Policy</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Terms of Use</li>
            <li className="hover:text-white hover:underline hover:decoration-orange-400 hover:decoration-2 underline-offset-4 transition cursor-pointer">Contact Us</li>
          </ul>
        </div>

      </div>

    
      <div className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} <span className="text-orange-400 font-medium">UniFinder</span>. All rights reserved.
      </div>

    </footer>
  );
}