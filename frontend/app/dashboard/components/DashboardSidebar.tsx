"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
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
    const s = io("http://localhost:5001", { withCredentials: true });
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
    <div className="flex flex-col h-full bg-[#0d1526] text-slate-200 border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-[#e06d53]/25 group-hover:scale-105 transition">
            J
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Member Portal • {user.city}
            </div>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links with Dynamic Badge Counts */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {/* Admin Return Link (Only for Admins) */}
        {user.role === "ADMIN" && (
          <div className="pb-3 border-b border-red-500/20">
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 border border-red-400/30 transition group transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "dashboard"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    activeSection === "dashboard" ? "text-[#e06d53]" : "text-slate-400"
                  }`}
                />
                <span>Dashboard</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("events", eventsCount);
                onSelectSection("events");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "events"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Discover Events</span>
              </div>
              {getUnseenCount("events", eventsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 transition-opacity">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "my-events"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-slate-400" />
                <span>My Events</span>
              </div>
              {getUnseenCount("my-events", myEventsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30 transition-opacity">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "connections"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span>My Connections</span>
              </div>
              {getUnseenCount("connections", connectionsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 transition-opacity">
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
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <Link
              href="/relationship-manager"
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                activeSection === "relationship-manager"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                <span>Relationship Manager</span>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30">
                Premium
              </span>
            </Link>

            <Link
              href="/breakup-buddy"
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                activeSection === "breakup-buddy"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                <span>Breakup Buddy</span>
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Premium
              </span>
            </Link>

            <button
              onClick={() => {
                onSelectSection("packages");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "packages"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Package className="w-4 h-4 text-emerald-400" />
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "profile"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "messages"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                <span>Messages</span>
              </div>
              {getUnseenCount("messages", unreadMessagesCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-opacity">
                  {getUnseenCount("messages", unreadMessagesCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectSection("call-history");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "call-history"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <PhoneCall className="w-4 h-4 text-indigo-400" />
              <span>Call History</span>
            </button>

            <button
              onClick={() => {
                markSectionAsSeen("notifications", notificationsCount);
                onSelectSection("notifications");
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "notifications"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
              {getUnseenCount("notifications", notificationsCount) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-opacity">
                  {getUnseenCount("notifications", notificationsCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSelectSection("payments");
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "payments"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "settings"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & Logout Bottom Card */}
      <div className="p-4 border-t border-white/10 bg-[#0a101d]">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                <span>{user.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
              {user.role === "ADMIN" && (
                <div className="mt-1">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition"
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
            className="p-2 text-slate-400 hover:text-[#fca5a5] hover:bg-rose-500/10 rounded-lg transition shrink-0"
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
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
