"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Compass,
  Sparkles,
  Ticket,
  FileQuestion,
  Eye,
  RotateCcw,
  AlertCircle,
  Layers,
  ChevronRight,
} from "lucide-react";

import ProfileProgressBar from "./profile/ProfileProgressBar";
import PersonalInfoSection from "./profile/PersonalInfoSection";
import LifestyleSection, { LifestyleData } from "./profile/LifestyleSection";
import InterestsPersonalitySection, {
  InterestsPersonalityData,
} from "./profile/InterestsPersonalitySection";
import PartnerPreferencesSection, {
  PartnerPreferencesData,
} from "./profile/PartnerPreferencesSection";
import EventTravelPreferencesSection, {
  EventTravelPreferencesData,
} from "./profile/EventTravelPreferencesSection";
import MatchmakingQuestionnaireSection, {
  MatchmakingQuestionnaireData,
} from "./profile/MatchmakingQuestionnaireSection";
import PrivacyVerificationSection, {
  PrivacyVerificationData,
} from "./profile/PrivacyVerificationSection";
import ProfilePreviewCard from "./profile/ProfilePreviewCard";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string | null;
  relationshipIntent: string | null;
  role: string;
  createdAt: string;
  dateOfBirth?: string;
}

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedFields: Partial<UserProfile>) => void;
}

type TabType =
  | "all"
  | "personal"
  | "lifestyle"
  | "interests"
  | "partner"
  | "events"
  | "questionnaire"
  | "privacy"
  | "preview";

