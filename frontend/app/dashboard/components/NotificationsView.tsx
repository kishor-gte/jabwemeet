"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  HeartHandshake,
  Headphones,
  CheckCheck,
  Inbox,
  Filter,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface NotificationsViewProps {
  registeredEvents: EventItem[];
  hasRelationshipManagerReq: boolean;
  hasBreakupBuddyReq: boolean;
}

export default function NotificationsView({
  registeredEvents,
  hasRelationshipManagerReq,
  hasBreakupBuddyReq,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<"all" | "events" | "services">("all");

  const notifications = [
    ...registeredEvents.map((evt) => ({
      id: `notif-evt-${evt.id}`,
      type: "events",
      title: `RSVP Confirmed for "${evt.title}"`,
      detail: `Your entry pass PASS-JWM-${evt.id.slice(-4).toUpperCase()} is verified for ${evt.location}, ${evt.city}.`,
      time: "Recent",
      icon: CalendarCheck,
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    })),
    ...(hasRelationshipManagerReq
      ? [
          {
            id: "notif-rm",
            type: "services",
            title: "Relationship Manager Consultation Active",
            detail: "Your preferences are being reviewed by a certified human matchmaker.",
            time: "Active",
            icon: HeartHandshake,
            color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
          },
        ]
      : []),
    ...(hasBreakupBuddyReq
      ? [
          {
            id: "notif-bb",
            type: "services",
            title: "Breakup Buddy Support Session Logged",
            detail: "A peer listener has received your confidential support request.",
            time: "Active",
            icon: Headphones,
            color: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
          },
        ]
      : []),
    {
      id: "notif-sys-1",
      type: "services",
      title: "Account Security & Phone Verified",
      detail: "Your account is verified and eligible for real-world events.",
      time: "Welcome",
      icon: CheckCircle2,
      color: "text-teal-400 bg-teal-500/15 border-teal-500/30",
    },
  ];

  const filtered = notifications.filter((n) => filter === "all" || n.type === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alerts & Updates
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time confirmations, matchmaker updates, and venue reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#131d2e] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === "all" ? "bg-[#e06d53] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("events")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === "events" ? "bg-[#e06d53] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Events ({notifications.filter((n) => n.type === "events").length})
          </button>
          <button
            onClick={() => setFilter("services")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === "services" ? "bg-[#e06d53] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Services ({notifications.filter((n) => n.type === "services").length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#131d2e] border border-white/10 flex items-start gap-4 shadow hover:border-white/20 transition"
            >
              <div className={`p-2.5 rounded-xl border ${item.color} shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
