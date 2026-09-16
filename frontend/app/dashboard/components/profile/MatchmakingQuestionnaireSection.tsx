"use client";

import React, { useState } from "react";
import {
  FileQuestion,
  ChevronDown,
  ChevronUp,
  UserCheck,
  HeartHandshake,
  Coffee,
  Lock,
  Sparkles,
  Info,
} from "lucide-react";

export interface MatchmakingQuestionnaireData {
  // About You
  q1Energized: string;
  q2IdealSunday: string;
  q3Passions: string;
  q4FutureGoals: string;
  // Relationships
  q5HealthyRelationship: string;
  q6ConflictHandling: string;
  q7DeepValues: string;
  q8LoveLanguage: string;
  q9MarriageTimeline: string;
  // Dating
  q10MemorableDate: string;
  q11BlindDateComfort: string;
  q12RmAssistance: string;
  q13ThingToKnow: string;
  q14Icebreaker: string;
}

interface MatchmakingQuestionnaireSectionProps {
  data: MatchmakingQuestionnaireData;
  onChange: (field: keyof MatchmakingQuestionnaireData, value: string) => void;
}

export default function MatchmakingQuestionnaireSection({
  data,
  onChange,
}: MatchmakingQuestionnaireSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"about" | "relationships" | "dating">("about");

  const answeredCount = Object.values(data).filter((v) => v && v.trim().length > 0).length;

  return (
    <div
      id="section-questionnaire"
      className="rounded-3xl bg-[#131d2e] border border-white/10 overflow-hidden shadow-xl"
    >
      {/* Header bar / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 sm:p-8 flex items-center justify-between cursor-pointer select-none border-b border-white/10 hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                Relationship Manager Intake Questionnaire
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deals deeper into your personality for curated 1-on-1 blind dates and personalized introductions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {answeredCount} of 14 answered
          </span>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Privacy Notice */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex items-start gap-3 text-xs">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <span className="font-bold text-emerald-300">Confidential to Matchmaking Team: </span>
              Your answers here are reviewed exclusively by JabWeMeet Relationship Managers to curate high-compatibility blind dates and private introductions. They are never published on your public event profile.
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory("about")}
              className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === "about"
                  ? "bg-[#e06d53] text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>1. About You (4 Qs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("relationships")}
              className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === "relationships"
                  ? "bg-[#e06d53] text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>2. Relationships & Values (5 Qs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("dating")}
              className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === "dating"
                  ? "bg-[#e06d53] text-white"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>3. Dating & Blind Dates (5 Qs)</span>
            </button>
          </div>

          {/* CATEGORY 1: ABOUT YOU */}
          {activeCategory === "about" && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  1. What makes you feel most energized, peaceful, or happy in daily life?
                </label>
                <textarea
                  rows={2}
                  value={data.q1Energized}
                  onChange={(e) => onChange("q1Energized", e.target.value)}
                  placeholder="e.g. Morning coffee in quiet, finishing a good workout, catching up with close friends..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  2. What does your ideal, uncomplicated Sunday look like?
                </label>
                <textarea
                  rows={2}
                  value={data.q2IdealSunday}
                  onChange={(e) => onChange("q2IdealSunday", e.target.value)}
                  placeholder="e.g. Sleeping in till 9, exploring a breakfast cafe, reading a book or going for a swim..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  3. What are 1-2 passions or niche topics you could talk about for hours?
                </label>
                <input
                  type="text"
                  value={data.q3Passions}
                  onChange={(e) => onChange("q3Passions", e.target.value)}
                  placeholder="e.g. Formula 1 racing, specialty pour-over coffee, architecture, history of cinema..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    4. What are your major personal or career goals for the next 2-3 years?
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      data.q4FutureGoals.length > 500 ? "text-rose-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {data.q4FutureGoals.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={data.q4FutureGoals}
                  onChange={(e) => onChange("q4FutureGoals", e.target.value)}
                  placeholder="e.g. Transitioning into leadership, traveling through Japan, buying my first home..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>
          )}

          {/* CATEGORY 2: RELATIONSHIPS & VALUES */}
          {activeCategory === "relationships" && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  5. In your own words, how do you define a healthy, thriving relationship?
                </label>
                <textarea
                  rows={2}
                  value={data.q5HealthyRelationship}
                  onChange={(e) => onChange("q5HealthyRelationship", e.target.value)}
                  placeholder="e.g. Mutual respect, emotional safety, laughing often, and giving each other room to grow..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  6. How do you naturally handle disagreement or conflict?
                </label>
                <textarea
                  rows={2}
                  value={data.q6ConflictHandling}
                  onChange={(e) => onChange("q6ConflictHandling", e.target.value)}
                  placeholder="e.g. I prefer taking 15 minutes to cool down, then talking through things calmly without raising voices..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  7. What is something you hold non-negotiable in deep human connections?
                </label>
                <input
                  type="text"
                  value={data.q7DeepValues}
                  onChange={(e) => onChange("q7DeepValues", e.target.value)}
                  placeholder="e.g. Intellectual honesty, kindness to service staff, empathy in tough times..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    8. Primary Love Language
                  </label>
                  <select
                    value={data.q8LoveLanguage}
                    onChange={(e) => onChange("q8LoveLanguage", e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select primary love language</option>
                    <option value="Quality Time">Quality Time</option>
                    <option value="Words of Affirmation">Words of Affirmation</option>
                    <option value="Acts of Service">Acts of Service</option>
                    <option value="Physical Touch">Physical Touch</option>
                    <option value="Receiving Gifts">Receiving Gifts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    9. Marriage & Intent Timeline
                  </label>
                  <select
                    value={data.q9MarriageTimeline}
                    onChange={(e) => onChange("q9MarriageTimeline", e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select intention timeline</option>
                    <option value="Ready for marriage within 1-2 years">
                      Ready for marriage within 1-2 years
                    </option>
                    <option value="Intentional dating leading to marriage in 2-3 years">
                      Intentional dating leading to marriage in 2-3 years
                    </option>
                    <option value="Long-term partnership without marriage rush">
                      Long-term partnership without marriage rush
                    </option>
                    <option value="Taking time to meet the right person first">
                      Taking time to meet the right person first
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 3: DATING & BLIND DATES */}
          {activeCategory === "dating" && (
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  10. What was your most memorable date or social experience and why?
                </label>
                <textarea
                  rows={2}
                  value={data.q10MemorableDate}
                  onChange={(e) => onChange("q10MemorableDate", e.target.value)}
                  placeholder="e.g. Getting lost on a spontaneous food walk in old Bangalore, or playing board games until midnight..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    11. Comfort with Curated 1-on-1 Blind Dates
                  </label>
                  <select
                    value={data.q11BlindDateComfort}
                    onChange={(e) => onChange("q11BlindDateComfort", e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select comfort level</option>
                    <option value="Very excited & ready to try!">Very excited & ready to try!</option>
                    <option value="Open & curious (with verified venue)">
                      Open & curious (with verified venue)
                    </option>
                    <option value="A bit nervous, prefer guided format">
                      A bit nervous, prefer guided format
                    </option>
                    <option value="Prefer group events first">Prefer group events first</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    12. Relationship Manager Assistance
                  </label>
                  <select
                    value={data.q12RmAssistance}
                    onChange={(e) => onChange("q12RmAssistance", e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select assistance preference</option>
                    <option value="Yes! Pre-screen and introduce me to verified matches">
                      Yes! Pre-screen and introduce me to verified matches
                    </option>
                    <option value="Only recommend curated events for now">
                      Only recommend curated events for now
                    </option>
                    <option value="I prefer discovering organically at events">
                      I prefer discovering organically at events
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  13. What is one honest thing someone should know about you before a date?
                </label>
                <input
                  type="text"
                  value={data.q13ThingToKnow}
                  onChange={(e) => onChange("q13ThingToKnow", e.target.value)}
                  placeholder="e.g. I take a minute to warm up in new settings, I love dad jokes, I am very punctual..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  14. What is your favorite icebreaker or conversation starter?
                </label>
                <input
                  type="text"
                  value={data.q14Icebreaker}
                  onChange={(e) => onChange("q14Icebreaker", e.target.value)}
                  placeholder="e.g. If you had 2 free weeks and unlimited flight credits tomorrow, where are we landing?"
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