export default function ProfileView({ user, onUpdateUser }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    fullName: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    city: user.city || "",
    hometown: "",
    gender: user.gender || "",
    profession: "",
    industry: "",
    education: "",
    languages: "",
    height: "",
    relationshipIntent: user.relationshipIntent || "",
    aboutMe: "",
  });

  // 2. Lifestyle State
  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    smoking: "",
    alcohol: "",
    foodPreference: "",
    pets: "",
    fitness: "",
    travelFrequency: "",
    sleepRhythm: "",
  });

  // 3. Interests & Personality State
  const [interests, setInterests] = useState<InterestsPersonalityData>({
    hobbies: [],
    selfDescription: "",
    personalityTraits: [],
    preferredSocialEnvironment: [],
  });

  // 4. Partner Preferences State
  const [partnerPreferences, setPartnerPreferences] = useState<PartnerPreferencesData>({
    minAge: 21,
    maxAge: 35,
    preferredGender: "Any Gender",
    preferredLocation: "Same City Only",
    preferredHeight: "No preference",
    smokingPreference: "Doesn't matter",
    drinkingPreference: "Social / Occasional is fine",
    dietaryPreference: "No preference / Any diet",
    petPreference: "Doesn't matter",
    coreQualities: [],
    dealBreakers: [],
  });

  // 5. Event & Travel Preferences State
  const [eventPreferences, setEventPreferences] = useState<EventTravelPreferencesData>({
    eventFormats: [],
    eventSize: "Medium & Balanced (20–40 people)",
    preferredDays: [],
    firstMeetingPreference: "",
    travelStyle: [],
    tripBudgetPreference: "",
  });

  // 6. Matchmaking Questionnaire State
  const [questionnaire, setQuestionnaire] = useState<MatchmakingQuestionnaireData>({
    q1Energized: "",
    q2IdealSunday: "",
    q3Passions: "",
    q4FutureGoals: "",
    q5HealthyRelationship: "",
    q6ConflictHandling: "",
    q7DeepValues: "",
    q8LoveLanguage: "",
    q9MarriageTimeline: "",
    q10MemorableDate: "",
    q11BlindDateComfort: "",
    q12RmAssistance: "",
    q13ThingToKnow: "",
    q14Icebreaker: "",
  });

  // 7. Privacy & Verification State
  const [privacy, setPrivacy] = useState<PrivacyVerificationData>({
    profileVisibility: "all_members",
    allowRmMatchmaking: true,
    showAgePublicly: true,
    showHometownPublicly: true,
  });

  // Hydrate from localStorage on initial mount
  useEffect(() => {
    if (!user || !user.id) return;
    try {
      const stored = localStorage.getItem(`jwm_matching_profile_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.personalInfo) {
          setPersonalInfo((prev) => ({
            ...prev,
            ...parsed.personalInfo,
            fullName: user.name, // Keep verified
            email: user.email, // Keep verified
            phone: user.phone, // Keep verified
            city: parsed.personalInfo.city || user.city || "",
            gender: parsed.personalInfo.gender || user.gender || "",
            relationshipIntent: parsed.personalInfo.relationshipIntent || user.relationshipIntent || "",
            dateOfBirth: parsed.personalInfo.dateOfBirth || (user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : ""),
          }));
        }
        if (parsed.lifestyle) setLifestyle(parsed.lifestyle);
        if (parsed.interests) setInterests(parsed.interests);
        if (parsed.partnerPreferences) setPartnerPreferences(parsed.partnerPreferences);
        if (parsed.eventPreferences) setEventPreferences(parsed.eventPreferences);
        if (parsed.questionnaire) setQuestionnaire(parsed.questionnaire);
        if (parsed.privacy) setPrivacy(parsed.privacy);
      }
    } catch (e) {
      console.warn("Could not load matching profile from storage", e);
    }
  }, [user]);

  // Validation Checks
  const dobAge = useMemo(() => {
    if (!personalInfo.dateOfBirth) return null;
    const bDate = new Date(personalInfo.dateOfBirth);
    if (isNaN(bDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return age;
  }, [personalInfo.dateOfBirth]);

  const dobError = useMemo(() => {
    if (dobAge !== null && dobAge < 18) {
      return "You must be at least 18 years old to join JabWeMeet events.";
    }
    return undefined;
  }, [dobAge]);

  const ageRangeError = useMemo(() => {
    if (partnerPreferences.minAge < 18) {
      return "Minimum partner age must be at least 18.";
    }
    if (partnerPreferences.minAge > partnerPreferences.maxAge) {
      return "Minimum age cannot be greater than maximum age.";
    }
    return undefined;
  }, [partnerPreferences.minAge, partnerPreferences.maxAge]);

  // Calculate dynamic completion percentage and missing section shortcuts
  const { percentage, missingShortcuts } = useMemo(() => {
    let score = 0;
    const missing: { label: string; sectionId: string }[] = [];

    // Verified basics (always 15% for authenticated members)
    score += 15;

    // City (5%)
    if (personalInfo.city.trim()) score += 5;
    else missing.push({ label: "Add Current City", sectionId: "personal" });

    // Gender (5%)
    if (personalInfo.gender) score += 5;
    else missing.push({ label: "Set Gender", sectionId: "personal" });

    // Relationship Intent (5%)
    if (personalInfo.relationshipIntent) score += 5;
    else missing.push({ label: "Choose Intent", sectionId: "personal" });

    // Date of Birth (5%)
    if (personalInfo.dateOfBirth && (!dobAge || dobAge >= 18)) score += 5;
    else missing.push({ label: "Enter Birthday", sectionId: "personal" });

    // Profession / Education (5%)
    if (personalInfo.profession.trim() || personalInfo.education.trim()) score += 5;
    else missing.push({ label: "Add Profession", sectionId: "personal" });

    // About Me (10%)
    if (personalInfo.aboutMe.trim().length >= 20) score += 10;
    else missing.push({ label: "Write About Me", sectionId: "personal" });

    // Lifestyle (15%)
    let lifestyleCount = 0;
    if (lifestyle.smoking) lifestyleCount++;
    if (lifestyle.alcohol) lifestyleCount++;
    if (lifestyle.foodPreference) lifestyleCount++;
    if (lifestyle.fitness) lifestyleCount++;
    if (lifestyle.travelFrequency) lifestyleCount++;
    score += Math.min(15, lifestyleCount * 3);
    if (lifestyleCount < 3) {
      missing.push({ label: "Set Lifestyle Habits", sectionId: "lifestyle" });
    }

    // Interests & Vibe (15%)
    if (interests.hobbies.length >= 3) score += 7;
    else missing.push({ label: "Pick 3+ Hobbies", sectionId: "interests" });

    if (interests.selfDescription) score += 4;
    if (interests.personalityTraits.length >= 2) score += 4;

    // Partner Criteria (10%)
    if (partnerPreferences.coreQualities.length >= 2) score += 5;
    else missing.push({ label: "Select Top Qualities", sectionId: "partner" });
    if (partnerPreferences.preferredLocation) score += 5;

    // Event Preferences (10%)
    if (eventPreferences.eventFormats.length >= 2) score += 6;
    else missing.push({ label: "Choose Event Formats", sectionId: "events" });
    if (eventPreferences.preferredDays.length >= 1) score += 4;

    return {
      percentage: Math.min(100, Math.round(score)),
      missingShortcuts: missing.slice(0, 4),
    };
  }, [personalInfo, lifestyle, interests, partnerPreferences, eventPreferences, dobAge]);

  // Section Change Handlers
  const handlePersonalInfoChange = (field: string, value: string) => {
    setIsDirty(true);
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleLifestyleChange = (field: keyof LifestyleData, value: string) => {
    setIsDirty(true);
    setLifestyle((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestsChange = (field: keyof InterestsPersonalityData, value: any) => {
    setIsDirty(true);
    setInterests((prev) => ({ ...prev, [field]: value }));
  };

  const handlePartnerChange = (field: keyof PartnerPreferencesData, value: any) => {
    setIsDirty(true);
    setPartnerPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (field: keyof EventTravelPreferencesData, value: any) => {
    setIsDirty(true);
    setEventPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionnaireChange = (
    field: keyof MatchmakingQuestionnaireData,
    value: string
  ) => {
    setIsDirty(true);
    setQuestionnaire((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: keyof PrivacyVerificationData, value: any) => {
    setIsDirty(true);
    setPrivacy((prev) => ({ ...prev, [field]: value }));
  };

  // Keyboard shortcut Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Save Function
  const handleSave = async () => {
    setErrorMessage("");

    // Validate inputs
    if (dobError) {
      setErrorMessage(dobError);
      setActiveTab("personal");
      return;
    }
    if (ageRangeError) {
      setErrorMessage(ageRangeError);
      setActiveTab("partner");
      return;
    }
    if (!personalInfo.city.trim()) {
      setErrorMessage("Please enter your current city.");
      setActiveTab("personal");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Call Backend API to persist core attributes
      const payload: Partial<UserProfile> = {
        city: personalInfo.city.trim(),
        gender: personalInfo.gender.trim() || null,
        relationshipIntent: personalInfo.relationshipIntent.trim() || null,
        dateOfBirth: personalInfo.dateOfBirth ? personalInfo.dateOfBirth : undefined,
      };

      try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...payload,
            dateOfBirth: personalInfo.dateOfBirth || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            onUpdateUser(data.user);
          } else {
            onUpdateUser(payload);
          }
        } else {
          onUpdateUser(payload);
        }
      } catch (apiErr) {
        // Fallback gracefully to parent update
        onUpdateUser(payload);
      }

      // 2. Persist extended matching profile in localStorage
      const fullProfileState = {
        personalInfo,
        lifestyle,
        interests,
        partnerPreferences,
        eventPreferences,
        questionnaire,
        privacy,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`jwm_matching_profile_${user.id}`, JSON.stringify(fullProfileState));

      setIsDirty(false);
      setSavedMessage("Profile & matching preferences saved successfully!");
      setTimeout(() => setSavedMessage(""), 4500);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage("Could not save changes. Please check your inputs and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const handleDiscard = () => {
    if (confirm("Discard all unsaved changes and reload your last saved profile?")) {
      try {
        const stored = localStorage.getItem(`jwm_matching_profile_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.personalInfo) setPersonalInfo(parsed.personalInfo);
          if (parsed.lifestyle) setLifestyle(parsed.lifestyle);
          if (parsed.interests) setInterests(parsed.interests);
          if (parsed.partnerPreferences) setPartnerPreferences(parsed.partnerPreferences);
          if (parsed.eventPreferences) setEventPreferences(parsed.eventPreferences);
          if (parsed.questionnaire) setQuestionnaire(parsed.questionnaire);
          if (parsed.privacy) setPrivacy(parsed.privacy);
        } else {
          setPersonalInfo({
            fullName: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
            city: user.city || "",
            hometown: "",
            gender: user.gender || "",
            profession: "",
            industry: "",
            education: "",
            languages: "",
            height: "",
            relationshipIntent: user.relationshipIntent || "",
            aboutMe: "",
          });
        }
      } catch (e) {}
      setIsDirty(false);
      setErrorMessage("");
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === "personal") setActiveTab("personal");
    else if (sectionId === "lifestyle") setActiveTab("lifestyle");
    else if (sectionId === "interests") setActiveTab("interests");
    else if (sectionId === "partner") setActiveTab("partner");
    else if (sectionId === "events") setActiveTab("events");
    else if (sectionId === "questionnaire") setActiveTab("questionnaire");
    else if (sectionId === "privacy") setActiveTab("privacy");
    else setActiveTab("all");

    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const navTabs: { id: TabType; label: string; icon: any }[] = [
    { id: "all", label: "All Sections", icon: Layers },
    { id: "personal", label: "Personal", icon: User },
    { id: "lifestyle", label: "Lifestyle", icon: Sparkles },
    { id: "interests", label: "Interests & Vibe", icon: Compass },
    { id: "partner", label: "Preferences", icon: Heart },
    { id: "events", label: "Events & Travel", icon: Ticket },
    { id: "questionnaire", label: "Matchmaking Q&A", icon: FileQuestion },
    { id: "privacy", label: "Privacy & Badges", icon: ShieldCheck },
    { id: "preview", label: "Public Preview", icon: Eye },
  ];

  return (
    <div className="space-y-8 max-w-5xl pb-24">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
          <User className="w-3.5 h-3.5 text-[#e06d53]" />
          Account Management
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Member Profile & Matching Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Personalize your offline event seating, peer recommendations, and Relationship Manager matchmaking criteria.
        </p>
      </div>

      {/* Dynamic Profile Progress Bar */}
      <ProfileProgressBar
        percentage={percentage}
        missingShortcuts={missingShortcuts}
        onNavigateSection={handleNavigateSection}
      />

      {/* Alerts */}
      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{savedMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedMessage("")}
            className="text-emerald-400 hover:text-white text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-rose-400 hover:text-white text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categorized Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
                isActive
                  ? "bg-[#e06d53] text-white shadow-lg shadow-[#e06d53]/25"
                  : "bg-[#131d2e] text-slate-400 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}
      <div className="space-y-8">
        {/* 1. PERSONAL INFO */}
        {(activeTab === "all" || activeTab === "personal") && (
          <PersonalInfoSection
            formData={personalInfo}
            onChange={handlePersonalInfoChange}
            dobError={dobError}
          />
        )}

        {/* 2. LIFESTYLE */}
        {(activeTab === "all" || activeTab === "lifestyle") && (
          <LifestyleSection data={lifestyle} onChange={handleLifestyleChange} />
        )}

        {/* 3. INTERESTS & PERSONALITY */}
        {(activeTab === "all" || activeTab === "interests") && (
          <InterestsPersonalitySection data={interests} onChange={handleInterestsChange} />
        )}

        {/* 4. PARTNER PREFERENCES */}
        {(activeTab === "all" || activeTab === "partner") && (
          <PartnerPreferencesSection
            data={partnerPreferences}
            onChange={handlePartnerChange}
            ageError={ageRangeError}
          />
        )}

        {/* 5. EVENT & TRAVEL */}
        {(activeTab === "all" || activeTab === "events") && (
          <EventTravelPreferencesSection data={eventPreferences} onChange={handleEventChange} />
        )}

        {/* 6. MATCHMAKING QUESTIONNAIRE */}
        {(activeTab === "all" || activeTab === "questionnaire") && (
          <MatchmakingQuestionnaireSection
            data={questionnaire}
            onChange={handleQuestionnaireChange}
          />
        )}

        {/* 7. PRIVACY & VERIFICATION */}
        {(activeTab === "all" || activeTab === "privacy") && (
          <PrivacyVerificationSection
            data={privacy}
            onChange={handlePrivacyChange}
            userVerification={{
              emailVerified: true,
              phoneVerified: true,
              isMemberVerified: true,
            }}
          />
        )}

        {/* 8. PUBLIC PROFILE PREVIEW */}
        {(activeTab === "all" || activeTab === "preview") && (
          <ProfilePreviewCard
            fullName={personalInfo.fullName}
            city={personalInfo.city}
            hometown={personalInfo.hometown}
            gender={personalInfo.gender}
            dateOfBirth={personalInfo.dateOfBirth}
            profession={personalInfo.profession}
            industry={personalInfo.industry}
            relationshipIntent={personalInfo.relationshipIntent}
            aboutMe={personalInfo.aboutMe}
            hobbies={interests.hobbies}
            selfDescription={interests.selfDescription}
            personalityTraits={interests.personalityTraits}
            foodPreference={lifestyle.foodPreference}
            pets={lifestyle.pets}
            travelFrequency={lifestyle.travelFrequency}
            fitness={lifestyle.fitness}
            coreQualities={partnerPreferences.coreQualities}
            eventFormats={eventPreferences.eventFormats}
            showAgePublicly={privacy.showAgePublicly}
            showHometownPublicly={privacy.showHometownPublicly}
            role={user.role}
          />
        )}
      </div>

      {/* Floating / Sticky Save Bar */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-40 max-w-xl">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0f1726]/95 backdrop-blur-md border border-white/15 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {isDirty ? (
              <span className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All changes saved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleDiscard}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#e06d53] hover:bg-[#c95940] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#e06d53]/25 transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
