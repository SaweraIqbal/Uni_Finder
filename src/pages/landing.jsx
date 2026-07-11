import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import heroVideo from "../assets/video2.mp4";
import ShimmerCard from "../components/ShimmerCard";
import SearchBar from "../components/SearchBar";
import StatsSection from "../components/StatsSection";
import { listUniversities } from "../api/university";
import { fileUrl } from "../api/client";

const DEFAULT_COVER =
  "https://i.pinimg.com/736x/7a/39/0b/7a390b0d75f6973efed81f41df0038d0.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchValues, setSearchValues] = useState({
    program: "",
    city: "",
    university: "",
  });

  const [loading, setLoading] = useState(true);

  const [uniList, setUniList] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listUniversities();
        if (active && Array.isArray(data)) {
          setUniList(
            data.map((u) => {


              const cover = u.cover_image || u.banner_url;
              return {
                id: u.id,
                name: u.name,
                location: u.city || "—",
                program: u.tagline || "View details for programs",
                image: cover ? fileUrl(cover) : DEFAULT_COVER,
                logo: u.logo_url ? fileUrl(u.logo_url) : null,
              };
            }),
          );
        }
      } catch {
        if (active) setUniList([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const [programQuery, setProgramQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [universityQuery, setUniversityQuery] = useState("");

  const [programSuggestions, setProgramSuggestions] = useState([]);
  const [UniversitySuggestions, setUniversitySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const programs = [
    "BS Computer Science",
    "BS Software Engineering",
    "Engineering",
  ];
  const cities = ["Lahore", "Karachi", "Islamabad"];
  const universitiesList = ["LUMS Lahore", "FAST University", "NUST Islamabad"];

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />{" "}
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>{" "}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-white">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Future at the Perfect University
            </h2>
            <p className="text-lg">
              Discover top universities, compare programs, and start your
              journey today.
            </p>
          </div>
          <SearchBar
            searchValues={searchValues}
            onSearchChange={setSearchValues}
            resultsPath="/explore"
          />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Why Choose UniFinder?</h2>
          <p className="text-gray-600 mb-12">
            We help students find the best universities quickly and easily
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl shadow hover:shadow-lg transition">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-semibold text-lg mb-2">Top Universities</h3>
              <p className="text-gray-600 text-sm">
                Discover the best universities across Pakistan with updated
                data.
              </p>
            </div>

            <div className="p-6 rounded-xl shadow hover:shadow-lg transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Fast & Easy Search</h3>
              <p className="text-gray-600 text-sm">
                Find universities by program, city, and fee in seconds.
              </p>
            </div>

            <div className="p-6 rounded-xl shadow hover:shadow-lg transition">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="font-semibold text-lg mb-2">Career Focused</h3>
              <p className="text-gray-600 text-sm">
                Choose programs that match your future career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-2">
        <h2 className="text-3xl font-bold text-gray-800">Universities</h2>
        <p className="text-gray-500 text-sm mt-1">
          Verified universities added by their administrators.
        </p>
      </div>

      {!loading && uniList.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <span className="text-5xl mb-4 block">🏫</span>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No universities yet
          </h3>
          <p className="text-sm text-gray-400">
            Approved universities will appear here once admins add them.
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ShimmerCard key={i} />)
            : uniList.map((uni) => (
                <div
                  key={uni.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-200"
                >

                  <div className="h-40 overflow-hidden">
                    <img
                      src={uni.image}
                      alt={uni.name}
                      className="w-full h-full object-cover transition-transform duration-400 hover:scale-105"
                    />
                  </div>


                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      {uni.logo && (
                        <img
                          src={uni.logo}
                          alt={`${uni.name} logo`}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      )}
                      <p className="font-medium text-[14px] text-gray-900">
                        {uni.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">
                      {uni.location}
                    </p>
                    <p className="text-xs text-gray-400 mb-2">{uni.program}</p>

                    <hr className="border-t border-gray-100 my-2" />


                    <button
                      onClick={() => navigate(`/university?id=${uni.id}`)}
                      className="w-full py-2 text-xs font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95 mt-1"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}
        </div>
      )}
      <StatsSection />
    </div>
  );
}