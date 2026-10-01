"use client";

import React, { useState } from "react";
import {
  Compass,
  Check,
  Plus,
  X,
  Smile,
  Users2,
  Sparkles,
  Layers,
} from "lucide-react";

export interface InterestsPersonalityData {
  hobbies: string[];
  selfDescription: string;
  personalityTraits: string[];
  preferredSocialEnvironment: string[];
}

interface InterestsPersonalitySectionProps {
  data: InterestsPersonalityData;
  onChange: (field: keyof InterestsPersonalityData, value: any) => void;
}

const DEFAULT_HOBBIES = [
  "Travel & Exploration",
  "Live Music & Concerts",
  "Reading & Literature",
  "Cooking & Baking",
  "Cafes & Coffee Hopping",
  "Board Games & Trivia",
  "Fitness & Gym",
  "Running & Marathons",
  "Art & Museums",
  "Photography",
  "Cinema & Theatre",
  "Hiking & Trekking",
  "Tech & Startups",
  "Gaming & Esports",
  "Dance & Salsa",
  "Yoga & Mindfulness",
  "Volunteering & Social Causes",
  "Pets & Animals",
  "Stand-up Comedy",
  "Writing & Journaling",
  "Podcasts & Audiobooks",
];

const PERSONALITY_TRAITS = [
  "Calm & Grounded",
  "Ambitious & Driven",
  "Empathetic & Caring",
  "Witty & Humorous",
  "Adventurous & Spontaneous",
  "Thoughtful & Reflective",
  "Curious & Lifelong Learner",
  "Creative & Artistic",
  "Analytical & Structured",
  "Optimistic & Warm",
  "Independent & Self-reliant",
  "Loyal & Dependable",
  "Social & Outgoing",
  "Deep & Philosophical",
];

const SOCIAL_ENVIRONMENTS = [
  "One-to-One Conversations",
  "Small intimate groups (4–8 people)",
  "Lively mid-size gatherings (15–30 people)",
  "Large parties & celebrations (50+ people)",
  "Quiet, cozy cafes & bookshops",
  "Dynamic, outdoor adventures",
];

export default function InterestsPersonalitySection({
  data,
  onChange,
}: InterestsPersonalitySectionProps) {
  const [customHobby, setCustomHobby] = useState("");

  const toggleItem = (list: string[], item: string): string[] => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    } else {
      return [...list, item];
    }
  };

  const handleAddCustomHobby = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customHobby.trim();
    if (trimmed && !data.hobbies.includes(trimmed)) {
      onChange("hobbies", [...data.hobbies, trimmed]);
      setCustomHobby("");
    }
  };

  const removeHobby = (hobbyToRemove: string) => {
    onChange(
      "hobbies",
      data.hobbies.filter((h) => h !== hobbyToRemove)
    );
  };

  const personaOptions = ["Introvert", "Extrovert", "Ambivert", "Not Sure / Situational"];

  return (
    <div id="section-interests" className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Interests, Hobbies & Personality</h3>
            <p className="text-xs text-slate-500">
              Connect effortlessly with attendees and matches who share your genuine vibe.
            </p>
          </div>
        </div>
      </div>

      {/* Hobbies & Passions */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Hobbies & Passions</span>
            <span className="text-slate-500 font-normal">({data.hobbies.length} selected)</span>
          </label>
          <span className="text-[11px] text-slate-400">Tap to select or deselect</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DEFAULT_HOBBIES.map((hobby) => {
            const isSelected = data.hobbies.includes(hobby);
            return (
              <button
                key={hobby}
                type="button"
                onClick={() => onChange("hobbies", toggleItem(data.hobbies, hobby))}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{hobby}</span>
              </button>
            );
          })}

          {/* Any custom added hobbies */}
          {data.hobbies
            .filter((h) => !DEFAULT_HOBBIES.includes(h))
            .map((custom) => (
              <span
                key={custom}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
              >
                <Check className="w-3 h-3" />
                <span>{custom}</span>
                <button
                  type="button"
                  onClick={() => removeHobby(custom)}
                  className="hover:text-rose-200 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>

        {/* Add custom hobby input */}
        <div className="pt-1">
          <form onSubmit={handleAddCustomHobby} className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={customHobby}
              onChange={(e) => setCustomHobby(e.target.value)}
              placeholder="Add other interest (e.g. Pottery, Bouldering)..."
              className="bg-[#FDFBF9] border border-rose-200 rounded-full px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white flex-1"
            />
            <button
              type="submit"
              disabled={!customHobby.trim()}
              className="px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[#7E2248] disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Social Energy / Persona */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-amber-600" />
          <span>Social Energy & Disposition</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {personaOptions.map((opt) => {
            const isSelected = data.selfDescription === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange("selfDescription", opt)}
                className={`p-3 rounded-2xl border text-center transition text-xs font-medium cursor-pointer ${
                  isSelected
                    ? "bg-rose-50 border-[#7E2248] text-[#7E2248] font-bold shadow-xs"
                    : "bg-[#FDFBF9] border-rose-200 text-slate-600 hover:text-slate-900 hover:border-rose-300"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personality Traits Multi-select */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Core Personality Traits</span>
            <span className="text-slate-500 font-normal">
              ({data.personalityTraits.length} selected)
            </span>
          </label>
          <span className="text-[11px] text-slate-400">Select the traits that define you</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TRAITS.map((trait) => {
            const isSelected = data.personalityTraits.includes(trait);
            return (
              <button
                key={trait}
                type="button"
                onClick={() =>
                  onChange("personalityTraits", toggleItem(data.personalityTraits, trait))
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{trait}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Social Environment */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preferred Social Settings</span>
            <span className="text-slate-500 font-normal">
              ({data.preferredSocialEnvironment.length} selected)
            </span>
          </label>
          <span className="text-[11px] text-slate-400">Where you feel most comfortable</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SOCIAL_ENVIRONMENTS.map((env) => {
            const isSelected = data.preferredSocialEnvironment.includes(env);
            return (
              <button
                key={env}
                type="button"
                onClick={() =>
                  onChange(
                    "preferredSocialEnvironment",
                    toggleItem(data.preferredSocialEnvironment, env)
                  )
                }
                className={`p-3 rounded-2xl border text-left transition text-xs font-medium flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs"
                    : "bg-[#FDFBF9] border-rose-200 text-slate-600 hover:text-slate-900 hover:border-rose-300"
                }`}
              >
                <span>{env}</span>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
