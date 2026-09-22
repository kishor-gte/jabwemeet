"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  MapPin,
  CheckCircle2,
  Send,
  UserCheck,
  Search,
  Filter,
  Calendar,
  MessageCircle,
  Clock,
  Phone,
  Mail,
  Users,
  Award,
  ChevronRight,
  ArrowRight,
  X,
  Menu,
  LogOut,
} from "lucide-react";
import DashboardSidebar from "../dashboard/components/DashboardSidebar";

interface RelationshipManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  gender: string | null;
  profileImage: string | null;
  isVerified: boolean;
  isApproved: boolean;
  isAvailableForRequests: boolean;
  weeklySchedule: any;
  blockedDates: string[];
  createdAt: string;
  _count?: {
    assignedClients: number;
    madeSuggestions: number;
  };
}

interface AssignedManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  profileImage: string | null;
}

interface UserMatchmakingRequest {
  id: string;
  goal: string;
  notes: string;
  matchmakerId: string | null;
  managerName: string | null;
  status: "New" | "Approved" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

export default function RelationshipManagerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [managers, setManagers] = useState<RelationshipManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // User's Real-time Matchmaking Status
  const [assignedManager, setAssignedManager] = useState<AssignedManager | null>(null);
  const [latestRequest, setLatestRequest] = useState<UserMatchmakingRequest | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Badge counts for sidebar (matching dashboard)
  const [badgeCounts, setBadgeCounts] = useState({
    eventsCount: 0,
    myEventsCount: 0,
    connectionsCount: 0,
    notificationsCount: 0,
  });

  // Connect Modal State
  const [selectedManager, setSelectedManager] = useState<RelationshipManager | null>(null);
  const [introGoal, setIntroGoal] = useState("Long-term Relationship");
  const [introNotes, setIntroNotes] = useState("");
  const [introSending, setIntroSending] = useState(false);
  const [introSuccess, setIntroSuccess] = useState(false);

