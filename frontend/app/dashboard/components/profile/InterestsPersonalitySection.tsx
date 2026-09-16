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
    <div id="section-interests" className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-7 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interests, Hobbies & Personality</h3>
            <p className="text-xs text-slate-400">
              Connect effortlessly with attendees and matches who share your genuine vibe.
            </p>
          </div>
        </div>
      </div>

      {/* Hobbies & Passions */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#e06d53]" />
            <span>Hobbies & Passions</span>
            <span className="text-slate-400 font-normal">({data.hobbies.length} selected)</span>
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isSelected
                    ? "bg-[#e06d53] text-white shadow-md shadow-[#e06d53]/25 border border-[#e06d53]"
                    : "bg-[#0b111e] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#e06d53] text-white shadow-md border border-[#e06d53]"
              >
                <Check className="w-3 h-3" />
                <span>{custom}</span>
                <button
                  type="button"
                  onClick={() => removeHobby(custom)}
                  className="hover:text-rose-200 transition"
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
              className="bg-[#0b111e] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53] flex-1"
            />
            <button
              type="submit"
              disabled={!customHobby.trim()}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* Social Energy / Persona */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-amber-400" />
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
                className={`p-3 rounded-xl border text-center transition text-xs font-medium ${
                  isSelected
                    ? "bg-purple-500/15 border-purple-500 text-purple-300 font-semibold shadow-sm"
                    : "bg-[#0b111e] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personality Traits Multi-select */}
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Core Personality Traits</span>
            <span className="text-slate-400 font-normal">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500"
                    : "bg-[#0b111e] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white"
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
      <div className="space-y-3 pt-3 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferred Social Settings</span>
            <span className="text-slate-400 font-normal">
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
                className={`p-3 rounded-xl border text-left transition text-xs font-medium flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500 text-white"
                    : "bg-[#0b111e] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <span>{env}</span>
                {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
