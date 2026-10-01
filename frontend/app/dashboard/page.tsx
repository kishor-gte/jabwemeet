"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, LogOut, ShieldCheck, AlertCircle, RefreshCw, Megaphone, X, ArrowLeft, Shield } from "lucide-react";

import DashboardSidebar from "./components/DashboardSidebar";
import DashboardHeader from "./components/DashboardHeader";
import QuickStats from "./components/QuickStats";
import ProfileCompletionCard from "./components/ProfileCompletionCard";
import { calculateProfileStrength } from "./components/profile/profileStrength";
import UpcomingEventsSection, { EventItem } from "./components/UpcomingEventsSection";
import ExperiencesSection from "./components/ExperiencesSection";
import PremiumServicesSection from "./components/PremiumServicesSection";
import ConnectionsSection, { ConnectionItem } from "./components/ConnectionsSection";
import ActivityFeed from "./components/ActivityFeed";
import MyEventsView from "./components/MyEventsView";
import ProfileView from "./components/ProfileView";
import MessagesView from "./components/MessagesView";
import NotificationsView from "./components/NotificationsView";
import PaymentsView from "./components/PaymentsView";
import SettingsView from "./components/SettingsView";
import CallHistoryView from "./components/CallHistoryView";
import PackagesView from "./components/PackagesView";

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

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  sentBy: string;
  sentAt: string;
}

interface BookingRecordItem {
  eventId?: string;
  spots?: number;
  event?: {
    id: string;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    description?: string;
    code?: string;
    reason?: string;
    step?: string;
    source?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (resp: RazorpayFailureResponse) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

type WindowWithRazorpay = Window & typeof globalThis & {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic user & event state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navigation & Interactive states
  const urlTab = searchParams.get("tab");
  const [internalSection, setInternalSection] = useState<string | null>(null);
  const activeSection = internalSection || urlTab || "dashboard";

  const setActiveSection = (sec: string) => {
    setInternalSection(sec);
    window.history.replaceState(null, "", `/dashboard?tab=${sec}`);
  };
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [userBookedSpotsMap, setUserBookedSpotsMap] = useState<Record<string, number>>({});
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [messageAnnouncements, setMessageAnnouncements] = useState<AnnouncementItem[]>([]);
  const [serviceRequests, setServiceRequests] = useState<{
    relationshipManager: boolean;
    breakupBuddy: boolean;
  }>({ relationshipManager: false, breakupBuddy: false });
  const [assignedManager, setAssignedManager] = useState<{
    id: string;
    name: string;
    city: string | null;
    email: string;
    phone: string;
  } | null>(null);
  const [latestMatchmakingRequest, setLatestMatchmakingRequest] = useState<{
    id: string;
    goal: string;
    managerName: string | null;
    status: "New" | "Approved" | "Rejected";
  } | null>(null);
  const [toast, setToast] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [profileTargetSection, setProfileTargetSection] = useState<string | null>(null);

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
            } catch {
              setUser(data.user);
            }
          } else {
            setUser(data.user);
          }

