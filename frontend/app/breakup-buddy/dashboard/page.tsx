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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
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
  const [acceptedFormatFilter, setAcceptedFormatFilter] = useState<"all" | "call" | "chat" | "video">("all");
  const [acceptedSort, setAcceptedSort] = useState<"newest" | "oldest" | "name">("newest");
  const [isRefreshingAccepted, setIsRefreshingAccepted] = useState<boolean>(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [buddyActiveCall, setBuddyActiveCall] = useState<{ requestId: string; targetUserId: string; targetName?: string; callerName: string } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, sessions: [] });
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [requestFilter, setRequestFilter] = useState<"all" | "Pending" | "Accepted" | "Rejected">("all");
  const [requestsSearch, setRequestsSearch] = useState<string>("");
  const [requestsSort, setRequestsSort] = useState<"newest" | "oldest">("newest");
  const [isRefreshingRequests, setIsRefreshingRequests] = useState<boolean>(false);
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
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3.5 sm:px-4 py-3 shadow-sm text-xs">
        <span className="text-slate-500 font-medium text-center sm:text-left">
          Showing <span className="font-bold text-slate-800">{startIndex + 1}</span>–<span className="font-bold text-slate-800">{endIndex}</span> of <span className="font-bold text-slate-800">{totalItems}</span> {label}
        </span>
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            if (totalPages > 5 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
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
            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
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

  const handleRefreshRequests = async () => {
    setIsRefreshingRequests(true);
    try {
      const res = await fetch("/api/buddy/requests", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (e) {
      console.error("Failed to refresh requests:", e);
    } finally {
      setTimeout(() => setIsRefreshingRequests(false), 300);
    }
  };

  const handleRefreshAccepted = async () => {
    setIsRefreshingAccepted(true);
    try {
      const res = await fetch("/api/buddy/accepted-users", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAcceptedUsers(data.data);
      } else {
        const reqRes = await fetch("/api/buddy/requests", { credentials: "include" });
        const reqData = await reqRes.json();
        if (reqData.success && Array.isArray(reqData.data)) {
          setAcceptedUsers(reqData.data.filter((r: any) => r.status === "Accepted"));
        }
      }
    } catch (e) {
      console.error("Failed to refresh accepted users:", e);
    } finally {
      setTimeout(() => setIsRefreshingAccepted(false), 300);
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
            return currentCall;
          }
          setCallWaiting(data);
          return currentCall;
        }
        return data;
      });
    });

    s.on("new-broadcast-request", () => {
      handleRefreshRequests();
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: "⚡ New Connection Request",
        message: "A member requested a Breakup Buddy session! Click to review and claim.",
        timestamp: "Just now",
        read: false,
        targetTab: "Requests",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    s.on("new-buddy-request", () => {
      handleRefreshRequests();
    });

    s.on("buddy-request-claimed", () => {
      handleRefreshRequests();
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: "🔒 Request Claimed",
        message: "A connection request was claimed by another Breakup Buddy.",
        timestamp: "Just now",
        read: false,
        targetTab: "Requests",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    s.on("broadcast-request-claimed", () => {
      handleRefreshRequests();
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (callWaiting) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
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

  const navTabs = [
    { id: 'Dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'Requests', icon: '📩', label: 'Requests', badge: requests.filter((r) => r.status === 'Pending').length },
    { id: 'Accepted Users', icon: '👥', label: 'Accepted' },
    { id: 'Call Log', icon: '📞', label: 'Call Log' },
    { id: 'Messages', icon: '💬', label: 'Messages' },
    { id: 'Availability', icon: '🕐', label: 'Availability' },
    { id: 'Reviews', icon: '⭐', label: 'Reviews' },
    { id: 'Earnings', icon: '💰', label: 'Earnings' },
    { id: 'History', icon: '📜', label: 'History' },
    { id: 'Settings', icon: '⚙️', label: 'Settings' },
  ];

  const renderDashboardHome = () => {
    const pendingRequests = requests.filter((r) => r.status === "Pending");

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">
              Good Day, {displayName.split(' ')[0] || 'Buddy'} 👋
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
              Here's your Breakup Buddy session and request overview
            </p>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab("Requests")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">New Requests</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{dashboardData.newRequests}</p>
              <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                View Requests →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("Accepted Users")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Accepted Users</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">{acceptedUsers.length}</p>
              <span className="text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                View Users →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("History")}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm text-center transition group text-left cursor-pointer"
          >
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Completed Sessions</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{dashboardData.completedSessions}</p>
              <span className="text-xs font-bold text-slate-500 group-hover:translate-x-1 transition-transform">
                View History →
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("Earnings")}
            className="bg-gradient-to-br from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white border border-teal-600 rounded-2xl p-4 sm:p-5 shadow-sm transition group text-left cursor-pointer"
          >
            <p className="text-teal-100 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Total Earnings</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl sm:text-3xl font-black">₹{earnings.totalEarnings || dashboardData.totalEarnings || 0}</p>
              <span className="text-xs font-bold text-teal-200 group-hover:translate-x-1 transition-transform">
                View Payouts →
              </span>
            </div>
          </button>
        </div>

        {/* Quick Pending Requests on Dashboard */}
        {pendingRequests.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-serif text-base sm:text-lg">Action Needed: Pending Requests</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingRequests.length} Pending
              </span>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((req: any) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">{req.user?.name || "User"}</h4>
                    <p className="text-xs text-slate-500">
                      {req.sessionType || "1-on-1"} Session • Topic: "{req.topic || "General Discussion"}"
                    </p>
                    <p className="text-[11px] text-teal-600 font-medium mt-0.5">
                      Requested {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      disabled={actionLoadingId === req.id}
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer text-center"
                    >
                      {actionLoadingId === req.id ? "Accepting..." : "✓ Accept"}
                    </button>
                    <button
                      disabled={actionLoadingId === req.id}
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold transition disabled:opacity-50 cursor-pointer text-center"
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
    const totalRequestsCount = requests.length;
    const pendingCount = requests.filter((r) => r.status === "Pending").length;
    const acceptedCount = requests.filter((r) => r.status === "Accepted").length;
    const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

    const acceptanceRate =
      totalRequestsCount > 0
        ? Math.round((acceptedCount / totalRequestsCount) * 100)
        : 100;

    const filteredRequests = requests.filter((req) => {
      if (requestFilter !== "all" && req.status !== requestFilter) {
        return false;
      }
      const q = requestsSearch.toLowerCase().trim();
      if (!q) return true;

      const userName = (req.user?.name || "").toLowerCase();
      const userEmail = (req.user?.email || "").toLowerCase();
      const userCity = (req.user?.city || "").toLowerCase();
      const topic = (req.topic || "").toLowerCase();
      const sessionType = (req.sessionType || "").toLowerCase();

      return (
        userName.includes(q) ||
        userEmail.includes(q) ||
        userCity.includes(q) ||
        topic.includes(q) ||
        sessionType.includes(q)
      );
    });

    filteredRequests.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return requestsSort === "newest" ? timeB - timeA : timeA - timeB;
    });

    const paginatedRequests = filteredRequests.slice(
      (requestsPage - 1) * REQUESTS_PER_PAGE,
      requestsPage * REQUESTS_PER_PAGE
    );

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Booking Requests</h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {pendingCount} Needs Review
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Review, accept, and manage incoming support and consultation requests from clients.
            </p>
          </div>

          <button
            onClick={handleRefreshRequests}
            disabled={isRefreshingRequests}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingRequests ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingRequests ? "Refreshing..." : "Refresh Requests"}</span>
          </button>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{actionMessage.type === "success" ? "✓" : "⚠️"}</span>
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                📩
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{totalRequestsCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All-time booking inquiries</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Action</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm border border-amber-100">
                ⏳
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {pendingCount > 0 ? "Awaiting your prompt response" : "All requests responded"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Accepted Clients</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100">
                👥
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-teal-600">{acceptedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Confirmed active clients</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acceptance Rate</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100">
                📈
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{acceptanceRate}%</p>
                <span className="text-[11px] font-medium text-emerald-600">index</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                  style={{ width: `${acceptanceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by client name, email, city, or topic..."
                value={requestsSearch}
                onChange={(e) => {
                  setRequestsSearch(e.target.value);
                  setRequestsPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              {requestsSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setRequestsSearch("");
                    setRequestsPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills with Horizontal Touch Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 shrink-0 -mx-1 px-1">
              {[
                { id: "all", label: "All", count: totalRequestsCount },
                { id: "Pending", label: "Pending", count: pendingCount, highlight: pendingCount > 0 },
                { id: "Accepted", label: "Accepted", count: acceptedCount },
                { id: "Rejected", label: "Declined", count: rejectedCount },
              ].map((f) => {
                const isActive = requestFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setRequestFilter(f.id as any);
                      setRequestsPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : f.highlight
                          ? "bg-amber-200 text-amber-900"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">Sort:</span>
              <select
                value={requestsSort}
                onChange={(e) => setRequestsSort(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 flex-1 sm:flex-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-slate-200 shadow-2xs">
              📩
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {requestsSearch || requestFilter !== "all"
                ? "No matching booking requests found"
                : "No booking requests received yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {requestsSearch || requestFilter !== "all"
                ? "Try adjusting your search query or switching the status filter above."
                : "When clients discover your Breakup Buddy profile in the directory and book a session, their requests will appear here for your review."}
            </p>
            {(requestsSearch || requestFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setRequestsSearch("");
                  setRequestFilter("all");
                  setRequestsPage(1);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((req: any) => {
              const u = req.user || {};
              const clientName = u.name || "Anonymous Client";
              const initial = clientName.charAt(0).toUpperCase();

              const age = u.dateOfBirth
                ? Math.floor(
                    (new Date().getTime() - new Date(u.dateOfBirth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null;

              const reqDate = new Date(req.createdAt);
              const formattedDate = reqDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = reqDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={req.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-6 shadow-sm transition-all flex flex-col justify-between gap-4 sm:gap-5 ${
                    req.status === "Pending"
                      ? "border-amber-200/90 shadow-amber-500/5 hover:border-amber-300"
                      : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: User Avatar, Name, Location & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={clientName}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm border border-teal-400/30">
                              {initial}
                            </div>
                          )}
                          {req.status === "Pending" && (
                            <span
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white animate-pulse"
                              title="Pending Action"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-slate-800">{clientName}</h3>
                            {age && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold">
                                {age} yrs
                              </span>
                            )}
                            {u.gender && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold">
                                {u.gender}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            {u.city && u.city !== "N/A" && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <span>📍</span> {u.city}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                              <span>🕒</span> {formattedDate} • {formattedTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="shrink-0 self-start sm:self-auto">
                        {req.status === "Pending" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Action Required
                          </span>
                        )}
                        {req.status === "Accepted" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span>✓</span> Session Confirmed
                          </span>
                        )}
                        {req.status === "Rejected" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span>✕</span> Declined
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Session Format & Topic */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">Format:</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs flex items-center gap-1">
                            {req.sessionType?.toLowerCase().includes("call")
                              ? "🎧"
                              : req.sessionType?.toLowerCase().includes("video")
                              ? "📹"
                              : "💬"}{" "}
                            {req.sessionType || "1-on-1 Consultation"}
                          </span>
                        </div>
                        {req.packagePrice && (
                          <span className="text-xs font-bold text-emerald-700">
                            Est. Payout: ₹{req.packagePrice}
                          </span>
                        )}
                      </div>

                      {/* Discussion Topic & Notes */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Client Discussion Topic / Situation:
                        </span>
                        <div className="bg-white rounded-lg p-3 border border-slate-200/70 text-xs text-slate-700 leading-relaxed italic relative">
                          <span className="text-teal-500 font-serif text-base leading-none absolute -top-1 left-1.5 opacity-60">
                            “
                          </span>
                          <p className="pl-3">
                            {req.topic ||
                              "Looking for a safe, confidential space to talk through recent emotional challenges and receive supportive guidance."}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      {(u.email || u.phone) && (
                        <div className="pt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {u.email && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                              <span>✉️</span> {u.email}
                            </span>
                          )}
                          {u.phone && (
                            <a
                              href={`tel:${u.phone}`}
                              className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800 transition"
                            >
                              <span>📞</span> {u.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {req.isClaimedByOther ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
                          <span>🔒</span> Claimed & accepted by another Breakup Buddy.
                        </span>
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          Claimed by Peer
                        </span>
                      </div>
                    ) : req.status === "Pending" ? (
                      <>
                        <p className="text-xs text-slate-500 font-medium hidden sm:block">
                          First 30 Mins Free session. Accepting connects you directly with the client.
                        </p>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleRejectRequest(req.id)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-bold transition disabled:opacity-50 cursor-pointer text-center"
                          >
                            {actionLoadingId === req.id ? "Processing..." : "✕ Decline"}
                          </button>
                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 text-center"
                          >
                            {actionLoadingId === req.id ? (
                              <span>Claiming...</span>
                            ) : (
                              <>
                                <span>✓</span> Accept & Claim Request
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : req.status === "Accepted" ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                          <span>✓</span> Active session assigned to you.
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          ✓ Confirmed
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full text-xs text-slate-400">
                        <span>This request was declined.</span>
                        <span className="italic">Archived</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {filteredRequests.length > 0 &&
              renderPagination(
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
    const totalAcceptedCount = acceptedUsers.length;
    const callCount = acceptedUsers.filter((r) => (r.sessionType || "").toLowerCase().includes("call")).length;
    const chatCount = acceptedUsers.filter((r) => (r.sessionType || "").toLowerCase().includes("chat")).length;
    const videoCount = acceptedUsers.filter((r) => (r.sessionType || "").toLowerCase().includes("video")).length;

    const filtered = acceptedUsers.filter((req) => {
      const q = acceptedSearch.toLowerCase().trim();
      const u = req.user || {};
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const city = (u.city || "").toLowerCase();
      const topic = (req.topic || "").toLowerCase();
      const sessionType = (req.sessionType || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        topic.includes(q) ||
        sessionType.includes(q);

      const matchesFormat =
        acceptedFormatFilter === "all" ||
        (acceptedFormatFilter === "call" && sessionType.includes("call")) ||
        (acceptedFormatFilter === "chat" && sessionType.includes("chat")) ||
        (acceptedFormatFilter === "video" && sessionType.includes("video"));

      return matchesSearch && matchesFormat;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (acceptedSort === "newest") {
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
      }
      if (acceptedSort === "oldest") {
        return new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime();
      }
      if (acceptedSort === "name") {
        const nameA = (a.user?.name || "").toLowerCase();
        const nameB = (b.user?.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    const paginatedAccepted = sorted.slice(
      (acceptedPage - 1) * ACCEPTED_PER_PAGE,
      acceptedPage * ACCEPTED_PER_PAGE
    );

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Accepted Users</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {totalAcceptedCount} {totalAcceptedCount === 1 ? "Client" : "Clients"}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              All clients whose consultation requests you have accepted. Initiate voice calls or open direct chats anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshAccepted}
            disabled={isRefreshingAccepted}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span className={isRefreshingAccepted ? "animate-spin inline-block" : ""}>🔄</span>
            <span>{isRefreshingAccepted ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 KPI Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-teal-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Accepted Clients</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-100">
                👥
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700">{totalAcceptedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Confirmed active relationships</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Voice Calls</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100">
                🎧
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{callCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">1-on-1 audio sessions</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chat Discussions</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                💬
              </div>
            </div>
            <div className="mt-2.5">
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{chatCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Live messaging threads</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Readiness</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                🟢
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">100%</p>
                <span className="text-[11px] font-medium text-emerald-600">Connected</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Ready for call or chat</p>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by client name, email, phone, city, or topic..."
                value={acceptedSearch}
                onChange={(e) => {
                  setAcceptedSearch(e.target.value);
                  setAcceptedPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
              />
              {acceptedSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedSearch("");
                    setAcceptedPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Format Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 shrink-0 -mx-1 px-1">
              {[
                { id: "all", label: "All Formats", count: totalAcceptedCount },
                { id: "call", label: "🎧 Calls", count: callCount },
                { id: "chat", label: "💬 Chat", count: chatCount },
                ...(videoCount > 0 ? [{ id: "video", label: "📹 Video", count: videoCount }] : []),
              ].map((f) => {
                const isActive = acceptedFormatFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setAcceptedFormatFilter(f.id as any);
                      setAcceptedPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-500">Sort:</span>
              <select
                value={acceptedSort}
                onChange={(e) => setAcceptedSort(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 flex-1 sm:flex-none"
              >
                <option value="newest">Recently Accepted</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Client Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accepted Users Cards Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-slate-200 shadow-2xs">
              👥
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {acceptedSearch || acceptedFormatFilter !== "all"
                ? "No matching accepted clients found"
                : "No accepted clients yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {acceptedSearch || acceptedFormatFilter !== "all"
                ? "Try searching with a different client name, city, or reset the format filter."
                : "When you accept booking requests from the Requests tab, those clients will appear here with one-click calling and messaging."}
            </p>
            {acceptedSearch || acceptedFormatFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setAcceptedSearch("");
                  setAcceptedFormatFilter("all");
                  setAcceptedPage(1);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab("Requests")}
                className="mt-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Go to Requests Tab →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {paginatedAccepted.map((req: any) => {
              const u = req.user || {};
              const clientName = u.name || "Client";
              const initial = clientName.charAt(0).toUpperCase();

              const age = u.dateOfBirth
                ? Math.floor(
                    (new Date().getTime() - new Date(u.dateOfBirth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )
                : null;

              const reqDateStr = req.createdAt
                ? new Date(req.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent";

              const acceptedDateStr = req.updatedAt
                ? new Date(req.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : reqDateStr;

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200/90 hover:border-teal-300 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={clientName}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm border border-teal-400/30">
                              {initial}
                            </div>
                          )}
                          <span
                            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
                            title="Active Client"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-1.5 truncate">
                            {clientName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                            {u.city && u.city !== "N/A" && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <span>📍</span> {u.city}
                              </span>
                            )}
                            {age && <span>• {age} yrs</span>}
                            {u.gender && <span>• {u.gender}</span>}
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full shadow-2xs shrink-0">
                        <span>✓</span> ACCEPTED
                      </span>
                    </div>

                    {/* Booking Details Box */}
                    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200/70 text-xs space-y-3">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200/60 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-600">Format:</span>
                          <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            {req.sessionType?.toLowerCase().includes("call")
                              ? "🎧"
                              : req.sessionType?.toLowerCase().includes("video")
                              ? "📹"
                              : "💬"}{" "}
                            {req.sessionType || "1-on-1 Consultation"}
                          </span>
                        </div>
                        {req.packagePrice && (
                          <span className="font-bold text-emerald-700">₹{req.packagePrice}</span>
                        )}
                      </div>

                      {/* Discussion Topic */}
                      <div>
                        <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                          Discussion Topic / Care Reason:
                        </span>
                        <div className="bg-white p-3 rounded-lg border border-slate-200/70 text-xs text-slate-700 italic relative leading-relaxed">
                          <span className="text-teal-500 font-serif text-base leading-none absolute -top-1 left-1.5 opacity-60">
                            “
                          </span>
                          <p className="pl-3">
                            {req.topic ||
                              "General emotional support, active listening, and post-breakup guidance."}
                          </p>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 gap-2">
                        <span className="flex items-center gap-1">
                          <span>📅</span> Requested: <strong>{reqDateStr}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-teal-700">
                          <span>✓</span> Connected: <strong>{acceptedDateStr}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Contact Details Chips */}
                    {(u.email || u.phone) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {u.email && (
                          <a
                            href={`mailto:${u.email}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition"
                          >
                            <span>✉️</span> {u.email}
                          </a>
                        )}
                        {u.phone && (
                          <a
                            href={`tel:${u.phone}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-700 font-medium transition"
                          >
                            <span>📞</span> {u.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() =>
                        setBuddyActiveCall({
                          requestId: req.id,
                          targetUserId: u.id,
                          targetName: clientName,
                          callerName: displayName || user?.name || "Breakup Buddy",
                        })
                      }
                      className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition shadow-sm hover:shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>📞</span> Call Client
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChatRequestId(req.id);
                        setActiveTab("Messages");
                      }}
                      className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition border border-teal-200 text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>💬</span> Open Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {sorted.length > 0 &&
          renderPagination(
            acceptedPage,
            sorted.length,
            ACCEPTED_PER_PAGE,
            setAcceptedPage,
            "accepted clients"
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Manage Availability</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Set your weekly routine and active timeslots.</p>
          </div>
        </div>

        {/* 1. Status Card */}
        <div className={`border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isAvailableForRequests ? "bg-white border-slate-200" : "bg-amber-50/50 border-amber-200"
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Your Status</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                isAvailableForRequests
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAvailableForRequests ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isAvailableForRequests ? "Available for Requests" : "Unavailable for Requests"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAvailableForRequests
                ? "Clients browsing the Breakup Buddy directory can discover your profile and book new confidential sessions."
                : "Your card on the Breakup Buddy directory is marked as 'Unavailable for Requests' and new session bookings are disabled."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Weekly Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize time slots for each day of the week.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {daysOrder.map((dayName) => {
              const dayObj = weeklySchedule.find((s: any) => s.day === dayName);
              const slots: string[] = dayObj?.slots || [];

              return (
                <div key={dayName} className="py-3.5 sm:py-4 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                  <div className="font-bold text-slate-700 text-sm sm:pt-1.5">{dayName}</div>
                  
                  <div className="sm:col-span-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {slots.length === 0 ? (
                        <span className="text-xs italic text-slate-400">Unavailable</span>
                      ) : (
                        slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition"
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
                      <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-teal-200 p-2.5 rounded-xl animate-in fade-in max-w-full sm:max-w-md mt-2">
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#131d2e] hover:bg-slate-800 text-white font-bold text-sm shadow transition disabled:opacity-60 cursor-pointer text-center"
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Client Reviews & Ratings</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ⭐ {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Verified feedback, star ratings, and testimonials shared by clients you've supported.
            </p>
          </div>

          <button
            onClick={handleRefreshReviews}
            disabled={isRefreshingReviews}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingReviews ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingReviews ? "Refreshing..." : "Refresh Reviews"}</span>
          </button>
        </div>

        {/* Analytics & Rating Breakdown Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* 1. Overall Score Card */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between border border-slate-700/50">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Overall Rating</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {numAvg >= 4.5 ? "🌟 Top Rated" : "✨ Verified Feedback"}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3 sm:mt-4">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">{avgRating}</span>
                <span className="text-lg sm:text-xl text-slate-400 font-semibold">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-base sm:text-lg mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= Math.round(numAvg) ? "text-amber-400" : "text-slate-600"}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Based on <strong>{totalReviews}</strong> ratings</span>
              <span className="text-teal-300 font-semibold">{satisfactionPercent}% Positive</span>
            </div>
          </div>

          {/* 2. Rating Breakdown Bars */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm mb-3">Rating Breakdown</h3>
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
                    className={`w-full flex items-center gap-2.5 sm:gap-3 text-xs p-1 rounded-lg transition text-left cursor-pointer group ${
                      isSelected ? "bg-teal-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-10 sm:w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
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
                    <span className="w-12 sm:w-14 text-right text-slate-400 group-hover:text-slate-700 font-medium shrink-0">
                      {count} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Performance Insights */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center text-lg shrink-0">
                🎯
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-emerald-800">{satisfactionPercent}%</p>
                <p className="text-[11px] text-emerald-700 font-semibold">Satisfaction Rate</p>
              </div>
            </div>

            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center text-lg shrink-0">
                💬
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-teal-800">{reviewsWithComments}</p>
                <p className="text-[11px] text-teal-700 font-semibold">Detailed Comments</p>
              </div>
            </div>

            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center text-lg shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-sky-800">100%</p>
                <p className="text-[11px] text-sky-700 font-semibold">Verified Feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Star Filter Pills, Search Bar, and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          {/* Star Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
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
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer flex-1 sm:flex-none"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="highest">⭐ Highest Rating</option>
              <option value="lowest">📉 Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews Cards List */}
        {totalReviews === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl mx-auto border border-amber-200 shadow-inner">
              ⭐
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Client Reviews Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When clients complete their hourly passes or voice consultation sessions with you, their ratings and thoughtful reviews will appear here.
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl mx-auto text-slate-400">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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
                    className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-teal-100 to-emerald-200 text-teal-800 font-black text-sm flex items-center justify-center shrink-0 border border-teal-200 shadow-sm overflow-hidden">
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
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
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
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100">
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
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/60">
                        🤝 Consultation Feedback
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Earnings & Subscriptions</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Real-time revenue from user subscriptions and consultations</p>
          </div>
          <button
            onClick={fetchData}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            🔄 Refresh Earnings
          </button>
        </div>

        {/* Highlight Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-teal-100 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">💰</span>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight">₹{earnings.totalEarnings || 0}</h3>
              <p className="text-[11px] sm:text-xs text-teal-100 mt-1">✓ Credited from client passes</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Paid Packages</span>
              <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-base">📦</span>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="text-2xl sm:text-4xl font-black text-slate-800">{allEarningsSessions.length}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Completed transactions</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Paying Clients</span>
              <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-base">👥</span>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="text-2xl sm:text-4xl font-black text-slate-800">{uniqueClientsCount}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Active subscribers</p>
            </div>
          </div>
        </div>

        {/* Transactions / Subscriptions Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 font-serif text-base sm:text-lg">Subscription & Payment History</h3>
            <span className="text-xs font-semibold text-slate-400">
              {allEarningsSessions.length} Transactions
            </span>
          </div>

          {allEarningsSessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-500 space-y-3">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-teal-100">
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center shrink-0 border border-teal-200">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{u.name || "Client Subscriber"}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ PAID
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {sess.sessionType || "Hourly Unlimited Subscription Pass"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            <span>📅 {new Date(sess.scheduledAt || sess.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {u.city && <span>• 📍 {u.city}</span>}
                            {u.email && <span>• ✉️ {u.email}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 flex sm:flex-col justify-between items-center sm:items-end">
                        <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight">
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Session & Package History</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {history.length} Completed
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Historical log of all client subscriptions, hourly unlimited passes, and completed consultations.
            </p>
          </div>

          <button
            onClick={handleRefreshHistory}
            disabled={isRefreshingHistory}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingHistory ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingHistory ? "Refreshing..." : "Refresh History"}</span>
          </button>
        </div>

        {/* 3 Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-lg font-bold">
              📜
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-800">{history.length}</p>
              <p className="text-xs text-slate-500 font-semibold">Completed Passes</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-lg font-bold">
              ⏱️
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-sky-600">{totalHours} hrs</p>
              <p className="text-xs text-slate-500 font-semibold">Total Delivered</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-lg font-bold">
              💰
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600">₹{totalRevenue}</p>
              <p className="text-xs text-slate-500 font-semibold">Package Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar -mx-1 px-1">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
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

        {/* History Cards */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-teal-100">
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
                  className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl p-4 sm:p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 text-teal-800 font-black text-sm sm:text-base flex items-center justify-center shrink-0 border border-teal-200 shadow-sm overflow-hidden">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name ? u.name[0].toUpperCase() : "👤"
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">{u.name || "Client Subscriber"}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ COMPLETED
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                          ⏱️ {h.durationMinutes || 60}m
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-teal-700">
                        📦 {h.sessionType || "Hourly Unlimited Subscription Pass"}
                      </p>

                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 flex-wrap">
                        {u.city && <span>📍 {u.city}</span>}
                        {u.email && <span>✉️ {u.email}</span>}
                        {u.phone && <span>📞 {u.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between md:justify-end">
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 sm:p-3 text-xs space-y-1 text-slate-600 min-w-0 sm:min-w-[200px]">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400 font-medium">🚀 Started:</span>
                        <span className="font-bold text-slate-700 text-right">{formattedStart}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] border-t border-slate-200/60 pt-1">
                        <span className="text-slate-400 font-medium">🏁 Ended:</span>
                        <span className="font-bold text-emerald-700 text-right">{formattedEnd}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-[11px] font-semibold text-slate-400 block">Package Amount</span>
                      <div className="text-lg sm:text-xl font-black text-emerald-600 tracking-tight">
                        ₹{h.amountEarned || 0}
                      </div>
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Call Logs & History</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {totalCalls} Total
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Complete call history for all voice consultations with your clients.
            </p>
          </div>

          <button
            onClick={handleRefreshCallLogs}
            disabled={isRefreshingLogs}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span className={`inline-block ${isRefreshingLogs ? "animate-spin" : ""}`}>🔄</span>
            <span>{isRefreshingLogs ? "Refreshing..." : "Refresh Log"}</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-lg font-bold">
              📞
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{totalCalls}</p>
              <p className="text-xs text-slate-500 font-semibold">Total Calls</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-lg font-bold">
              📵
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-rose-600">{missedCalls}</p>
              <p className="text-xs text-slate-500 font-semibold">Missed Calls</p>
            </div>
          </div>
        </div>

        {/* Call Log List */}
        {callLogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center text-slate-500 shadow-sm space-y-3">
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
                    className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isMissed ? "border-rose-200 bg-rose-50/30" : "border-slate-200 hover:border-teal-200"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center shrink-0 border border-teal-200">
                        {u.name ? u.name[0].toUpperCase() : "U"}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{u.name || "User"}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap">
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
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
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
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 sm:p-2 bg-teal-50 text-teal-600 rounded-xl text-base sm:text-lg font-bold">⚙️</span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Profile & Account Settings</h2>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Customize your public consultant card, consultation specialties, and manage verification details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-60 cursor-pointer"
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

        {/* Notification Toast */}
        {settingsMessage && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2 ${
              settingsMessage.type === "success"
                ? "bg-teal-50 border-teal-200 text-teal-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
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

        {/* Sub-Tab Navigation Bar with Horizontal Touch Scroll */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar -mx-1 px-1">
          {[
            { id: "profile", label: "Public Profile", icon: "👤" },
            { id: "specialties", label: "Specialties & Services", icon: "🎯" },
            { id: "account", label: "Account & Verification", icon: "🛡️" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSettingsActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Photo & Display Name Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>📸</span> Avatar & Identity
                </h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pt-1">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl sm:text-2xl border-2 border-teal-200 overflow-hidden shadow-inner">
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
                    <label className="block text-xs font-bold text-slate-700">Profile Photo URL or Upload</label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer inline-flex items-center gap-1">
                        <span>📁 Choose image...</span>
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
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      What people call you (Display Alias / Nickname) <span className="text-teal-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Buddy Sam, Listener Alex, Hope..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      🔒 This is the only name shown to users. Your original legal name is kept 100% private.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Mumbai, India or Remote"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Bio & Intro Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
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
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition resize-none leading-relaxed"
                />
              </div>

              {/* Languages Spoken Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🗣️</span> Languages Spoken
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                    {languages.length} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {predefinedLanguages.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayItem(lang, languages, setLanguages)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white shadow-sm"
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
                    placeholder="Add other language..."
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
              <div className="lg:sticky lg:top-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    👁️ Client View Preview
                  </span>
                  <span className="text-[11px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">
                    Live Simulator
                  </span>
                </div>

                <div className="bg-white border-2 border-teal-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden bg-gradient-to-b from-teal-50/20 via-white to-white">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-600"></div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg sm:text-xl border border-teal-200 overflow-hidden shadow-sm">
                          {profilePhoto && (profilePhoto.startsWith("http") || profilePhoto.startsWith("data:")) ? (
                            <img src={profilePhoto} alt={displayName || "Buddy"} className="w-full h-full object-cover" />
                          ) : (
                            <span>{displayName ? displayName[0].toUpperCase() : "B"}</span>
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">{displayName || "Your Display Name"}</h4>
                          <span className="text-teal-600 text-sm shrink-0" title="Verified Breakup Buddy">
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

                  <div className="mt-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Speaks
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(languages.length > 0 ? languages : ["English", "Hindi"]).map((l) => (
                        <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-medium rounded-md">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Focus Areas
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(areasOfExpertise.length > 0 ? areasOfExpertise.slice(0, 3) : ["Breakup Recovery", "Moving On", "Emotional Healing"]).map((a) => (
                        <span key={a} className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] sm:text-[11px] font-bold rounded-md border border-teal-100">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {sessionTypes.includes("Chat") && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[11px]">
                          💬 Chat
                        </span>
                      )}
                      {sessionTypes.includes("Audio Call") && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[11px]">
                          📞 Voice
                        </span>
                      )}
                    </div>
                    <span className="text-teal-600 font-bold text-xs">Available Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Specialties & Services */}
        {settingsActiveTab === "specialties" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>📡</span> Consultation Channels
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable the communication modes through which users can book sessions with you.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full self-start sm:self-auto">
                  {sessionTypes.length} Active Formats
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
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
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
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
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChecked ? "bg-teal-600 text-white" : "border border-slate-300 bg-slate-50"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4 flex items-center gap-2">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🎯</span> Areas of Focus & Emotional Support
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick topics where you feel most confident offering understanding and guidance.
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full self-start sm:self-auto">
                  {areasOfExpertise.length} Topics Selected
                </span>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {expertiseCategories.map((category) => (
                  <div key={category.title} className="space-y-2.5 sm:space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {category.title}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {category.items.map((item) => {
                        const isSelected = areasOfExpertise.includes(item.name);
                        return (
                          <div
                            key={item.name}
                            onClick={() => toggleArrayItem(item.name, areasOfExpertise, setAreasOfExpertise)}
                            className={`p-3 sm:p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
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
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 mb-3 sm:mb-4">
                <span>🛡️</span> Consultant Verification Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-teal-50 border border-teal-100 flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-base sm:text-lg font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">
                      Account Status
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-teal-900">Verified & Active</span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base sm:text-lg font-bold">
                    🛡️
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                      Role Privilege
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">Breakup Buddy Specialist</span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-base sm:text-lg font-bold">
                    🔒
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Confidentiality
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">100% Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📋</span> Registered Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Registered Email ID
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{user?.email || "buddy@jabwemeet.com"}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Registered Mobile Number
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{user?.phone || "+91 ••••••••••"}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Ethics */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🤝</span>
                <h4 className="font-bold text-xs sm:text-sm">JabWeMeet Breakup Buddy Community Pledge</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As a verified Breakup Buddy on JabWeMeet, you play a vital role in supporting members during their most vulnerable moments. All conversations must maintain absolute confidentiality, kindness, empathy, and active listening. Never request or share private off-platform contact details.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-teal-400 font-bold">
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
      {/* Mobile Offcanvas Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Offcanvas Navigation Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white z-50 shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h1 className="text-xl font-bold font-serif text-slate-800 tracking-tight">
              JabWe<span className="text-teal-500">Meet</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Buddy Portal</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3">
          <nav className="space-y-1">
            {navTabs.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-teal-50 text-teal-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
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

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="block w-full text-center py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-red-100"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold font-serif text-slate-800 tracking-tight">
            JabWe<span className="text-teal-500">Meet</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Buddy Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navTabs.map((item) => (
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between px-3.5 sm:px-6 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <span className="text-xl leading-none">☰</span>
            </button>

            <div className="md:hidden font-bold font-serif text-slate-800 text-base">
              JabWe<span className="text-teal-500">Meet</span>
            </div>
            <div className="hidden md:block text-sm text-slate-500 font-bold uppercase tracking-wider">
              {activeTab}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
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
                <span className="text-lg sm:text-xl">🔔</span>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-0.5 right-0.5 px-1.5 py-0.5 min-w-[16px] text-[9px] font-extrabold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Menu */}
              {showNotificationsDropdown && (
                <div className="fixed sm:absolute top-16 sm:top-auto right-2 sm:right-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 md:w-96 max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">Notifications</span>
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

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-teal-50/50 transition cursor-pointer flex gap-3 items-start ${
                            !notif.read ? "bg-slate-50/80" : ""
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200 mt-0.5">
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

            <div
              onClick={() => setActiveTab("Settings")}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-slate-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                {displayName ? displayName[0].toUpperCase() : 'B'}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 max-w-[90px] sm:max-w-none truncate">
                {displayName || 'Buddy'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 pb-20 md:pb-8">
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

        {/* Mobile Bottom Quick Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-30 flex items-center justify-around shadow-lg">
          {[
            { id: 'Dashboard', icon: '🏠', label: 'Home' },
            { id: 'Requests', icon: '📩', label: 'Requests', badge: requests.filter((r) => r.status === 'Pending').length },
            { id: 'Accepted Users', icon: '👥', label: 'Clients' },
            { id: 'Messages', icon: '💬', label: 'Chat' },
            { id: 'Settings', icon: '⚙️', label: 'Settings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative cursor-pointer ${
                  isActive ? "text-teal-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
                }`}
              >
                <span className="text-lg relative">
                  {tab.icon}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] font-black text-white bg-amber-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
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
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 z-[200] bg-[#131d2e] border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-w-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
              {callWaiting.callerName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Call Waiting...</p>
              <p className="text-xs text-slate-400 truncate">{callWaiting.callerName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectWaiting}
              className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-xs font-semibold text-slate-300 hover:text-red-400 transition cursor-pointer text-center"
            >
              Reject
            </button>
            <button
              onClick={handleAcceptWaiting}
              className="flex-1 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg transition cursor-pointer text-center"
            >
              End & Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
