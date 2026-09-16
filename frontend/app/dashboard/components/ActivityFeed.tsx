"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  CalendarCheck,
  Bell,
  Sparkles,
  ChevronRight,
  Inbox,
  HeartHandshake,
  Headphones,
  UserCheck,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface ActivityFeedProps {
  userCreatedAt: string;
  userName: string;
  profilePercentage: number;
  registeredEvents: EventItem[];
  serviceRequests: {
    relationshipManager: boolean;
    breakupBuddy: boolean;
  };
  connectionRequestsCount: number;
}

export default function ActivityFeed({
  userCreatedAt,
  userName,
  profilePercentage,
  registeredEvents,
  serviceRequests,
  connectionRequestsCount,
}: ActivityFeedProps) {
  const createdDate = new Date(userCreatedAt);
  const formattedCreated = !isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  // Build live activity timeline dynamically from actual active state
  const activities = [
    // 1. Registered Events
    ...registeredEvents.map((evt) => ({
      title: `Confirmed RSVP for "${evt.title}"`,
      detail: `Venue: ${evt.location}, ${evt.city} • Pass active`,
      time: "Just now",
      icon: CalendarCheck,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    })),

    // 2. Service Requests
    ...(serviceRequests.relationshipManager
      ? [
          {
            title: "Relationship Manager Consultation Requested",
            detail: "Our human matchmaker team is reviewing your preferences",
            time: "Active",
            icon: HeartHandshake,
            color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          },
        ]
      : []),

    ...(serviceRequests.breakupBuddy
      ? [
          {
            title: "Breakup Buddy Session Requested",
            detail: "A certified peer buddy has received your confidential request",
            time: "Active",
            icon: Headphones,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          },
        ]
      : []),

    // 3. Connection Requests
    ...(connectionRequestsCount > 0
      ? [
          {
            title: `Sent ${connectionRequestsCount} community connection request${
              connectionRequestsCount > 1 ? "s" : ""
            }`,
            detail: "Peers in your city have been notified",
            time: "Today",
            icon: UserCheck,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          },
        ]
      : []),

    // 4. Profile strength milestone
    {
      title: `Profile Strength currently at ${profilePercentage}%`,
      detail:
        profilePercentage === 100
          ? "All essential matchmaking details verified"
          : "Complete remaining attributes for higher compatibility matching",
      time: "Current",
      icon: CheckCircle2,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },

    // 5. Account Creation Milestone
    {
      title: `Welcome to JabWeMeet, ${userName.split(" ")[0]}!`,
      detail: "Registered and authenticated verified member",
      time: formattedCreated,
      icon: Sparkles,
      color: "text-[#fca5a5] bg-[#e06d53]/15 border-[#e06d53]/30",
    },
  ];

  // Dynamic Notifications list
  const notifications = [
    ...registeredEvents.map((evt) => ({
      id: `notif-${evt.id}`,
      title: `RSVP Confirmed: ${evt.title}`,
      subtitle: `Scheduled for ${new Date(evt.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} at ${evt.location}.`,
      icon: CalendarCheck,
      color: "text-emerald-400",
    })),
    ...(serviceRequests.relationshipManager
      ? [
          {
            id: "notif-rm",
            title: "Relationship Manager Assigned",
            subtitle: "Your personal matchmaker will initiate contact within 24 hours.",
            icon: HeartHandshake,
            color: "text-rose-400",
          },
        ]
      : []),
    ...(serviceRequests.breakupBuddy
      ? [
          {
            id: "notif-bb",
            title: "Breakup Buddy Session Scheduled",
            subtitle: "We're setting up a safe space for your healing journey.",
            icon: Headphones,
            color: "text-indigo-400",
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dynamic Recent Activity */}
      <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#e06d53]" />
              <h3 className="text-base font-bold text-white">Live Activity Feed</h3>
            </div>
            <span className="text-xs text-slate-400">{activities.length} recorded events</span>
          </div>

          <div className="space-y-3.5">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border ${act.color} shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-snug truncate">
                        {act.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      {act.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Notifications Preview */}
      <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {notifications.length} New
                </span>
              )}
            </div>
            <button
              onClick={() => alert("Notification center is up to date.")}
              className="text-xs font-semibold text-[#fca5a5] hover:text-white transition flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3"
                  >
                    <Icon className={`w-4 h-4 ${notif.color} shrink-0 mt-0.5`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-200 font-semibold">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {notif.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">You're all caught up</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No unread alerts. Event tickets, matchmaker updates, and peer messages will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>SMS & Email Alerts: <strong className="text-slate-300">Live</strong></span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
      </div>
    </div>
  );
}
