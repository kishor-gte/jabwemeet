"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Compass,
  Calendar,
  Heart,
  Clock,
  UserCheck,
  ArrowRight,
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    name: string;
    city: string;
    role: string;
    isVerified?: boolean;
    gender: string | null;
    relationshipIntent: string | null;
    createdAt: string;
    dateOfBirth?: string;
  };
  totalEventsCount: number;
  localEventsCount: number;
  onExploreExperiences: () => void;
  onBrowseEvents: () => void;
}

export default function DashboardHeader({
  user,
  totalEventsCount,
  localEventsCount,
  onExploreExperiences,
  onBrowseEvents,
}: DashboardHeaderProps) {
  // Dynamic greeting based on current local hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  const firstName = user.name ? user.name.split(" ")[0] : "Member";

  // Dynamic calculation of days since member joined
  const joinDate = new Date(user.createdAt);
  const daysSinceJoin = !isNaN(joinDate.getTime())
    ? Math.max(0, Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Dynamic calculation of user age if DOB is present
  const userAge = user.dateOfBirth
    ? Math.abs(new Date(Date.now() - new Date(user.dateOfBirth).getTime()).getUTCFullYear() - 1970)
    : null;

  // Dynamic context-aware subtitle
  const getDynamicSubtitle = () => {
    if (localEventsCount > 0) {
      return `You have ${localEventsCount} curated ${
        localEventsCount === 1 ? "event" : "events"
      } happening right here in ${user.city}, plus ${totalEventsCount} nationwide gatherings.`;
    }
    if (user.relationshipIntent) {
      return `Looking for ${user.relationshipIntent.toLowerCase()}? Explore ${totalEventsCount} verified offline experiences and personalized introductions.`;
    }
    return `Discover people, experiences and genuine connections in ${user.city || "your city"}. ${totalEventsCount} experiences currently active.`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF3F6] via-[#FDFBF9] to-white border border-rose-100 p-6 sm:p-8 lg:p-10 shadow-sm">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          {/* Dynamic Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {user.isVerified !== false && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Account
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 border border-rose-100 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
              {user.city} {localEventsCount > 0 ? `(${localEventsCount} nearby)` : ""}
            </span>

            <span className="px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200 uppercase tracking-wider text-[10px] font-bold">
              Role: {user.role}
            </span>

            {user.relationshipIntent && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50/80 text-[#7E2248] border border-rose-200 text-[11px] font-semibold">
                <Heart className="w-3 h-3 text-[#7E2248]" />
                Intent: {user.relationshipIntent}
              </span>
            )}

            {userAge && (
              <span className="px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-[11px]">
                Age: {userAge}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-slate-500 border border-slate-200 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              {daysSinceJoin === 0 ? "Joined today" : `Member for ${daysSinceJoin}d`}
            </span>
          </div>

          {/* Dynamic Greeting */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {greeting},{" "}
            <span className="font-serif italic font-normal text-[#7E2248]">
              {firstName}
            </span>{" "}
            👋
          </h1>

          {/* Dynamic Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {getDynamicSubtitle()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onExploreExperiences}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#7E2248]/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Experiences</span>
          </button>

          <button
            onClick={onBrowseEvents}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 text-xs font-bold uppercase tracking-wider transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-[#7E2248]" />
            <span>Browse Events ({totalEventsCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