  // Fetch real-time matchmaking request and assigned manager from backend
  const fetchMyMatchmakingStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await fetch("/api/services/my-matchmaking-requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setAssignedManager(data.assignedManager || null);
          setLatestRequest(data.latestRequest || null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user matchmaking status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch current session if logged in
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
          // Fetch real-time matchmaking status from DB
          fetchMyMatchmakingStatus();

          // Load local user counts for sidebar
          try {
            const savedRsvps = localStorage.getItem(`jwm_rsvps_${data.user.id}`);
            const myEventsCount = savedRsvps ? JSON.parse(savedRsvps).length : 0;
            const savedConns = localStorage.getItem(`jwm_conns_${data.user.id}`);
            const connectionsCount = savedConns ? JSON.parse(savedConns).length : 0;
            const savedServices = localStorage.getItem(`jwm_services_${data.user.id}`);
            const services = savedServices ? JSON.parse(savedServices) : {};
            const serviceReqCount = (services.relationshipManager ? 1 : 0) + (services.breakupBuddy ? 1 : 0);

            setBadgeCounts({
              eventsCount: 0,
              myEventsCount,
              connectionsCount,
              notificationsCount: myEventsCount + serviceReqCount,
            });
          } catch (e) {}
        }
      })
      .catch(() => {});

    // 2. Fetch approved Relationship Managers from backend
    fetch("/api/services/relationship-managers")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setManagers(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch relationship managers:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    router.replace("/login");
  };

  // Filter managers by search and city
  const filteredManagers = managers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.city && m.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity =
      selectedCity === "all" ||
      (m.city && m.city.toLowerCase() === selectedCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  // Unique cities list
  const availableCities = Array.from(
    new Set(
      managers
        .map((m) => m.city)
        .filter((c): c is string => Boolean(c && c !== "N/A"))
    )
  );

  const handleSendIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManager) return;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setIntroSending(true);

    try {
      const res = await fetch("/api/services/matchmaking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          matchmakerId: selectedManager.id,
          managerName: selectedManager.name,
          goal: introGoal,
          notes: introNotes,
        }),
      });

      const data = await res.json();

      if (data?.success) {
        // Refresh live status from backend
        await fetchMyMatchmakingStatus();

        // Sync local storage for dashboard
        try {
          const services = JSON.parse(
            localStorage.getItem(`jwm_services_${currentUser.id}`) || "{}"
          );
          services.relationshipManager = true;
          localStorage.setItem(
            `jwm_services_${currentUser.id}`,
            JSON.stringify(services)
          );
        } catch (e) {}

        setIntroSuccess(true);
        setTimeout(() => {
          setIntroSuccess(false);
          setSelectedManager(null);
          setIntroNotes("");
        }, 2200);
      } else {
        alert(data?.message || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting matchmaking request:", err);
      alert("Network error sending introduction request. Please try again.");
    } finally {
      setIntroSending(false);
    }
  };

  const sidebarUser = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name || "Member",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        city: currentUser.city && currentUser.city !== "N/A" ? currentUser.city : "Pan-India",
        gender: currentUser.gender || null,
        relationshipIntent: currentUser.relationshipIntent || null,
        role: currentUser.role || "USER",
        createdAt: currentUser.createdAt || new Date().toISOString(),
      }
    : {
        id: "guest",
        name: "Member",
        email: "",
        phone: "",
        city: "Pan-India",
        gender: null,
        relationshipIntent: null,
        role: "USER",
        createdAt: new Date().toISOString(),
      };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white flex flex-col">
      {/* Mobile Topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0d1526]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-sm">
              J
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-[#fca5a5] rounded-lg transition"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Desktop Sidebar + Mobile Drawer */}
      <DashboardSidebar
        user={sidebarUser}
        activeSection="relationship-manager"
        eventsCount={badgeCounts.eventsCount}
        myEventsCount={badgeCounts.myEventsCount}
        connectionsCount={badgeCounts.connectionsCount}
        notificationsCount={badgeCounts.notificationsCount}
        onSelectSection={(sec) => {
          if (sec === "dashboard") {
            const dashUrl = currentUser?.role === 'ADMIN' ? '/admin' :
                            currentUser?.role === 'MATCHMAKER' ? '/matchmaker/dashboard' :
                            currentUser?.role === 'BREAKUP_BUDDY' ? '/breakup-buddy/dashboard' :
                            currentUser?.role === 'HOST' ? '/host/dashboard' :
                            '/dashboard';
            router.push(dashUrl);
          } else {
            router.push(`/dashboard?tab=${sec}`);
          }
        }}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar with breadcrumbs and back button */}
        <div className="bg-[#0d1526]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href={
                currentUser?.role === 'ADMIN' ? '/admin' :
                currentUser?.role === 'MATCHMAKER' ? '/matchmaker/dashboard' :
                currentUser?.role === 'BREAKUP_BUDDY' ? '/breakup-buddy/dashboard' :
                currentUser?.role === 'HOST' ? '/host/dashboard' :
                '/dashboard'
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e06d53]" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs text-slate-400 hidden sm:inline">Premium Services</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-white hidden sm:inline">Relationship Managers</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Matchmaking Network
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <header className="relative border-b border-white/10 bg-gradient-to-b from-[#131d2e] via-[#0d1526] to-[#0b111e] py-10 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>JabWeMeet Certified Matchmaking Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-serif">
              Verified Relationship Managers
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Human-curated matchmaking for offline events. Certified Relationship Managers understand your values, pre-screen compatible peers, and arrange meaningful face-to-face introductions.
            </p>

            {/* Quick Metrics */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Admin Verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#e06d53]" />
                Offline Date Curation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Values-First Matching
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
          {/* Real-time Matchmaking Status Banner */}
          {assignedManager ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#102924] to-[#131d2e] border border-emerald-500/50 shadow-2xl shadow-emerald-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Official Relationship Manager Assigned
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    You are paired with {assignedManager.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Your certified Relationship Manager has accepted your introduction request. They are actively curating hand-picked compatible profiles and organizing 1-on-1 offline date experiences for you.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {assignedManager.city || "Bangalore / Remote"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      {assignedManager.email}
                    </span>

                  </div>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Status: Active & Approved</span>
                </div>
              </div>
            </div>
          ) : latestRequest?.status === "New" ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/70 via-[#261e14] to-[#131d2e] border border-amber-500/50 shadow-2xl shadow-amber-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Introduction Request Pending Review
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Request Sent to {latestRequest.managerName || "Relationship Manager"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Your request for <strong>"{latestRequest.goal}"</strong> was submitted on{" "}
                    {new Date(latestRequest.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    . The matchmaker is reviewing your profile and preferences.
                  </p>
                  {latestRequest.notes && (
                    <div className="text-xs text-amber-200/90 bg-black/30 rounded-xl px-3.5 py-2 mt-1 border border-amber-500/20">
                      <span className="font-semibold text-amber-300">Your notes: </span>"{latestRequest.notes}"
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Awaiting Matchmaker Decision</span>
                </div>
              </div>
            </div>
          ) : latestRequest?.status === "Rejected" ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/70 via-[#261517] to-[#131d2e] border border-rose-500/50 shadow-2xl shadow-rose-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-xl shrink-0">
                  <X className="w-8 h-8 text-rose-400" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                    Request Status Update
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Previous Request Could Not Be Accommodated
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Your previous request to {latestRequest.managerName || "the relationship manager"} could not be accepted at this time due to capacity. Please browse and select another verified Relationship Manager below.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <span className="inline-flex w-full md:w-auto items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  Browse Available Managers
                </span>
              </div>
            </div>
          ) : null}

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#131d2e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Box */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by manager name or city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b111e] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#e06d53] transition"
              />
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> City:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCity("all")}
                className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                  selectedCity === "all"
                    ? "bg-[#e06d53] text-white shadow-md shadow-[#e06d53]/20"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                All Cities ({managers.length})
              </button>
              {availableCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? "bg-[#e06d53] text-white shadow-md shadow-[#e06d53]/20"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Live Count Header */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredManagers.length}</strong> verified Relationship Manager{filteredManagers.length === 1 ? "" : "s"} approved by admin
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Profiles Vetted
            </span>
          </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-[#131d2e] border border-white/5 animate-pulse p-6"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredManagers.length === 0 && (
          <div className="text-center py-16 px-6 rounded-3xl bg-[#131d2e] border border-white/10 space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-2xl mx-auto">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {searchTerm || selectedCity !== "all"
                ? "No Relationship Managers Match Your Filter"
                : "No Approved Relationship Managers Available Right Now"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchTerm || selectedCity !== "all"
                ? "Try clearing your city filter or search terms to view all registered Relationship Managers."
                : "New certified matchmakers will appear here once reviewed and approved by JabWeMeet administrators."}
            </p>
            {(searchTerm || selectedCity !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("all");
                }}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Relationship Managers Cards Grid */}
        {!loading && filteredManagers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredManagers.map((manager) => {
              const initials = manager.name
                ? manager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "RM";

              const isAssigned = assignedManager?.id === manager.id;
              const isPending =
                !isAssigned &&
                latestRequest?.matchmakerId === manager.id &&
                latestRequest?.status === "New";

              return (
                <div
                  key={manager.id}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition shadow-xl group ${
                    isAssigned
                      ? "bg-gradient-to-b from-[#102924] to-[#0d1c1a] border-2 border-emerald-500/80 shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                      : isPending
                      ? "bg-gradient-to-b from-[#241c14] to-[#14120e] border-2 border-amber-500/80 shadow-amber-950/40 ring-1 ring-amber-500/50"
                      : "bg-[#131d2e] border border-white/10 hover:border-amber-500/40 hover:shadow-amber-500/10"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Avatar & Badges */}
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0 ${
                          isAssigned
                            ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/30"
                            : isPending
                            ? "bg-gradient-to-tr from-amber-500 to-orange-400 shadow-amber-500/30"
                            : "bg-gradient-to-tr from-amber-500 to-[#e06d53] shadow-amber-500/20"
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="text-right">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Your Assigned Manager
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Request Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Joined {new Date(manager.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>

                    {/* Manager Name & City */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition flex items-center gap-2">
                          <span>{manager.name}</span>
                        </h3>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          manager.isAvailableForRequests !== false
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            manager.isAvailableForRequests !== false ? "bg-emerald-400" : "bg-rose-400"
                          }`} />
                          {manager.isAvailableForRequests !== false ? "Available" : "Unavailable"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 capitalize">
                        <MapPin className="w-3.5 h-3.5 text-[#e06d53]" />
                        <span>{manager.city && manager.city !== "N/A" ? manager.city : "All India / Remote"}</span>
                      </div>
                    </div>

                    {/* Matchmaker Expertise Pills */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Core Matchmaking Services
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                          Values Assessment
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                          Pre-Screened Introductions
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                          Offline Venue Curation
                        </span>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-white/5">
                      <div className="p-2.5 rounded-xl bg-[#0b111e] border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Assigned Clients</span>
                        <span className="font-bold text-white text-sm">
                          {manager._count?.assignedClients || 12}+
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#0b111e] border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Match Suggestions</span>
                        <span className="font-bold text-amber-400 text-sm">
                          {manager._count?.madeSuggestions || 28}+
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connect Action Button */}
                  <div className="pt-2">
                    {isAssigned ? (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Assigned & Connected</span>
                      </div>
                    ) : isPending ? (
                      <div className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Request Awaiting Review</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedManager(manager)}
                        disabled={manager.isAvailableForRequests === false}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                          manager.isAvailableForRequests !== false
                            ? "bg-gradient-to-r from-amber-500 to-[#e06d53] hover:from-amber-600 hover:to-[#c95940] text-white shadow-lg shadow-amber-500/20"
                            : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
                        }`}
                      >
                        {manager.isAvailableForRequests !== false ? (
                          <>
                            <HeartHandshake className="w-4 h-4" />
                            <span>Request Introduction with {manager.name.split(" ")[0]}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            <span>Currently Unavailable</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>

      {/* Connect / Consultation Modal */}
      {selectedManager && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#131d2e] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl space-y-5">
            <button
              onClick={() => setSelectedManager(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {introSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">Introduction Requested!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Your request has been forwarded directly to <strong>{selectedManager.name}</strong>. They will review your matching criteria and contact you shortly.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-2">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Curated Introduction
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Connect with {selectedManager.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Certified Relationship Manager in {selectedManager.city || "All India"}
                  </p>
                </div>

                <form onSubmit={handleSendIntro} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Primary Dating / Relationship Goal *
                    </label>
                    <select
                      value={introGoal}
                      onChange={(e) => setIntroGoal(e.target.value)}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#e06d53]"
                    >
                      <option value="Long-term Relationship">Long-term Relationship</option>
                      <option value="Marriage / Matrimonial">Marriage / Matrimonial</option>
                      <option value="Intentional Dating">Intentional Dating</option>
                      <option value="Curated 1-on-1 Blind Date">Curated 1-on-1 Blind Date</option>
                      <option value="Offline Event Table Placement">Offline Event Table Placement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      What are you looking for in a partner? (Optional notes for manager)
                    </label>
                    <textarea
                      rows={3}
                      value={introNotes}
                      onChange={(e) => setIntroNotes(e.target.value)}
                      placeholder="e.g. Someone calm, ambitious, values good conversation, enjoys outdoor hikes..."
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>

                  {(assignedManager || latestRequest) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Note: Submitting this request will update your target Relationship Manager to{" "}
                        <strong>{selectedManager.name}</strong>.
                      </span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Your contact details and criteria are encrypted. {selectedManager.name} will only facilitate introductions that match your explicit values.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={introSending}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-[#e06d53] hover:from-amber-600 hover:to-[#c95940] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/25 disabled:opacity-50"
                  >
                    {introSending ? "Submitting request..." : "CONFIRM INTRODUCTION REQUEST"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
