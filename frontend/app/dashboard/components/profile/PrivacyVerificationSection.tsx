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
    <div id="section-privacy" className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Privacy, Visibility & Verification</h3>
            <p className="text-xs text-slate-500">
              Control how your profile appears to other members and manage your trust credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Status Cards */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your Verification Status</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Email Address</div>
              <div className="text-[11px] text-emerald-700 font-medium">Verified & Protected</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Mobile Phone</div>
              <div className="text-[11px] text-emerald-700 font-medium">Verified & Confidential</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Member Tier</div>
              <div className="text-[11px] text-emerald-700 font-medium">Verified Offline Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Visibility Selector */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#7E2248]" />
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
                    ? "bg-rose-50 border-[#7E2248] text-slate-900 shadow-xs"
                    : "bg-[#FDFBF9] border-rose-200 text-slate-600 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-[#7E2248] bg-[#7E2248]" : "border-slate-300"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className={`font-bold ${isSelected ? "text-[#7E2248]" : "text-slate-800"}`}>
                    {opt.title}
                  </div>
                  <div className={`text-[11px] ${isSelected ? "text-slate-600" : "text-slate-500"} mt-0.5`}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relationship Manager Consent Toggle */}
      <div className="pt-3 border-t border-rose-100 space-y-3">
        <div className="p-4 rounded-2xl bg-[#FDFBF9] border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-[#7E2248] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">
                Curated Relationship Manager Introductions
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
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
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7E2248]"></div>
          </label>
        </div>

        {/* Display Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="p-3.5 rounded-2xl bg-[#FDFBF9] border border-rose-200 flex items-center justify-between cursor-pointer hover:border-rose-300">
            <span className="text-slate-700 font-medium">Display my Age on public attendee card</span>
            <input
              type="checkbox"
              checked={data.showAgePublicly}
              onChange={(e) => onChange("showAgePublicly", e.target.checked)}
              className="accent-[#7E2248] w-4 h-4 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 rounded-2xl bg-[#FDFBF9] border border-rose-200 flex items-center justify-between cursor-pointer hover:border-rose-300">
            <span className="text-slate-700 font-medium">Display Hometown on public attendee card</span>
            <input
              type="checkbox"
              checked={data.showHometownPublicly}
              onChange={(e) => onChange("showHometownPublicly", e.target.checked)}
              className="accent-[#7E2248] w-4 h-4 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Trust & Data Protection Guarantee */}
      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3 text-xs">
        <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-slate-700 text-[11px] leading-relaxed">
          <span className="font-bold text-emerald-950">JabWeMeet Offline Safety Guarantee: </span>
          Your email address, phone number, and confidential deal-breakers are never shown to other attendees or searchable anywhere on the platform. Connections only exchange contact information when both members mutually accept at or after an offline event.
        </div>
      </div>
    </div>
  );
}
