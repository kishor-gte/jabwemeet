"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Heart,
  Sparkles,
  Phone,
  Clock,
  PhoneCall,
  Loader2,
  HeartHandshake,
  Menu,
  LogOut,
} from "lucide-react";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";
import DashboardSidebar from "../dashboard/components/DashboardSidebar";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/lib/socketUrl";

export default function BreakupBuddyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({
    eventsCount: 0,
    myEventsCount: 0,
    connectionsCount: 0,
    notificationsCount: 0,
  });

  // Calling State
  const [activeCallReqId, setActiveCallReqId] = useState<string | null>(null);
  const [activeCallBuddyId, setActiveCallBuddyId] = useState<string | null>(null);
  const [userIncomingCall, setUserIncomingCall] = useState<{ requestId: string; callerName: string } | null>(null);

  // Connect State
  const [isConnecting, setIsConnecting] = useState(false);

  // Packages State
  const [packages, setPackages] = useState<any[]>([
    {
      id: "pkg-30m",
      name: "30-Minute Support Session",
      price: 299,
      duration: "30 Minutes",
      features: ["1-on-1 Voice Call or Chat", "Compassionate Listening", "Non-judgmental Space", "Instant Connection"]
    },
    {
      id: "pkg-60m",
      name: "60-Minute Deep Healing Pack",
      price: 499,
      duration: "60 Minutes",
      isPopular: true,
      features: ["Full 1-Hour Voice & Chat Support", "Vent & Heal Freely", "Personalized Recovery Tips", "Valid for 7 Days"]
    },
    {
      id: "pkg-week",
      name: "Weekly Unlimited Care Pass",
      price: 1999,
      duration: "7 Days",
      features: ["Unlimited Voice Calls & Daily Chat", "Priority Buddy Matching", "Crisis Emotional Support", "24/7 Availability"]
    }
  ]);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch("/api/services/my-buddy-requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setMyRequests(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = () => {
    fetch("/api/services/packages/breakup-buddy")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
        }
      })
      .catch((e) => console.error("Error fetching dynamic packages:", e));
  };

  useEffect(() => {
    fetchPackages();
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
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
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

  // Real-time socket listener for incoming voice calls
  useEffect(() => {
    if (!currentUser) return;
    const s = io(getSocketUrl(), { withCredentials: true });
    s.on("connect", () => {
      s.emit("join-user-room", currentUser.id);
    });
    s.on("incoming-call", (data) => {
      setUserIncomingCall(data);
    });
    s.on("buddy-request-accepted", () => {
      fetchMyRequests();
    });
    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  const activeConnection =
    myRequests.find((r) => r.status === "Accepted") ||
    myRequests.find((r) => r.status === "Pending") ||
    myRequests[0];
  const isAccepted = activeConnection && activeConnection.status === "Accepted";
  const isPending = activeConnection && activeConnection.status === "Pending";
  const buddyDisplayName =
    activeConnection?.buddy?.displayName ||
    activeConnection?.buddy?.name ||
    "Breakup Buddy";
  const buddyProfilePhoto = activeConnection?.buddy?.profilePhoto;

  // Polling for live acceptance when request is pending
  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      fetchMyRequests();
    }, 3500);
    return () => clearInterval(interval);
  }, [isPending]);

  // Direct Connect Handler (Broadcasts to all Breakup Buddies with 30 mins free chat & call)
  const handleConnectWithBuddy = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (isPending) {
      showToast("⏳ Please wait, a Breakup Buddy is already reviewing your request.");
      return;
    }

    if (isAccepted) {
      showToast("✓ You are already connected with a Breakup Buddy!");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/services/buddy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionFormat: "Both (Chat & Call)",
          notes: "Need emotional support and safe listening",
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchMyRequests();
        showToast("📢 Request sent! Please wait, a Breakup Buddy will accept your request shortly.");
      } else {
        alert(data.message || "Could not submit request.");
      }
    } catch (e) {
      alert("Failed to submit connection request. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Razorpay payment loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyPackage = async (pkg: any) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setIsProcessingPayment(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay payment gateway.");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const targetReqId = activeConnection ? activeConnection.id : "new";

      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: pkg.price,
          currency: "INR",
          type: "BREAKUP_BUDDY_PACKAGE",
          metadata: {
            packageId: pkg.id,
            packageName: pkg.name,
            requestId: targetReqId,
          }
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "Could not initiate payment.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: orderData.keyId || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "JabWeMeet",
        description: pkg.name,
        order_id: orderData.order.id,
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.phone || "",
        },
        theme: {
          color: "#7E2248",
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                type: "BREAKUP_BUDDY_PACKAGE",
                metadata: {
                  packageId: pkg.id,
                  packageName: pkg.name,
                  requestId: targetReqId,
                }
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              fetchMyRequests();
              showToast(`🎉 ${pkg.name} activated successfully!`);
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
            alert("Error verifying payment.");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment initiation error.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-slate-900 font-sans selection:bg-[#7E2248] selection:text-white flex flex-col">
      {/* Voice Call Overlay */}
      {(activeCallReqId || userIncomingCall) && (
        <VoiceCallOverlay
          requestId={activeCallReqId || userIncomingCall?.requestId || ""}
          buddyId={activeCallBuddyId || ""}
          role="USER"
          isInitiator={!userIncomingCall}
          autoAccept={!!userIncomingCall}
          callerName={currentUser?.name || "Member"}
          targetName={userIncomingCall?.callerName || buddyDisplayName}
          onClose={() => {
            setActiveCallReqId(null);
            setActiveCallBuddyId(null);
            setUserIncomingCall(null);
          }}
        />
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-rose-200 text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#7E2248]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-rose-50 transition cursor-pointer"
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
                className="p-2 text-slate-500 hover:text-[#7E2248] rounded-lg transition cursor-pointer"
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
          } else if (sec === "breakup-buddy") {
            router.push("/breakup-buddy");
          } else if (sec === "relationship-manager") {
            router.push("/relationship-manager");
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
        {/* Desktop Top Header Bar with breadcrumbs (No "Back to Dashboard" button) */}
        <div className="bg-white/80 backdrop-blur-md border-b border-rose-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Premium Services</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-900">Breakup Buddy</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnectWithBuddy}
              disabled={isConnecting || isPending || isAccepted}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#7E2248] hover:bg-[#681938] disabled:opacity-60 text-white shadow-md shadow-[#7E2248]/20 transition cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              {isAccepted
                ? `Connected: ${buddyDisplayName}`
                : isPending
                ? "Waiting for Buddy..."
                : "Connect with Breakup Buddy"}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7E2248]" />
              Emotional Wellness Support
            </span>
          </div>
        </div>

      {/* HERO SECTION */}
      <header className="pt-14 pb-14 px-6 text-center relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white border-b border-rose-100">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-[#7E2248]">
            🎁 100% Confidential • First 30 Mins Free Call & Chat
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight font-serif leading-tight">
            Healing Starts with a <span className="text-[#7E2248]">Safe Conversation</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Going through heartbreak, emotional overwhelm, or relationship distress? Connect with a compassionate Breakup Buddy who listens without judgment. Your privacy is 100% protected.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAccepted ? (
              <div className="w-full sm:w-auto px-6 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm rounded-full shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Connected with {buddyDisplayName}
              </div>
            ) : (
              <button
                onClick={handleConnectWithBuddy}
                disabled={isConnecting || isPending}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-70 text-white font-bold text-sm rounded-full shadow-lg shadow-[#7E2248]/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Request...
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Waiting for Buddy to Accept...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" /> Connect with Breakup Buddy
                  </>
                )}
              </button>
            )}

            <a
              href="#packages"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-rose-50 border border-rose-200 text-slate-800 font-semibold text-xs rounded-full shadow-xs transition text-center"
            >
              View Support Packages ↓
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* PENDING WAITING STATE */}
        {isPending && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">We are assigning you with a Breakup Buddy</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Please wait, your request has been sent to our Breakup Buddy team. Once a Breakup Buddy accepts your request, you can freely chat or make a voice call during your 30 minutes free session.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-xs font-semibold text-amber-900 animate-pulse">
              ⏳ Assigning your Breakup Buddy... Please wait.
            </div>
          </div>
        )}

        {/* ACCEPTED ACTIVE SESSION CARD */}
        {isAccepted && (
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-rose-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#7E2248] to-[#9B2C59] border border-rose-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {buddyProfilePhoto ? (
                    <img
                      src={
                        buddyProfilePhoto.startsWith("http") || buddyProfilePhoto.startsWith("/") || buddyProfilePhoto.startsWith("data:")
                          ? buddyProfilePhoto
                          : `/uploads/${buddyProfilePhoto}`
                      }
                      alt={buddyDisplayName}
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
                      buddyProfilePhoto ? "hidden" : "flex"
                    } items-center justify-center`}
                  >
                    {buddyDisplayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Online & Connected" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800">
                      ✓ Connected with {buddyDisplayName}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                    Active Session with {buddyDisplayName}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1">
                    Your 30 minutes free session is active. You can freely call or chat with {buddyDisplayName} below.
                  </p>
                </div>
              </div>

              {/* Free Minutes / Package Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3.5 py-2 bg-[#FDFBF9] border border-rose-100 rounded-2xl text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Free Chat</div>
                  <div className="text-sm font-bold text-[#7E2248]">
                    {activeConnection.hasActivePackage ? "Unlimited" : `${activeConnection.chatMinutesLeft || 30}m Left`}
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-[#FDFBF9] border border-rose-100 rounded-2xl text-center min-w-[90px]">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Free Call</div>
                  <div className="text-sm font-bold text-[#7E2248]">
                    {activeConnection.hasActivePackage ? "Unlimited" : `${activeConnection.callMinutesLeft || 30}m Left`}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Chat and Call */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Link
                href="/messages"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold rounded-2xl shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" /> Open Chat with {buddyDisplayName}
              </Link>

              <button
                onClick={() => {
                  setActiveCallReqId(activeConnection.id);
                  setActiveCallBuddyId(activeConnection.buddyId);
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-xs transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" /> Start Voice Call with {buddyDisplayName}
              </button>
            </div>
          </div>
        )}

        {/* 3 CORE PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-rose-100 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center text-xl">
              🎁
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">First 30 Mins Free</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every connection starts with 30 minutes of free call and chat support so you can talk freely without hesitation.
            </p>
          </div>

          <div className="p-6 bg-white border border-rose-100 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center text-xl">
              🛡️
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">100% Confidential</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All conversations and identities are completely private and confidential. No real names are ever exposed.
            </p>
          </div>

          <div className="p-6 bg-white border border-rose-100 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center text-xl">
              ⚡
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">Instant Team Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your connection request is dispatched immediately to our Breakup Buddy network for the fastest response.
            </p>
          </div>
        </div>

        {/* PACKAGES SECTION */}
        <section id="packages" className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#7E2248] uppercase tracking-wider">Session Plans</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">Breakup Buddy Packages</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              {isAccepted
                ? `Completed your 30-min free session? Choose a package to keep speaking with ${buddyDisplayName} anytime.`
                : "Completed your 30-min free session? Choose a package to keep speaking with your Breakup Buddy anytime."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-8 rounded-3xl bg-white transition duration-300 flex flex-col justify-between space-y-6 ${
                  pkg.isPopular
                    ? "border-2 border-[#7E2248] shadow-xl shadow-[#7E2248]/10 relative"
                    : "border border-rose-100 hover:border-rose-200 shadow-sm"
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#7E2248] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold text-slate-900">{pkg.name}</h3>
                    <Clock className="w-4 h-4 text-[#7E2248]" />
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-slate-900">₹{pkg.price}</span>
                    <span className="text-xs text-slate-500">/ {pkg.duration}</span>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-rose-100 text-xs text-slate-600">
                    {pkg.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleBuyPackage(pkg)}
                  disabled={isProcessingPayment}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    pkg.isPopular
                      ? "bg-[#7E2248] hover:bg-[#681938] text-white shadow-[#7E2248]/20"
                      : "bg-[#FAF3F6] hover:bg-rose-100/70 text-slate-800 border border-rose-200"
                  }`}
                >
                  {isProcessingPayment ? "Processing..." : `Buy Package (₹${pkg.price})`}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
