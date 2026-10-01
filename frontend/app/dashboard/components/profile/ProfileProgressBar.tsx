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
    <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-7 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-1.5 border border-rose-200">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            Profile Strength
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
            Complete your JabWeMeet profile
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Complete your profile to receive better event recommendations, compatible peer introductions, and personalized Relationship Manager assistance.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#7E2248]">{percentage}%</span>
          <span className="text-xs text-slate-400 block font-medium">completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-rose-50 rounded-full h-3 overflow-hidden p-0.5 border border-rose-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7E2248] via-[#982b57] to-amber-500 transition-all duration-500 shadow-xs"
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>

      {/* Missing section shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-rose-100/60 text-xs">
        {missingShortcuts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Quick complete:</span>
            {missingShortcuts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateSection(item.sectionId)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200 hover:bg-rose-100 transition font-semibold text-[11px]"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-3 h-3 opacity-75" />
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
