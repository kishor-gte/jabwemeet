"use client";

import React from "react";
import {
  Users,
  Clock,
  HeartHandshake,
  Music,
  Plane,
  Smile,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Ticket,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface ExperiencesSectionProps {
  events: EventItem[];
  userCity: string;
  onSelectCategory: (category: string) => void;
}

export default function ExperiencesSection({
  events,
  userCity,
  onSelectCategory,
}: ExperiencesSectionProps) {
  // Core signature categories recognized by JabWeMeet
  const standardCategories = [
    {
      key: "Singles Events",
      aliases: ["singles", "mixer", "singles events"],
      title: "Singles Meetups",
      defaultDescription: "Meet new people in a relaxed real-world environment designed for easy conversation.",
      tag: "Social Mixer",
      icon: Users,
      color: "text-[#7E2248]",
      bg: "bg-rose-50",
      border: "border-rose-200/80",
    },
    {
      key: "Speed Dating",
      aliases: ["speed", "speed dating"],
      title: "Speed Dating",
      defaultDescription: "Short conversations. Multiple new connections. 10+ intentional mini-dates in one evening.",
      tag: "Fast Track",
      icon: Clock,
      color: "text-amber-800",
      bg: "bg-amber-50",
      border: "border-amber-200/80",
    },
    {
      key: "Blind Dates",
      aliases: ["blind", "blind dates"],
      title: "Blind Dates",
      defaultDescription: "Let our Relationship Managers curate a hand-picked introduction based on your core values.",
      tag: "Human Curated",
      icon: HeartHandshake,
      color: "text-purple-800",
      bg: "bg-purple-50",
      border: "border-purple-200/80",
    },
    {
      key: "Dance Dates",
      aliases: ["dance", "dance dates", "bachata", "salsa"],
      title: "Dance Dates",
      defaultDescription: "Break the ice naturally through music, rhythm and shared movement in an energetic setting.",
      tag: "Active & Fun",
      icon: Music,
      color: "text-emerald-800",
      bg: "bg-emerald-50",
      border: "border-emerald-200/80",
    },
    {
      key: "Singles Travel",
      aliases: ["travel", "trip", "singles travel", "singles trips"],
      title: "Singles Trips",
      defaultDescription: "Weekend getaways, treks, and curated travel experiences with like-minded singles.",
      tag: "Adventure",
      icon: Plane,
      color: "text-sky-800",
      bg: "bg-sky-50",
      border: "border-sky-200/80",
    },
    {
      key: "Breakup Community",
      aliases: ["breakup", "breakup community", "fresh start"],
      title: "Breakup Support Circles",
      defaultDescription: "A supportive, uplifting social space to share, heal, and begin your next chapter with empathy.",
      tag: "Fresh Start",
      icon: Smile,
      color: "text-rose-800",
      bg: "bg-rose-50",
      border: "border-rose-200/80",
    },
  ];

  // Dynamically compute real metrics for each category from actual events
  const dynamicExperiences = standardCategories.map((cat) => {
    const matching = events.filter((e) => {
      const eCat = (e.category || "").toLowerCase();
      return (
        cat.aliases.some((alias) => eCat.includes(alias)) ||
        eCat.includes(cat.key.toLowerCase())
      );
    });

    const localMatching = matching.filter(
      (e) => (e.city || "").toLowerCase() === (userCity || "").toLowerCase()
    );

    const minPrice =
      matching.length > 0
        ? Math.min(...matching.map((e) => (typeof e.price === "number" ? e.price : 0)))
        : null;

    const distinctCities = Array.from(new Set(matching.map((e) => e.city).filter(Boolean)));

    const upcomingEventsSorted = [...matching].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
    const nextEvent = upcomingEventsSorted.find((e) => new Date(e.date).getTime() > Date.now()) || upcomingEventsSorted[0];

    return {
      ...cat,
      count: matching.length,
      localCount: localMatching.length,
      minPrice,
      distinctCities,
      nextEventDate: nextEvent ? new Date(nextEvent.date) : null,
      matchingEvents: matching,
    };
  });

  return (
    <div id="experiences" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            Dynamic Concept Catalog
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Find Your Next Experience
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
            Live catalog compiled dynamically across {events.length} upcoming gatherings in {Array.from(new Set(events.map(e => e.city))).length || 1} cities.
          </p>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Click any experience to filter live events
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dynamicExperiences.map((exp, idx) => {
          const Icon = exp.icon;
          return (
            <div
              key={idx}
              className="group relative rounded-3xl bg-white border border-rose-100 hover:border-[#7E2248]/40 p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 shadow-sm"
            >
              <div>
                {/* Header with Icon and Dynamic Badges */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`p-3 rounded-2xl ${exp.bg} ${exp.border} border ${exp.color} group-hover:scale-105 transition`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {exp.localCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {exp.localCount} in {userCity}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                      {exp.count} {exp.count === 1 ? "Event" : "Events"}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold font-serif text-slate-900 mb-2 group-hover:text-[#7E2248] transition">
                  {exp.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {exp.defaultDescription}
                </p>

                {/* Dynamic Event Metadata Row */}
                <div className="space-y-1.5 pt-3 border-t border-rose-100/60 text-xs text-slate-500">
                  {exp.minPrice !== null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Ticket className="w-3.5 h-3.5 text-[#7E2248]" />
                        Entry from
                      </span>
                      <span className="text-slate-900 font-bold">
                        {exp.minPrice > 0 ? `₹${exp.minPrice.toLocaleString("en-IN")}` : "Free"}
                      </span>
                    </div>
                  )}

                  {exp.distinctCities.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Hosted in
                      </span>
                      <span className="text-slate-700 font-medium truncate max-w-[140px]">
                        {exp.distinctCities.join(", ")}
                      </span>
                    </div>
                  )}

                  {exp.nextEventDate && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        Next date
                      </span>
                      <span className="text-slate-700 font-medium">
                        {exp.nextEventDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-rose-100/60">
                <button
                  onClick={() => onSelectCategory(exp.key)}
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#7E2248] group-hover:translate-x-0.5 transition"
                >
                  <span>
                    {exp.count > 0 ? `View ${exp.count} ${exp.title}` : `Discover ${exp.title}`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#7E2248] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
