"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import QuickStats from "./components/QuickStats";
import ProfileCompletionCard from "./components/ProfileCompletionCard";
import UpcomingEventsSection, { EventItem } from "./components/UpcomingEventsSection";
import ExperiencesSection from "./components/ExperiencesSection";
import PremiumServicesSection from "./components/PremiumServicesSection";
import ConnectionsSection, { ConnectionItem } from "./components/ConnectionsSection";
import ActivityFeed from "./components/ActivityFeed";

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
  dateOfBirth?: string;
}

// Fallback seed catalog matching seed.js to ensure dashboard remains fully interactive
// if the local database service is momentarily offline
const FALLBACK_SEED_EVENTS: EventItem[] = [
  {
    id: "evt-1",
    title: "Rooftop Singles Mixer & Cocktail Evening",
    description:
      "An evening of relaxed conversations, great music, and curated icebreakers atop the city skyline.",
    category: "Singles Events",
    location: "Sky Lounge, Indiranagar",
    city: "Bangalore",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1200,
    maxAttendees: 40,
  },
  {
    id: "evt-2",
    title: "5-Minute Chemistry: Speed Dating Edition",
    description:
      "15 structured mini-conversations with verified members in an intimate café setting.",
    category: "Speed Dating",
    location: "Artisan Coffee Roasters, Bandra",
    city: "Mumbai",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1500,
    maxAttendees: 30,
  },
  {
    id: "evt-3",
    title: "Curated Blind Dinner Date",
    description:
      "Hand-picked pairing based on shared values and relationship goals, hosted at a premier bistro.",
    category: "Blind Dates",
    location: "Olive Bistro, Mehrauli",
    city: "Delhi",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    price: 2500,
    maxAttendees: 10,
  },
  {
    id: "evt-4",
    title: "Beginner Bachata & Salsa Social Date",
    description:
      "No partner or dance experience needed! Connect through rhythm, laughter, and movement.",
    category: "Dance Dates",
    location: "Movement Studio, Koregaon Park",
    city: "Pune",
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    price: 900,
    maxAttendees: 35,
  },
  {
    id: "evt-5",
    title: "Weekend Mountain Escape & Bonfire",
    description:
      "A 2-day getaway with like-minded singles: stargazing, trail hiking, and acoustic bonfire sessions.",
    category: "Singles Travel",
    location: "Cedar Woods Retreat, Manali",
    city: "Himachal",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    price: 7500,
    maxAttendees: 20,
  },
  {
    id: "evt-6",
    title: "Fresh Start: Breakup Recovery Circle & Comedy",
    description:
      "A warm, uplifting space to share stories, laugh together, and embrace new beginnings.",
    category: "Breakup Community",
    location: "The Common Room, Cyber Hub",
    city: "Gurugram",
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    price: 500,
    maxAttendees: 25,
  },
];

