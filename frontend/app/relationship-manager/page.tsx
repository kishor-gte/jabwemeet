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
  Loader2,
} from "lucide-react";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/lib/socketUrl";
import DashboardSidebar from "../dashboard/components/DashboardSidebar";



interface AssignedManager {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone: string;
  city: string | null;
  profileImage: string | null;
  profilePhoto?: string | null;
}

interface UserMatchmakingRequest {
  id: string;
  goal: string;
  notes: string;
  matchmakerId: string | null;
  managerName: string | null;
  status: "New" | "Pending" | "Approved" | "Accepted" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

export default function RelationshipManagerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Broadcast & Connect State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // User's Real-time Matchmaking Status
  const [assignedManager, setAssignedManager] = useState<AssignedManager | null>(null);
  const [latestRequest, setLatestRequest] = useState<UserMatchmakingRequest | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Status Banner Auto-Vanish state (vanishes after 10 seconds and stays vanished)
  const [showAssignedBanner, setShowAssignedBanner] = useState(false);
  const [isVanishing, setIsVanishing] = useState(false);
  const [bannerSecondsLeft, setBannerSecondsLeft] = useState(10);

  // Badge counts for sidebar (matching dashboard)
  const [badgeCounts, setBadgeCounts] = useState({
    eventsCount: 0,
    myEventsCount: 0,
    connectionsCount: 0,
    notificationsCount: 0,
  });

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
          setIsPending(Boolean(data.isPending));
        }
      }
    } catch (err) {
      console.error("Failed to fetch user matchmaking status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Real-time socket listener for RM request acceptance
  useEffect(() => {
    if (!currentUser) return;
    const s = io(getSocketUrl(), { withCredentials: true });
    s.on("connect", () => {
      s.emit("join-user-room", currentUser.id);
    });
    s.on("rm-request-accepted", (data: any) => {
      setIsPending(false);
      fetchMyMatchmakingStatus();
      setToast({
        text: `🎉 Connected with Relationship Manager: ${data?.managerDisplayName || data?.managerName || "Relationship Manager"}!`,
        type: "success",
      });
      setTimeout(() => setToast(null), 6000);
    });
    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  // Polling for live acceptance when request is pending
  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      fetchMyMatchmakingStatus();
    }, 3500);
    return () => clearInterval(interval);
  }, [isPending]);

  // Broadcast Connect Handler (Broadcasts to all approved Relationship Managers)
  const handleConnectWithRM = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (isPending) {
      setToast({ text: "⏳ Please wait, a Relationship Manager is already reviewing your request.", type: "error" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    if (assignedManager) {
      setToast({ text: `✓ You are already connected with ${assignedManager.displayName || assignedManager.name}!`, type: "success" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/services/rm-broadcast-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          goal: "Curated 1-on-1 Offline Matchmaking",
          notes: "Need dedicated certified Relationship Manager for curated offline dating introductions",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsPending(true);
        await fetchMyMatchmakingStatus();
        setToast({
          text: "📢 Request sent! Please wait, a certified Relationship Manager will claim and connect with you shortly.",
          type: "success",
        });
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({ text: data.message || "Could not submit broadcast request.", type: "error" });
        setTimeout(() => setToast(null), 4500);
      }
    } catch (e) {
      setToast({ text: "Failed to submit connection request. Please try again.", type: "error" });
      setTimeout(() => setToast(null), 4500);
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-dismiss assigned manager banner 10 seconds after user sees it
  useEffect(() => {
    if (!assignedManager) {
      setShowAssignedBanner(false);
      return;
    }

    const bannerKey = `jwm_rm_banner_vanished_${currentUser?.id || "guest"}_${assignedManager.id}`;
    const firstSeenKey = `jwm_rm_banner_first_seen_${currentUser?.id || "guest"}_${assignedManager.id}`;

    // If user already saw this banner and it finished vanishing, do not show again
    try {
      if (localStorage.getItem(bannerKey) === "true") {
        setShowAssignedBanner(false);
        return;
      }
    } catch (e) {}

    let firstSeen = Date.now();
    try {
      const storedFirstSeen = localStorage.getItem(firstSeenKey);
      if (storedFirstSeen) {
        firstSeen = parseInt(storedFirstSeen, 10);
      } else {
        localStorage.setItem(firstSeenKey, firstSeen.toString());
      }
    } catch (e) {}

    const elapsed = Date.now() - firstSeen;
    const remainingMs = Math.max(0, 10000 - elapsed);

    if (remainingMs <= 0) {
      try {
        localStorage.setItem(bannerKey, "true");
      } catch (e) {}
      setShowAssignedBanner(false);
      return;
    }

    setShowAssignedBanner(true);
    setIsVanishing(false);
    setBannerSecondsLeft(Math.ceil(remainingMs / 1000));

    const countdownInterval = setInterval(() => {
      const nowElapsed = Date.now() - firstSeen;
      const left = Math.max(0, Math.ceil((10000 - nowElapsed) / 1000));
      setBannerSecondsLeft(left);
      if (left <= 1) {
        setIsVanishing(true);
      }
    }, 1000);

    const vanishTimeout = setTimeout(() => {
      setIsVanishing(true);
      setTimeout(() => {
        setShowAssignedBanner(false);
        try {
          localStorage.setItem(bannerKey, "true");
        } catch (e) {}
      }, 500); // 500ms smooth fade-out
    }, remainingMs);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(vanishTimeout);
    };
  }, [assignedManager, currentUser?.id]);

  const handleDismissBanner = () => {
    setIsVanishing(true);
    setTimeout(() => {
      setShowAssignedBanner(false);
      if (assignedManager) {
        const bannerKey = `jwm_rm_banner_vanished_${currentUser?.id || "guest"}_${assignedManager.id}`;
        try {
          localStorage.setItem(bannerKey, "true");
        } catch (e) {}
      }
    }, 300);
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
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    router.replace("/login");
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
    <div className="min-h-screen bg-[#FDFBF9] text-slate-900 font-sans selection:bg-[#7E2248] selection:text-white flex flex-col">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-medium text-xs shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-600/30 border-emerald-500' : 'bg-rose-600 shadow-rose-600/30 border-rose-500'}`}>
            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 shrink-0 font-bold text-center leading-4">!</div>}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Mobile Topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-rose-50 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7E2248] flex items-center justify-center font-extrabold text-white text-sm shadow-xs">
              J
            </div>
            <span className="font-serif font-bold text-base tracking-tight text-slate-900">
              Jab<span className="text-[#7E2248]">We</span>Meet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-[#7E2248] rounded-lg transition"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 rounded-lg bg-[#7E2248] text-white text-xs font-semibold"
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
        <div className="bg-white/80 backdrop-blur-md border-b border-rose-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href={
                currentUser?.role === 'ADMIN' ? '/admin' :
                currentUser?.role === 'MATCHMAKER' ? '/matchmaker/dashboard' :
                currentUser?.role === 'BREAKUP_BUDDY' ? '/breakup-buddy/dashboard' :
                currentUser?.role === 'HOST' ? '/host/dashboard' :
                '/dashboard'
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#7E2248] transition px-3 py-1.5 rounded-full bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs text-slate-500 hidden sm:inline">Premium Services</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-slate-900 hidden sm:inline">Relationship Managers</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnectWithRM}
              disabled={isConnecting || isPending || !!assignedManager}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#7E2248] hover:bg-[#681938] disabled:opacity-60 text-white shadow-md shadow-[#7E2248]/20 transition cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              {assignedManager
                ? `Connected: ${assignedManager.displayName || assignedManager.name}`
                : isPending
                ? "Assigning RM..."
                : "Connect with Relationship Manager"}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7E2248]" />
              Matchmaking Network
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <header className="relative border-b border-rose-100 bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white py-12 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold border border-rose-200">
              <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>JabWeMeet Certified Matchmaking Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-serif">
              Verified Relationship Managers
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Human-curated matchmaking for offline events. Certified Relationship Managers understand your values, pre-screen compatible peers, and arrange meaningful face-to-face introductions.
            </p>

            {/* Quick Metrics */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Admin Verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#7E2248]" />
                Offline Date Curation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                Values-First Matching
              </span>
            </div>

            {/* Action CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              {assignedManager ? (
                <div className="w-full sm:w-auto px-6 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-full shadow-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Connected with {assignedManager.displayName || assignedManager.name}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWithRM}
                  disabled={isConnecting || isPending}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-70 text-white font-bold text-sm rounded-full shadow-lg shadow-[#7E2248]/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Broadcast Request...
                    </>
                  ) : isPending ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" /> Waiting for Manager to Accept...
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-4 h-4" /> Connect with Relationship Manager
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
          {/* PENDING WAITING STATE */}
          {isPending && !assignedManager && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">We are assigning you with a Relationship Manager</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Please wait, your request has been broadcast to all verified Relationship Managers. The first manager to claim will be assigned to guide your dating journey and arrange hand-picked offline introductions.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-xs font-semibold text-amber-900 animate-pulse">
                ⏳ Assigning your Relationship Manager... Please wait.
              </div>
            </div>
          )}

          {/* ACTIVE ASSIGNED RELATIONSHIP MANAGER CARD */}
          {assignedManager && (
            <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-rose-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#7E2248] to-[#9B2C59] border border-rose-200 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {assignedManager.profilePhoto || assignedManager.profileImage ? (
                      <img
                        src={
                          (assignedManager.profilePhoto || assignedManager.profileImage)!.startsWith("http") ||
                          (assignedManager.profilePhoto || assignedManager.profileImage)!.startsWith("/") ||
                          (assignedManager.profilePhoto || assignedManager.profileImage)!.startsWith("data:")
                            ? (assignedManager.profilePhoto || assignedManager.profileImage)!
                            : `/uploads/${assignedManager.profilePhoto || assignedManager.profileImage}`
                        }
                        alt={assignedManager.displayName || assignedManager.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const parent = (e.target as HTMLElement).parentElement;
                          const fallback = parent?.querySelector(".avatar-fallback");
                          if (fallback) (fallback as HTMLElement).style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className={`avatar-fallback font-extrabold text-2xl text-white ${
                        assignedManager.profilePhoto || assignedManager.profileImage ? "hidden" : "flex"
                      } items-center justify-center`}
                    >
                      {(assignedManager.displayName || assignedManager.name).charAt(0).toUpperCase()}
                    </span>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online & Connected" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800">
                        ✓ Connected with {assignedManager.displayName || assignedManager.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
                        {assignedManager.city && assignedManager.city !== "N/A" ? assignedManager.city : "Pan-India"}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                      Active Relationship Manager: {assignedManager.displayName || assignedManager.name}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1">
                      Your certified Relationship Manager is actively curating compatible introductions and organizing 1-on-1 offline date experiences for you.
                    </p>
                  </div>
                </div>

                {/* Manager Contact details */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                  <div className="px-4 py-2.5 bg-[#FDFBF9] border border-rose-100 rounded-2xl text-left">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">RM Email</div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                      {assignedManager.email}
                    </div>
                  </div>
                  {assignedManager.phone && (
                    <div className="px-4 py-2.5 bg-[#FDFBF9] border border-rose-100 rounded-2xl text-left">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">RM Phone</div>
                      <div className="text-xs font-bold text-[#7E2248]">
                        {assignedManager.phone}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Chat & View Dashboard */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <Link
                  href="/messages"
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold rounded-2xl shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" /> Message {assignedManager.displayName || assignedManager.name}
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#FAF3F6] hover:bg-rose-100/70 border border-rose-200 text-slate-800 text-xs font-bold rounded-2xl transition"
                >
                  <Calendar className="w-4 h-4 text-[#7E2248]" /> Member Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Rejection Alert */}
          {!assignedManager && latestRequest?.status === "Rejected" && (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl shrink-0">
                  <X className="w-8 h-8 text-rose-700" />
                </div>
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 text-rose-800 text-[11px] font-bold border border-rose-200">
                    Request Status Update
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                    Previous Request Could Not Be Accommodated
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    Your previous request could not be accepted at this time due to capacity. You can broadcast a new request below to connect with an available Relationship Manager.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleConnectWithRM}
                  disabled={isConnecting}
                  className="inline-flex w-full md:w-auto items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 cursor-pointer"
                >
                  Connect with Available RM
                </button>
              </div>
            </div>
          )}

          {/* HOW IT WORKS & SERVICE BENEFITS (When not yet assigned) */}
          {!assignedManager && !isPending && (
            <div className="space-y-8">
              {/* 3 Step Broadcast Flow */}
              <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold border border-rose-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    How Curated Matching Works
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                    Instant Broadcast & Personal Pairing
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    No directory browsing or waiting days for approvals. Connect directly with our certified Relationship Managers in 3 simple steps:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div className="bg-[#FDFBF9] border border-rose-100 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#7E2248] font-serif font-bold flex items-center justify-center text-sm border border-rose-200">
                      1
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">Click to Connect</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Click the "Connect with Relationship Manager" button. Your matchmaking request is immediately broadcast to all approved Relationship Managers.
                    </p>
                  </div>

                  <div className="bg-[#FDFBF9] border border-rose-100 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-serif font-bold flex items-center justify-center text-sm border border-amber-200">
                      2
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">First RM Claims You</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The first available Relationship Manager accepts and claims your request. All other managers are automatically notified that you are paired.
                    </p>
                  </div>

                  <div className="bg-[#FDFBF9] border border-rose-100 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-serif font-bold flex items-center justify-center text-sm border border-emerald-200">
                      3
                    </div>
                    <h3 className="text-base font-serif font-bold text-slate-900">Curated Offline Dates</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your assigned manager contacts you directly to review your lifestyle and values, and arranges hand-picked 1-on-1 offline date introductions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-slate-900">1-on-1 Dedicated RM</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Personalized consultation with a certified relationship expert devoted to your portfolio.
                  </p>
                </div>

                <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-slate-900">100% Vetted Members</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Zero fake profiles. Every introduction candidate is pre-screened for background and intent.
                  </p>
                </div>

                <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-slate-900">Offline Venue Curation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Relaxed, private table bookings arranged seamlessly at JabWeMeet partner cafes.
                  </p>
                </div>

                <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-amber-700 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-slate-900">Values-First Matching</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Introductions aligned with your long-term goals, mutual life visions, and personality traits.
                  </p>
                </div>
              </div>

              {/* Bottom Large CTA Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-sm">
                <div className="max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-rose-200 text-[#7E2248] text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
                    <span>Instant Certified Matchmaking Dispatch</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                    Ready to Meet Someone Special?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Click below to broadcast your request across all active Relationship Managers. The first manager to claim will be assigned to guide you and curate your offline introductions.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleConnectWithRM}
                    disabled={isConnecting || isPending}
                    className="px-10 py-4 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-70 text-white font-bold text-sm rounded-full shadow-xl shadow-[#7E2248]/25 transition inline-flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting Request...
                      </>
                    ) : (
                      <>
                        <HeartHandshake className="w-5 h-5" /> Connect with Relationship Manager
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
