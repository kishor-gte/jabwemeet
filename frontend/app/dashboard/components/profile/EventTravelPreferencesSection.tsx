"use client";

import React from "react";
import {
  CalendarDays,
  Ticket,
  Users,
  Clock,
  Compass,
  Check,
  Coffee,
  Plane,
} from "lucide-react";

export interface EventTravelPreferencesData {
  eventFormats: string[];
  eventSize: string;
  preferredDays: string[];
  firstMeetingPreference: string;
  travelStyle: string[];
  tripBudgetPreference: string;
}

interface EventTravelPreferencesSectionProps {
  data: EventTravelPreferencesData;
  onChange: (field: keyof EventTravelPreferencesData, value: any) => void;
}

const EVENT_FORMATS = [
  "Singles Meetups & Social Mixers",
  "Speed Dating",
  "Curated 1-on-1 Blind Dates",
  "Dance & Salsa Socials",
  "Singles Weekend Trips & Retreats",
  "Board Game Nights & Trivia",
  "Hiking, Treks & Nature Walks",
  "Cafe Crawls & Coffee Tastings",
  "Breakup Healing & Moving-On Circles",
  "Live Music & Concert Evenings",
  "Culinary Workshops & Wine Evenings",
];

const EVENT_SIZES = [
  "Small & Intimate (10–20 people)",
  "Medium & Balanced (20–40 people)",
  "Large & High-Energy (50+ people)",
  "No Preference (Comfortable with any)",
];

const PREFERRED_DAYS = [
  "Friday Evenings",
  "Saturday Evenings",
  "Sunday Brunches / Afternoons",
  "Weekday Evenings (Tue–Thu)",
  "Weekend Mornings",
];

const FIRST_MEETING_OPTIONS = [
  "Casual Coffee or Boba Date",
  "Interactive Activity (Board games, workshop, pottery)",
  "Seated Dinner & Deep Conversation",
  "Outdoor Walk / Botanical garden stroll",
  "Cocktails / Drinks at a cozy speakeasy",
];

const TRAVEL_STYLES = [
  "Relaxing & Boutique Stays",
  "Trekking, Hiking & Outdoor Adventure",
  "Cultural, Heritage & Food Walks",
  "Scenic Road Trips & Camping",
  "Beachside Retreats & Sunsets",
  "Quick Weekend Staycations",
];

const BUDGET_PREFERENCES = [
  "Budget-friendly & Backpacking",
  "Comfort / Mid-range (₹₹)",
  "Premium & Luxury (₹₹₹)",
  "Flexible depending on itinerary",
];

export default function EventTravelPreferencesSection({
  data,
  onChange,
}: EventTravelPreferencesSectionProps) {
  const toggleArrayItem = (field: "eventFormats" | "preferredDays" | "travelStyle", item: string) => {
    const list = data[field];
    if (list.includes(item)) {
      onChange(
        field,
        list.filter((i) => i !== item)
      );
    } else {
      onChange(field, [...list, item]);
    }
  };

  return (
    <div id="section-events" className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shadow-xs">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Event & Travel Preferences</h3>
            <p className="text-xs text-slate-500">
              Customize your JabWeMeet offline invites, group outings, and singles trips.
            </p>
          </div>
        </div>
      </div>

      {/* Preferred Event Formats */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Preferred Event Experiences</span>
            <span className="text-slate-500 font-normal">
              ({data.eventFormats.length} selected)
            </span>
          </label>
          <span className="text-[11px] text-slate-500">Select all that interest you</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {EVENT_FORMATS.map((format) => {
            const isSelected = data.eventFormats.includes(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => toggleArrayItem("eventFormats", format)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{format}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Group Size */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-600" />
          <span>Preferred Event Crowd Size</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EVENT_SIZES.map((size) => {
            const isSelected = data.eventSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onChange("eventSize", size)}
                className={`p-3.5 rounded-2xl border text-left transition text-xs font-medium flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-rose-50 border-[#7E2248] text-[#7E2248] shadow-xs"
                    : "bg-[#FDFBF9] border-rose-200 text-slate-600 hover:text-slate-900 hover:border-rose-300"
                }`}
              >
                <span>{size}</span>
                {isSelected && <Check className="w-4 h-4 text-[#7E2248] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Days & Timing */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Best Days for Offline Events</span>
            <span className="text-slate-500 font-normal">
              ({data.preferredDays.length} selected)
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {PREFERRED_DAYS.map((day) => {
            const isSelected = data.preferredDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleArrayItem("preferredDays", day)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{day}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* First Meeting / Date Setting */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Coffee className="w-3.5 h-3.5 text-[#7E2248]" />
          <span>Ideal First Meetup Setting</span>
        </label>

        <select
          value={data.firstMeetingPreference}
          onChange={(e) => onChange("firstMeetingPreference", e.target.value)}
          className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
        >
          <option value="">Select your preferred first meeting setting</option>
          {FIRST_MEETING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Travel & Trip Styles */}
      <div className="space-y-3 pt-3 border-t border-rose-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Travel & Singles Trip Vibe</span>
            <span className="text-slate-500 font-normal">
              ({data.travelStyle.length} selected)
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRAVEL_STYLES.map((style) => {
            const isSelected = data.travelStyle.includes(style);
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleArrayItem("travelStyle", style)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs border border-[#7E2248]"
                    : "bg-[#FDFBF9] text-slate-600 border border-rose-200 hover:border-rose-300 hover:text-slate-900"
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{style}</span>
              </button>
            );
          })}
        </div>

        {/* Trip Budget */}
        <div className="pt-2 text-xs">
          <label className="block text-slate-700 font-semibold mb-1.5">
            Preferred Trip Budget Tier
          </label>
          <select
            value={data.tripBudgetPreference}
            onChange={(e) => onChange("tripBudgetPreference", e.target.value)}
            className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
          >
            <option value="">Select trip budget preference</option>
            {BUDGET_PREFERENCES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