export default function DashboardPage() {
  const router = useRouter();

  // Dynamic user & event state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation & Interactive states
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<{
    relationshipManager: boolean;
    breakupBuddy: boolean;
  }>({ relationshipManager: false, breakupBuddy: false });
  const [reservationToast, setReservationToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        // Authenticated session check
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          // Check if there are local saved preferences for this user
          const savedUserOverrides = localStorage.getItem(`jwm_user_overrides_${data.user.id}`);
          if (savedUserOverrides) {
            try {
              const overrides = JSON.parse(savedUserOverrides);
              setUser({ ...data.user, ...overrides });
            } catch (e) {
              setUser(data.user);
            }
          } else {
            setUser(data.user);
          }

          // Load user-specific interactive state
          const savedRsvps = localStorage.getItem(`jwm_rsvps_${data.user.id}`);
          if (savedRsvps) {
            try {
              setRegisteredEventIds(JSON.parse(savedRsvps));
            } catch (e) {}
          }

          const savedConns = localStorage.getItem(`jwm_conns_${data.user.id}`);
          if (savedConns) {
            try {
              setConnections(JSON.parse(savedConns));
            } catch (e) {}
          }

          const savedServices = localStorage.getItem(`jwm_services_${data.user.id}`);
          if (savedServices) {
            try {
              setServiceRequests(JSON.parse(savedServices));
            } catch (e) {}
          }
        } else {
          router.replace("/login");
          return;
        }

        // Fetch real database events
        try {
          const eventRes = await fetch("/api/events");
          if (eventRes.ok) {
            const eventData = await eventRes.json();
            if (eventData.success && Array.isArray(eventData.events) && eventData.events.length > 0) {
              setEvents(eventData.events);
            } else {
              setEvents(FALLBACK_SEED_EVENTS);
            }
          } else {
            setEvents(FALLBACK_SEED_EVENTS);
          }
        } catch (e) {
          setEvents(FALLBACK_SEED_EVENTS);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Unable to load dashboard data right now. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {}
    router.replace("/");
  }

  // Handle Dynamic User Profile Updates
  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    try {
      localStorage.setItem(`jwm_user_overrides_${user.id}`, JSON.stringify(updatedFields));
    } catch (e) {}
  };

  // Handle Event RSVP
  const handleRegisterEvent = (evt: EventItem) => {
    if (!user || registeredEventIds.includes(evt.id)) return;
    const updated = [...registeredEventIds, evt.id];
    setRegisteredEventIds(updated);
    try {
      localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    setReservationToast(`Confirmed spot for "${evt.title}"! Digital admission pass ready.`);
    setTimeout(() => setReservationToast(null), 4500);
  };

  // Handle Cancel Event RSVP
  const handleCancelReservation = (eventId: string) => {
    if (!user) return;
    const updated = registeredEventIds.filter((id) => id !== eventId);
    setRegisteredEventIds(updated);
    try {
      localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    setReservationToast("RSVP released. Spot is now open for other members.");
    setTimeout(() => setReservationToast(null), 3500);
  };

  // Handle Connecting with a Peer
  const handleAddConnection = (newConn: ConnectionItem) => {
    if (!user) return;
    const exists = connections.some((c) => c.id === newConn.id);
    if (exists) return;
    const updated = [...connections, newConn];
    setConnections(updated);
    try {
      localStorage.setItem(`jwm_conns_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    setReservationToast(`Connection request sent to ${newConn.name}!`);
    setTimeout(() => setReservationToast(null), 4000);
  };

  // Handle Requesting Premium Services
  const handleRequestService = (service: "relationshipManager" | "breakupBuddy") => {
    if (!user) return;
    const updated = { ...serviceRequests, [service]: true };
    setServiceRequests(updated);
    try {
      localStorage.setItem(`jwm_services_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    const serviceName =
      service === "relationshipManager" ? "Relationship Manager" : "Breakup Buddy";
    setReservationToast(`Request submitted for ${serviceName}! A specialist will reach out.`);
    setTimeout(() => setReservationToast(null), 4500);
  };

  // Calculate profile completion percentage dynamically
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    const required = [
      Boolean(user.name?.trim()),
      Boolean(user.email?.trim()),
      Boolean(user.phone?.trim()),
      Boolean(user.city?.trim()),
      Boolean(user.dateOfBirth),
      Boolean(user.gender?.trim()),
      Boolean(user.relationshipIntent?.trim()),
    ];
    const completed = required.filter(Boolean).length;
    return Math.round((completed / required.length) * 100);
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans">
        {/* Skeleton Topbar */}
        <div className="h-16 border-b border-white/10 bg-[#0d1526] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-28 h-5 rounded-md bg-white/10 animate-pulse" />
          </div>
          <div className="w-20 h-8 rounded-full bg-white/10 animate-pulse" />
        </div>

        <div className="flex-1 flex">
          {/* Skeleton Sidebar (Desktop) */}
          <div className="hidden lg:block w-72 border-r border-white/10 bg-[#0d1526] p-6 space-y-4">
            <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-full h-8 rounded-xl bg-white/5 animate-pulse" />
          </div>

          {/* Skeleton Main Body */}
          <div className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl mx-auto w-full">
            <div className="h-44 rounded-3xl bg-[#131d2e] border border-white/10 animate-pulse p-8 space-y-4">
              <div className="w-32 h-6 rounded-full bg-white/10" />
              <div className="w-64 h-8 rounded-lg bg-white/10" />
              <div className="w-96 h-4 rounded-md bg-white/5" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-[#131d2e] border border-white/10 animate-pulse p-4" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-[#131d2e] border border-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#131d2e] border border-white/10 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Unable to load dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {error || "Your session could not be verified. Please try again."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-semibold shadow-md transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => router.replace("/login")}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const registeredEvents = events.filter((e) => registeredEventIds.includes(e.id));
  const localEvents = events.filter(
    (e) => (e.city || "").toLowerCase() === (user.city || "").toLowerCase()
  );
  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white flex flex-col">
      {/* Dynamic Toast Notification */}
      {reservationToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-500/40 border border-emerald-400/30">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{reservationToast}</span>
          </div>
        </div>
      )}

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
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline truncate max-w-[120px]">
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-[#fca5a5] rounded-lg transition"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar + Mobile Drawer with Dynamic Badges */}
      <DashboardSidebar
        user={user}
        activeSection={activeSection}
        eventsCount={events.length}
        myEventsCount={registeredEvents.length}
        connectionsCount={connections.length}
        notificationsCount={registeredEvents.length + (serviceRequests.relationshipManager ? 1 : 0) + (serviceRequests.breakupBuddy ? 1 : 0)}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec === "events" || sec === "my-events") {
            scrollToElement("events");
          } else if (sec === "connections") {
            scrollToElement("connections");
          }
        }}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10 flex-1">
          {/* Dynamic Header Greeting */}
          <DashboardHeader
            user={user}
            totalEventsCount={events.length}
            localEventsCount={localEvents.length}
            onExploreExperiences={() => scrollToElement("experiences")}
            onBrowseEvents={() => scrollToElement("events")}
          />

          {/* Dynamic Quick Stats Row */}
          <QuickStats
            totalEventsCount={events.length}
            localEventsCount={localEvents.length}
            userCity={user.city}
            joinedEventsCount={registeredEvents.length}
            connectionsCount={connections.length}
            profileCompletionPercentage={completionPercentage}
            onViewEvents={() => {
              setSelectedCategory("ALL");
              scrollToElement("events");
            }}
            onViewLocalEvents={() => {
              scrollToElement("events");
            }}
            onViewConnections={() => scrollToElement("connections")}
            onViewProfile={() => {}}
          />

          {/* Dynamic Profile Completion Section */}
          <ProfileCompletionCard
            user={user}
            onUpdateUser={handleUpdateUser}
          />

          {/* Dynamic Upcoming Events Section */}
          <UpcomingEventsSection
            events={events}
            userCity={user.city}
            userName={user.name}
            registeredEventIds={registeredEventIds}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onRegisterEvent={handleRegisterEvent}
            onCancelReservation={handleCancelReservation}
            onExploreClick={() => scrollToElement("experiences")}
          />

          {/* Dynamic Discover Experiences Section */}
          <ExperiencesSection
            events={events}
            userCity={user.city}
            onSelectCategory={(categoryKey) => {
              setSelectedCategory(categoryKey);
              scrollToElement("events");
            }}
          />

          {/* Dynamic Premium Services Section */}
          <PremiumServicesSection
            userCity={user.city}
            userIntent={user.relationshipIntent}
            serviceRequests={serviceRequests}
            onRequestService={handleRequestService}
          />

          {/* Dynamic Connections Section */}
          <ConnectionsSection
            connections={connections}
            userCity={user.city}
            registeredEventsCount={registeredEvents.length}
            onExploreEvents={() => scrollToElement("events")}
            onAddConnection={handleAddConnection}
          />

          {/* Dynamic Activity & Notifications */}
          <ActivityFeed
            userCreatedAt={user.createdAt}
            userName={user.name}
            profilePercentage={completionPercentage}
            registeredEvents={registeredEvents}
            serviceRequests={serviceRequests}
            connectionRequestsCount={connections.length}
          />
        </main>

        {/* Dynamic Footer */}
        <footer className="border-t border-white/5 py-6 px-8 text-center text-xs text-slate-400">
          <p>
            JabWeMeet Member Portal • Real People. Real Places. Real Connections. Active in {user.city} and nationwide.
          </p>
        </footer>
      </div>
    </div>
  );
}
