"use client";

import React from "react";
import {
  Cigarette,
  Wine,
  Utensils,
  PawPrint,
  Dumbbell,
  Plane,
  Sparkles,
  SunMoon,
} from "lucide-react";

export interface LifestyleData {
  smoking: string;
  alcohol: string;
  foodPreference: string;
  pets: string;
  fitness: string;
  travelFrequency: string;
  sleepRhythm: string;
}

interface LifestyleSectionProps {
  data: LifestyleData;
  onChange: (field: keyof LifestyleData, value: string) => void;
}

export default function LifestyleSection({ data, onChange }: LifestyleSectionProps) {
  const smokingOptions = ["Never", "Occasionally", "Socially", "Regularly", "Prefer not to say"];
  const alcoholOptions = ["Never", "Occasionally", "Socially", "Regularly", "Prefer not to say"];
  const foodOptions = [
    "Vegetarian",
    "Non-Vegetarian",
    "Vegan",
    "Eggetarian",
    "Jain",
    "Other",
    "Prefer not to say",
  ];
  const petsOptions = [
    "Love pets & have pets",
    "Love pets, don't have one",
    "Like pets",
    "Not comfortable with pets",
    "Allergic to pets",
    "No preference",
  ];
  const fitnessOptions = [
    "Very Active (Daily fitness/sports)",
    "Active (3-4 times a week)",
    "Occasionally Active (Walks, light yoga)",
    "Not Particularly Active",
    "Prefer not to say",
  ];
  const travelOptions = [
    "Frequent Traveller (Monthly trips/exploring)",
    "Occasional Traveller (Few times a year)",
    "Rarely Travel / Homebody",
    "Prefer staycations",
  ];
  const sleepOptions = ["Early Bird (Morning Person)", "Night Owl", "Flexible / In Between"];

  return (
    <div id="section-lifestyle" className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Daily Lifestyle & Habits</h3>
            <p className="text-xs text-slate-400">
              Helps matchmakers and event hosts pair you with like-minded members.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Smoking */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <Cigarette className="w-4 h-4 text-[#e06d53]" />
            <span>Smoking</span>
          </label>
          <select
            value={data.smoking}
            onChange={(e) => onChange("smoking", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select smoking habit</option>
            {smokingOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Alcohol */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <Wine className="w-4 h-4 text-purple-400" />
            <span>Alcohol</span>
          </label>
          <select
            value={data.alcohol}
            onChange={(e) => onChange("alcohol", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select alcohol consumption</option>
            {alcoholOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Food Preference */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>Dietary Preference</span>
          </label>
          <select
            value={data.foodPreference}
            onChange={(e) => onChange("foodPreference", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select diet preference</option>
            {foodOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Pets */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <PawPrint className="w-4 h-4 text-amber-400" />
            <span>Pets & Animals</span>
          </label>
          <select
            value={data.pets}
            onChange={(e) => onChange("pets", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select pet preference</option>
            {petsOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Fitness */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span>Fitness & Activity</span>
          </label>
          <select
            value={data.fitness}
            onChange={(e) => onChange("fitness", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select fitness frequency</option>
            {fitnessOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Travel Frequency */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <Plane className="w-4 h-4 text-sky-400" />
            <span>Travel Frequency</span>
          </label>
          <select
            value={data.travelFrequency}
            onChange={(e) => onChange("travelFrequency", e.target.value)}
            className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53] transition"
          >
            <option value="">Select travel frequency</option>
            {travelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Sleep Rhythm / Routine */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1.5">
            <SunMoon className="w-4 h-4 text-indigo-400" />
            <span>Daily Routine / Sleep Rhythm</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {sleepOptions.map((opt) => {
              const isSelected = data.sleepRhythm === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange("sleepRhythm", opt)}
                  className={`p-3 rounded-xl border text-left transition text-xs font-medium flex items-center justify-between ${
                    isSelected
                      ? "bg-[#e06d53]/15 border-[#e06d53] text-white"
                      : "bg-[#0b111e] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#e06d53] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
