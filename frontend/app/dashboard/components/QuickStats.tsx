"use client";

import React from "react";
import { Calendar, CalendarCheck, Users, CheckCircle2, MapPin } from "lucide-react";

interface QuickStatsProps {
  totalEventsCount: number;
  localEventsCount: number;
  userCity: string;
  joinedEventsCount: number;
  connectionsCount: number;
  profileCompletionPercentage: number;
  onViewEvents: () => void;
  onViewLocalEvents: () => void;
  onViewConnections: () => void;
  onViewProfile: () => void;
}

export default function QuickStats({
  totalEventsCount,
  localEventsCount,
  userCity,
  joinedEventsCount,
  connectionsCount,
  profileCompletionPercentage,
  onViewEvents,
  onViewLocalEvents,
  onViewConnections,
  onViewProfile,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Upcoming Events",
      value: totalEventsCount.toString(),
      helper: localEventsCount > 0 ? `${localEventsCount} right in ${userCity}` : `Live across all cities`,
      icon: Calendar,
      color: "text-[#7E2248]",
      bg: "bg-rose-50",
      border: "border-rose-200/80",
      onClick: onViewEvents,
    },
    {
      label: `In ${userCity || "Your City"}`,
      value: localEventsCount.toString(),
      helper: localEventsCount > 0 ? `Local offline experiences` : `No local events today`,
      icon: MapPin,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
      onClick: onViewLocalEvents,
    },
    {
      label: "My RSVPs",
      value: joinedEventsCount.toString(),
      helper: joinedEventsCount === 0 ? "No active reservations" : `${joinedEventsCount} spot${joinedEventsCount > 1 ? "s" : ""} secured`,
      icon: CalendarCheck,
      color: "text-[#7E2248]",
      bg: "bg-rose-50",
      border: "border-rose-200/80",
      onClick: onViewEvents,
    },
    {
      label: "Connections",
      value: connectionsCount.toString(),
      helper: connectionsCount === 0 ? "Connect with event peers" : `${connectionsCount} mutual connection${connectionsCount > 1 ? "s" : ""}`,
      icon: Users,
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200/80",
      onClick: onViewConnections,
    },
    {
      label: "Profile Strength",
      value: `${profileCompletionPercentage}%`,
      helper: profileCompletionPercentage === 100 ? "All verified details complete" : `${100 - profileCompletionPercentage}% details missing`,
      icon: CheckCircle2,
      color: profileCompletionPercentage >= 80 ? "text-emerald-700" : "text-amber-700",
      bg: profileCompletionPercentage >= 80 ? "bg-emerald-50" : "bg-amber-50",
      border: profileCompletionPercentage >= 80 ? "border-emerald-200/80" : "border-amber-200/80",
      onClick: onViewProfile,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <button
            key={idx}
            onClick={stat.onClick}
            className="group text-left relative overflow-hidden rounded-3xl bg-white border border-rose-100 p-4 sm:p-5 hover:border-[#7E2248]/40 hover:shadow-md transition duration-300 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {stat.label}
                </span>
                <div className={`p-1.5 sm:p-2 rounded-2xl ${stat.bg} ${stat.border} border ${stat.color} group-hover:scale-110 transition shrink-0`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 group-hover:text-[#7E2248] tracking-tight transition">
                  {stat.value}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 truncate">
              {stat.helper}
            </p>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-100 to-transparent group-hover:via-[#7E2248]/50 transition" />
          </button>
        );
      })}
    </div>
  );
}