          // Load user-specific interactive state
          try {
            const bookingRes = await fetch("/api/events/my-bookings", { credentials: "include" });
            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              if (bookingData.success && Array.isArray(bookingData.bookings)) {
                const dbIds = bookingData.bookings.map((b: BookingRecordItem) => b.eventId || b.event?.id);
                setRegisteredEventIds(dbIds);
                const sMap: Record<string, number> = {};
                bookingData.bookings.forEach((b: BookingRecordItem) => {
                  const evId = b.eventId || b.event?.id;
                  if (evId) sMap[evId] = b.spots || 1;
                });
                setUserBookedSpotsMap(sMap);
                localStorage.setItem(`jwm_rsvps_${data.user.id}`, JSON.stringify(dbIds));
                localStorage.setItem(`jwm_spots_${data.user.id}`, JSON.stringify(sMap));
              }
            } else {
              const savedRsvps = localStorage.getItem(`jwm_rsvps_${data.user.id}`);
              if (savedRsvps) {
                setRegisteredEventIds(JSON.parse(savedRsvps));
              }
              const savedSpots = localStorage.getItem(`jwm_spots_${data.user.id}`);
              if (savedSpots) {
                try { setUserBookedSpotsMap(JSON.parse(savedSpots)); } catch {}
              }
            }
          } catch {
            const savedRsvps = localStorage.getItem(`jwm_rsvps_${data.user.id}`);
            if (savedRsvps) {
              try { setRegisteredEventIds(JSON.parse(savedRsvps)); } catch {}
            }
          }

          // Load real-time connections from backend
          try {
            const connRes = await fetch("/api/auth/connections", {
              credentials: "include",
            });
            if (connRes.ok) {
              const connData = await connRes.json();
              if (connData.success && Array.isArray(connData.connections)) {
                setConnections(connData.connections);
              }
            }
          } catch {}

          // Load real-time matchmaking status from backend
          try {
            const rmRes = await fetch("/api/services/my-matchmaking-requests", {
              credentials: "include",
            });
            if (rmRes.ok) {
              const rmData = await rmRes.json();
              if (rmData?.success) {
                setAssignedManager(rmData.assignedManager || null);
                setLatestMatchmakingRequest(rmData.latestRequest || null);
                if (rmData.assignedManager || rmData.latestRequest?.status === "New") {
                  setServiceRequests((prev) => ({ ...prev, relationshipManager: true }));
                } else if (rmData.latestRequest?.status === "Rejected") {
                  setServiceRequests((prev) => ({ ...prev, relationshipManager: false }));
                }
              }
            }
          } catch {}
        } else {
          router.replace("/login");
          return;
        }

        // Fetch real database events ONLY (no dummy events)
        try {
          const eventRes = await fetch("/api/events");
          if (eventRes.ok) {
            const eventData = await eventRes.json();
            if (eventData.success && Array.isArray(eventData.events)) {
              setEvents(eventData.events);
            } else {
              setEvents([]);
            }
          } else {
            setEvents([]);
          }
        } catch {
          setEvents([]);
        }

        // Fetch platform announcements & broadcasts
        try {
          const notifRes = await fetch("/api/notifications");
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            if (notifData.success && Array.isArray(notifData.announcements)) {
              setAnnouncements(notifData.announcements);
            }
          }
        } catch {}
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Unable to load dashboard data right now. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/auth/messages/unread?t=${Date.now()}`, { 
          credentials: "include",
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
          }
        });
        const data = await res.json();
        if (data.success) {
          setUnreadMessagesCount(data.count);
          if (data.senders && data.senders.length > 0) {
            const msgs = data.senders.map((senderName: string, idx: number) => ({
              id: `unread-msg-${idx}`,
              title: `New Message from ${senderName}`,
              message: `You got a message from ${senderName}, please open that check it out.`,
              type: 'MESSAGE',
              targetAudience: 'USER',
              sentBy: 'System',
              sentAt: new Date().toISOString()
            }));
            setMessageAnnouncements(msgs);
          } else {
            setMessageAnnouncements([]);
          }
        }
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 3000); // Polling faster for better UX
    return () => clearInterval(interval);
  }, [user]);


  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    router.replace("/");
  }

  // Handle Dynamic User Profile Updates
  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    try {
      localStorage.setItem(`jwm_user_overrides_${user.id}`, JSON.stringify(updatedFields));
    } catch {}
  };

  // Helper to dynamically load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      const win = window as WindowWithRazorpay;
      if (typeof window !== "undefined" && win.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        if (win.Razorpay) return resolve(true);
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Helper to reload user bookings
  const reloadBookings = async () => {
    try {
      const res = await fetch("/api/events/my-bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings)) {
          const ids = data.bookings.map((b: BookingRecordItem) => b.eventId || b.event?.id);
          setRegisteredEventIds(ids);
          const sMap: Record<string, number> = {};
          data.bookings.forEach((b: BookingRecordItem) => {
            const evId = b.eventId || b.event?.id;
            if (evId) sMap[evId] = b.spots || 1;
          });
          setUserBookedSpotsMap(sMap);
          if (user) {
            localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(ids));
            localStorage.setItem(`jwm_spots_${user.id}`, JSON.stringify(sMap));
          }
        }
      }
    } catch {}
  };

  // Handle Event Ticket Booking (Complimentary or Razorpay Paid)
  const handleRegisterEvent = async (evt: EventItem, spots: number = 1) => {
    if (!user) {
      alert("Please log in to book tickets for this event.");
      router.push("/login");
      return;
    }
    const ticketCount = Math.max(1, spots);

    // Free event path
    if (!evt.price || evt.price <= 0) {
      try {
        const res = await fetch(`/api/events/${evt.id}/book`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spots: ticketCount }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          const updated = Array.from(new Set([...registeredEventIds, evt.id]));
          setRegisteredEventIds(updated);
          setUserBookedSpotsMap((prev) => ({
            ...prev,
            [evt.id]: (prev[evt.id] || 0) + ticketCount,
          }));
          setEvents((prev) =>
            prev.map((e) =>
              e.id === evt.id
                ? { ...e, confirmedBookings: (e.confirmedBookings ?? 0) + ticketCount }
                : e
            )
          );
          try {
            localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(updated));
          } catch {}
          setToast({ text: `🎉 Confirmed ${ticketCount} ${ticketCount === 1 ? 'seat' : 'seats'} for "${evt.title}"!`, type: 'success' });
          setTimeout(() => setToast(null), 4500);
          reloadBookings();
        } else {
          setToast({ text: data.message || "Failed to reserve spot.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
        }
      } catch (err) {
        console.error("Free booking error:", err);
        setToast({ text: "Failed to connect to server. Please try again.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
      }
      return;
    }

    // Paid event path via Razorpay
    const loaded = await loadRazorpay();
    if (!loaded) {
      setToast({ text: "Razorpay checkout failed to load. Please verify your internet connection.", type: 'error' });
      setTimeout(() => setToast(null), 4500);
      return;
    }

    try {
      const orderRes = await fetch(`/api/events/${evt.id}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spots: ticketCount }),
        credentials: "include",
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setToast({ text: orderData.message || "Failed to create payment order.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
        return;
      }

      if (orderData.free) {
        const updated = Array.from(new Set([...registeredEventIds, evt.id]));
        setRegisteredEventIds(updated);
        setUserBookedSpotsMap((prev) => ({ ...prev, [evt.id]: (prev[evt.id] || 0) + ticketCount }));
        setEvents((prev) =>
          prev.map((e) =>
            e.id === evt.id
              ? { ...e, confirmedBookings: (e.confirmedBookings ?? 0) + ticketCount }
              : e
          )
        );
        setToast({ text: `🎉 Confirmed ${ticketCount} seat(s) for "${evt.title}"!`, type: 'success' });
        setTimeout(() => setToast(null), 4500);
        reloadBookings();
        return;
      }

      // Handle development / mock order fallback
      if (orderData.order?.id?.startsWith("order_mock_")) {
        const verifyRes = await fetch(`/api/events/${evt.id}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.order.id,
            razorpay_payment_id: "pay_mock_" + Date.now(),
            razorpay_signature: "mock_signature",
            spots: ticketCount,
          }),
          credentials: "include",
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          const updated = Array.from(new Set([...registeredEventIds, evt.id]));
          setRegisteredEventIds(updated);
          setUserBookedSpotsMap((prev) => ({
            ...prev,
            [evt.id]: (prev[evt.id] || 0) + ticketCount,
          }));
          setEvents((prev) =>
            prev.map((e) =>
              e.id === evt.id
                ? { ...e, confirmedBookings: (e.confirmedBookings ?? 0) + ticketCount }
                : e
            )
          );
          try {
            localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(updated));
          } catch {}
          setToast({
            text: `🎉 Payment verified! ${ticketCount} ${ticketCount === 1 ? 'seat' : 'seats'} secured for "${evt.title}".`,
            type: 'success',
          });
          setTimeout(() => setToast(null), 4500);
          reloadBookings();
        } else {
          setToast({ text: verifyData.message || "Payment verification failed.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
        }
        return;
      }

      const options: RazorpayOptions = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "JabWeMeet",
        description: `${ticketCount} Ticket(s) — ${evt.title}`,
        order_id: orderData.order.id,
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            const verifyRes = await fetch(`/api/events/${evt.id}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                spots: ticketCount,
              }),
              credentials: "include",
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const updated = Array.from(new Set([...registeredEventIds, evt.id]));
              setRegisteredEventIds(updated);
              setUserBookedSpotsMap((prev) => ({
                ...prev,
                [evt.id]: (prev[evt.id] || 0) + ticketCount,
              }));
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === evt.id
                    ? { ...e, confirmedBookings: (e.confirmedBookings ?? 0) + ticketCount }
                    : e
                )
              );
              try {
                localStorage.setItem(`jwm_rsvps_${user.id}`, JSON.stringify(updated));
              } catch {}
              setToast({ text: `🎉 Payment verified! ${ticketCount} ${ticketCount === 1 ? 'seat' : 'seats'} secured for "${evt.title}".`, type: 'success' });
              setTimeout(() => setToast(null), 4500);
              reloadBookings();
            } else {
              setToast({ text: verifyData.message || "Payment verification failed.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
            }
          } catch (verErr) {
            console.error("Payment verification error:", verErr);
            setToast({ text: "Error confirming payment. Please contact support.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: "#7E2248",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment window closed without completion.");
          },
        },
      };

      const win = window as WindowWithRazorpay;
      if (win.Razorpay) {
        const paymentObj = new win.Razorpay(options);
        paymentObj.on("payment.failed", function (resp: RazorpayFailureResponse) {
          alert(resp.error?.description || "Payment failed or cancelled");
        });
        paymentObj.open();
      }
    } catch (err) {
      console.error("Booking error:", err);
      setToast({ text: "Failed to initiate payment. Please try again.", type: 'error' });
          setTimeout(() => setToast(null), 4500);
    }
  };


  // Handle Update Connection
  const handleUpdateConnection = async (id: string, action: "Approve" | "Reject") => {
    try {
      const res = await fetch(`/api/auth/connections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setConnections(connections.map(c => c.id === id ? { ...c, ...data.connection } : c));
        setToast({ text: action === 'Approve' ? 'Connection Approved!' : 'Passed on connection.', type: 'success' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Requesting Premium Services
  const handleRequestService = (service: "relationshipManager" | "breakupBuddy") => {
    if (!user) return;
    const updated = { ...serviceRequests, [service]: true };
    setServiceRequests(updated);
    try {
      localStorage.setItem(`jwm_services_${user.id}`, JSON.stringify(updated));
    } catch {}

    const serviceName =
      service === "relationshipManager" ? "Relationship Manager" : "Breakup Buddy";
    setToast({ text: `Request submitted for ${serviceName}! A specialist will reach out.`, type: 'success' });
    setTimeout(() => setToast(null), 4500);
  };

  // Calculate profile completion percentage dynamically using unified profile strength model
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    return calculateProfileStrength(user).percentage;
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // SKELETON LOADING STATE
  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  // ERROR STATE
  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white border border-rose-100 p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">Unable to load dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {error || "Your session could not be verified. Please try again."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-semibold shadow-md shadow-[#7E2248]/20 transition transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => router.replace("/login")}
              className="px-6 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 text-xs font-semibold transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const registeredEvents = events
    .filter((e) => registeredEventIds.includes(e.id))
    .map((e) => ({
      ...e,
      bookedSpots: userBookedSpotsMap[e.id] || 1,
    }));
  const eventsWithUserSpots = events.map((e) => ({
    ...e,
    bookedSpots: userBookedSpotsMap[e.id] || 1,
  }));
  const localEvents = eventsWithUserSpots.filter(
    (e) => (e.city || "").toLowerCase() === (user.city || "").toLowerCase()
  );
  const completionPercentage = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-slate-800 font-sans selection:bg-[#7E2248] selection:text-white flex flex-col">
      {/* Dynamic Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-medium text-xs shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-600 shadow-emerald-600/30 border-emerald-500' : 'bg-rose-600 shadow-rose-600/30 border-rose-500'}`}>
            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 shrink-0 font-bold text-center leading-4">!</div>}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Mobile Topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-[#7E2248] hover:bg-rose-50 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7E2248] to-[#5c1331] flex items-center justify-center font-extrabold text-white text-sm shadow-sm">
              J
            </div>
            <span className="font-serif font-bold text-base tracking-tight text-slate-900">
              Jab<span className="text-[#7E2248]">We</span>Meet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 hidden sm:inline truncate max-w-[120px]">
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-lg transition"
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
        notificationsCount={
          registeredEvents.length +
          announcements.length +
          messageAnnouncements.length +
          (serviceRequests.relationshipManager ? 1 : 0) +
          (serviceRequests.breakupBuddy ? 1 : 0)
        }
        unreadMessagesCount={unreadMessagesCount}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          window.history.replaceState(null, "", `/dashboard?tab=${sec}`);
        }}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10 flex-1">
          {/* Admin Mode Top Banner & Back Navigation (Exclusively for Admins) */}
          {user.role === "ADMIN" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-rose-50/50 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-[#7E2248] flex items-center justify-center shrink-0 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Administrator Preview Mode</span>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] border border-rose-200">
                      SUPER_ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    You are previewing the member dashboard as an administrator. You can return to the control center anytime.
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs shadow-md shadow-[#7E2248]/20 transition shrink-0 group transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Admin Dashboard</span>
              </Link>
            </div>
          )}
          {/* TAB 1: MAIN DASHBOARD OVERVIEW */}
          {activeSection === "dashboard" && (
            <>
              {/* Broadcast Announcement Banner */}
              {announcements.length > 0 && !dismissedAnnouncement && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border border-amber-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0 shadow-sm">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 tracking-wider">
                          Platform Announcement
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(announcements[0].sentAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-bold text-slate-900 mt-1">
                        {announcements[0].title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {announcements[0].message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setActiveSection("notifications");
                        window.history.replaceState(null, "", "/dashboard?tab=notifications");
                      }}
                      className="text-xs font-bold text-amber-900 hover:text-amber-950 px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 transition cursor-pointer"
                    >
                      View in Notifications
                    </button>
                    <button
                      onClick={() => setDismissedAnnouncement(true)}
                      title="Dismiss announcement banner"
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-amber-100/60 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

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
                  setActiveSection("events");
                  window.history.replaceState(null, "", "/dashboard?tab=events");
                }}
                onViewLocalEvents={() => {
                  setActiveSection("events");
                  window.history.replaceState(null, "", "/dashboard?tab=events");
                }}
                onViewConnections={() => {
                  setActiveSection("connections");
                  window.history.replaceState(null, "", "/dashboard?tab=connections");
                }}
                onViewProfile={() => {
                  setActiveSection("profile");
                  window.history.replaceState(null, "", "/dashboard?tab=profile");
                }}
              />

              {/* Dynamic Profile Completion Section */}
              <ProfileCompletionCard
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigateSection={(sectionId) => {
                  setProfileTargetSection(sectionId);
                  setActiveSection("profile");
                  window.history.replaceState(null, "", "/dashboard?tab=profile");
                  setTimeout(() => {
                    const el = document.getElementById(`section-${sectionId}`);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 150);
                }}
              />

              {/* Dynamic Upcoming Events Section */}
              <UpcomingEventsSection
                events={eventsWithUserSpots}
                userCity={user.city}
                userName={user.name}
                registeredEventIds={registeredEventIds}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onRegisterEvent={handleRegisterEvent}
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
                assignedManager={assignedManager}
                latestMatchmakingRequest={latestMatchmakingRequest}
                onRequestService={handleRequestService}
              />

              {/* Dynamic Connections Section */}
              <ConnectionsSection
                userId={user.id}
                connections={connections}
                userCity={user.city}
                registeredEventsCount={registeredEvents.length}
                onExploreEvents={() => scrollToElement("events")}
                onUpdateConnection={handleUpdateConnection}
                onChat={(connId) => {
                  window.history.replaceState(null, "", `/dashboard?tab=messages&requestId=${connId}`);
                  setActiveSection("messages");
                }}
              />

              {/* Dynamic Activity & Notifications */}
              <ActivityFeed
                userCreatedAt={user.createdAt}
                userName={user.name}
                profilePercentage={completionPercentage}
                registeredEvents={registeredEvents}
                serviceRequests={serviceRequests}
                connectionRequestsCount={connections.length}
                announcements={[...messageAnnouncements, ...announcements]}
                onViewAllNotifications={() => {
                  setActiveSection("notifications");
                  window.history.replaceState(null, "", "/dashboard?tab=notifications");
                }}
              />
            </>
          )}

          {/* TAB 2: DISCOVER EVENTS */}
          {activeSection === "events" && (
            <UpcomingEventsSection
              events={eventsWithUserSpots}
              userCity={user.city}
              userName={user.name}
              registeredEventIds={registeredEventIds}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              onRegisterEvent={handleRegisterEvent}
              onExploreClick={() => {
                setActiveSection("dashboard");
                window.history.replaceState(null, "", "/dashboard");
              }}
            />
          )}

          {/* TAB 3: MY EVENTS */}
          {activeSection === "my-events" && (
            <MyEventsView
              registeredEvents={registeredEvents}
              userName={user.name}
              onExploreEvents={() => {
                setActiveSection("events");
                window.history.replaceState(null, "", "/dashboard?tab=events");
              }}
            />
          )}

          {/* TAB 4: MY CONNECTIONS */}
          {activeSection === "connections" && (
            <ConnectionsSection
              userId={user.id}
              connections={connections}
              userCity={user.city}
              registeredEventsCount={registeredEvents.length}
              onExploreEvents={() => {
                setActiveSection("events");
                window.history.replaceState(null, "", "/dashboard?tab=events");
              }}
              onUpdateConnection={handleUpdateConnection}
              onChat={(connId) => {
                window.history.replaceState(null, "", `/dashboard?tab=messages&requestId=${connId}`);
                setActiveSection("messages");
              }}
            />
          )}

          {/* TAB 5: PROFILE */}
          {activeSection === "profile" && (
            <ProfileView
              user={user}
              onUpdateUser={handleUpdateUser}
              targetSection={profileTargetSection}
            />
          )}

          {/* TAB 6: MESSAGES */}
          {activeSection === "messages" && (
            <MessagesView userName={user.name} userId={user.id} connections={connections} />
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <NotificationsView
              registeredEvents={registeredEvents}
              hasRelationshipManagerReq={serviceRequests.relationshipManager}
              hasBreakupBuddyReq={serviceRequests.breakupBuddy}
              announcements={[...messageAnnouncements, ...announcements]}
            />
          )}

          {/* TAB 8: PAYMENTS */}
          {activeSection === "payments" && (
            <PaymentsView
              registeredEvents={registeredEvents}
              userName={user.name}
            />
          )}

          {/* TAB 9: SETTINGS */}
          {activeSection === "settings" && (
            <SettingsView
              userEmail={user.email}
              onLogout={handleLogout}
            />
          )}

          {/* TAB 10: CALL HISTORY */}
          {activeSection === "call-history" && (
            <CallHistoryView />
          )}

          {/* TAB 11: PACKAGES */}
          {activeSection === "packages" && (
            <PackagesView user={user} />
          )}
        </main>

        {/* Dynamic Footer */}
        <footer className="border-t border-rose-100/80 py-6 px-8 text-center text-xs text-slate-500">
          <p>
            JabWeMeet Member Portal • Real People. Real Places. Real Connections. Active in {user.city} and nationwide.
          </p>
        </footer>
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFBF9] text-slate-800 flex flex-col font-sans">
      <div className="h-16 border-b border-rose-100 bg-white px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100/70 animate-pulse" />
          <div className="w-28 h-5 rounded-md bg-rose-100/70 animate-pulse" />
        </div>
        <div className="w-20 h-8 rounded-full bg-rose-100/70 animate-pulse" />
      </div>

      <div className="flex-1 flex">
        <div className="hidden lg:block w-72 border-r border-rose-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="w-full h-9 rounded-2xl bg-rose-50 animate-pulse" />
          <div className="w-full h-9 rounded-2xl bg-rose-50 animate-pulse" />
          <div className="w-full h-9 rounded-2xl bg-rose-50 animate-pulse" />
          <div className="w-full h-9 rounded-2xl bg-rose-50 animate-pulse" />
        </div>

        <div className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl mx-auto w-full">
          <div className="h-44 rounded-3xl bg-white border border-rose-100 shadow-sm animate-pulse p-8 space-y-4">
            <div className="w-32 h-6 rounded-full bg-rose-100/70" />
            <div className="w-64 h-8 rounded-lg bg-rose-100/70" />
            <div className="w-96 h-4 rounded-md bg-rose-50" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-rose-100 shadow-sm animate-pulse p-4" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-rose-100 shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

