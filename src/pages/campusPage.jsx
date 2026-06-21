import React, { useState, useEffect } from "react";
import BentoStats from "../components/campus/bentoStats";
import ApplyCard from "../components/campus/applyCard";
import CampusHeroSection from "../components/campus/CampusHeroSection";
import CampusDetail from "../components/campus/campusDetail";

const SECTION_IDS = ["programs", "facilities", "hostels", "transport"];

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDjqx4Q5HsN1EMdWLtHyai0AtLdvkvKjsB2BU6U-wS4nuKYw9psoXSfwas7b9KmLMItdNOq9qizUhwpbJF50XHrqz5asjmznGdpKhjQq1D6IzdHlz4exVtRYSfnTcCFrv_yb3snvRMYbBTEZQfL8hf45JgWS1W32BxRNQKWhzLPnH3HH3CDvt__-TD94I7swJfM08hWlGd4RJgg0PsAD7iHC0fQyi7TobRFaL-q8xlwRPywCUgYQKEiHL9vg2ViRHx5i3DNrcjrAwC8";

export default function CampusPage() {
  const [activeSection, setActiveSection] = useState("programs");

  useEffect(() => {
    const handler = () => {
      let current = "";
      SECTION_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 160) {
            current = id;
          }
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleApply = () => {
    console.log("Apply clicked");
    // Add your apply logic here - e.g., open modal, navigate to form, etc.
  };

  const handleDownload = () => {
    console.log("Download prospectus clicked");
    // Add download logic here - e.g., download PDF
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="bg-white text-slate-800">
      <CampusHeroSection
        universityName="Tech-Poly University"
        location="Silicon Valley Innovation Hub"
        campusType="Main Campus"
        heroImage={HERO_IMAGE}
        onBack={handleBack}
        onApply={handleApply}
      />
      <BentoStats heroImage={HERO_IMAGE} onApply={handleApply} />
      {/* <StickyTabs activeSection={activeSection} /> */}
      <CampusDetail />
      {/* <LocationSection /> */}
      <ApplyCard onApply={handleApply} onDownload={handleDownload} />
    </div>
  );
}
