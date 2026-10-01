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
  announcements?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    sentAt: string;
    sentBy?: string;
  }>;
  onViewAllNotifications?: () => void;
}

export default function ActivityFeed({
  userCreatedAt,
  userName,
  profilePercentage,
  registeredEvents,
  serviceRequests,
  connectionRequestsCount,
  announcements = [],
  onViewAllNotifications,
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
      color: "text-[#7E2248] bg-rose-50 border-rose-200",
    },
  ];

  // Dynamic Notifications list
  const notifications = [
    // Broadcast Announcements
    ...announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      subtitle: ann.message,
      icon: Bell,
      color: "text-amber-400",
      isBroadcast: true,
    })),
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
      isBroadcast: false,
    })),
    ...(serviceRequests.relationshipManager
      ? [
          {
            id: "notif-rm",
            title: "Relationship Manager Assigned",
            subtitle: "Your personal matchmaker will initiate contact within 24 hours.",
            icon: HeartHandshake,
            color: "text-rose-400",
            isBroadcast: false,
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
            isBroadcast: false,
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dynamic Recent Activity */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7E2248]" />
              <h3 className="text-base font-serif font-bold text-slate-900">Live Activity Feed</h3>
            </div>
            <span className="text-xs text-slate-500">{activities.length} recorded events</span>
          </div>

          <div className="space-y-3.5">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border ${act.color} shrink-0 mt-0.5 shadow-2xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug truncate">
                        {act.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
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
      <div className="rounded-3xl bg-white border border-rose-100 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-serif font-bold text-slate-900">Notifications</h3>
              {notifications.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                  {notifications.length} New
                </span>
              )}
            </div>
            <button
              onClick={onViewAllNotifications || (() => alert("Notification center is up to date."))}
              className="text-xs font-semibold text-[#7E2248] hover:text-[#681938] transition flex items-center gap-1 cursor-pointer"
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
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                      notif.isBroadcast
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-rose-50/30 border-rose-100 hover:bg-rose-50/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${notif.color} shrink-0 mt-0.5`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-900 font-semibold truncate">
                          {notif.title}
                        </p>
                        {notif.isBroadcast && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            Broadcast
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] mx-auto mb-3 shadow-xs">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-serif font-bold text-slate-900">You're all caught up</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No unread alerts. Event tickets, matchmaker updates, and peer messages will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-rose-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>SMS & Email Alerts: <strong className="text-slate-800">Live</strong></span>
          <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Connected
          </span>
        </div>
      </div>
    </div>
  );
}
