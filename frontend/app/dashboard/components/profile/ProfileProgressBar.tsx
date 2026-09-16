"use client";

import React from "react";
import { Sparkles, ArrowUpRight, CheckCircle2 } from "lucide-react";

interface ProfileProgressBarProps {
  percentage: number;
  missingShortcuts: { label: string; sectionId: string }[];
  onNavigateSection: (sectionId: string) => void;
}

export default function ProfileProgressBar({
  percentage,
  missingShortcuts,
  onNavigateSection,
}: ProfileProgressBarProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#162238] via-[#121c2d] to-[#0c1424] border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold mb-1.5 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Profile Strength
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Complete your JabWeMeet profile
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            Complete your profile to receive better event recommendations, compatible peer introductions, and personalized Relationship Manager assistance.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-3xl sm:text-4xl font-black text-white">{percentage}%</span>
          <span className="text-xs text-slate-400 block font-medium">completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#e06d53] via-amber-400 to-emerald-400 transition-all duration-500 shadow-lg"
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>

      {/* Missing section shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
        {missingShortcuts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Quick complete:</span>
            {missingShortcuts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateSection(item.sectionId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition font-medium text-[11px]"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-3 h-3 opacity-75" />
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            Your profile is 100% complete! Matchmakers and hosts have complete compatibility insights.
          </span>
        )}

        <span className="text-[11px] text-slate-400 shrink-0">
          {percentage < 80 ? "Recommended: reach 80%+ for priority invites" : "All key matching criteria met"}
        </span>
      </div>
    </div>
  );
}
