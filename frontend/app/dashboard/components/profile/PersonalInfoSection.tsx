"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  Calendar,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Languages,
  Ruler,
  Home,
  Info,
} from "lucide-react";

interface PersonalInfoSectionProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    city: string;
    hometown: string;
    gender: string;
    profession: string;
    industry: string;
    education: string;
    languages: string;
    height: string;
    relationshipIntent: string;
    aboutMe: string;
  };
  onChange: (field: string, value: string) => void;
  dobError?: string;
}

export default function PersonalInfoSection({
  formData,
  onChange,
  dobError,
}: PersonalInfoSectionProps) {
  // Automatically calculate age from DOB
  const calculateAge = (dobString: string): number | null => {
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

  const calculatedAge = calculateAge(formData.dateOfBirth);

  return (
    <div id="section-personal" className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e06d53]/15 border border-[#e06d53]/30 flex items-center justify-center text-[#e06d53]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Personal Information</h3>
            <p className="text-xs text-slate-400">
              Basic identity, professional background, and verified credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Full Name (Verified Read-Only) */}
        <div>
          <label className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
            <span>Full Name</span>
            <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </label>
          <input
            disabled
            value={formData.fullName}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed font-medium"
          />
        </div>

        {/* Email Address (Verified Read-Only) */}
        <div>
          <label className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
            <span>Email Address</span>
            <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </label>
          <input
            disabled
            value={formData.email}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed font-medium"
          />
        </div>

        {/* Mobile Phone (Verified Read-Only) */}
        <div>
          <label className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
            <span>Mobile Phone</span>
            <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </label>
          <input
            disabled
            value={formData.phone}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed font-medium"
          />
        </div>

        {/* Date of Birth & Auto Age */}
        <div>
          <label className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
            <span>Date of Birth *</span>
            {calculatedAge !== null && (
              <span className={`text-[11px] font-semibold ${calculatedAge >= 18 ? "text-emerald-400" : "text-rose-400"}`}>
                Age: {calculatedAge} {calculatedAge < 18 ? "(Under 18)" : "years"}
              </span>
            )}
          </label>
          <input
            type="date"
            required
            value={formData.dateOfBirth ? formData.dateOfBirth.slice(0, 10) : ""}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            className={`w-full bg-[#0b111e] border rounded-xl px-4 py-2 text-white focus:outline-none transition ${
              dobError ? "border-rose-500" : "border-white/10 focus:border-[#e06d53]"
            }`}
          />
          {dobError && <p className="text-rose-400 text-[11px] mt-1 font-medium">{dobError}</p>}
        </div>

        {/* Current City (Required) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">Current City *</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="e.g. Bangalore, Mumbai, Delhi"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Hometown (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Hometown <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.hometown}
            onChange={(e) => onChange("hometown", e.target.value)}
            placeholder="e.g. Pune, Jaipur, Mysuru"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Gender (Required) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">Gender *</label>
          <select
            value={formData.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary / Other">Non-binary / Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* Relationship Intent (Required) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">Relationship Intent *</label>
          <select
            value={formData.relationshipIntent}
            onChange={(e) => onChange("relationshipIntent", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          >
            <option value="">Select primary intent</option>
            <option value="Long-term Relationship">Long-term Relationship</option>
            <option value="Marriage / Matrimonial">Marriage / Matrimonial</option>
            <option value="Intentional Dating">Intentional Dating</option>
            <option value="New Connections & Friends">New Connections & Friends</option>
            <option value="Breakup Healing & Moving On">Breakup Healing & Moving On</option>
          </select>
        </div>

        {/* Profession (Recommended) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Profession <span className="text-amber-400 font-normal">(Recommended)</span>
          </label>
          <input
            type="text"
            value={formData.profession}
            onChange={(e) => onChange("profession", e.target.value)}
            placeholder="e.g. Product Designer, Architect, Founder"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Industry (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Industry <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.industry}
            onChange={(e) => onChange("industry", e.target.value)}
            placeholder="e.g. Technology, Design, Healthcare, Finance"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Education (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Education <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.education}
            onChange={(e) => onChange("education", e.target.value)}
            placeholder="e.g. B.Tech, MBA, Masters in Fine Arts"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Languages Known (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Languages Known <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.languages}
            onChange={(e) => onChange("languages", e.target.value)}
            placeholder="e.g. English, Hindi, Kannada"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>

        {/* Height (Optional) */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Height <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.height}
            onChange={(e) => onChange("height", e.target.value)}
            placeholder="e.g. 5 ft 10 in or 178 cm"
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
          />
        </div>
      </div>

      {/* About Me (Max 500 characters with live counter) */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300">
            About Me <span className="text-amber-400 font-normal">(Recommended)</span>
          </label>
          <span
            className={`font-mono text-[11px] ${
              formData.aboutMe.length > 500 ? "text-rose-400 font-bold" : "text-slate-400"
            }`}
          >
            {formData.aboutMe.length} / 500
          </span>
        </div>
        <textarea
          rows={4}
          maxLength={500}
          value={formData.aboutMe}
          onChange={(e) => onChange("aboutMe", e.target.value)}
          placeholder="Tell people a little about yourself, what brings you to JabWeMeet, and what an ideal Sunday afternoon looks like..."
          className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53] leading-relaxed"
        />
        <p className="text-[11px] text-slate-400">
          This brief introduction appears on your public attendee profile during events.
        </p>
      </div>
    </div>
  );
}
