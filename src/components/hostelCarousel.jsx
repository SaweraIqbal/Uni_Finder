import { useRef } from "react";

const hostels = [
  {
    id: 1,
    name: "Green View Residency",
    distance: "0.5 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8F1NDAlWj8hG2dLX6MBqLfw4mn3zeBRgNU1DPwT_RS7pyBBWJw2FzDWRxfFXffDvyRn1W6lohQUtieCvfVehCMW2ealV50AAmboDUPCftwmpUtPbUb89eyVMXBLdHDId9WZVTublqUHyYZ7s4yWDK_o5pqGOR0j-6KKiEDd51u2c_Unq8rMt-vr-RZPs8NpnZg6REQGO2gKKVuK7zAYi-hfD-Tp2OVagN7plYOo7j8QXQVfxRlYI0uuG5aBN5nk63QblkmBlYAyw",
  },
  {
    id: 2,
    name: "University Heights",
    distance: "0.8 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAIzQzApz2SRxh5g4chkZLvkBWg4bb_eaFpniEHPQbYYj49IDEiNQUPTgXIVd8eIhLEnUyKNohqYNaz-f21ulRd_R0Rfd2zsVDkH0TXyV_jex-YEIhUukP_xRozV1Zofk370RWH4ts75_hDRfW2MYxAuy6ST0nt1dkpa6itkGPomQbu5n2C3RSknxcQ-NDizDZuyZSjRGcEppznoQsCc8OsC4qsgEatYX5xFbOdp1mLFxe_5Rrgwm07Nn2xnqMmCSzBaSioKFG-aMw",
  },
  {
    id: 3,
    name: "Pine Street Commons",
    distance: "1.2 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyodUoSAdxB_aG0B3S7D_1kl7Ohuu8x2IP0WklxBhECK-h8t1wFzL5sObMf1coA1J6lHsZgal-OZ_Qj9UG10UVACaXJtxTiqDZEtCYizLauTaxn0kyS5-nOjRHhtyZHkm2m8eYQMUE8erUB6dh8M3fe1kGV9Y7nZDysh-LnnrSRFeSCPjWEx8pyJWa089yo6X8dRQQn6EPw0CFGJ_xwCOZAGxAXiQ4GLLq2x_SB3uV9hhVgTeYCgfqll1CZfrYq8CUweAMPM4dyy4",
  },
  {
    id: 4,
    name: "Heritage House",
    distance: "0.3 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7cqam7b5R8MxO5RQPr2ZtckiMnXvinJK-hFDjVL1n8g4T6_ubOc0kZuOBa4ZzgcpKfai_Rt7nPQucsKDeXYEygHrRfJh3WU6LMPYi90sjVU18FFYwvzO7yO33bjWGvArjzzMpgrZ4EruQISNFmqdzN8TA8BbTFXSVWpA0GI4uujki6F0HMkii5F2Or9JMQ1VgbsHK1iyFYluucWhBGv_7AFXj110pK7DiRep2FytRoUdPevPTXzXmGguxNFZ4KQbAsLAVApwnU5I",
  },
  {
    id: 5,
    name: "Green View Residency",
    distance: "0.5 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8F1NDAlWj8hG2dLX6MBqLfw4mn3zeBRgNU1DPwT_RS7pyBBWJw2FzDWRxfFXffDvyRn1W6lohQUtieCvfVehCMW2ealV50AAmboDUPCftwmpUtPbUb89eyVMXBLdHDId9WZVTublqUHyYZ7s4yWDK_o5pqGOR0j-6KKiEDd51u2c_Unq8rMt-vr-RZPs8NpnZg6REQGO2gKKVuK7zAYi-hfD-Tp2OVagN7plYOo7j8QXQVfxRlYI0uuG5aBN5nk63QblkmBlYAyw",
  },
  {
    id: 6,
    name: "University Heights",
    distance: "0.8 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAIzQzApz2SRxh5g4chkZLvkBWg4bb_eaFpniEHPQbYYj49IDEiNQUPTgXIVd8eIhLEnUyKNohqYNaz-f21ulRd_R0Rfd2zsVDkH0TXyV_jex-YEIhUukP_xRozV1Zofk370RWH4ts75_hDRfW2MYxAuy6ST0nt1dkpa6itkGPomQbu5n2C3RSknxcQ-NDizDZuyZSjRGcEppznoQsCc8OsC4qsgEatYX5xFbOdp1mLFxe_5Rrgwm07Nn2xnqMmCSzBaSioKFG-aMw",
  },
  {
    id: 7,
    name: "Pine Street Commons",
    distance: "1.2 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyodUoSAdxB_aG0B3S7D_1kl7Ohuu8x2IP0WklxBhECK-h8t1wFzL5sObMf1coA1J6lHsZgal-OZ_Qj9UG10UVACaXJtxTiqDZEtCYizLauTaxn0kyS5-nOjRHhtyZHkm2m8eYQMUE8erUB6dh8M3fe1kGV9Y7nZDysh-LnnrSRFeSCPjWEx8pyJWa089yo6X8dRQQn6EPw0CFGJ_xwCOZAGxAXiQ4GLLq2x_SB3uV9hhVgTeYCgfqll1CZfrYq8CUweAMPM4dyy4",
  },
  {
    id: 8,
    name: "Heritage House",
    distance: "0.3 miles from campus",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7cqam7b5R8MxO5RQPr2ZtckiMnXvinJK-hFDjVL1n8g4T6_ubOc0kZuOBa4ZzgcpKfai_Rt7nPQucsKDeXYEygHrRfJh3WU6LMPYi90sjVU18FFYwvzO7yO33bjWGvArjzzMpgrZ4EruQISNFmqdzN8TA8BbTFXSVWpA0GI4uujki6F0HMkii5F2Or9JMQ1VgbsHK1iyFYluucWhBGv_7AFXj110pK7DiRep2FytRoUdPevPTXzXmGguxNFZ4KQbAsLAVApwnU5I",
  },
];

function HostelCard({ hostel }) {
  return (
    <article className="min-w-[280px] max-w-[280px] bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1 transition-all duration-200 scroll-snap-align-start">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={hostel.image}
          alt={hostel.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {hostel.premium && (
          <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Premium
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-[15px] mb-1.5">
          {hostel.name}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 flex-shrink-0 text-orange-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {hostel.distance}
        </div>

        <button className="w-full py-2 border border-orange-500 text-orange-500 text-sm font-medium rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-150 active:scale-95">
          View details
        </button>
      </div>
    </article>
  );
}

export default function HostelCarousel() {
  const trackRef = useRef(null);

  const scroll = (direction) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: direction * 294, behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-5 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
            Accommodation
          </p>
          <h2 className="text-2xl font-bold text-gray-800">Nearby hostels</h2>
        </div>

        {/* Nav buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-3.5 overflow-x-auto px-6 pb-4 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {hostels.map((hostel) => (
          <HostelCard key={hostel.id} hostel={hostel} />
        ))}
      </div>
    </section>
  );
}
