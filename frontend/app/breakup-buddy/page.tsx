"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Send,
  MessageCircle,
  Heart,
  Lock,
  Smile,
  Sparkles,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Globe,
  ChevronRight,
  X,
  UserCheck,
  Phone,
  HelpCircle,
  Menu,
  LogOut,
} from "lucide-react";
import DashboardSidebar from "../dashboard/components/DashboardSidebar";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";

interface BreakupBuddy {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  phone: string;
  city: string | null;
  gender: string | null;
  profilePhoto: string | null;
  shortBio: string | null;
  languages: string[];
  areasOfExpertise: string[];
  sessionTypes: string[];
  availableDays: string[];
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  weeklySchedule?: any;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
}

import { io } from "socket.io-client";

export default function BreakupBuddyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [buddies, setBuddies] = useState<BreakupBuddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  
  // Calling State
  const [activeCallReqId, setActiveCallReqId] = useState<string | null>(null);
  const [activeCallBuddyId, setActiveCallBuddyId] = useState<string | null>(null);
  const [userIncomingCall, setUserIncomingCall] = useState<{ requestId: string; callerName: string } | null>(null);
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Badge counts for sidebar (matching dashboard)
  const [badgeCounts, setBadgeCounts] = useState({
    eventsCount: 0,
    myEventsCount: 0,
    connectionsCount: 0,
    notificationsCount: 0,
  });

  // Booking Modal State
  const [selectedBuddy, setSelectedBuddy] = useState<BreakupBuddy | null>(null);
  const [sessionFormat, setSessionFormat] = useState("Chat");
  const [feelingDescription, setFeelingDescription] = useState("");
  const [bookingSending, setBookingSending] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Feedback State
  const [feedbackBuddyId, setFeedbackBuddyId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchMyRequests = () => {
    fetch("/api/services/my-buddy-requests", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setMyRequests(data.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // 1. Fetch current session if logged in
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
          fetchMyRequests();

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
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const s = io("http://localhost:5001", { withCredentials: true });
    s.on("connect", () => {
      s.emit("join-user-room", currentUser.id);
    });
    s.on("incoming-call", (data) => {
      setUserIncomingCall(data);
    });
    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    // 2. Fetch approved Breakup Buddies from backend API
    fetch("/api/services/breakup-buddies")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          setBuddies(data.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch breakup buddies:", err);
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

  // Filter buddies by search, city, and expertise
  const filteredBuddies = buddies.filter((b) => {
    const fullName = b.name.toLowerCase();
    const dispName = (b.displayName || "").toLowerCase();
    const city = (b.city || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(query) ||
      dispName.includes(query) ||
      city.includes(query) ||
      b.languages.some((l) => l.toLowerCase().includes(query)) ||
      b.areasOfExpertise.some((e) => e.toLowerCase().includes(query));

    const matchesCity =
      selectedCity === "all" ||
      (b.city && b.city.toLowerCase() === selectedCity.toLowerCase());

    const matchesExpertise =
      selectedExpertise === "all" ||
      b.areasOfExpertise.some(
        (e) => e.toLowerCase() === selectedExpertise.toLowerCase()
      );

    return matchesSearch && matchesCity && matchesExpertise;
  });

  // Extract unique cities (excluding 'N/A' or empty)
  const availableCities = Array.from(
    new Set(
      buddies
        .map((b) => b.city)
        .filter((c): c is string => Boolean(c && c !== "N/A"))
    )
  );

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSending(true);

    if (currentUser?.id && selectedBuddy) {
      try {
        const res = await fetch('/api/services/buddy-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            buddyId: selectedBuddy.id,
            sessionFormat,
            notes: feelingDescription,
          }),
        });

        const data = await res.json();
        
        if (data.success) {
          // Update services flag
          const services = JSON.parse(
            localStorage.getItem(`jwm_services_${currentUser.id}`) || "{}"
          );
          services.breakupBuddy = true;
          localStorage.setItem(
            `jwm_services_${currentUser.id}`,
            JSON.stringify(services)
          );

          setBookingSuccess(true);
          fetchMyRequests();
          setTimeout(() => {
            setBookingSuccess(false);
            setSelectedBuddy(null);
            setFeelingDescription("");
          }, 3500);
        } else {
          alert("Error: " + data.message);
        }
      } catch (e) {
        alert("Failed to submit request.");
      }
    }

    setBookingSending(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/services/buddy-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          buddyId: feedbackBuddyId,
          rating,
          comment: feedbackComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setFeedbackSuccess(false);
          setFeedbackBuddyId(null);
          setFeedbackComment("");
          setRating(5);
        }, 3000);
      } else {
        alert("Failed to submit feedback: " + (data.message || data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to submit feedback.");
    }
    setFeedbackSending(false);
  };

  const getPhotoUrl = (photo: string | null) => {
    if (!photo) return null;
    if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
      return photo;
    }
    return `/uploads/${photo}`;
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
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-black text-white text-base">
              J
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Jab<span className="text-indigo-400">We</span>Meet
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
        activeSection="breakup-buddy"
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
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs text-slate-400 hidden sm:inline">Premium Services</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-white hidden sm:inline">Breakup Buddies</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Headphones className="w-3 h-3 text-indigo-400" />
              Safe Space Network
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <header className="relative border-b border-white/10 bg-gradient-to-b from-[#131d2e] via-[#0d1526] to-[#0b111e] py-10 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>JabWeMeet Certified Safe Space Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-serif">
              Verified Breakup Buddies
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Breakups can feel heavy and isolating. Our verified Breakup Buddies provide empathetic, non-judgmental listening, no-contact accountability, and healthy moving-on guidance in a 100% confidential environment.
            </p>

            {/* Quick Pillars */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Admin Approved
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-sky-400" />
                Strictly Confidential
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Empathy Without Judgment
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#131d2e] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Box */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by buddy name, language, or topic..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b111e] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> City:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCity("all")}
                className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                  selectedCity === "all"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                All / Pan-India ({buddies.length})
              </button>
              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-lg font-medium shrink-0 transition ${
                    selectedCity.toLowerCase() === city.toLowerCase()
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Spinner */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading approved Breakup Buddies...</p>
            </div>
          ) : filteredBuddies.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center rounded-3xl bg-[#131d2e] border border-white/10 max-w-xl mx-auto space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                <Headphones className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No Breakup Buddies Found</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {searchTerm || selectedCity !== "all" || selectedExpertise !== "all"
                  ? "No approved Breakup Buddies match your current filter criteria. Try resetting filters."
                  : "There are currently no approved Breakup Buddies registered in the system."}
              </p>

              {(searchTerm || selectedCity !== "all" || selectedExpertise !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("all");
                    setSelectedExpertise("all");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            /* Buddy Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuddies.map((buddy) => {
                const photoUrl = getPhotoUrl(buddy.profilePhoto);
                const displayName = buddy.displayName || buddy.name;
                const displayCity =
                  buddy.city && buddy.city !== "N/A" ? buddy.city : "Remote / Pan-India";

                const defaultBio =
                  "Compassionate and trained active listener. Dedicated to providing a safe, confidential space where you can speak your heart, unpack emotions, and move forward at your own pace.";

                const bio = buddy.shortBio || defaultBio;

                const languages =
                  buddy.languages && buddy.languages.length > 0
                    ? buddy.languages
                    : ["English", "Hindi"];

                const expertise =
                  buddy.areasOfExpertise && buddy.areasOfExpertise.length > 0
                    ? buddy.areasOfExpertise
                    : ["Healing & Closure", "No-Contact Support", "Active Listening"];

                return (
                  <div
                    key={buddy.id}
                    className="rounded-3xl bg-[#131d2e] border border-white/10 overflow-hidden shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Top Banner / Avatar Header */}
                      <div className="relative p-6 pb-4 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                        <div className="flex items-start gap-4">
                          {/* Profile Image or Initials Avatar */}
                          <div className="relative shrink-0">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={displayName}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                                onError={(e) => {
                                  // Fallback to initial avatar on image error
                                  (e.target as HTMLElement).style.display = "none";
                                  const fallback = document.getElementById(
                                    `avatar-fallback-${buddy.id}`
                                  );
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              id={`avatar-fallback-${buddy.id}`}
                              style={{ display: photoUrl ? "none" : "flex" }}
                              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 items-center justify-center font-bold text-white text-xl border-2 border-indigo-500/40 shadow-md"
                            >
                              {displayName.charAt(0).toUpperCase()}
                            </div>

                            <div
                              title="Admin Approved Breakup Buddy"
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#131d2e] flex items-center justify-center text-white"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Name and Badges */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-base font-bold text-white truncate">
                                {displayName}
                              </h3>
                            </div>

                            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span>{displayCity}</span>
                            </p>

                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Admin Approved Safe Space</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 space-y-4">
                        {/* Short Bio */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                          "{bio}"
                        </p>

                        {/* Languages Spoken */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Globe className="w-3 h-3 text-sky-400" /> Languages:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {languages.map((lang, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[11px] border border-white/5"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Focus & Expertise */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-400" /> Areas of Care:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {expertise.map((exp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-[11px] font-medium border border-indigo-500/30"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Availability Details if present */}
                        {(() => {
                          let activeDays = [];
                          let hasSlots = false;
                          if (Array.isArray(buddy.weeklySchedule) && buddy.weeklySchedule.length > 0) {
                            activeDays = buddy.weeklySchedule.filter((s: any) => s.slots && s.slots.length > 0).map((s: any) => s.day);
                            hasSlots = activeDays.length > 0;
                          } else if (buddy.availableDays && buddy.availableDays.length > 0) {
                            activeDays = buddy.availableDays;
                          }
                          const shortDays = activeDays.map((d: string) => d.slice(0, 3));

                          if (shortDays.length === 0 && !buddy.availableTimeStart && !hasSlots) return null;

                          return (
                            <div className="pt-3 border-t border-white/5 space-y-2">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-400" /> Availability
                              </span>
                              {shortDays.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap gap-1">
                                    {shortDays.map((day: string, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                        {day}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {buddy.availableTimeStart && buddy.availableTimeEnd 
                                      ? `Usually active between ${buddy.availableTimeStart} - ${buddy.availableTimeEnd}`
                                      : hasSlots ? "Specific timing slots available for booking." : "Flexible hours."}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">
                                  Flexible Schedule 
                                  {buddy.availableTimeStart && buddy.availableTimeEnd
                                    ? ` (${buddy.availableTimeStart} - ${buddy.availableTimeEnd})`
                                    : ""}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-6 pt-0">
                      {(() => {
                        const existingReq = myRequests.find((r) => r.buddyId === buddy.id);
                        
                        if (existingReq?.status === 'Pending') {
                          return (
                            <div className="w-full py-3 rounded-2xl bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 border border-amber-500/30">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span>Request Pending - Waiting for Acceptance</span>
                            </div>
                          );
                        }
                        
                        if (existingReq?.status === 'Accepted') {
                          return (
                            <div className="grid grid-cols-3 gap-2">
                              <Link
                                href={`/dashboard?tab=messages&requestId=${existingReq.id}`}
                                className="py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                              >
                                <MessageCircle className="w-4 h-4" /> Chat
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCallReqId(existingReq.id);
                                  setActiveCallBuddyId(buddy.id);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                              >
                                <Phone className="w-4 h-4" /> Call
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFeedbackBuddyId(buddy.id);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                              >
                                <Sparkles className="w-4 h-4" /> Feedback
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBuddy(buddy);
                            }}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition active:scale-[0.99]"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Book Confidential Session</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Connect & Book Session Modal */}
      {selectedBuddy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedBuddy(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              /* Success confirmation state */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Support Session Requested!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your confidential request has been submitted to{" "}
                  <strong>{selectedBuddy.displayName || selectedBuddy.name}</strong>. You will receive a discreet message via your contact details shortly.
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => setSelectedBuddy(null)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Close & Return to Directory
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleBookSession} className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold mb-2 border border-indigo-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    100% Confidential
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Connect with {selectedBuddy.displayName || selectedBuddy.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose your preferred session format. Your details remain confidential and are only shared to coordinate your support session.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Session Format
                    </label>
                    <select
                      value={sessionFormat}
                      onChange={(e) => setSessionFormat(e.target.value)}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Chat">💬 Chat</option>
                      <option value="Voice Call">📞 Voice Call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      How are you feeling right now? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feelingDescription}
                      onChange={(e) => setFeelingDescription(e.target.value)}
                      placeholder="Share as much or as little as you want. There is zero pressure to explain everything..."
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Safe Space Guaranteed</span>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingSending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
                  >
                    {bookingSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Feedback Modal */}
      {feedbackBuddyId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setFeedbackBuddyId(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {feedbackSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Feedback Submitted!</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you for sharing how you felt about your buddy.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Rate your Buddy</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    How was your experience with this Breakup Buddy?
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Rating (1-5)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl transition ${rating >= star ? 'text-amber-400' : 'text-slate-600 hover:text-slate-500'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Comment
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share how you felt..."
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={feedbackSending}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {feedbackSending ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Voice Call Overlay (Outgoing) */}
      {activeCallReqId && activeCallBuddyId && (
        <VoiceCallOverlay
          key={activeCallReqId}
          requestId={activeCallReqId}
          buddyId={activeCallBuddyId}
          role="USER"
          isInitiator={true}
          callerName={currentUser?.name}
          onClose={() => {
            setActiveCallReqId(null);
            setActiveCallBuddyId(null);
          }}
        />
      )}

      {/* Voice Call Overlay (Incoming) */}
      {userIncomingCall && (
        <VoiceCallOverlay
          key={userIncomingCall.requestId}
          requestId={userIncomingCall.requestId}
          role="USER"
          isInitiator={false}
          callerName={userIncomingCall.callerName}
          onClose={() => setUserIncomingCall(null)}
        />
      )}
    </div>
  );
}

