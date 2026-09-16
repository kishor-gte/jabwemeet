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
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      onClick: onViewEvents,
    },
    {
      label: `In ${userCity || "Your City"}`,
      value: localEventsCount.toString(),
      helper: localEventsCount > 0 ? `Local offline experiences` : `No local events today`,
      icon: MapPin,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      onClick: onViewLocalEvents,
    },
    {
      label: "My RSVPs",
      value: joinedEventsCount.toString(),
      helper: joinedEventsCount === 0 ? "No active reservations" : `${joinedEventsCount} spot${joinedEventsCount > 1 ? "s" : ""} secured`,
      icon: CalendarCheck,
      color: "text-[#fca5a5]",
      bg: "bg-[#e06d53]/15",
      border: "border-[#e06d53]/30",
      onClick: onViewEvents,
    },
    {
      label: "Connections",
      value: connectionsCount.toString(),
      helper: connectionsCount === 0 ? "Connect with event peers" : `${connectionsCount} mutual connection${connectionsCount > 1 ? "s" : ""}`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      onClick: onViewConnections,
    },
    {
      label: "Profile Strength",
      value: `${profileCompletionPercentage}%`,
      helper: profileCompletionPercentage === 100 ? "All verified details complete" : `${100 - profileCompletionPercentage}% details missing`,
      icon: CheckCircle2,
      color: profileCompletionPercentage >= 80 ? "text-teal-400" : "text-amber-400",
      bg: profileCompletionPercentage >= 80 ? "bg-teal-400/10" : "bg-amber-400/10",
      border: profileCompletionPercentage >= 80 ? "border-teal-400/20" : "border-amber-400/20",
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
            className="group text-left relative overflow-hidden rounded-2xl bg-[#131d2e] border border-white/10 p-4 sm:p-5 hover:border-white/20 hover:bg-[#162238] transition duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {stat.label}
                </span>
                <div className={`p-1.5 sm:p-2 rounded-xl ${stat.bg} ${stat.border} border ${stat.color} group-hover:scale-110 transition shrink-0`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {stat.value}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 truncate">
              {stat.helper}
            </p>

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#e06d53]/50 transition" />
          </button>
        );
      })}
    </div>
  );
}
