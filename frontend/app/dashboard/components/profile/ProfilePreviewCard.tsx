"use client";

import React from "react";
import {
  ShieldCheck,
  MapPin,
  Briefcase,
  Heart,
  Sparkles,
  Utensils,
  PawPrint,
  Plane,
  Eye,
  Lock,
  Calendar,
  Layers,
  Ticket,
} from "lucide-react";

interface ProfilePreviewCardProps {
  fullName: string;
  city: string;
  hometown: string;
  gender: string;
  dateOfBirth?: string;
  profession: string;
  industry: string;
  relationshipIntent: string;
  aboutMe: string;
  hobbies: string[];
  selfDescription: string;
  personalityTraits: string[];
  foodPreference: string;
  pets: string;
  travelFrequency: string;
  fitness: string;
  coreQualities: string[];
  eventFormats: string[];
  showAgePublicly: boolean;
  showHometownPublicly: boolean;
  role: string;
}

export default function ProfilePreviewCard({
  fullName,
  city,
  hometown,
  gender,
  dateOfBirth,
  profession,
  industry,
  relationshipIntent,
  aboutMe,
  hobbies,
  selfDescription,
  personalityTraits,
  foodPreference,
  pets,
  travelFrequency,
  fitness,
  coreQualities,
  eventFormats,
  showAgePublicly,
  showHometownPublicly,
  role,
}: ProfilePreviewCardProps) {
  // Calculate age
  const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const bDate = new Date(dobString);
    if (isNaN(bDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dateOfBirth);

  return (
    <div id="section-preview" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248]">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-bold text-slate-900">Live Public Profile Preview</h4>
            <p className="text-[11px] text-slate-500">
              How verified attendees and table hosts see you at JabWeMeet events.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Email, Phone & Deal Breakers Hidden</span>
        </div>
      </div>

      {/* Member Public Card */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header: Avatar & Main Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#7E2248] to-[#9B2C59] flex items-center justify-center font-extrabold text-white text-2xl sm:text-3xl shadow-lg shadow-[#7E2248]/20 shrink-0">
              {fullName ? fullName.slice(0, 2).toUpperCase() : "ME"}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                  {fullName || "Verified Member"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 mt-1">
                {showAgePublicly && age !== null && <span>{age} years old</span>}
                {showAgePublicly && age !== null && city && <span>•</span>}
                {city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
                    {city}
                  </span>
                )}
                {showHometownPublicly && hometown && (
                  <span className="text-slate-500">(from {hometown})</span>
                )}
              </div>

              {profession && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {profession} {industry ? `• ${industry}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Relationship Intent Badge */}
          {relationshipIntent && (
            <div className="self-start sm:self-center shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200 text-xs font-semibold shadow-xs">
                <Heart className="w-3.5 h-3.5 text-[#7E2248]" />
                <span>{relationshipIntent}</span>
              </span>
            </div>
          )}
        </div>

        {/* About Me Bio */}
        {aboutMe ? (
          <div className="bg-[#FDFBF9] border border-rose-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed relative z-10 shadow-xs">
            <p className="italic font-normal">"{aboutMe}"</p>
          </div>
        ) : (
          <div className="bg-[#FDFBF9] border border-dashed border-rose-200 rounded-2xl p-4 text-xs text-slate-500 italic">
            Add an "About Me" summary above to introduce yourself to offline event attendees!
          </div>
        )}

        {/* Key Quick Badges: Persona, Diet, Pets, Fitness */}
        <div className="flex flex-wrap gap-2 text-xs relative z-10">
          {selfDescription && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{selfDescription}</span>
            </span>
          )}
          {foodPreference && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-700 font-medium">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span>{foodPreference}</span>
            </span>
          )}
          {pets && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-700 font-medium">
              <PawPrint className="w-3.5 h-3.5 text-amber-600" />
              <span>{pets}</span>
            </span>
          )}
          {travelFrequency && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-700 font-medium">
              <Plane className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>{travelFrequency}</span>
            </span>
          )}
        </div>

        {/* Hobbies & Passions */}
        {hobbies.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Hobbies & Passions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {hobbies.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1 rounded-lg bg-rose-50/70 text-slate-700 text-xs font-medium border border-rose-200"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personality Traits */}
        {personalityTraits.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Personality Traits
            </span>
            <div className="flex flex-wrap gap-1.5">
              {personalityTraits.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg bg-purple-50 text-purple-800 text-xs font-medium border border-purple-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Core Values Valued in Match */}
        {coreQualities.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Values Most in a Partner
            </span>
            <div className="flex flex-wrap gap-1.5">
              {coreQualities.map((q) => (
                <span
                  key={q}
                  className="px-3 py-1 rounded-lg bg-rose-50 text-[#7E2248] text-xs font-medium border border-rose-200"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Events */}
        {eventFormats.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-rose-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>Looking Forward To</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {eventFormats.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-lg bg-[#FAF3F6] text-[#7E2248] text-xs font-medium border border-rose-200"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
