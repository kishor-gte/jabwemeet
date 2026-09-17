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

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  sentBy: string;
  sentAt: string;
}

interface NotificationsViewProps {
  registeredEvents: EventItem[];
  hasRelationshipManagerReq: boolean;
  hasBreakupBuddyReq: boolean;
  announcements?: AnnouncementItem[];
}

export default function NotificationsView({
  registeredEvents,
  hasRelationshipManagerReq,
  hasBreakupBuddyReq,
  announcements = [],
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<"all" | "announcements" | "events" | "services">("all");

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  const notifications = [
    // 1. Official Platform Broadcast Announcements from Super Admin
    ...announcements.map((ann) => ({
      id: ann.id,
      type: "announcements" as const,
      title: ann.title,
      detail: ann.message,
      time: formatRelativeTime(ann.sentAt),
      icon: Bell,
      color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      badge: "Platform Announcement",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      author: ann.sentBy || "Super Admin",
      audience: ann.targetAudience,
    })),
    // 2. Event RSVP Confirmed
    ...registeredEvents.map((evt) => ({
      id: `notif-evt-${evt.id}`,
      type: "events" as const,
      title: `RSVP Confirmed for "${evt.title}"`,
      detail: `Your entry pass PASS-JWM-${evt.id.slice(-4).toUpperCase()} is verified for ${evt.location}, ${evt.city}.`,
      time: "Recent",
      icon: CalendarCheck,
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      badge: "Event Pass",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      author: "Events Team",
      audience: "Attendee",
    })),
    // 3. RM Consultations
    ...(hasRelationshipManagerReq
      ? [
          {
            id: "notif-rm",
            type: "services" as const,
            title: "Relationship Manager Consultation Active",
            detail: "Your preferences are being reviewed by a certified human matchmaker.",
            time: "Active",
            icon: HeartHandshake,
            color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
            badge: "Matchmaking",
            badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
            author: "RM Concierge",
            audience: "Client",
          },
        ]
      : []),
    // 4. Breakup Buddy Support
    ...(hasBreakupBuddyReq
      ? [
          {
            id: "notif-bb",
            type: "services" as const,
            title: "Breakup Buddy Support Session Logged",
            detail: "A peer listener has received your confidential support request.",
            time: "Active",
            icon: Headphones,
            color: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
            badge: "Peer Support",
            badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
            author: "Care Team",
            audience: "Member",
          },
        ]
      : []),
    // 5. Account Security
    {
      id: "notif-sys-1",
      type: "services" as const,
      title: "Account Security & Phone Verified",
      detail: "Your account is verified and eligible for real-world events.",
      time: "Welcome",
      icon: CheckCircle2,
      color: "text-teal-400 bg-teal-500/15 border-teal-500/30",
      badge: "Security",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      author: "Platform Trust",
      audience: "All Users",
    },
  ];

  const filtered = notifications.filter((n) => filter === "all" || n.type === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alerts & Broadcasts
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time platform announcements, RSVP confirmations, and service updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[#131d2e] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === "all" ? "bg-[#e06d53] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("announcements")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === "announcements" ? "bg-[#e06d53] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Announcements ({notifications.filter((n) => n.type === "announcements").length})
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
        {filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#131d2e] border border-white/10 text-center text-slate-400 text-sm">
            No notifications found in this category.
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon;
            const isAnnouncement = item.type === "announcements";
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-[#131d2e] border transition flex items-start gap-4 shadow ${
                  isAnnouncement
                    ? "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#131d2e] to-[#131d2e] hover:border-amber-500/50"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${item.color} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1.5 leading-relaxed whitespace-pre-line">
                    {item.detail}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                    <span>From: {item.author}</span>
                    <span>•</span>
                    <span>Target: {item.audience}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

