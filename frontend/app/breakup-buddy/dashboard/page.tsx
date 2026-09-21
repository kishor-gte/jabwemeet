"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BuddyMessagesTab from "./BuddyMessagesTab";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";
import { io, Socket } from "socket.io-client";

export default function BreakupBuddyDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  // Call State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ requestId: string, callerName: string, autoAccept?: boolean } | null>(null);
  const [callWaiting, setCallWaiting] = useState<{ requestId: string, callerName: string, autoAccept?: boolean } | null>(null);

  // Profile Settings State
  const [settingsActiveTab, setSettingsActiveTab] = useState<"profile" | "specialties" | "account">("profile");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLanguageInput, setCustomLanguageInput] = useState("");
  const [areasOfExpertise, setAreasOfExpertise] = useState<string[]>([]);
  const [sessionTypes, setSessionTypes] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeStart, setAvailableTimeStart] = useState("");
  const [availableTimeEnd, setAvailableTimeEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Availability & Schedule Dynamic States
  const [isAvailableForRequests, setIsAvailableForRequests] = useState<boolean>(true);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([
    { day: "Monday", slots: ["10:00 AM — 01:00 PM", "06:00 PM — 10:00 PM"] },
    { day: "Tuesday", slots: ["10:00 AM — 01:00 PM"] },
    { day: "Wednesday", slots: ["06:00 PM — 10:00 PM"] },
    { day: "Thursday", slots: [] },
    { day: "Friday", slots: [] },
    { day: "Saturday", slots: [] },
    { day: "Sunday", slots: [] },
  ]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockDate, setNewBlockDate] = useState<string>("");
  const [savingAvailability, setSavingAvailability] = useState<boolean>(false);
  const [addingSlotDay, setAddingSlotDay] = useState<string | null>(null);
  const [slotStartTime, setSlotStartTime] = useState<string>("10:00 AM");
  const [slotEndTime, setSlotEndTime] = useState<string>("01:00 PM");
  // Notifications Dynamic State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [selectedChatRequestId, setSelectedChatRequestId] = useState<string | undefined>(undefined);

  const handleNotificationClick = (notif: any) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setShowNotificationsDropdown(false);
    if (notif.targetRequestId) {
      setSelectedChatRequestId(notif.targetRequestId);
    }
    if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
  };

  // Real Data States
  const [dashboardData, setDashboardData] = useState<{
    newRequests: number;
    upcomingSessions: number;
    completedSessions: number;
    totalEarnings?: number;
  }>({ newRequests: 0, upcomingSessions: 0, completedSessions: 0, totalEarnings: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [acceptedUsers, setAcceptedUsers] = useState<any[]>([]);
  const [acceptedSearch, setAcceptedSearch] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [buddyActiveCall, setBuddyActiveCall] = useState<{ requestId: string; targetUserId: string; targetName?: string; callerName: string } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, sessions: [] });
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [requestFilter, setRequestFilter] = useState<"all" | "Pending" | "Accepted" | "Rejected">("all");
  const [isRefreshingLogs, setIsRefreshingLogs] = useState<boolean>(false);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false);
  const [isRefreshingReviews, setIsRefreshingReviews] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "hourly" | "session">("all");
  const [reviewsSearch, setReviewsSearch] = useState<string>("");
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | "all">("all");
  const [reviewsSort, setReviewsSort] = useState<"newest" | "highest" | "lowest">("newest");

  // Pagination States for Tabs
  const [requestsPage, setRequestsPage] = useState<number>(1);
  const [acceptedPage, setAcceptedPage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [callLogsPage, setCallLogsPage] = useState<number>(1);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [earningsPage, setEarningsPage] = useState<number>(1);

  const REQUESTS_PER_PAGE = 5;
  const ACCEPTED_PER_PAGE = 6;
  const HISTORY_PER_PAGE = 5;
  const CALL_LOGS_PER_PAGE = 6;
  const REVIEWS_PER_PAGE = 5;
  const EARNINGS_PER_PAGE = 6;

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    itemsPerPage: number,
    onPageChange: (p: number) => void,
    label: string
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (totalPages <= 1) return null;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return (
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm text-xs">
        <span className="text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{startIndex + 1}</span>–<span className="font-bold text-slate-800">{endIndex}</span> of <span className="font-bold text-slate-800">{totalItems}</span> {label}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
              if (p === 2 || p === totalPages - 1) {
                return <span key={p} className="px-1 text-slate-400">...</span>;
              }
              return null;
            }
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentPage === p
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  const handleRefreshCallLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const res = await fetch("/api/buddy/call-logs", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCallLogs(data.data);
      }
    } catch (e) {
      console.error("Failed to refresh call logs:", e);
    } finally {
      setTimeout(() => setIsRefreshingLogs(false), 300);
    }
  };

  const handleRefreshHistory = async () => {
    setIsRefreshingHistory(true);
    try {
      const res = await fetch("/api/buddy/history", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistory(data.data);
      }
    } catch (e) {
      console.error("Failed to refresh history:", e);
    } finally {
      setTimeout(() => setIsRefreshingHistory(false), 300);
    }
  };

  const handleRefreshReviews = async () => {
    setIsRefreshingReviews(true);
    try {
      const res = await fetch("/api/buddy/reviews", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (e) {
      console.error("Failed to refresh reviews:", e);
    } finally {
      setTimeout(() => setIsRefreshingReviews(false), 300);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/buddy/availability", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) {
        if (typeof data.data.isAvailableForRequests === "boolean") {
          setIsAvailableForRequests(data.data.isAvailableForRequests);
        }
        if (Array.isArray(data.data.weeklySchedule) && data.data.weeklySchedule.length > 0) {
          setWeeklySchedule(data.data.weeklySchedule);
        }
        if (Array.isArray(data.data.blockedDates)) {
          setBlockedDates(data.data.blockedDates);
        }
      }
    } catch (e) {}
  };

  const handleSaveAvailability = async (updatedFields?: any) => {
    setSavingAvailability(true);
    setActionMessage(null);
    try {
      const payload = {
        isAvailableForRequests: updatedFields?.isAvailableForRequests !== undefined ? updatedFields.isAvailableForRequests : isAvailableForRequests,
        weeklySchedule: updatedFields?.weeklySchedule !== undefined ? updatedFields.weeklySchedule : weeklySchedule,
        blockedDates: updatedFields?.blockedDates !== undefined ? updatedFields.blockedDates : blockedDates,
      };
      const res = await fetch("/api/buddy/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: "✓ Availability schedule updated successfully!", type: "success" });
        if (data.data) {
          if (typeof data.data.isAvailableForRequests === "boolean") setIsAvailableForRequests(data.data.isAvailableForRequests);
          if (Array.isArray(data.data.weeklySchedule)) setWeeklySchedule(data.data.weeklySchedule);
          if (Array.isArray(data.data.blockedDates)) setBlockedDates(data.data.blockedDates);
        }
      } else {
        setActionMessage({ text: data.message || "Failed to update availability", type: "error" });
      }
    } catch (e) {
      setActionMessage({ text: "Error saving availability", type: "error" });
    } finally {
      setSavingAvailability(false);
    }
  };

  const fetchData = async () => {
    fetchAvailability();
    try {
      const [dashRes, reqRes, accRes, sessRes, histRes, revRes, earnRes, callLogRes] = await Promise.all([
        fetch('/api/buddy/dashboard', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/requests', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/accepted-users', { credentials: 'include' }).then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/buddy/sessions', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/history', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/reviews', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/earnings', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/buddy/call-logs', { credentials: 'include' }).then(r => r.json()).catch(() => ({ success: false })),
      ]);
      if (dashRes.success) setDashboardData(dashRes.data);
      if (reqRes.success) {
        setRequests(reqRes.data);
        if (!accRes?.success) {
          setAcceptedUsers(reqRes.data.filter((r: any) => r.status === "Accepted"));
        }
      }
      if (accRes?.success) setAcceptedUsers(accRes.data);
      if (sessRes.success) setSessions(sessRes.data);
      if (histRes.success) setHistory(histRes.data);
      if (revRes.success) setReviews(revRes.data);
      if (earnRes.success) setEarnings(earnRes.data);
      if (callLogRes?.success && Array.isArray(callLogRes.data)) setCallLogs(callLogRes.data);
    } catch(e) {}
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const s = io("http://localhost:5001", { withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
      s.emit("join-buddy-room", user.id);
    });

    s.on("user-entered-chat", (data) => {
      const uName = data.userName || "User";
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: "User in Chat",
        message: data.message || `Hey, your user ${uName} is in chat! Go and talk with them.`,
        timestamp: "Just now",
        read: false,
        targetTab: "Messages",
        targetRequestId: data.requestId,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    s.on("incoming-call", (data) => {
      const caller = data.callerName || "User";
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: "Incoming Voice Call",
        message: `Incoming voice call from ${caller}.`,
        timestamp: "Just now",
        read: false,
        targetTab: "Call Log",
        targetRequestId: data.requestId,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      setIncomingCall((currentCall) => {
        if (currentCall) {
          if (currentCall.requestId === data.requestId) {
            // Same call event duplicate, ignore
            return currentCall;
          }
          // Buddy is ALREADY on a call with a different user, set call waiting for 2nd caller
          setCallWaiting(data);
          return currentCall;
        }
        return data; // set first incoming call
      });
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  // Play gentle beep when call waiting arrives
  useEffect(() => {
    if (callWaiting) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime); // higher pitch soft beep
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05); // quiet
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.2);
      
      return () => {
        audioCtx.close().catch(console.error);
      };
    }
  }, [callWaiting]);

  const handleAcceptWaiting = () => {
    const currentActiveReqId = incomingCall ? incomingCall.requestId : (buddyActiveCall ? buddyActiveCall.requestId : null);
    if (socket && currentActiveReqId) {
      socket.emit("end-call", { requestId: currentActiveReqId });
    }
    setBuddyActiveCall(null);
    if (callWaiting) {
      setIncomingCall({ ...callWaiting, autoAccept: true });
      setCallWaiting(null);
    }
  };

  const handleRejectWaiting = () => {
    if (socket && callWaiting) {
      socket.emit("reject-call", { requestId: callWaiting.requestId, reason: "busy" });
      setCallWaiting(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/buddy/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Accepted" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: "✓ Request accepted! Session has been scheduled.", type: "success" });
        await fetchData();
      } else {
        setActionMessage({ text: data.message || "Failed to accept request", type: "error" });
      }
    } catch (e) {
      setActionMessage({ text: "Error connecting to server", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    setActionLoadingId(requestId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/buddy/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Rejected" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: "Request declined.", type: "success" });
        await fetchData();
      } else {
        setActionMessage({ text: data.message || "Failed to decline request", type: "error" });
      }
    } catch (e) {
      setActionMessage({ text: "Error connecting to server", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    setActionLoadingId(sessionId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/buddy/sessions/${sessionId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: "✓ Session marked as completed! Payout added to earnings.", type: "success" });
        await fetchData();
      } else {
        setActionMessage({ text: data.message || "Failed to complete session", type: "error" });
      }
    } catch (e) {
      setActionMessage({ text: "Error updating session", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) router.replace("/");
        else {
          setUser(d.user);
          setProfilePhoto(d.user.profilePhoto || "");
          setDisplayName(d.user.displayName || d.user.name || "");
          setCity(d.user.city || "");
          setShortBio(d.user.shortBio || "");
          setLanguages(d.user.languages || []);
          setAreasOfExpertise(d.user.areasOfExpertise || []);
          setSessionTypes(d.user.sessionTypes || []);
          setAvailableDays(d.user.availableDays || []);
          setAvailableTimeStart(d.user.availableTimeStart || "");
          setAvailableTimeEnd(d.user.availableTimeEnd || "");
          if (typeof d.user.isAvailableForRequests === "boolean") {
            setIsAvailableForRequests(d.user.isAvailableForRequests);
          }
          fetchAvailability();
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSettingsMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profilePhoto,
          displayName,
          city,
          shortBio,
          languages,
          areasOfExpertise,
          sessionTypes,
          availableDays,
          availableTimeStart,
          availableTimeEnd
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setUser(data.user);
        }
        setSettingsMessage({ text: "✓ Your profile settings have been successfully saved!", type: "success" });
        setTimeout(() => setSettingsMessage(null), 5000);
      } else {
        setSettingsMessage({ text: data.message || "Failed to save profile changes.", type: "error" });
      }
    } catch (e) {
      setSettingsMessage({ text: "Error saving profile. Please check your connection.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (item: string, array: string[], setArray: (val: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/");
    } catch (e) {
      console.error(e);
      router.replace("/");
    }
  };

  const renderDashboardHome = () => {
    const pendingRequests = requests.filter((r) => r.status === "Pending");

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">
              Good Day, {displayName.split(' ')[0] || 'Buddy'} 👋
            </h2>
            <p className="text-slate-500 text-sm mt-1">Here's your Breakup Buddy session and request overview</p>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab("Requests")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">New Requests</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-amber-600">{dashboardData.newRequests}</p>
              <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                View Requests →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("Accepted Users")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Accepted Users</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-teal-600">{acceptedUsers.length}</p>
              <span className="text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                View Users →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("History")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed Sessions</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-800">{dashboardData.completedSessions}</p>
              <span className="text-xs font-bold text-slate-500 group-hover:translate-x-1 transition-transform">
                View History →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("Earnings")}
            className="bg-gradient-to-br from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white border border-teal-600 rounded-xl p-5 shadow-sm transition group text-left cursor-pointer"
          >
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider mb-2">Total Earnings</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-black">₹{earnings.totalEarnings || dashboardData.totalEarnings || 0}</p>
              <span className="text-xs font-bold text-teal-200 group-hover:translate-x-1 transition-transform">
                View Payouts →
              </span>
            </div>
          </button>
        </div>

        {/* Quick Pending Requests on Dashboard */}
        {pendingRequests.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-serif text-lg">Action Needed: Pending Requests</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingRequests.length} Pending
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req: any) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-800">{req.user?.name || "User"}</h4>
                    <p className="text-xs text-slate-500">
                      {req.sessionType || "1-on-1"} Session • Topic: "{req.topic || "General Discussion"}"
                    </p>
                    <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                      Requested {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={actionLoadingId === req.id}
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoadingId === req.id ? "Accepting..." : "✓ Accept"}
                    </button>
                    <button
                      disabled={actionLoadingId === req.id}
                      onClick={() => handleRejectRequest(req.id)}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRequests = () => {
    const filteredRequests =
      requestFilter === "all"
        ? requests
        : requests.filter((r) => r.status === requestFilter);

    const paginatedRequests = filteredRequests.slice(
      (requestsPage - 1) * REQUESTS_PER_PAGE,
      requestsPage * REQUESTS_PER_PAGE
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">Booking Requests</h2>
            <p className="text-slate-500 text-sm mt-0.5">Manage and respond to user session requests</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            {(["all", "Pending", "Accepted", "Rejected"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => { setRequestFilter(filter); setRequestsPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  requestFilter === filter
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter === "all" ? "All" : filter}
              </button>
            ))}
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm space-y-2">
            <p className="text-2xl">📩</p>
            <p className="font-semibold text-slate-700">No {requestFilter !== "all" ? requestFilter.toLowerCase() : ""} requests found</p>
            <p className="text-xs text-slate-400">Incoming requests will show up here automatically.</p>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              {paginatedRequests.map((req: any) => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                        {req.user?.name ? req.user.name[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{req.user?.name || "User"}</h3>
                        <p className="text-sm text-slate-600 font-medium">
                          {req.sessionType || "1-on-1 Call"} Session • Topic: "{req.topic || "General Discussion"}"
                        </p>
                        <p className="text-xs text-teal-600 font-semibold mt-1">
                          Requested on {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      {req.status === "Pending" && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                          PENDING
                        </span>
                      )}
                      {req.status === "Accepted" && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          ✓ ACCEPTED
                        </span>
                      )}
                      {req.status === "Rejected" && (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
                          ✕ DECLINED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    {req.status === "Pending" ? (
                      <>
                        <button
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-5 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-sm font-bold transition disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoadingId === req.id ? "Processing..." : "Reject"}
                        </button>
                        <button
                          disabled={actionLoadingId === req.id}
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {actionLoadingId === req.id ? (
                            "Accepting..."
                          ) : (
                            <>
                              <span>✓</span> Accept Request
                            </>
                          )}
                        </button>
                      </>
                    ) : req.status === "Accepted" ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-emerald-700 font-semibold">
                          ✓ Session created & added to upcoming sessions.
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">This request was declined.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination(
              requestsPage,
              filteredRequests.length,
              REQUESTS_PER_PAGE,
              setRequestsPage,
              "requests"
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAcceptedUsers = () => {
    const filtered = acceptedUsers.filter((req) => {
      const q = acceptedSearch.toLowerCase();
      const name = (req.user?.name || "").toLowerCase();
      const email = (req.user?.email || "").toLowerCase();
      const city = (req.user?.city || "").toLowerCase();
      const topic = (req.topic || "").toLowerCase();
      const sessionType = (req.sessionType || "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        topic.includes(q) ||
        sessionType.includes(q)
      );
    });

    const paginatedAccepted = filtered.slice(
      (acceptedPage - 1) * ACCEPTED_PER_PAGE,
      acceptedPage * ACCEPTED_PER_PAGE
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-serif text-slate-800">Accepted Users</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {acceptedUsers.length} {acceptedUsers.length === 1 ? "Client" : "Clients"}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              All users whose session and consultation requests you have accepted.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, city, email or topic..."
              value={acceptedSearch}
              onChange={(e) => { setAcceptedSearch(e.target.value); setAcceptedPage(1); }}
              className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 shadow-sm transition"
            />
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-teal-100">
              👥
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {acceptedSearch ? "No matching accepted users" : "No accepted users yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {acceptedSearch
                ? "Try searching with a different name, city or topic."
                : "When you accept booking requests from the 'Requests' tab, those clients and their consultation history will show up here."}
            </p>
            {!acceptedSearch && (
              <button
                onClick={() => setActiveTab("Requests")}
                className="mt-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Go to Requests Tab →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedAccepted.map((req: any) => {
              const u = req.user || {};
              const age = u.dateOfBirth
                ? Math.floor((new Date().getTime() - new Date(u.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null;

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* User Profile Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg overflow-hidden border border-teal-200 shadow-sm">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name ? u.name[0].toUpperCase() : "👤"
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                            {u.name || "User"}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            {u.city && <span>📍 {u.city}</span>}
                            {age && <span>• {age} yrs</span>}
                            {u.gender && <span>• {u.gender}</span>}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-full">
                        ✓ ACCEPTED
                      </span>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold text-slate-700">Format:</span>
                        <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {req.sessionType || "1-on-1 Session"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 block mb-0.5">Discussion Topic / Reason:</span>
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          "{req.topic || "General emotional support & active listening"}"
                        </p>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                        <span>Accepted: {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    {(u.email || u.phone) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {u.email && (
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                          >
                            ✉️ {u.email}
                          </a>
                        )}
                        {u.phone && (
                          <a
                            href={`tel:${u.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                          >
                            📞 {u.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() =>
                        setBuddyActiveCall({
                          requestId: req.id,
                          targetUserId: u.id,
                          targetName: u.name || "User",
                          callerName: displayName || user?.name || "Breakup Buddy",
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    >
                      📞 Call User
                    </button>
                    <button
                      onClick={() => setActiveTab("Messages")}
                      className="flex-1 py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition border border-teal-200 text-center cursor-pointer"
                    >
                      💬 Open Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {filtered.length > 0 &&
          renderPagination(
            acceptedPage,
            filtered.length,
            ACCEPTED_PER_PAGE,
            setAcceptedPage,
            "clients"
          )}
      </div>
    );
  };

  const renderMessages = () => (
    <BuddyMessagesTab acceptedUsers={acceptedUsers} initialActiveReqId={selectedChatRequestId} />
  );

  const renderAvailability = () => {
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">Manage Availability</h2>
            <p className="text-slate-500 text-sm mt-0.5">Set your weekly routine and active timeslots.</p>
          </div>
        </div>

        {/* 1. Your Status Card */}
        <div className={`border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isAvailableForRequests ? "bg-white border-slate-200" : "bg-amber-50/50 border-amber-200"
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-800">Your Status</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                isAvailableForRequests
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAvailableForRequests ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isAvailableForRequests ? "Available for Requests" : "Unavailable for Requests"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAvailableForRequests
                ? "Clients browsing the Breakup Buddy directory can discover your profile and book new confidential sessions."
                : "Your card on the Breakup Buddy directory is marked as 'Unavailable for Requests' and new session bookings are disabled."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-slate-700">Accept new requests</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isAvailableForRequests;
                setIsAvailableForRequests(nextVal);
                handleSaveAvailability({ isAvailableForRequests: nextVal });
                setActionMessage({
                  text: nextVal
                    ? "✓ Status updated: You are now Available for new client requests!"
                    : "✓ Status updated: You are now marked as Unavailable. Clients cannot send new requests.",
                  type: "success",
                });
              }}
              className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                isAvailableForRequests ? "bg-teal-500" : "bg-slate-300"
              }`}
              title={isAvailableForRequests ? "Click to set status to Unavailable" : "Click to set status to Available"}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isAvailableForRequests ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 2. Weekly Schedule Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Weekly Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize time slots for each day of the week.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {daysOrder.map((dayName) => {
              const dayObj = weeklySchedule.find((s: any) => s.day === dayName);
              const slots: string[] = dayObj?.slots || [];

              return (
                <div key={dayName} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                  <div className="font-bold text-slate-700 text-sm md:pt-1.5">{dayName}</div>
                  
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {slots.length === 0 ? (
                        <span className="text-xs italic text-slate-400">Unavailable</span>
                      ) : (
                        slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition"
                          >
                            <span>{slot}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSlots = slots.filter((_, i) => i !== idx);
                                const updatedSchedule = daysOrder.map(d => {
                                  if (d === dayName) return { day: d, slots: updatedSlots };
                                  const existing = weeklySchedule.find((s: any) => s.day === d);
                                  return existing || { day: d, slots: [] };
                                });
                                setWeeklySchedule(updatedSchedule);
                              }}
                              className="text-slate-400 hover:text-rose-500 font-bold transition text-sm leading-none ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}

                      <button
                        type="button"
                        onClick={() => setAddingSlotDay(dayName)}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer ml-1"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    {addingSlotDay === dayName && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-teal-200 p-2.5 rounded-xl animate-in fade-in max-w-md mt-2">
                        <select
                          value={slotStartTime}
                          onChange={(e) => setSlotStartTime(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-slate-400">—</span>
                        <select
                          value={slotEndTime}
                          onChange={(e) => setSlotEndTime(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newSlotStr = `${slotStartTime} — ${slotEndTime}`;
                            const updatedSlots = [...slots, newSlotStr];
                            const updatedSchedule = daysOrder.map(d => {
                              if (d === dayName) return { day: d, slots: updatedSlots };
                              const existing = weeklySchedule.find((s: any) => s.day === d);
                              return existing || { day: d, slots: [] };
                            });
                            setWeeklySchedule(updatedSchedule);
                            setAddingSlotDay(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer ml-auto"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingSlotDay(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSaveAvailability()}
              disabled={savingAvailability}
              className="px-6 py-2.5 rounded-xl bg-[#131d2e] hover:bg-slate-800 text-white font-bold text-sm shadow transition disabled:opacity-60 cursor-pointer"
            >
              {savingAvailability ? "Saving Schedule..." : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
        : "5.0";
    const numAvg = parseFloat(avgRating);

    // Distribution
    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: any) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
      starCounts[star] = (starCounts[star] || 0) + 1;
    });

    const satisfactionPercent =
      totalReviews > 0
        ? Math.round(((starCounts[5] + starCounts[4]) / totalReviews) * 100)
        : 100;

    const reviewsWithComments = reviews.filter((r: any) => r.comment && r.comment.trim().length > 0).length;

    // Filter & Search & Sort
    const filteredReviews = reviews.filter((r: any) => {
      const q = reviewsSearch.toLowerCase().trim();
      const userName = (r.user?.name || "Anonymous").toLowerCase();
      const comment = (r.comment || "").toLowerCase();

      const matchesQuery = !q || userName.includes(q) || comment.includes(q);
      if (!matchesQuery) return false;

      if (reviewsRatingFilter !== "all") {
        const star = Math.max(1, Math.min(5, Math.round(r.rating || 5)));
        if (reviewsRatingFilter === 1 || reviewsRatingFilter === 2) {
          if (star > 2) return false;
        } else if (star !== reviewsRatingFilter) {
          return false;
        }
      }
      return true;
    });

    // Sort
    filteredReviews.sort((a: any, b: any) => {
      if (reviewsSort === "highest") {
        return (b.rating || 5) - (a.rating || 5);
      }
      if (reviewsSort === "lowest") {
        return (a.rating || 5) - (b.rating || 5);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const paginatedReviews = filteredReviews.slice(
      (reviewsPage - 1) * REVIEWS_PER_PAGE,
      reviewsPage * REVIEWS_PER_PAGE
    );

    const getRatingLabel = (rating: number) => {
      if (rating >= 5) return { label: "Excellent", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      if (rating >= 4) return { label: "Great", color: "bg-teal-50 text-teal-700 border-teal-200" };
      if (rating >= 3) return { label: "Good", color: "bg-sky-50 text-sky-700 border-sky-200" };
      if (rating >= 2) return { label: "Fair", color: "bg-amber-50 text-amber-700 border-amber-200" };
      return { label: "Needs Attention", color: "bg-rose-50 text-rose-700 border-rose-200" };
    };

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-serif text-slate-800">Client Reviews & Ratings</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ⭐ {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Verified feedback, star ratings, and testimonials shared by clients you've supported.
            </p>
          </div>

          <button
            onClick={handleRefreshReviews}
            disabled={isRefreshingReviews}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center gap-2 self-start sm:self-center cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingReviews ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingReviews ? "Refreshing..." : "Refresh Reviews"}</span>
          </button>
        </div>

        {/* Analytics & Rating Breakdown Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 1. Overall Score Card (4 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between border border-slate-700/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Overall Rating</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {numAvg >= 4.5 ? "🌟 Top Rated" : "✨ Verified Feedback"}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-black tracking-tight">{avgRating}</span>
                <span className="text-xl text-slate-400 font-semibold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-lg mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= Math.round(numAvg) ? "text-amber-400" : "text-slate-600"}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Based on <strong>{totalReviews}</strong> ratings</span>
              <span className="text-teal-300 font-semibold">{satisfactionPercent}% Positive</span>
            </div>
          </div>

          {/* 2. Rating Breakdown Bars (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Rating Breakdown</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star] || 0;
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                const isSelected = reviewsRatingFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setReviewsRatingFilter(isSelected ? "all" : star);
                      setReviewsPage(1);
                    }}
                    className={`w-full flex items-center gap-3 text-xs p-1 rounded-lg transition text-left cursor-pointer group ${
                      isSelected ? "bg-teal-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                      {star} <span className="text-amber-400 text-xs">★</span>
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          star >= 4 ? "bg-teal-500" : star === 3 ? "bg-sky-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-slate-400 group-hover:text-slate-700 font-medium shrink-0">
                      {count} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Performance Insights (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-1 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                🎯
              </div>
              <div>
                <p className="text-xl font-black text-emerald-800">{satisfactionPercent}%</p>
                <p className="text-[11px] text-emerald-700 font-semibold">Satisfaction Rate</p>
              </div>
            </div>

            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center text-xl shrink-0">
                💬
              </div>
              <div>
                <p className="text-xl font-black text-teal-800">{reviewsWithComments}</p>
                <p className="text-[11px] text-teal-700 font-semibold">Detailed Comments</p>
              </div>
            </div>

            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center text-xl shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-xl font-black text-sky-800">100%</p>
                <p className="text-[11px] text-sky-700 font-semibold">Verified Client Reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Star Filter Pills, Search Bar, and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          {/* Star Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: `All (${totalReviews})` },
              { id: 5, label: `5 ★ (${starCounts[5] || 0})` },
              { id: 4, label: `4 ★ (${starCounts[4] || 0})` },
              { id: 3, label: `3 ★ (${starCounts[3] || 0})` },
              { id: 1, label: `1–2 ★ (${(starCounts[1] || 0) + (starCounts[2] || 0)})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setReviewsRatingFilter(tab.id as any);
                  setReviewsPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  reviewsRatingFilter === tab.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search reviews or client..."
                value={reviewsSearch}
                onChange={(e) => {
                  setReviewsSearch(e.target.value);
                  setReviewsPage(1);
                }}
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {reviewsSearch && (
                <button
                  onClick={() => {
                    setReviewsSearch("");
                    setReviewsPage(1);
                  }}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={reviewsSort}
              onChange={(e) => {
                setReviewsSort(e.target.value as any);
                setReviewsPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="highest">⭐ Highest Rating</option>
              <option value="lowest">📉 Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews Cards List */}
        {totalReviews === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto border border-amber-200 shadow-inner">
              ⭐
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Client Reviews Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When clients complete their hourly passes or voice consultation sessions with you, their ratings and thoughtful reviews will appear here.
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl mx-auto text-slate-400">
              🔍
            </div>
            <h3 className="font-bold text-slate-800 text-base">No matching reviews found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any reviews matching your current filters or search term.
            </p>
            <button
              onClick={() => {
                setReviewsSearch("");
                setReviewsRatingFilter("all");
                setReviewsPage(1);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm cursor-pointer inline-block mt-2"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedReviews.map((rev: any) => {
                const u = rev.user || {};
                const rating = Math.max(1, Math.min(5, rev.rating || 5));
                const ratingMeta = getRatingLabel(rating);
                const formattedDate = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";

                return (
                  <div
                    key={rev.id}
                    className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    {/* Top: User Profile & Rating Pill */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-100 to-emerald-200 text-teal-800 font-black text-sm flex items-center justify-center shrink-0 border border-teal-200 shadow-sm overflow-hidden">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name ? u.name[0].toUpperCase() : "👤"
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">
                              {u.name || "Client"}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Verified Client
                              </span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rating Pill */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < rating ? "text-amber-400" : "text-slate-200"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingMeta.color}`}>
                            {rating.toFixed(1)} • {ratingMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Comment Body */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {rev.comment && rev.comment.trim().length > 0 ? (
                          <div className="relative pl-3 border-l-2 border-teal-400/60">
                            <p className="text-slate-700 text-xs leading-relaxed font-normal italic">
                              "{rev.comment}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic">
                            Provided a {rating}-star rating with no written review.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Tags */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/60">
                        🤝 Breakup Consultation Feedback
                      </span>
                      <span className="text-slate-400 font-semibold">Public Review</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredReviews.length > 0 &&
              renderPagination(
                reviewsPage,
                filteredReviews.length,
                REVIEWS_PER_PAGE,
                setReviewsPage,
                "reviews"
              )}
          </div>
        )}
      </div>
    );
  };


  const renderEarnings = () => {
    const allEarningsSessions = earnings.sessions || [];
    const uniqueClientsCount = new Set(allEarningsSessions.map((s: any) => s.userId).filter(Boolean)).size;
    const paginatedEarningsSessions = allEarningsSessions.slice(
      (earningsPage - 1) * EARNINGS_PER_PAGE,
      earningsPage * EARNINGS_PER_PAGE
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">Earnings & Subscriptions</h2>
            <p className="text-slate-500 text-sm mt-0.5">Real-time revenue from user subscriptions and consultations</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            🔄 Refresh Earnings
          </button>
        </div>

        {/* Highlight Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-teal-100 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">💰</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{earnings.totalEarnings || 0}</h3>
              <p className="text-xs text-teal-100 mt-1">✓ Credited from client subscriptions & passes</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Paid Packages & Sessions</span>
              <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-lg">📦</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{allEarningsSessions.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Total completed transactions</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Paying Clients</span>
              <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-lg">👥</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{uniqueClientsCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Clients who subscribed or booked</p>
            </div>
          </div>
        </div>

        {/* Transactions / Subscriptions Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 font-serif text-lg">Subscription & Payment History</h3>
            <span className="text-xs font-semibold text-slate-400">
              {allEarningsSessions.length} Transactions
            </span>
          </div>

          {allEarningsSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-teal-100">
                💳
              </div>
              <h4 className="font-bold text-slate-800 text-base">No Subscription Earnings Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When users purchase hourly packages or passes for your profile, the payments and pass details will appear here automatically!
              </p>
            </div>
          ) : (
            <div>
              <div className="space-y-3">
                {paginatedEarningsSessions.map((sess: any) => {
                  const u = sess.user || {};
                  return (
                    <div
                      key={sess.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl gap-4 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center shrink-0 border border-teal-200">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">{u.name || "Client Subscriber"}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ PAID
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {sess.sessionType || "Hourly Unlimited Subscription Pass"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>📅 {new Date(sess.scheduledAt || sess.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {u.city && <span>• 📍 {u.city}</span>}
                            {u.email && <span>• ✉️ {u.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <div className="text-xl font-black text-emerald-600 tracking-tight">
                          +₹{sess.amountEarned}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Credit Payout
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderPagination(
                earningsPage,
                allEarningsSessions.length,
                EARNINGS_PER_PAGE,
                setEarningsPage,
                "transactions"
              )}
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderHistory = () => {
    const totalMinutes = history.reduce((acc: number, h: any) => acc + (h.durationMinutes || 60), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const totalRevenue = history.reduce((acc: number, h: any) => acc + (h.amountEarned || 0), 0);

    const filteredHistory = history.filter((h: any) => {
      const q = historySearch.toLowerCase();
      const userName = (h.user?.name || "").toLowerCase();
      const userEmail = (h.user?.email || "").toLowerCase();
      const userCity = (h.user?.city || "").toLowerCase();
      const sessionType = (h.sessionType || "").toLowerCase();

      const matchesQuery =
        userName.includes(q) ||
        userEmail.includes(q) ||
        userCity.includes(q) ||
        sessionType.includes(q);

      if (!matchesQuery) return false;

      if (historyFilter === "hourly") {
        return sessionType.includes("hour") || sessionType.includes("pass") || sessionType.includes("unlimited");
      }
      if (historyFilter === "session") {
        return !sessionType.includes("hour") && !sessionType.includes("pass");
      }
      return true;
    });

    const paginatedHistory = filteredHistory.slice(
      (historyPage - 1) * HISTORY_PER_PAGE,
      historyPage * HISTORY_PER_PAGE
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-serif text-slate-800">Session & Package History</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {history.length} Completed
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Historical log of all client subscriptions, hourly unlimited passes, and completed consultations.
            </p>
          </div>

          <button
            onClick={handleRefreshHistory}
            disabled={isRefreshingHistory}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center gap-2 self-start sm:self-center cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingHistory ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingHistory ? "Refreshing..." : "Refresh History"}</span>
          </button>
        </div>

        {/* 3 Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-xl font-bold">
              📜
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{history.length}</p>
              <p className="text-xs text-slate-500 font-semibold">Completed Passes</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-xl font-bold">
              ⏱️
            </div>
            <div>
              <p className="text-2xl font-black text-sky-600">{totalHours} hrs</p>
              <p className="text-xs text-slate-500 font-semibold">Total Duration Delivered</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xl font-bold">
              💰
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">₹{totalRevenue}</p>
              <p className="text-xs text-slate-500 font-semibold">Total Package Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: "all", label: "All Completed" },
                { id: "hourly", label: "Hourly Passes" },
                { id: "session", label: "1-on-1 Sessions" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setHistoryFilter(tab.id); setHistoryPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  historyFilter === tab.id
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by client, plan, or city..."
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* History Cards / Table */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-teal-100">
              📜
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {historySearch ? "No matching history found" : "No Completed Passes or Sessions Yet"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {historySearch
                ? "Try adjusting your search keywords."
                : "When users complete their purchased hourly passes or scheduled consultations with you, complete timestamped history will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedHistory.map((h: any) => {
              const u = h.user || {};
              const durMinutes = Number(h.durationMinutes) || 60;
              const startedDate = h.startedAt ? new Date(h.startedAt) : new Date(h.scheduledAt || h.createdAt || Date.now());
              const startMs = startedDate.getTime();
              const durMs = durMinutes * 60000;

              let completedDate = new Date(startMs + durMs);
              if (h.completedAt) {
                const compMs = new Date(h.completedAt).getTime();
                if (compMs - startMs >= durMs || compMs - startMs >= 60000) {
                  completedDate = new Date(compMs);
                }
              }

              const formattedStart = startedDate.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              const formattedEnd = completedDate.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });

              return (
                <div
                  key={h.id}
                  className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: User & Package Info */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-black text-base flex items-center justify-center shrink-0 border border-teal-200 shadow-sm overflow-hidden">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name ? u.name[0].toUpperCase() : "👤"
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{u.name || "Client Subscriber"}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ COMPLETED
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                          ⏱️ {h.durationMinutes || 60} mins
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-teal-700">
                        📦 {h.sessionType || "Hourly Unlimited Subscription Pass"}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        {u.city && <span>📍 {u.city}</span>}
                        {u.email && <span>✉️ {u.email}</span>}
                        {u.phone && <span>📞 {u.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date, Time Taken, Time Completed & Amount */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 md:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between md:justify-end">
                    {/* Timestamp Grid */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-600 min-w-[210px]">
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-slate-400 font-medium">🚀 Started / Taken:</span>
                        <span className="font-bold text-slate-700 text-right">{formattedStart}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] border-t border-slate-200/60 pt-1">
                        <span className="text-slate-400 font-medium">🏁 Completed / Over:</span>
                        <span className="font-bold text-emerald-700 text-right">{formattedEnd}</span>
                      </div>
                    </div>

                    {/* Price Payout */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-400 block">Package Amount</span>
                      <div className="text-xl font-black text-emerald-600 tracking-tight">
                        ₹{h.amountEarned || 0}
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block mt-0.5">
                        Credit Settled
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {filteredHistory.length > 0 &&
          renderPagination(
            historyPage,
            filteredHistory.length,
            HISTORY_PER_PAGE,
            setHistoryPage,
            "sessions"
          )}
      </div>
    );
  };


  const renderCallLogs = () => {
    const totalCalls = callLogs.length;
    const missedCalls = callLogs.filter((c: any) => c.status === "MISSED").length;
    const paginatedCallLogs = callLogs.slice(
      (callLogsPage - 1) * CALL_LOGS_PER_PAGE,
      callLogsPage * CALL_LOGS_PER_PAGE
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-serif text-slate-800">Call Logs & History</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {totalCalls} Total
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Complete call history for all voice consultations with your clients.
            </p>
          </div>

          <button
            onClick={handleRefreshCallLogs}
            disabled={isRefreshingLogs}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center gap-2 self-start sm:self-center cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingLogs ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingLogs ? "Refreshing..." : "Refresh Log"}</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-xl font-bold">
              📞
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalCalls}</p>
              <p className="text-xs text-slate-500 font-semibold">Total Calls</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-xl font-bold">
              📵
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600">{missedCalls}</p>
              <p className="text-xs text-slate-500 font-semibold">Missed Calls</p>
            </div>
          </div>
        </div>

        {/* Call Log List */}
        {callLogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl mx-auto">
              📞
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Call History Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Call history details will appear here when you or your clients start voice calls.
            </p>
          </div>
        ) : (
          <div>
            <div className="space-y-3">
              {paginatedCallLogs.map((log: any) => {
                const isMissed = log.status === "MISSED";
                const u = log.user || {};

                return (
                  <div
                    key={log.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isMissed ? "border-rose-200 bg-rose-50/30" : "border-slate-200 hover:border-teal-200"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-bold text-base flex items-center justify-center shrink-0 border border-teal-200">
                        {u.name ? u.name[0].toUpperCase() : "U"}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{u.name || "User"}</span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isMissed
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {isMissed ? "MISSED CALL" : log.status}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                            {log.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>📅 {new Date(log.startedAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>⏱️ {isMissed ? "No connection" : `${Math.floor((log.durationSec || 0) / 60)}m ${(log.durationSec || 0) % 60}s`}</span>
                          {u.phone && <span>• 📞 {u.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setBuddyActiveCall({
                          requestId: log.requestId,
                          targetUserId: u.id,
                          targetName: u.name || "User",
                          callerName: displayName || user?.name || "Breakup Buddy",
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-end sm:self-center cursor-pointer shrink-0"
                    >
                      📞 Call User
                    </button>
                  </div>
                );
              })}
            </div>
            {renderPagination(
              callLogsPage,
              callLogs.length,
              CALL_LOGS_PER_PAGE,
              setCallLogsPage,
              "call records"
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    const predefinedLanguages = [
      "English",
      "Hindi",
      "Kannada",
      "Tamil",
      "Telugu",
      "Spanish",
      "French",
      "German",
      "Bengali",
      "Marathi",
      "Punjabi",
      "Gujarati",
      "Malayalam",
    ];

    const expertiseCategories = [
      {
        title: "💔 Heartbreak & Healing",
        items: [
          { name: "Breakup Recovery", desc: "Guiding through immediate heartbreak and emotional turbulence" },
          { name: "Moving On & Closure", desc: "Acceptance, letting go, and finding inner peace" },
          { name: "Grief & Emotional Loss", desc: "Processing loneliness, sadness, and nostalgia after separation" },
          { name: "Detachment & No-Contact", desc: "Overcoming dependency and breaking compulsive contact loops" },
        ],
      },
      {
        title: "⚡ Relationship Challenges",
        items: [
          { name: "Toxic Relationship Exit", desc: "Navigating difficult separations and rebuilding self-identity" },
          { name: "Communication & Conflict", desc: "Understanding what went wrong and processing relationship patterns" },
          { name: "Trust & Betrayal", desc: "Healing from infidelity, broken trust, and emotional pain" },
          { name: "Dating Burnout & Anxiety", desc: "Navigating fear of vulnerability and modern dating fatigue" },
        ],
      },
      {
        title: "🌱 Self-Love & Emotional Wellbeing",
        items: [
          { name: "Self-Love & Rebuilding", desc: "Reclaiming self-worth, positive habits, and personal goals" },
          { name: "Loneliness & Isolation", desc: "A compassionate presence when you feel isolated or unheard" },
          { name: "Friendly Empathetic Venting", desc: "A safe, 100% confidential space to release thoughts freely" },
          { name: "Life & Post-Breakup Transition", desc: "Adjusting to single life and discovering new routines" },
        ],
      },
    ];

    const handleAddCustomLanguage = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = customLanguageInput.trim();
      if (trimmed && !languages.includes(trimmed)) {
        setLanguages([...languages, trimmed]);
        setCustomLanguageInput("");
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-teal-50 text-teal-600 rounded-xl text-lg font-bold">⚙️</span>
              <h2 className="text-2xl font-bold font-serif text-slate-800">Profile & Account Settings</h2>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Customize your public consultant card, consultation specialties, and manage verification details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <span>💾 Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Action / Notification Toast Banner */}
        {settingsMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium animate-in slide-in-from-top-2 ${
              settingsMessage.type === "success"
                ? "bg-teal-50 border-teal-200 text-teal-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{settingsMessage.type === "success" ? "✅" : "⚠️"}</span>
              <span>{settingsMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSettingsMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          {[
            { id: "profile", label: "Public Profile", icon: "👤" },
            { id: "specialties", label: "Specialties & Services", icon: "🎯" },
            { id: "account", label: "Account & Verification", icon: "🛡️" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSettingsActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                settingsActiveTab === tab.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: Public Profile */}
        {settingsActiveTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form: 7 columns */}
            <div className="lg:col-span-7 space-y-6">
              {/* Photo & Display Name Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>📸</span> Avatar & Identity
                </h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-2xl border-2 border-teal-200 overflow-hidden shadow-inner">
                      {profilePhoto && (profilePhoto.startsWith("http") || profilePhoto.startsWith("data:")) ? (
                        <img
                          src={profilePhoto}
                          alt={displayName || "Buddy"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{displayName ? displayName[0].toUpperCase() : "B"}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <label className="block text-xs font-bold text-slate-700">Profile Photo URL or Image Name</label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="https://example.com/avatar.jpg or image filename"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer inline-flex items-center gap-1">
                        <span>📁 Choose file...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfilePhoto(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {profilePhoto && (
                        <button
                          type="button"
                          onClick={() => setProfilePhoto("")}
                          className="text-xs text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Display Name <span className="text-teal-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Alex Bennett"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Visible to clients seeking breakup support.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">City / Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Mumbai, India or Remote"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Helps match with local or timezone-friendly users.</p>
                  </div>
                </div>
              </div>

              {/* Bio & Intro Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>✍️</span> About Me / Short Bio
                  </h3>
                  <span
                    className={`text-xs font-bold ${
                      shortBio.length > 280 ? "text-amber-500" : "text-slate-400"
                    }`}
                  >
                    {shortBio.length}/300
                  </span>
                </div>

                <textarea
                  value={shortBio}
                  maxLength={300}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="Introduce yourself warmly. Mention your listening style, empathy, and how you support people going through breakups..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition resize-none leading-relaxed"
                />

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-500">
                    💡 <strong className="text-slate-700">Pro Tip:</strong> Breakup buddies with a warm, non-judgmental introduction receive 3x more accepted requests.
                  </p>
                </div>
              </div>

              {/* Languages Spoken Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🗣️</span> Languages Spoken
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                    {languages.length} Selected
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Select the languages you are comfortable speaking or chatting in during sessions.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {predefinedLanguages.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayItem(lang, languages, setLanguages)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/20"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "✓" : "+"} {lang}
                      </button>
                    );
                  })}
                  {languages
                    .filter((l) => !predefinedLanguages.includes(l))
                    .map((customLang) => (
                      <span
                        key={customLang}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white shadow-sm"
                      >
                        ✓ {customLang}
                        <button
                          type="button"
                          onClick={() => toggleArrayItem(customLang, languages, setLanguages)}
                          className="hover:text-rose-200 ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                </div>

                <form onSubmit={handleAddCustomLanguage} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customLanguageInput}
                    onChange={(e) => setCustomLanguageInput(e.target.value)}
                    placeholder="Add other language (e.g., Telugu, Italian)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={!customLanguageInput.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    + Add
                  </button>
                </form>
              </div>
            </div>

            {/* Right Live Preview: 5 columns */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    👁️ Client View Preview
                  </span>
                  <span className="text-[11px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">
                    Live Simulator
                  </span>
                </div>

                {/* Simulated Consultant Card */}
                <div className="bg-white border-2 border-teal-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden bg-gradient-to-b from-teal-50/20 via-white to-white">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-600"></div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-200 overflow-hidden shadow-sm">
                          {profilePhoto && (profilePhoto.startsWith("http") || profilePhoto.startsWith("data:")) ? (
                            <img src={profilePhoto} alt={displayName || "Buddy"} className="w-full h-full object-cover" />
                          ) : (
                            <span>{displayName ? displayName[0].toUpperCase() : "B"}</span>
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-base">{displayName || "Your Display Name"}</h4>
                          <span className="text-teal-600 text-sm" title="Verified Breakup Buddy">
                            ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>📍</span> {city || "City, India"}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mt-1">
                          <span>★ 4.9</span>
                          <span className="text-slate-400 font-normal">({reviews.length || 12} reviews)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic">
                      "{shortBio || "Your short bio and supportive message will appear here to introduce yourself to clients seeking comfort..."}"
                    </p>
                  </div>

                  {/* Languages Tags */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Speaks
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(languages.length > 0 ? languages : ["English", "Hindi"]).map((l) => (
                        <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Focus Areas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(areasOfExpertise.length > 0 ? areasOfExpertise.slice(0, 3) : ["Breakup Recovery", "Moving On", "Emotional Healing"]).map((a) => (
                        <span key={a} className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[11px] font-bold rounded-md border border-teal-100">
                          {a}
                        </span>
                      ))}
                      {areasOfExpertise.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-md">
                          +{areasOfExpertise.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consultation Formats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {sessionTypes.includes("Chat") && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg flex items-center gap-1">
                          💬 Chat
                        </span>
                      )}
                      {sessionTypes.includes("Audio Call") && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg flex items-center gap-1">
                          📞 Voice
                        </span>
                      )}
                      {!sessionTypes.includes("Chat") && !sessionTypes.includes("Audio Call") && (
                        <span className="text-slate-400 italic">No formats active</span>
                      )}
                    </div>
                    <span className="text-teal-600 font-bold text-xs">Available Now</span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full mt-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 opacity-90 cursor-not-allowed"
                  >
                    Request Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Specialties & Services */}
        {settingsActiveTab === "specialties" && (
          <div className="space-y-6">
            {/* Consultation Channels / Formats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>📡</span> Consultation Channels
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable the communication modes through which users can book sessions with you.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                  {sessionTypes.length} Active Formats
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    id: "Chat",
                    title: "💬 Instant Text & Chat Support",
                    desc: "Real-time empathetic chat messaging for clients who prefer written expression.",
                  },
                  {
                    id: "Audio Call",
                    title: "📞 1-on-1 Voice Call Sessions",
                    desc: "Private, high-quality audio call for active listening and spoken encouragement.",
                  },
                ].map((type) => {
                  const isChecked = sessionTypes.includes(type.id);
                  return (
                    <div
                      key={type.id}
                      onClick={() => toggleArrayItem(type.id, sessionTypes, setSessionTypes)}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                        isChecked
                          ? "border-teal-500 bg-teal-50/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{type.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                            isChecked ? "bg-teal-600 text-white" : "border border-slate-300 bg-slate-50"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isChecked ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          {isChecked ? "Active & Accepting Requests" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categorized Areas of Expertise */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🎯</span> Areas of Focus & Emotional Support
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick topics where you feel most confident offering understanding and guidance.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                  {areasOfExpertise.length} Topics Selected
                </span>
              </div>

              <div className="space-y-6">
                {expertiseCategories.map((category) => (
                  <div key={category.title} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {category.title}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {category.items.map((item) => {
                        const isSelected = areasOfExpertise.includes(item.name);
                        return (
                          <div
                            key={item.name}
                            onClick={() => toggleArrayItem(item.name, areasOfExpertise, setAreasOfExpertise)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? "border-teal-500 bg-teal-50/50 shadow-sm"
                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800">{item.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                            </div>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                isSelected ? "bg-teal-600 text-white" : "border border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && "✓"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Account & Verification */}
        {settingsActiveTab === "account" && (
          <div className="space-y-6">
            {/* Status & Badges Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                <span>🛡️</span> Consultant Verification Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">
                      Account Status
                    </span>
                    <span className="text-sm font-bold text-teal-900">Verified & Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
                    🛡️
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                      Role Privilege
                    </span>
                    <span className="text-sm font-bold text-emerald-900">Breakup Buddy Specialist</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-lg font-bold">
                    🔒
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Confidentiality
                    </span>
                    <span className="text-sm font-bold text-slate-800">100% Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📋</span> Registered Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Registered Email ID
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{user?.email || "buddy@jabwemeet.com"}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Registered Mobile Number
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{user?.phone || "+91 ••••••••••"}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Ethics & Confidentiality */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🤝</span>
                <h4 className="font-bold text-sm">JabWeMeet Breakup Buddy Community Pledge</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As a verified Breakup Buddy on JabWeMeet, you play a vital role in supporting members during their most vulnerable moments. All conversations must maintain absolute confidentiality, kindness, empathy, and active listening. Never request or share private off-platform contact details.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-teal-400 font-bold">
                <span>✓ Adheres to JabWeMeet Consultant Guidelines</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold font-serif text-slate-800 tracking-tight">
            JabWe<span className="text-teal-500">Meet</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Buddy Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {[
              { id: 'Dashboard', icon: '🏠' },
              { id: 'Requests', icon: '📩', badge: requests.filter((r) => r.status === 'Pending').length },
              { id: 'Accepted Users', icon: '👥', badge: acceptedUsers.length },
              { id: 'Call Log', icon: '📞', badge: callLogs.filter((c) => c.status === 'MISSED').length },
              { id: 'Messages', icon: '💬' },
              { id: 'Availability', icon: '🕐' },
              { id: 'Reviews', icon: '⭐' },
              { id: 'Earnings', icon: '💰' },
              { id: 'History', icon: '📜' },
              { id: 'Settings', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="text-base grayscale opacity-80">{item.icon}</span>
                <span className="flex-1 text-left">{item.id}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === item.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="block w-full text-center py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="md:hidden font-bold font-serif text-slate-800">JabWeMeet</div>
          <div className="hidden md:block text-sm text-slate-500 font-bold uppercase tracking-wider">{activeTab}</div>
          <div className="flex items-center gap-4">
            {/* Dynamic Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const nextState = !showNotificationsDropdown;
                  setShowNotificationsDropdown(nextState);
                  if (nextState) {
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  }
                }}
                className="text-slate-500 hover:text-slate-800 transition relative p-2 rounded-full hover:bg-slate-100 cursor-pointer"
                title="Notifications"
              >
                <span className="text-xl">🔔</span>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 px-1.5 py-0.5 min-w-[18px] text-[10px] font-extrabold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                        {notifications.length} Total
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotifications([])}
                        className="text-[11px] text-slate-400 hover:text-rose-500 font-bold transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 hover:bg-teal-50/50 transition cursor-pointer flex gap-3 items-start ${
                            !notif.read ? "bg-slate-50/80" : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200 mt-0.5">
                            💬
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                              <span>{notif.title}</span>
                              <span className="text-[10px] font-normal text-slate-400">{notif.timestamp}</span>
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                {displayName ? displayName[0].toUpperCase() : 'B'}
              </div>
              <span className="text-sm font-bold text-slate-700">{displayName || 'Buddy'} ▾</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'Dashboard' && renderDashboardHome()}
            {activeTab === 'Requests' && renderRequests()}
            {activeTab === 'Accepted Users' && renderAcceptedUsers()}
            {activeTab === 'Call Log' && renderCallLogs()}
            {activeTab === 'Messages' && renderMessages()}
            {activeTab === 'Availability' && renderAvailability()}
            {activeTab === 'Reviews' && renderReviews()}
            {activeTab === 'Earnings' && renderEarnings()}
            {activeTab === 'History' && renderHistory()}
            {activeTab === 'Settings' && renderSettings()}
          </div>
        </main>
      </div>

      {/* Outgoing Call Overlay initiated by Breakup Buddy */}
      {buddyActiveCall && (
        <VoiceCallOverlay
          key={buddyActiveCall.requestId}
          requestId={buddyActiveCall.requestId}
          targetUserId={buddyActiveCall.targetUserId}
          role="BUDDY"
          isInitiator={true}
          targetName={buddyActiveCall.targetName}
          callerName={buddyActiveCall.callerName}
          onClose={() => {
            setBuddyActiveCall(null);
            fetchData();
          }}
        />
      )}

      {/* Incoming Call Overlay */}
      {incomingCall && (
        <VoiceCallOverlay
          key={incomingCall.requestId}
          requestId={incomingCall.requestId}
          role="BUDDY"
          callerName={incomingCall.callerName}
          autoAccept={incomingCall.autoAccept}
          onClose={() => setIncomingCall(null)}
        />
      )}

      {/* Call Waiting Toast */}
      {callWaiting && (
        <div className="fixed top-4 right-4 z-[200] bg-[#131d2e] border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 min-w-[300px] animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {callWaiting.callerName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Call Waiting...</p>
              <p className="text-xs text-slate-400">{callWaiting.callerName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectWaiting}
              className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-xs font-semibold text-slate-300 hover:text-red-400 transition"
            >
              Reject
            </button>
            <button
              onClick={handleAcceptWaiting}
              className="flex-1 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg transition"
            >
              End Current & Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


