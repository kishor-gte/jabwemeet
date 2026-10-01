"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/lib/socketUrl";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  HeartHandshake,
  Headphones,
  User,
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  Package,
  X,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  ArrowLeft,
  Shield,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string | null;
  relationshipIntent: string | null;
  role: string;
  createdAt: string;
}

interface DashboardSidebarProps {
  user: UserProfile;
  activeSection: string;
  eventsCount: number;
  myEventsCount: number;
  connectionsCount: number;
  notificationsCount: number;
  unreadMessagesCount?: number;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function DashboardSidebar({
  user,
  activeSection,
  eventsCount,
  myEventsCount,
  connectionsCount,
  notificationsCount,
  unreadMessagesCount = 0,
  onSelectSection,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: DashboardSidebarProps) {
  const [incomingCall, setIncomingCall] = useState<{
    requestId: string;
    callLogId?: string;
    callerName: string;
    callerRole: "USER" | "BUDDY";
    callerId: string;
  } | null>(null);

  useEffect(() => {
    if (!user || !user.id || user.id === "guest") return;
    const s = io(getSocketUrl(), { withCredentials: true });
    s.on("connect", () => {
      s.emit("join-user-room", user.id);
    });
    s.on("incoming-call", (data) => {
      setIncomingCall(data);
    });
    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  // Track seen counts per section so badges disappear once viewed and do not appear again
  const [mounted, setMounted] = useState(false);
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>({});
  const storageKey = `jwm_sidebar_seen_${user?.id || "default"}`;

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSeenCounts(JSON.parse(stored));
      }
    } catch (e) {}
  }, [storageKey]);

  const markSectionAsSeen = (section: string, currentCount: number) => {
    setSeenCounts((prev) => {
      const updated = {
        ...prev,
        [section]: Math.max(prev[section] || 0, currentCount),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Automatically mark section as seen if user is currently on that section
  useEffect(() => {
    if (!mounted) return;
    if (activeSection === "events" && eventsCount > 0) {
      markSectionAsSeen("events", eventsCount);
    } else if (activeSection === "my-events" && myEventsCount > 0) {
      markSectionAsSeen("my-events", myEventsCount);
    } else if (activeSection === "connections" && connectionsCount > 0) {
      markSectionAsSeen("connections", connectionsCount);
    } else if (activeSection === "notifications" && notificationsCount > 0) {
      markSectionAsSeen("notifications", notificationsCount);
    } else if (activeSection === "messages" && unreadMessagesCount > 0) {
      markSectionAsSeen("messages", unreadMessagesCount);
    }
  }, [
    activeSection,
    eventsCount,
    myEventsCount,
    connectionsCount,
    notificationsCount,
    unreadMessagesCount,
    mounted,
    storageKey,
  ]);

  const getUnseenCount = (section: string, totalCount: number) => {
    if (!mounted) return 0;
    if (activeSection === section) return 0;
    const seen = seenCounts[section] || 0;
    return Math.max(0, totalCount - seen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-rose-100 shadow-xs select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-rose-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7E2248] to-[#982b57] flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-[#7E2248]/20 group-hover:scale-105 transition">
            J
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Member Portal • {user.city}
            </div>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links with Dynamic Badge Counts */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-rose-100">
        {/* Admin Return Link (Only for Admins) */}
        {user.role === "ADMIN" && (
          <div className="pb-3 border-b border-rose-100">
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-[#7E2248] hover:bg-[#681938] text-white shadow-sm transition group transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Return to Admin</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/25 font-bold">
                SUPER_ADMIN
              </span>
            </Link>
          </div>
        )}

        {/* MAIN */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectSection("dashboard");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "dashboard"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    activeSection === "dashboard" ? "text-[#7E2248]" : "text-slate-400"
                  }`}
                />
                <span>Dashboard</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("events", eventsCount);
                onSelectSection("events");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "events"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar
                  className={`w-4 h-4 ${
                    activeSection === "events" ? "text-[#7E2248]" : "text-slate-400"
                  }`}
                />
                <span>Discover Events</span>
              </div>
              {getUnseenCount("events", eventsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248]">
                  {getUnseenCount("events", eventsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("my-events", myEventsCount);
                onSelectSection("my-events");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "my-events"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck
                  className={`w-4 h-4 ${
                    activeSection === "my-events" ? "text-[#7E2248]" : "text-slate-400"
                  }`}
                />
                <span>My Events</span>
              </div>
              {getUnseenCount("my-events", myEventsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7E2248] text-white">
                  {getUnseenCount("my-events", myEventsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("connections", connectionsCount);
                onSelectSection("connections");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "connections"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users
                  className={`w-4 h-4 ${
                    activeSection === "connections" ? "text-[#7E2248]" : "text-slate-400"
                  }`}
                />
                <span>My Connections</span>
              </div>
              {getUnseenCount("connections", connectionsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248]">
                  {getUnseenCount("connections", connectionsCount)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PREMIUM SERVICES */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Premium Services</span>
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
          </div>
          <div className="space-y-1">
            <Link
              href="/relationship-manager"
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition group ${
                activeSection === "relationship-manager"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-4 h-4 text-[#7E2248] group-hover:scale-110 transition" />
                <span>Relationship Manager</span>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] border border-rose-200">
                Premium
              </span>
            </Link>

            <Link
              href="/breakup-buddy"
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition group ${
                activeSection === "breakup-buddy"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-purple-600 group-hover:scale-110 transition" />
                <span>Breakup Buddy</span>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Premium
              </span>
            </Link>

            <button
              onClick={() => {
                onSelectSection("packages");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "packages"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>My Packages</span>
            </button>
          </div>
        </div>

        {/* ACCOUNT */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Account
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectSection("profile");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "profile"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("messages", unreadMessagesCount);
                onSelectSection("messages");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "messages"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span>Messages</span>
              </div>
              {getUnseenCount("messages", unreadMessagesCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {getUnseenCount("messages", unreadMessagesCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectSection("call-history");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "call-history"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <PhoneCall className="w-4 h-4 text-slate-400" />
              <span>Call History</span>
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("notifications", notificationsCount);
                onSelectSection("notifications");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "notifications"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
              {getUnseenCount("notifications", notificationsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {getUnseenCount("notifications", notificationsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectSection("payments");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "payments"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span>Payments</span>
            </button>

            <button
              onClick={() => {
                onSelectSection("settings");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition ${
                activeSection === "settings"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs font-bold"
                  : "text-slate-600 hover:text-[#7E2248] hover:bg-rose-50/50"
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Bottom Card */}
      <div className="p-4 border-t border-rose-100 bg-[#FAF3F6]/80">
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white transition shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7E2248] to-[#982b57] flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span>{user.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
              {user.role === "ADMIN" && (
                <div className="mt-1">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7E2248] hover:underline transition"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Control Center</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-xl transition shrink-0"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer (Slide-over) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Global Incoming Voice Call Overlay for User Dashboard */}
      {incomingCall && (
        <VoiceCallOverlay
          requestId={incomingCall.requestId}
          initialCallLogId={incomingCall.callLogId}
          role="USER"
          isInitiator={false}
          callerName={incomingCall.callerName}
          onClose={() => setIncomingCall(null)}
        />
      )}
    </>
  );
}
