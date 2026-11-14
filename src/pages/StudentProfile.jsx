/**
 * StudentProfile.jsx  — /profile  (replaces the old 3-step profile.jsx)
 * Full student profile hub: summary card, sticky desktop nav, section cards.
 * All level-gating is driven by profileRequirements.js — zero hardcoded rules here.
 */
import { useState, useEffect, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchProfile, fetchCompleteness, saveProfile } from "../api/studentProfile";
import { isSectionVisible } from "../config/profileRequirements";
import { useAuth } from "../context/AuthContext";

import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";
import UnsavedWarning     from "../components/profile/UnsavedWarning";

import PersonalInfoSection      from "../components/profile/sections/PersonalInfoSection";
import AcademicRecordsSection   from "../components/profile/sections/AcademicRecordsSection";
import EntryTestSection         from "../components/profile/sections/EntryTestSection";
import ResearchProfileSection   from "../components/profile/sections/ResearchProfileSection";
import ReferencesSection        from "../components/profile/sections/ReferencesSection";
import AdmissionPreferencesSection from "../components/profile/sections/AdmissionPreferencesSection";

// ── Section navigation config ─────────────────────────────────────────────────
const SECTIONS = [
  { id: "personal",    label: "Personal Information", alwaysVisible: true },
  { id: "academic",    label: "Academic Records",      alwaysVisible: true },
  { id: "tests",       label: "Entry Test Scores",     alwaysVisible: true },
  { id: "research",    label: "Research Profile",      visibilityKey: "researchProfile" },
  { id: "references",  label: "References",            visibilityKey: "references" },
  { id: "preferences", label: "Admission Preferences", alwaysVisible: true },
];

export default function StudentProfile() {
  const { updateUser } = useAuth();
  const [profile,       setProfile]       = useState(null);
  const [completeness,  setCompleteness]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState("personal");
  // anyEditOpen: true whenever any section card is in edit mode — drives UnsavedWarning
  const [anyEditOpen,   setAnyEditOpen]   = useState(false);

  // ── Load profile + completeness ─────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    const [profRes, compRes] = await Promise.all([fetchProfile(), fetchCompleteness()]);
    if (profRes.ok && profRes.data) setProfile(profRes.data);
    if (compRes.ok) setCompleteness(compRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Intersection observer: highlight active section in desktop nav ──────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  // ── After any section save: refresh completeness ────────────────────────────
  const handleSectionSaved = useCallback(async () => {
    setAnyEditOpen(false);
    const res = await fetchCompleteness();
    if (res.ok) setCompleteness(res.data);
    // Also reload profile to get fresh completeness %
    const profRes = await fetchProfile();
    if (profRes.ok && profRes.data) setProfile(profRes.data);
  }, []);

  // ── Level change: immediately save to profile ───────────────────────────────
  const handleLevelChange = useCallback(async (newLevel) => {
    // Optimistic update
    setProfile((p) => p ? { ...p, target_level: newLevel } : p);
    await saveProfile({ target_level: newLevel });
    handleSectionSaved();
  }, [handleSectionSaved]);

  const handleAvatarSaved = useCallback(async (url) => {
    // Avatar is now public — no saveProfile call needed (uploadAvatarFile persists to DB)
    // Just refresh the profile state so Summary Card re-renders with the new photo
    const profRes = await fetchProfile();
    if (profRes.ok && profRes.data) {
      setProfile(profRes.data);
      // Also keep AuthContext in sync so the navbar avatar refreshes
      const fullUrl = url.startsWith("http") ? url : `http://localhost:5000${url}`;
      updateUser({ avatar: fullUrl });
    }
  }, [updateUser]);

  // Sections call this when they enter/leave edit mode → drives UnsavedWarning
  const handleEditChange = useCallback((isOpen) => {
    setAnyEditOpen(isOpen);
  }, []);

  // ── Visible sections for current level ──────────────────────────────────────
  const level = profile?.target_level || "BS";
  const visibleSections = SECTIONS.filter(({ alwaysVisible, visibilityKey }) =>
    alwaysVisible || isSectionVisible(visibilityKey, level)
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnsavedWarning when={anyEditOpen} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <ProfileSummaryCard
            profile={profile}
            completeness={completeness}
            onLevelChange={handleLevelChange}
            onAvatarSaved={handleAvatarSaved}
          />
        </div>

        {/* Mobile section tabs */}
        <div className="lg:hidden mb-4 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 w-max pb-1">
            {visibleSections.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors
                  ${activeSection === id
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-600 border-slate-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop layout: sticky left nav + main column */}
        <div className="flex gap-6 items-start">
          {/* Sticky left nav — desktop only */}
          <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0 sticky top-24 self-start">
            <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</p>
              </div>
              <ul className="py-1">
                {visibleSections.map(({ id, label }) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                      className={`w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm transition-colors
                        ${activeSection === id
                          ? "text-orange-600 bg-orange-50 font-semibold border-r-2 border-orange-500"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
                    >
                      {/* Status dot */}
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${activeSection === id ? "bg-orange-500" : "bg-slate-200"}`} />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-5">
            <PersonalInfoSection
              profile={profile}
              onProfileSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />

            <AcademicRecordsSection
              targetLevel={level}
              onSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />

            <EntryTestSection
              targetLevel={level}
              onSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />

            <ResearchProfileSection
              targetLevel={level}
              hidden={!isSectionVisible("researchProfile", level)}
              onSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />

            <ReferencesSection
              targetLevel={level}
              hidden={!isSectionVisible("references", level)}
              onSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />

            <AdmissionPreferencesSection
              onSaved={handleSectionSaved}
              onEditChange={handleEditChange}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
