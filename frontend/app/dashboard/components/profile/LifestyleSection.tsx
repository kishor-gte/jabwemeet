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
    <div id="section-lifestyle" className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Daily Lifestyle & Habits</h3>
            <p className="text-xs text-slate-500">
              Helps matchmakers and event hosts pair you with like-minded members.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Smoking */}
        <div>
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <Cigarette className="w-4 h-4 text-[#7E2248]" />
            <span>Smoking</span>
          </label>
          <select
            value={data.smoking}
            onChange={(e) => onChange("smoking", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <Wine className="w-4 h-4 text-purple-600" />
            <span>Alcohol</span>
          </label>
          <select
            value={data.alcohol}
            onChange={(e) => onChange("alcohol", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <Utensils className="w-4 h-4 text-emerald-600" />
            <span>Dietary Preference</span>
          </label>
          <select
            value={data.foodPreference}
            onChange={(e) => onChange("foodPreference", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <PawPrint className="w-4 h-4 text-amber-600" />
            <span>Pets & Animals</span>
          </label>
          <select
            value={data.pets}
            onChange={(e) => onChange("pets", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <Dumbbell className="w-4 h-4 text-[#7E2248]" />
            <span>Fitness & Activity</span>
          </label>
          <select
            value={data.fitness}
            onChange={(e) => onChange("fitness", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <Plane className="w-4 h-4 text-[#7E2248]" />
            <span>Travel Frequency</span>
          </label>
          <select
            value={data.travelFrequency}
            onChange={(e) => onChange("travelFrequency", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1.5">
            <SunMoon className="w-4 h-4 text-purple-600" />
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
                  className={`p-3 rounded-2xl border text-left transition text-xs font-medium flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-rose-50 border-[#7E2248] text-[#7E2248] font-bold shadow-xs"
                      : "bg-[#FDFBF9] border-rose-200 text-slate-600 hover:text-slate-900 hover:border-rose-300"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#7E2248] shrink-0 ml-2" />
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
