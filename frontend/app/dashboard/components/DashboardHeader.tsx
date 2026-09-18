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
  ArrowLeft,
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#162238] via-[#101a2c] to-[#0c1424] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#e06d53]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          {/* Dynamic Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {user.isVerified !== false && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Account
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#fca5a5]" />
              {user.city} {localEventsCount > 0 ? `(${localEventsCount} nearby)` : ""}
            </span>

            <span className="px-3 py-1 rounded-full bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30 uppercase tracking-wider text-[10px]">
              Role: {user.role}
            </span>

            {user.relationshipIntent && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                <Heart className="w-3 h-3" />
                Intent: {user.relationshipIntent}
              </span>
            )}

            {userAge && (
              <span className="px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5 text-[11px]">
                Age: {userAge}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              {daysSinceJoin === 0 ? "Joined today" : `Member for ${daysSinceJoin}d`}
            </span>
          </div>

          {/* Dynamic Greeting */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {greeting}, <span className="text-[#fca5a5]">{firstName}</span> 👋
          </h1>

          {/* Dynamic Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            {getDynamicSubtitle()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold shadow-lg shadow-red-500/30 border border-red-400/30 transition transform hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Admin Panel</span>
            </Link>
          )}

          <button
            onClick={onExploreExperiences}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#c95940] hover:to-[#b8432a] text-white text-sm font-semibold shadow-lg shadow-[#e06d53]/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Experiences</span>
          </button>

          <button
            onClick={onBrowseEvents}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/10 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Browse Events ({totalEventsCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
