"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Eye, 
  EyeOff, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Coffee, 
  Heart, 
  ChevronRight,
  Star,
  Quote,
  CheckCircle2,
  Lock,
  Compass
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showRecommendPlaceModal, setShowRecommendPlaceModal] = useState(false);
  const [placeCityInput, setPlaceCityInput] = useState("");
  const [placeCitySuggestions, setPlaceCitySuggestions] = useState<any[]>([]);
  const [placeCitySearching, setPlaceCitySearching] = useState(false);
  const [placeCityError, setPlaceCityError] = useState("");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeJoinDropdownId, setActiveJoinDropdownId] = useState<string | null>(null);

  const openRegisterModalWithRole = (role: string) => {
    setActiveJoinDropdownId(null);
    router.push(`/register?role=${role}`);
  };

  // Live Events state
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventCategory, setSelectedEventCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [expandedItineraryId, setExpandedItineraryId] = useState<string | null>(null);
  const [bookedEventSuccess, setBookedEventSuccess] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Platform stats state (real-time from Postgres)
  const [platformStats, setPlatformStats] = useState<any>({
    totalUsers: 0,
    verifiedMembers: 0,
    totalEvents: 0,
    totalCafes: 0,
    totalBookings: 0,
    averageRating: 4.9,
    activeCities: ["Bengaluru", "Mumbai"],
  });
  const [eventCities, setEventCities] = useState<string[]>([]);
  const [showCityPickerDropdown, setShowCityPickerDropdown] = useState(false);

  const fetchLiveEvents = (city?: string, category?: string) => {
    setEventsLoading(true);
    const params = new URLSearchParams();
    if (city && city !== "All" && city !== "All Cities") {
      params.append("city", city);
    }
    if (category && category !== "All") {
      params.append("category", category);
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";

    fetch(`/api/events${queryString}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.events) {
          setLiveEvents(data.events);
        }
      })
      .catch((e) => console.error("Error fetching live events:", e))
      .finally(() => setEventsLoading(false));
  };

  const fetchPlatformStats = () => {
    fetch("/api/services/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.stats) {
          setPlatformStats(data.stats);
        }
      })
      .catch((e) => console.error("Error fetching platform stats:", e));
  };

  const fetchEventCities = () => {
    fetch("/api/events/cities")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.cities) {
          setEventCities(data.cities);
        }
      })
      .catch((e) => console.error("Error fetching event cities:", e));
  };

  const fetchTestimonials = () => {
    fetch("/api/auth/public/feedbacks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.feedbacks) {
          setTestimonials(data.feedbacks);
        }
      })
      .catch((e) => console.error("Error fetching testimonials:", e));
  };

  // Public CMS Content state
  const [cmsContent, setCmsContent] = useState<any>({
    heroHeadline: "",
    heroSubheadline: "",
    aboutText: "",
    safetyPledge: "",
    announcementBanner: "",
  });

  const fetchCmsContent = () => {
    fetch("/api/services/content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.content) {
          setCmsContent(data.content);
        }
      })
      .catch((e) => console.error("Error fetching CMS content:", e));
  };

  // Check user session & load live events on load
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetchLiveEvents();
    fetchTestimonials();
    fetchCmsContent();
    fetchPlatformStats();
    fetchEventCities();
  }, []);

  // Real-time Indian city search for Recommend a Place
  useEffect(() => {
    if (!placeCityInput.trim()) {
      setPlaceCitySuggestions([]);
      return;
    }
    setPlaceCitySearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/cities?q=${encodeURIComponent(placeCityInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPlaceCitySuggestions(data.cities || []);
          }
        }
      } catch (e) {
        console.error("Error searching cities:", e);
      } finally {
        setPlaceCitySearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [placeCityInput]);

  const handleSearchPlaceRedirect = (cityName?: string) => {
    const target = (cityName || placeCityInput).trim();
    if (!target) {
      setPlaceCityError("Please enter an Indian city / place name to search.");
      return;
    }
    setPlaceCityError("");
    setShowRecommendPlaceModal(false);
    setPlaceCityInput("");
    router.push(`/cafes?city=${encodeURIComponent(target)}`);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowLoginModal(false);
        router.push(data.redirectUrl || "/dashboard");
      } else {
        setLoginError(data.message || "Email/mobile or password is incorrect.");
      }
    } catch (e) {
      setLoginError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCurrentUser(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* CMS ANNOUNCEMENT BANNER */}
      {cmsContent.announcementBanner && (
        <div className="w-full bg-gradient-to-r from-[#7E2248] via-[#982b57] to-[#7E2248] text-white text-xs py-2 px-4 text-center font-semibold shadow-sm flex items-center justify-center gap-2">
          <span>📢 {cmsContent.announcementBanner}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100/70 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="/" className="text-[#7E2248] font-extrabold border-b-2 border-[#7E2248] pb-1">
              HOME
            </a>
            <a href="/experiences" className="hover:text-[#7E2248] transition">
              EXPERIENCES
            </a>
            <a href="#how-it-works" className="hover:text-[#7E2248] transition">
              OUR STORIES
            </a>
            <a href="/cafes" className="hover:text-[#7E2248] transition">
              CAFES
            </a>
            <a href="#about" className="hover:text-[#7E2248] transition">
              ABOUT
            </a>
            <button
              onClick={() => {
                setPlaceCityError("");
                setShowRecommendPlaceModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 transition"
            >
              <span>📍</span> Recommend a Place
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 hidden sm:inline">
                  Hi, <strong className="text-slate-900">{currentUser.name.split(" ")[0]}</strong>
                </span>
                <Link
                  href={
                    currentUser.role === "ADMIN" ? "/admin" :
                    currentUser.role === "MATCHMAKER" ? "/matchmaker/dashboard" :
                    currentUser.role === "BREAKUP_BUDDY" ? "/breakup-buddy/dashboard" :
                    currentUser.role === "HOST" ? "/host/dashboard" :
                    currentUser.role === "CAFE" ? "/cafe/dashboard" :
                    "/dashboard"
                  }
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#7E2248] text-white hover:bg-[#681938] transition shadow-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#7E2248] border border-[#7E2248]/30 hover:bg-rose-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-xs font-bold tracking-wider uppercase text-slate-700 hover:text-[#7E2248] transition px-3 py-2"
                >
                  MEMBER'S PORTAL
                </button>
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveJoinDropdownId(activeJoinDropdownId === "nav" ? null : "nav")}
                    className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#7E2248] hover:bg-[#681938] text-white shadow-md shadow-rose-950/10 transition-all transform hover:-translate-y-0.5"
                  >
                    GET STARTED
                  </button>
                  {activeJoinDropdownId === "nav" && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-rose-100 rounded-2xl shadow-xl z-50 overflow-hidden text-left p-2 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => openRegisterModalWithRole("USER")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-rose-50 hover:text-[#7E2248] rounded-xl transition"
                      >
                        User / Member
                      </button>
                      <button 
                        onClick={() => openRegisterModalWithRole("HOST")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-[#7E2248] hover:bg-rose-50 rounded-xl transition"
                      >
                        Event Host / Organizer
                      </button>
                      <button 
                        onClick={() => openRegisterModalWithRole("CAFE")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition"
                      >
                        Cafe Partner
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FDFBF9] via-[#FAF3F6] to-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-rose-100/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-serif font-semibold tracking-tight text-slate-900 leading-[1.12]">
              DISCOVER THE PERSON
              <br />
              BEFORE <span className="italic font-normal text-[#7E2248]">THE PROFILE</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
              {cmsContent.heroSubheadline || 
                "A Reason to Meet. Curated offline singles experiences, verified matchmaking, and real human connection without the endless swiping."
              }
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => router.push("/register?role=USER")}
                className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase bg-[#7E2248] hover:bg-[#681938] text-white shadow-lg shadow-[#7E2248]/25 transition-all transform hover:-translate-y-0.5"
              >
                FIND YOUR MATCH
              </button>
              <a
                href="#events"
                className="px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase border border-slate-300 hover:border-[#7E2248] text-slate-700 hover:text-[#7E2248] bg-white transition-all shadow-xs"
              >
                UPCOMING EVENTS
              </a>
            </div>
          </div>

          {/* Right Column: Hero Image with Soft Glow */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
              <img
                src="/images/landing/hero_couple.jpg"
                alt="Couple laughing together at a date cafe"
                className="w-full h-[360px] sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#7E2248] text-sm">
                    ✨
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Live in {platformStats.activeCities?.slice(0, 2).map((c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()).join(" & ") || "Bengaluru & Mumbai"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {platformStats.totalEvents > 0 ? `${platformStats.totalEvents}+ offline gatherings hosted` : "250+ offline gatherings hosted"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7E2248] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Verified
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* THE DATA DILEMMA & STATS SECTION */}
      {/* ========================================================================= */}
      <section className="relative py-12 px-6 bg-white overflow-hidden">
        {/* Subtle Watermark Header */}
        <div className="text-center select-none pt-4 pb-2">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-[0.25em] text-[#D8A7B8]/35 uppercase">
            THE DATA DILEMMA
          </h2>
        </div>

        {/* 4 Stats Bar */}
        <div className="max-w-5xl mx-auto my-8 bg-white rounded-2xl border border-rose-150 shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-rose-100 text-center">
            <div className="pt-2 md:pt-0 md:px-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {platformStats.verifiedMembers > 0 
                  ? (platformStats.verifiedMembers >= 1000 
                      ? `${(platformStats.verifiedMembers / 1000).toFixed(1)}k+` 
                      : `${platformStats.verifiedMembers.toLocaleString()}+`) 
                  : "10,000+"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Verified Members</div>
            </div>
            <div className="pt-4 md:pt-0 md:px-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {platformStats.totalEvents > 0 
                  ? (platformStats.totalEvents >= 100 
                      ? `${platformStats.totalEvents}+` 
                      : `${platformStats.totalEvents}+`) 
                  : "250+"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Curated Events</div>
            </div>
            <div className="pt-4 md:pt-0 md:px-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">100%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Offline First</div>
            </div>
            <div className="pt-4 md:pt-0 md:px-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#7E2248] tracking-tight">
                {platformStats.averageRating ? `${platformStats.averageRating} ★` : "4.9 ★"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Community Trust</div>
            </div>
          </div>
        </div>

        {/* Problem Statement: Too many matches. Not enough moments. */}
        <div className="max-w-6xl mx-auto pt-10 pb-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Left: Overwhelmed Girl on Smartphone with Floating Chat Notifications */}
          <div className="md:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                <img
                  src="/images/landing/phone_fatigue.jpg"
                  alt="Young woman feeling overwhelmed by dating apps"
                  className="w-full h-[340px] sm:h-[380px] object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right: Copywriting */}
          <div className="md:col-span-7 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Too many matches.
              <br />
              <span className="font-serif italic font-normal text-[#7E2248]">not enough moments.</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed">
              Dating apps promised effortless human connection. Instead, they delivered algorithmic addiction, endless ghosting, superficial judgments, and hours wasted on dry chats that lead nowhere.
            </p>
            <p className="text-slate-600 text-base leading-relaxed">
              JabWeMeet changes that by bringing connection back to where it belongs: <strong className="text-slate-900">the real world</strong>.
            </p>
          </div>
        </div>

        {/* Fatigue Tags Row */}
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 pt-2 pb-6">
          <span className="px-5 py-2.5 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold bg-rose-50/50">
            Endless swipe
          </span>
          <span className="px-6 py-2.5 rounded-full bg-[#7E2248] text-white text-xs font-bold shadow-sm">
            Ghosting
          </span>
          <span className="px-5 py-2.5 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold bg-rose-50/50">
            Digital Deception
          </span>
          <span className="px-6 py-2.5 rounded-full bg-[#7E2248] text-white text-xs font-bold shadow-sm">
            Conversations that go Nowhere
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* OUR FOUNDATION: 3 PILLAR CARDS WITH DEEP WINE BANNER */}
      {/* ========================================================================= */}
      <section className="relative my-10" id="about">
        {/* Deep Wine / Burgundy Banner */}
        <div className="bg-[#7E2248] text-white pt-16 pb-40 px-6 rounded-3xl mx-4 sm:mx-8 relative shadow-xl">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-rose-200 font-bold block">
              OUR FOUNDATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
              A Place to meet people in the real world.
            </h2>
            <p className="text-sm sm:text-base text-rose-100/80 max-w-xl mx-auto leading-relaxed">
              JabWeMeet is built upon three pillars to shift dating from screen fatigue to authentic real-life connections.
            </p>
          </div>
        </div>

        {/* Overlapping Cards Container */}
        <div className="max-w-6xl mx-auto px-6 -mt-28 relative z-10">
          {/* Top Row: 2 Tilted White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1: Real People */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 transform md:-rotate-1 hover:rotate-0 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl text-rose-300 font-serif leading-none">“</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    REAL PEOPLE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real People</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Verified profiles, identity checks, and background-checked community members ready to meet honestly.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden h-48 w-full">
                <img
                  src="/images/landing/foundation_people.jpg"
                  alt="Real people laughing together"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 2: Real Connections */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-rose-100 transform md:rotate-1 hover:rotate-0 transition-transform duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl text-rose-300 font-serif leading-none">“</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-[#7E2248] border border-rose-200">
                    REAL CONNECTIONS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real Connections</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Curated chemistry and conversational icebreakers without the awkwardness or anxiety of blind dates.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden h-48 w-full">
                <img
                  src="/images/landing/foundation_connections.jpg"
                  alt="Real connections being made"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

          </div>

          {/* Bottom Center Overlapping Card: Real Places */}
          <div className="mt-8 max-w-lg mx-auto">
            <div className="bg-[#121927] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl text-amber-300 font-serif leading-none">“</span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    REAL PLACES • {platformStats.totalCafes > 0 ? `${platformStats.totalCafes} PARTNER VENUES` : 'HANDPICKED'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real Places</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Handpicked cozy partner cafes, rooftop lounges, and private spaces with reserved tables and warm ambiance across India.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden h-48 w-full">
                <img
                  src="/images/landing/foundation_places.jpg"
                  alt="Atmospheric partner cafe"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* UPCOMING EXPERIENCE & EVENTS */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 max-w-7xl mx-auto" id="events">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-900">
            Upcoming Experience & <span className="font-serif italic font-normal text-[#7E2248]">Events</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Explore offline singles events, speed dating, blind dinners, and curated mixers in your city. Real people, real moments.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-600 relative">
            <span>• Showing events in:</span>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowCityPickerDropdown(!showCityPickerDropdown)}
                className="font-bold text-slate-900 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-200 transition flex items-center gap-1.5"
              >
                <span>📍 {selectedCity}</span>
                <span className="text-[10px]">▼</span>
              </button>

              {showCityPickerDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border border-rose-200 rounded-2xl shadow-xl z-50 p-2 text-left animate-in fade-in">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Select City
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity("All Cities");
                      setShowCityPickerDropdown(false);
                      fetchLiveEvents("All", selectedEventCategory);
                    }}
                    className={`block w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedCity === "All Cities" ? "bg-rose-50 text-[#7E2248] font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    🇮🇳 All Cities
                  </button>
                  {Array.from(new Set([...eventCities, "Bengaluru", "Mumbai", "Pune", "Delhi NCR"])).map((c) => {
                    const formatted = c.charAt(0).toUpperCase() + c.slice(1);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedCity(formatted);
                          setShowCityPickerDropdown(false);
                          fetchLiveEvents(formatted, selectedEventCategory);
                        }}
                        className={`block w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          selectedCity.toLowerCase() === c.toLowerCase()
                            ? "bg-rose-50 text-[#7E2248] font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        📍 {formatted}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <span>•</span>
            <button
              onClick={() => {
                setPlaceCityError("");
                setShowRecommendPlaceModal(true);
              }}
              className="text-[#7E2248] font-bold hover:underline"
            >
              Recommend Cafe
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-6">
            {[
              { id: "All", label: "All Events" },
              { id: "Singles Mixers", label: "Singles Mixers" },
              { id: "Speed Dating", label: "Speed Dating" },
              { id: "Blind Dates", label: "Blind Dates" },
              { id: "Travel Retreats", label: "Travel Retreats" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedEventCategory(cat.id);
                  fetchLiveEvents(selectedCity === "All Cities" ? "All" : selectedCity, cat.id);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition border ${
                  selectedEventCategory === cat.id
                    ? "bg-[#7E2248] text-white border-[#7E2248] shadow-md shadow-[#7E2248]/20"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Event Showcase: 4 Steps on Left, Featured Event Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-6 pb-12">
          {/* Left: 4 Numbered Steps */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-[#7E2248] text-white flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Register for free</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Browse offline events happening in your city and pick an experience that fits your vibe.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-[#7E2248] text-white flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Reserve your spot</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Secure your pass online with 100% money back guarantee if cancelled by host.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-[#7E2248] text-white flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Walk in & connect</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Show your digital pass, meet our friendly host, and get introduced smoothly without pressure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-[#7E2248] text-white flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Keep the conversation going</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Loved someone's vibe? Swap numbers or request matchmaker follow-up through the portal.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Featured Candlelight Event with Floating Wine Badge */}
          {(() => {
            const featuredEvent = liveEvents && liveEvents.length > 0 ? liveEvents[0] : null;
            const featuredDate = featuredEvent && !isNaN(new Date(featuredEvent.date).getTime())
              ? new Date(featuredEvent.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
              : "Upcoming";
            const featuredPrice = featuredEvent?.price && featuredEvent.price > 0
              ? `₹${featuredEvent.price.toLocaleString("en-IN")}`
              : "₹1,499";

            return (
              <div className="lg:col-span-7 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    src={featuredEvent?.coverImage || featuredEvent?.image || "/images/landing/candlelight_event.jpg"}
                    alt={featuredEvent?.title || "Candlelight Speakeasy Singles Mixer"}
                    className="w-full h-[380px] sm:h-[440px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Wine Overlay Card */}
                <div className="bg-[#7E2248] text-white rounded-2xl p-5 shadow-2xl border border-white/20 -mt-16 sm:-mt-20 mx-4 sm:mx-8 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-rose-100">
                        {featuredEvent?.category || "Live Event"}
                      </span>
                      <span className="text-xs text-rose-200">
                        {featuredEvent 
                          ? `${featuredDate} in ${featuredEvent.location ? `${featuredEvent.location}, ` : ""}${featuredEvent.city}`
                          : "In 2 days in Indiranagar"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">
                      {featuredEvent?.title || "The Candlelight Speakeasy Singles Mixer"}
                    </h3>
                    <p className="text-xs text-rose-100/80 mt-0.5 line-clamp-2">
                      {featuredEvent?.description || "Curated for 24-34 age group. 1 complimentary artisanal drink included."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-rose-200 block">Entry pass</span>
                      <span className="text-base font-extrabold text-white">{featuredPrice}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (currentUser) {
                          router.push(`/dashboard?tab=events`);
                        } else {
                          router.push("/register?role=USER");
                        }
                      }}
                      className="px-5 py-2.5 rounded-full bg-white text-[#7E2248] hover:bg-rose-50 font-bold text-xs uppercase tracking-wider shadow-sm transition"
                    >
                      Book Spot
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Dynamic Events from Database */}
        {liveEvents.length > 0 && (
          <div className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">All Live Events ({liveEvents.length})</h3>
              <a href="/experiences" className="text-xs font-bold text-[#7E2248] hover:underline flex items-center gap-1">
                View full calendar <ChevronRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents
                .filter((ev) => {
                  if (selectedEventCategory === "All") return true;
                  const cat = (ev.category || "").toLowerCase();
                  const filterCat = selectedEventCategory.toLowerCase();
                  if (filterCat.includes("mixer")) return cat.includes("single") || cat.includes("mixer");
                  if (filterCat.includes("speed")) return cat.includes("speed");
                  if (filterCat.includes("blind")) return cat.includes("blind") || cat.includes("dinner");
                  if (filterCat.includes("travel")) return cat.includes("travel") || cat.includes("trip");
                  return cat.includes(filterCat);
                })
                .slice(0, 6)
                .map((ev) => {
                  const eventDate = new Date(ev.date);
                  const dateStr = !isNaN(eventDate.getTime())
                    ? eventDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "Upcoming";
                  const timeStr = !isNaN(eventDate.getTime())
                    ? eventDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={ev.id}
                      className="rounded-3xl bg-white border border-rose-100 hover:border-[#7E2248]/40 transition shadow-md hover:shadow-xl flex flex-col justify-between p-6 group duration-300"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#7E2248] border border-rose-200">
                            {ev.category}
                          </span>
                          <span className="text-[#7E2248] font-extrabold text-sm">
                            {ev.price && ev.price > 0 ? `₹${ev.price.toLocaleString("en-IN")}` : "Free"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-[#7E2248] transition line-clamp-1">
                            {ev.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>🗓️</span>
                            <span>{dateStr} {timeStr ? `• ${timeStr}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{ev.location}, <strong className="text-slate-800">{ev.city}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100">
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              router.push("/register");
                              return;
                            }
                            router.push("/dashboard?tab=events");
                          }}
                          className="w-full py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
                        >
                          {currentUser ? "Reserve Spot" : "Join to Book"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SIX REAL-WORLD EXPERIENCES */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF3F6] py-20 px-6 rounded-3xl mx-4 sm:mx-8 my-10" id="experiences">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading and Description */}
          <div className="lg:col-span-4 space-y-5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7E2248] block">
              6 CURATED FORMATS • REAL MOMENTS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
              <span className="text-[#7E2248] block">SIX REAL-WORLD</span>
              <span className="block mt-1">EXPERIENCES</span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Dating shouldn't feel like a job interview. We design interactive, pressure-free offline gatherings where you can laugh, chat, and connect with people who share your outlook on life.
            </p>

            <a
              href="/experiences"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#7E2248] text-[#7E2248] hover:bg-[#7E2248] hover:text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              EXPLORE FORMATS <ArrowRight size={14} />
            </a>
          </div>

          {/* Right Column: Visual Experience Cards Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            
            {/* Card 1: Singles Social */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_social.jpg"
                alt="Singles Social"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  Social Mixer
                </span>
                <h4 className="text-base font-bold">SINGLES SOCIAL</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Casual evening cocktails, icebreaker prompts, and warm mingling.
                </p>
              </div>
            </div>

            {/* Card 2: Speed Dating */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_speed.jpg"
                alt="Speed Dating"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  5-Min Rotations
                </span>
                <h4 className="text-base font-bold">SPEED DATING</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Quick 5-minute curated conversations with secret mutual matching.
                </p>
              </div>
            </div>

            {/* Card 3: Blind Dates */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_blind.jpg"
                alt="Blind Dates"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  1-on-1 Dinner
                </span>
                <h4 className="text-base font-bold">BLIND DATES</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Handcrafted 1-on-1 dinner pairings at our partner cafes.
                </p>
              </div>
            </div>

            {/* Card 4: Dance Dates */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_dance.jpg"
                alt="Dance Dates"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  Salsa & Bachata
                </span>
                <h4 className="text-base font-bold">DANCE DATES</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Beginner-friendly salsa rhythms that break the ice instantly.
                </p>
              </div>
            </div>

            {/* Card 5: Travel Escapes */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_travel.jpg"
                alt="Singles Travel Escapes"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  Weekend Getaways
                </span>
                <h4 className="text-base font-bold">TRAVEL RETREATS</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Curated group trips to Coorg, Goa, and scenic mountains.
                </p>
              </div>
            </div>

            {/* Card 6: Creative Mixers */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg group h-72">
              <img
                src="/images/landing/experience_creative.jpg"
                alt="Creative Mixers"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-1">
                  Art & Boardgames
                </span>
                <h4 className="text-base font-bold">CREATIVE MIXERS</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-2">
                  Bond over pottery wheels, coffee cupping, and playful games.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* HOW JABWEMEET WORKS (ASCENDING ROADMAP WITH 4 STEP CARDS) */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 max-w-7xl mx-auto" id="how-it-works">
        <div className="text-center space-y-2 mb-14">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7E2248] block">
            SIMPLE & 100% TRANSPARENT
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            HOW JAB<span className="font-serif italic font-normal text-[#7E2248]">WEMEET WORKS</span>
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            From curious click to real-world laughter in 4 easy, safe steps.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Get Offline Message */}
          <div className="lg:col-span-4 space-y-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-[#7E2248] border border-rose-200 inline-block">
              OFFLINE FIRST
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              GET OFFLINE
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Skip the awkward weeks of texting that fizzles into ghosting. Meet authentic singles in vetted, comfortable venues designed for natural conversations.
            </p>
            <button
              onClick={() => router.push("/register?role=USER")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#7E2248]/20 transition"
            >
              Get Started Now <ArrowRight size={14} />
            </button>
          </div>

          {/* Right Column: Ascending 4 Step Cards */}
          <div className="lg:col-span-8 relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              {/* Card 01: Join */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-rose-100 flex flex-col justify-between h-44 hover:-translate-y-1 transition">
                <div>
                  <span className="text-sm font-extrabold text-[#7E2248] block mb-1">01.</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Join</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Create your free verified profile in under 2 minutes.
                  </p>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">✓ Free & Instant</span>
              </div>

              {/* Card 02: Tell Us About You (Highlighted Wine Card with Pin Marker) */}
              <div className="bg-[#7E2248] text-white rounded-2xl p-5 shadow-xl border border-white/20 flex flex-col justify-between h-52 transform sm:-translate-y-4 hover:-translate-y-6 transition relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#7E2248] font-bold text-xs flex items-center justify-center shadow-md">
                  📍
                </div>
                <div>
                  <span className="text-sm font-extrabold text-rose-200 block mb-1">02.</span>
                  <h4 className="text-base font-bold text-white mb-1">Tell Us About You</h4>
                  <p className="text-xs text-rose-100/90 leading-relaxed">
                    Share your relationship intent, vibe, and what matters to you.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Relationship
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Bengaluru
                  </span>
                </div>
              </div>

              {/* Card 03: Choose Experience */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-rose-100 flex flex-col justify-between h-44 transform sm:-translate-y-8 hover:-translate-y-10 transition">
                <div>
                  <span className="text-sm font-extrabold text-[#7E2248] block mb-1">03.</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Choose Experience</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pick speed dating, mixers, dinners, or matchmaking.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Curated formats</span>
              </div>

              {/* Card 04: Meet in Real Life */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-rose-100 flex flex-col justify-between h-44 transform sm:-translate-y-12 hover:-translate-y-14 transition">
                <div>
                  <span className="text-sm font-extrabold text-[#7E2248] block mb-1">04.</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Meet in Real Life</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Show up, have a great time, and connect naturally.
                  </p>
                </div>
                <span className="text-[10px] text-[#7E2248] font-bold">✨ Real Spark</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SAFETY & COMFORT */}
      {/* ========================================================================= */}
      <section className="relative my-16" id="safety">
        {/* Dark Charcoal / Black Banner */}
        <div className="bg-[#121620] text-white pt-14 pb-28 px-6 rounded-3xl mx-4 sm:mx-8 relative shadow-2xl overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-rose-300 font-bold block">
              SAFETY & COMFORT
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wide text-white">
              MEET CONFIDENTLY. CONNECT SAFELY
            </h2>
          </div>
        </div>

        {/* 6 Lavender / Blush Tinted Cards Overlapping Banner */}
        <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Verified Members</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Identity & mobile verified</p>
            </div>

            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">☕</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Public Venues</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Vetted premium cafes & clubs</p>
            </div>

            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">🤝</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Event Hosts</h4>
              <p className="text-[10px] text-slate-500 leading-tight">On-ground staff present</p>
            </div>

            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">📜</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Community Guidelines</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Zero tolerance for misconduct</p>
            </div>

            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">🚨</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Report & Block</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Instant 24/7 staff escalation</p>
            </div>

            <div className="bg-[#FAF3F6] border border-rose-200/80 rounded-2xl p-4 text-center shadow-lg hover:-translate-y-1 transition">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Privacy Protection</h4>
              <p className="text-[10px] text-slate-500 leading-tight">No contact info shared</p>
            </div>

          </div>

          {/* Safety Button */}
          <div className="text-center pt-8">
            <button
              onClick={() => setShowSafetyModal(true)}
              className="px-8 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#7E2248]/20 transition"
            >
              READ OUR SAFETY POLICY
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TESTIMONIALS / STORIES */}
      {/* ========================================================================= */}
      <section className="py-16 px-6 max-w-6xl mx-auto" id="stories">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#7E2248] block">
            REAL STORIES
          </span>
          <h2 className="text-3xl font-serif font-bold text-slate-900">
            What Our Community Says
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(testimonials.length > 0 ? testimonials.slice(0, 3) : [
            {
              userName: "Ananya",
              rating: 5,
              feedback: "JabWeMeet completely changed dating for me. Meeting at a curated coffee social in Indiranagar felt so natural and refreshing compared to mindless swiping on apps.",
              gender: "Bengaluru",
              userImage: null,
            },
            {
              userName: "Rohan",
              rating: 5,
              feedback: "The atmosphere at the Speakeasy Singles Mixer was fantastic. The hosts were warm, the icebreakers were fun, and I actually met someone I clicked with.",
              gender: "Mumbai",
              userImage: null,
            },
            {
              userName: "Sneha",
              rating: 5,
              feedback: "Offline-first is the future. No ghosting, no dry messaging. You talk face to face, have real conversations, and feel the actual spark immediately.",
              gender: "Bengaluru",
              userImage: null,
            }
          ]).map((t, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-rose-150 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 mb-3">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed mb-4">
                  "{t.feedback}"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img
                  src={t.userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.userName || "Member")}&background=7E2248&color=fff`}
                  alt={t.userName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 capitalize">{t.userName}</h5>
                  <p className="text-[10px] text-slate-400">
                    Verified Member {t.gender ? `• ${t.gender}` : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-rose-100 pt-16 pb-12 px-6 text-sm text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
                JABWEMEET
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              {cmsContent.aboutText || 
                "JabWeMeet brings people together through real-world experiences, singles events, speed dating, blind dates, dance socials, and genuine human connections."
              }
            </p>
            <p className="text-xs font-semibold text-slate-700">
              A Reason to Meet. Not Another Dating App.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Experiences</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/experiences" className="hover:text-[#7E2248] transition">Singles Socials</a></li>
              <li><a href="/experiences" className="hover:text-[#7E2248] transition">Speed Dating</a></li>
              <li><a href="/experiences" className="hover:text-[#7E2248] transition">Blind Dates</a></li>
              <li><a href="/experiences" className="hover:text-[#7E2248] transition">Dance Dates</a></li>
              <li><a href="/experiences" className="hover:text-[#7E2248] transition">Travel Retreats</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#how-it-works" className="hover:text-[#7E2248] transition">How It Works</a></li>
              <li><a href="#safety" className="hover:text-[#7E2248] transition">Safety Standards</a></li>
              <li><a href="/cafes" className="hover:text-[#7E2248] transition">Partner Cafes</a></li>
              <li><Link href="/login" className="hover:text-[#7E2248] transition">Member Portal</Link></li>
              <li><Link href="/register?role=HOST" className="hover:text-[#7E2248] transition">Host an Event</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Trust & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-[#7E2248] transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#7E2248] transition">Privacy Policy</Link></li>
              <li><button onClick={() => setShowSafetyModal(true)} className="hover:text-[#7E2248] transition">Safety Pledge</button></li>
              <li><a href="mailto:support@jabweemeet.com" className="hover:text-[#7E2248] transition">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-rose-100/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 JabWeMeet. Real People. Real Places. Real Connections. All rights reserved.</p>
          <p>Made with ❤️ for real human relationships.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-150 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="font-extrabold text-xl tracking-wider text-[#7E2248] uppercase block mb-1">
                JABWEMEET
              </span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">Ready to meet someone in the real world?</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#7E2248] hover:underline font-semibold">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/25 disabled:opacity-60"
              >
                {loginLoading ? "Signing in..." : "LOGIN"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push("/register");
                }}
                className="text-[#7E2248] font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      )}

      {/* SAFETY MODAL */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <span className="text-2xl mb-1 block">🛡️</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">JabWeMeet Safety Pledge</h2>
              <p className="text-xs text-slate-500 mt-1">Our commitment to your security and peace of mind.</p>
            </div>

            {cmsContent.safetyPledge && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs leading-relaxed whitespace-pre-line">
                <p className="font-bold text-[#7E2248] mb-1">Official Platform Pledge:</p>
                <p>{cmsContent.safetyPledge}</p>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p><strong>1. Strict Verification:</strong> Every attendee must verify their mobile number and government identity before joining offline events.</p>
              <p><strong>2. Safe Public Venues:</strong> All events take place in vetted premium public cafes, restaurants, lounges, and dance studios.</p>
              <p><strong>3. On-Ground Event Hosts:</strong> Every experience is supervised by friendly on-ground coordinators who welcome you.</p>
              <p><strong>4. Consent-First Culture:</strong> Sharing phone numbers or personal contacts is always completely voluntary and never pressured.</p>
              <p><strong>5. Zero Tolerance Policy:</strong> Any harassment, disrespect, or inappropriate conduct leads to an immediate permanent ban.</p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-full py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMEND A PLACE MODAL */}
      {showRecommendPlaceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-150 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-5">
            <button
              onClick={() => setShowRecommendPlaceModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-[#7E2248] mb-2">
                ☕ Explore & Recommend Top Cafes in India 🇮🇳
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">Recommend a Place</h2>
              <p className="text-xs text-slate-500 mt-1">
                Search Indian cities to explore curated cafes, coffee spots, and cozy meetup venues.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchPlaceRedirect();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Enter Indian City / Place: <span className="text-[#7E2248]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#7E2248]">
                    📍
                  </span>
                  <input
                    type="text"
                    required
                    value={placeCityInput}
                    onChange={(e) => {
                      setPlaceCityInput(e.target.value);
                      if (placeCityError) setPlaceCityError("");
                    }}
                    placeholder="Type city (e.g. Bengaluru, Mumbai, Pune, Jaipur...)"
                    autoFocus
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${
                      placeCityError ? "border-rose-500" : "border-slate-200"
                    } rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition`}
                  />
                </div>
                {placeCityError && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5">
                    ⚠️ {placeCityError}
                  </p>
                )}
              </div>

              {placeCityInput.trim() && (
                <div className="max-h-44 overflow-y-auto space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-2">
                  {placeCitySearching ? (
                    <div className="text-xs text-slate-400 py-2 px-3 text-center">
                      Searching Indian cities...
                    </div>
                  ) : placeCitySuggestions.length > 0 ? (
                    placeCitySuggestions.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSearchPlaceRedirect(c.name)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-[#7E2248]">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{c.state}, India</div>
                        </div>
                        <span className="text-xs text-[#7E2248] font-bold">Select →</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-2 px-3 text-center">
                      Ready to search for cafes in <strong>"{placeCityInput}"</strong>, India
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#7E2248]/25 transition flex items-center justify-center gap-2"
              >
                <span>🔍</span> Search Cafes & Meetup Spots
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500">
                Popular Cities in India:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Bengaluru",
                  "Mumbai",
                  "Delhi NCR",
                  "Pune",
                  "Hyderabad",
                  "Goa",
                  "Jaipur",
                  "Kolkata",
                  "Chennai",
                  "Chandigarh",
                ].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSearchPlaceRedirect(city)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-[#7E2248] border border-slate-200 hover:border-rose-200 transition"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
