"use client";

import React from "react";
import {
  ShieldCheck,
  Eye,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
} from "lucide-react";

export interface PrivacyVerificationData {
  profileVisibility: string;
  allowRmMatchmaking: boolean;
  showAgePublicly: boolean;
  showHometownPublicly: boolean;
}

interface PrivacyVerificationSectionProps {
  data: PrivacyVerificationData;
  onChange: (field: keyof PrivacyVerificationData, value: any) => void;
  userVerification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    isMemberVerified: boolean;
  };
}

export default function PrivacyVerificationSection({
  data,
  onChange,
  userVerification,
}: PrivacyVerificationSectionProps) {
  const visibilityOptions = [
    {
      value: "all_members",
      title: "All Verified JabWeMeet Members (Recommended)",
      desc: "Eligible for event match recommendations, table seating curation, and community discovery.",
    },
    {
      value: "event_co_attendees",
      title: "Event Co-Attendees Only",
      desc: "Your profile is only visible to members who register for the same offline event as you.",
    },
    {
      value: "connections_only",
      title: "Mutual Connections & Hosts Only",
      desc: "Hidden from general discovery. Only visible to event hosts and members you mutually connect with.",
    },
  ];

  return (
    <div id="section-privacy" className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-7 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Privacy, Visibility & Verification</h3>
            <p className="text-xs text-slate-400">
              Control how your profile appears to other members and manage your trust credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Status Cards */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your Verification Status</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#0b111e] border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Email Address</div>
              <div className="text-[11px] text-emerald-400">Verified & Protected</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b111e] border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Mobile Phone</div>
              <div className="text-[11px] text-emerald-400">Verified & Confidential</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b111e] border border-emerald-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Member Tier</div>
              <div className="text-[11px] text-emerald-400">Verified Offline Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Visibility Selector */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#e06d53]" />
          <span>Profile Visibility</span>
        </label>

        <div className="space-y-2.5">
          {visibilityOptions.map((opt) => {
            const isSelected = data.profileVisibility === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => onChange("profileVisibility", opt.value)}
                className={`p-4 rounded-2xl border cursor-pointer transition text-xs flex items-start gap-3.5 ${
                  isSelected
                    ? "bg-[#e06d53]/10 border-[#e06d53] text-white shadow-sm"
                    : "bg-[#0b111e] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-[#e06d53] bg-[#e06d53]" : "border-slate-500"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className={`font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                    {opt.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relationship Manager Consent Toggle */}
      <div className="pt-3 border-t border-white/5 space-y-3">
        <div className="p-4 rounded-2xl bg-[#0b111e] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white">
                Curated Relationship Manager Introductions
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Allow JabWeMeet hosts and matchmakers to suggest your profile for private 1-on-1 blind dates and premium table seatings.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={data.allowRmMatchmaking}
              onChange={(e) => onChange("allowRmMatchmaking", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e06d53]"></div>
          </label>
        </div>

        {/* Display Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="p-3.5 rounded-xl bg-[#0b111e] border border-white/10 flex items-center justify-between cursor-pointer">
            <span className="text-slate-300 font-medium">Display my Age on public attendee card</span>
            <input
              type="checkbox"
              checked={data.showAgePublicly}
              onChange={(e) => onChange("showAgePublicly", e.target.checked)}
              className="accent-[#e06d53] w-4 h-4 rounded"
            />
          </label>

          <label className="p-3.5 rounded-xl bg-[#0b111e] border border-white/10 flex items-center justify-between cursor-pointer">
            <span className="text-slate-300 font-medium">Display Hometown on public attendee card</span>
            <input
              type="checkbox"
              checked={data.showHometownPublicly}
              onChange={(e) => onChange("showHometownPublicly", e.target.checked)}
              className="accent-[#e06d53] w-4 h-4 rounded"
            />
          </label>
        </div>
      </div>

      {/* Trust & Data Protection Guarantee */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 text-[11px] leading-relaxed">
          <span className="font-bold text-white">JabWeMeet Offline Safety Guarantee: </span>
          Your email address, phone number, and confidential deal-breakers are never shown to other attendees or searchable anywhere on the platform. Connections only exchange contact information when both members mutually accept at or after an offline event.
        </div>
      </div>
    </div>
  );
}
