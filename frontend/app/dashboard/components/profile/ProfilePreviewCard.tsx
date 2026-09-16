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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Live Public Profile Preview</h4>
            <p className="text-[11px] text-slate-400">
              How verified attendees and table hosts see you at JabWeMeet events.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Email, Phone & Deal Breakers Hidden</span>
        </div>
      </div>

      {/* Member Public Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#162438] to-[#0f1726] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e06d53]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header: Avatar & Main Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#e06d53] to-amber-500 flex items-center justify-center font-extrabold text-white text-2xl sm:text-3xl shadow-xl shadow-[#e06d53]/20 shrink-0">
              {fullName ? fullName.slice(0, 2).toUpperCase() : "ME"}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {fullName || "Verified Member"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300 mt-1">
                {showAgePublicly && age !== null && <span>{age} years old</span>}
                {showAgePublicly && age !== null && city && <span>•</span>}
                {city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#e06d53]" />
                    {city}
                  </span>
                )}
                {showHometownPublicly && hometown && (
                  <span className="text-slate-400">(from {hometown})</span>
                )}
              </div>

              {profession && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 text-xs font-semibold shadow-sm">
                <Heart className="w-3.5 h-3.5 text-[#e06d53]" />
                <span>{relationshipIntent}</span>
              </span>
            </div>
          )}
        </div>

        {/* About Me Bio */}
        {aboutMe ? (
          <div className="bg-[#0b111e]/80 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed relative z-10">
            <p className="italic font-normal">"{aboutMe}"</p>
          </div>
        ) : (
          <div className="bg-[#0b111e]/40 border border-dashed border-white/10 rounded-2xl p-4 text-xs text-slate-400 italic">
            Add an "About Me" summary above to introduce yourself to offline event attendees!
          </div>
        )}

        {/* Key Quick Badges: Persona, Diet, Pets, Fitness */}
        <div className="flex flex-wrap gap-2 text-xs relative z-10">
          {selfDescription && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{selfDescription}</span>
            </span>
          )}
          {foodPreference && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <Utensils className="w-3 h-3 text-emerald-400" />
              <span>{foodPreference}</span>
            </span>
          )}
          {pets && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <PawPrint className="w-3 h-3 text-amber-400" />
              <span>{pets}</span>
            </span>
          )}
          {travelFrequency && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <Plane className="w-3 h-3 text-sky-400" />
              <span>{travelFrequency}</span>
            </span>
          )}
        </div>

        {/* Hobbies & Passions */}
        {hobbies.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hobbies & Passions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {hobbies.map((h) => (
                <span
                  key={h}
                  className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs font-medium border border-white/10"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personality Traits */}
        {personalityTraits.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Personality Traits
            </span>
            <div className="flex flex-wrap gap-1.5">
              {personalityTraits.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-medium border border-indigo-500/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Core Values Valued in Match */}
        {coreQualities.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Values Most in a Partner
            </span>
            <div className="flex flex-wrap gap-1.5">
              {coreQualities.map((q) => (
                <span
                  key={q}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-medium border border-rose-500/20"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Events */}
        {eventFormats.length > 0 && (
          <div className="space-y-2 relative z-10 pt-2 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-sky-400" />
              <span>Looking Forward To</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {eventFormats.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 text-xs font-medium border border-sky-500/20"
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
