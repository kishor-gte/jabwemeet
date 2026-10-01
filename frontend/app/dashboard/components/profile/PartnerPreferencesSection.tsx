"use client";

import React from "react";
import {
  Heart,
  UserCheck,
  ShieldAlert,
  Lock,
  Check,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";

export interface PartnerPreferencesData {
  minAge: number;
  maxAge: number;
  preferredGender: string;
  preferredLocation: string;
  preferredHeight: string;
  smokingPreference: string;
  drinkingPreference: string;
  dietaryPreference: string;
  petPreference: string;
  coreQualities: string[];
  dealBreakers: string[];
}

interface PartnerPreferencesSectionProps {
  data: PartnerPreferencesData;
  onChange: (field: keyof PartnerPreferencesData, value: any) => void;
  ageError?: string;
}

const PARTNER_QUALITIES_OPTIONS = [
  "Emotional Maturity",
  "Great Sense of Humor",
  "Ambition & Career Drive",
  "Kindness & Empathy",
  "Open & Honest Communication",
  "Shared Moral Values",
  "Intellectual Curiosity",
  "Active & Healthy Lifestyle",
  "Family-Oriented",
  "Financial Responsibility",
  "Spontaneity & Sense of Adventure",
  "Loyalty & Consistency",
  "Creative & Expressive",
  "Patience & Calm Temperament",
];

const DEAL_BREAKER_OPTIONS = [
  "Active Smoking Habit",
  "Heavy Alcohol / Partying Lifestyle",
  "Lack of Transparency / Dishonesty",
  "Incompatible Relationship Intent",
  "Unwillingness to Relocate / Distance Issues",
  "Opposing Views on Family & Marriage",
  "Financial Irresponsibility",
  "Disrespectful Communication",
  "Apathy / No Personal Ambition",
  "Dislike of Pets / Animals",
];

export default function PartnerPreferencesSection({
  data,
  onChange,
  ageError,
}: PartnerPreferencesSectionProps) {
  const toggleQuality = (quality: string) => {
    if (data.coreQualities.includes(quality)) {
      onChange(
        "coreQualities",
        data.coreQualities.filter((q) => q !== quality)
      );
    } else {
      if (data.coreQualities.length >= 5) {
        return; // Limit to 5
      }
      onChange("coreQualities", [...data.coreQualities, quality]);
    }
  };

  const toggleDealBreaker = (breaker: string) => {
    if (data.dealBreakers.includes(breaker)) {
      onChange(
        "dealBreakers",
        data.dealBreakers.filter((b) => b !== breaker)
      );
    } else {
      onChange("dealBreakers", [...data.dealBreakers, breaker]);
    }
  };

  return (
    <div id="section-partner" className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shadow-xs">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Partner & Matching Preferences</h3>
            <p className="text-xs text-slate-500">
              Set your criteria for matchmaking algorithms, curated table assignments, and Relationship Managers.
            </p>
          </div>
        </div>
      </div>

      {/* Age Range & Demographics */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#7E2248] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Basic Criteria</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Min Age */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Minimum Age *</label>
            <input
              type="number"
              min={18}
              max={80}
              value={data.minAge || ""}
              onChange={(e) => onChange("minAge", parseInt(e.target.value) || 18)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
          </div>

          {/* Max Age */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Maximum Age *</label>
            <input
              type="number"
              min={18}
              max={80}
              value={data.maxAge || ""}
              onChange={(e) => onChange("maxAge", parseInt(e.target.value) || 35)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
          </div>

          {/* Preferred Gender */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Looking to Meet *</label>
            <select
              value={data.preferredGender}
              onChange={(e) => onChange("preferredGender", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="Women">Women</option>
              <option value="Men">Men</option>
              <option value="Any Gender">Any Gender / Everyone</option>
              <option value="Non-binary">Non-binary</option>
            </select>
          </div>

          {/* Preferred Height */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Height Preference</label>
            <select
              value={data.preferredHeight}
              onChange={(e) => onChange("preferredHeight", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="No preference">No preference</option>
              <option value="5'0&quot; to 5'4&quot;">5'0" to 5'4"</option>
              <option value="5'5&quot; to 5'8&quot;">5'5" to 5'8"</option>
              <option value="5'9&quot; to 6'0&quot;">5'9" to 6'0"</option>
              <option value="Above 6'0&quot;">Above 6'0"</option>
              <option value="Taller than me">Taller than me</option>
            </select>
          </div>
        </div>

        {ageError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{ageError}</span>
          </div>
        )}

        {/* Location Preference */}
        <div className="pt-2 text-xs">
          <label className="block text-slate-700 font-semibold mb-1.5">
            Geographic Scope / Distance
          </label>
          <select
            value={data.preferredLocation}
            onChange={(e) => onChange("preferredLocation", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          >
            <option value="Same City Only">Same City Only (Primary location)</option>
            <option value="Nearby Cities (within 2-3 hours drive)">
              Nearby Cities (within 2-3 hours drive)
            </option>
            <option value="Anywhere in State / Region">Anywhere in State / Region</option>
            <option value="Any metro in India">Any metro in India</option>
            <option value="Open to Relocation / Long-Distance">
              Open to Relocation / Long-Distance
            </option>
          </select>
        </div>
      </div>

      {/* Partner Lifestyle Compatibility */}
      <div className="space-y-4 pt-4 border-t border-rose-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#7E2248] flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Partner Lifestyle Expectations</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Smoking */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Smoking Habit</label>
            <select
              value={data.smokingPreference}
              onChange={(e) => onChange("smokingPreference", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="Non-smoker preferred">Non-smoker preferred</option>
              <option value="Occasional / Social is fine">Occasional / Social is fine</option>
              <option value="Doesn't matter">Doesn't matter</option>
            </select>
          </div>

          {/* Drinking */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Alcohol Habit</label>
            <select
              value={data.drinkingPreference}
              onChange={(e) => onChange("drinkingPreference", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="Non-drinker preferred">Non-drinker preferred</option>
              <option value="Social / Occasional is fine">Social / Occasional is fine</option>
              <option value="Regular is fine">Regular is fine</option>
              <option value="Doesn't matter">Doesn't matter</option>
            </select>
          </div>

          {/* Dietary */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Dietary Compatibility</label>
            <select
              value={data.dietaryPreference}
              onChange={(e) => onChange("dietaryPreference", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="No preference / Any diet">No preference / Any diet</option>
              <option value="Vegetarian preferred">Vegetarian preferred</option>
              <option value="Vegan preferred">Vegan preferred</option>
              <option value="Eggetarian or Non-veg">Eggetarian or Non-veg</option>
            </select>
          </div>

          {/* Pets */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Pet Friendliness</label>
            <select
              value={data.petPreference}
              onChange={(e) => onChange("petPreference", e.target.value)}
              className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="Must love pets">Must love pets</option>
              <option value="Comfortable with pets">Comfortable with pets</option>
              <option value="No pets preferred">No pets preferred</option>
              <option value="Doesn't matter">Doesn't matter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Qualities & Values (Max 5) */}
      <div className="space-y-3 pt-4 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Top Qualities You Value in a Partner</span>
            <span
              className={`font-semibold text-[11px] ${
                data.coreQualities.length === 5 ? "text-[#7E2248]" : "text-slate-500"
              }`}
            >
              ({data.coreQualities.length} / 5 selected)
            </span>
          </label>
          <span className="text-[11px] text-slate-400">Select up to 5 priority qualities</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PARTNER_QUALITIES_OPTIONS.map((quality) => {
            const isSelected = data.coreQualities.includes(quality);
            const isDisabled = !isSelected && data.coreQualities.length >= 5;

            return (
              <button
                key={quality}
                type="button"
                disabled={isDisabled}
                onClick={() => toggleQuality(quality)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : isDisabled
                    ? "bg-rose-50/40 text-slate-400 border border-rose-100 cursor-not-allowed opacity-40"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{quality}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Private Deal Breakers */}
      <div className="space-y-3 pt-5 border-t border-rose-100 bg-rose-50/50 -mx-6 sm:-mx-8 p-6 sm:p-8 rounded-b-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-serif font-bold text-rose-900 uppercase tracking-wider">
              Confidential Deal Breakers
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Strictly Private — Never Shown on Public Profile</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Select attributes that are definite deal-breakers for you. JabWeMeet's matchmaking engine and Relationship Managers will filter out profiles matching these traits before introducing anyone to you.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {DEAL_BREAKER_OPTIONS.map((breaker) => {
            const isSelected = data.dealBreakers.includes(breaker);
            return (
              <button
                key={breaker}
                type="button"
                onClick={() => toggleDealBreaker(breaker)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-rose-100 text-rose-900 border border-rose-300 font-semibold shadow-2xs"
                    : "bg-white text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5 text-rose-700" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                <span>{breaker}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
