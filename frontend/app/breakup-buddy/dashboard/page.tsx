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
  const [profilePhoto, setProfilePhoto] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [areasOfExpertise, setAreasOfExpertise] = useState<string[]>([]);
  const [sessionTypes, setSessionTypes] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeStart, setAvailableTimeStart] = useState("");
  const [availableTimeEnd, setAvailableTimeEnd] = useState("");
  const [saving, setSaving] = useState(false);

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
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "hourly" | "session">("all");

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
          setShortBio(d.user.shortBio || "");
          setLanguages(d.user.languages || []);
          setAreasOfExpertise(d.user.areasOfExpertise || []);
          setSessionTypes(d.user.sessionTypes || []);
          setAvailableDays(d.user.availableDays || []);
          setAvailableTimeStart(d.user.availableTimeStart || "");
          setAvailableTimeEnd(d.user.availableTimeEnd || "");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profilePhoto,
          displayName,
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
        alert("Profile saved successfully!");
      } else {
        alert("Error saving profile: " + data.message);
      }
    } catch (e) {
      alert("Error saving profile.");
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
                onClick={() => setRequestFilter(filter)}
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
          filteredRequests.map((req: any) => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
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
          ))
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
              onChange={(e) => setAcceptedSearch(e.target.value)}
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
            {filtered.map((req: any) => {
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
            <p className="text-slate-500 text-sm mt-0.5">Set your weekly routine, active timeslots, and blocked days.</p>
          </div>
        </div>

        {/* 1. Your Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Your Status</h3>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailableForRequests ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className={isAvailableForRequests ? "text-emerald-700" : "text-slate-500"}>
                {isAvailableForRequests ? "Available for Requests" : "Unavailable for Requests"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Accept new requests</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isAvailableForRequests;
                setIsAvailableForRequests(nextVal);
                handleSaveAvailability({ isAvailableForRequests: nextVal });
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                isAvailableForRequests ? "bg-teal-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isAvailableForRequests ? "translate-x-6" : "translate-x-0"
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

        {/* 3. Block Date Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Block Date</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prevent users from booking when you are unavailable.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={() => {
                if (!newBlockDate) return;
                if (!blockedDates.includes(newBlockDate)) {
                  const updated = [...blockedDates, newBlockDate].sort();
                  setBlockedDates(updated);
                  handleSaveAvailability({ blockedDates: updated });
                }
                setNewBlockDate("");
              }}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200 cursor-pointer"
            >
              Block
            </button>
          </div>

          {blockedDates.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Currently Blocked Dates:</p>
              <div className="flex flex-wrap gap-2">
                {blockedDates.map((dStr) => (
                  <div key={dStr} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    <span>📅 {dStr}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = blockedDates.filter((x) => x !== dStr);
                        setBlockedDates(updated);
                        handleSaveAvailability({ blockedDates: updated });
                      }}
                      className="text-rose-400 hover:text-rose-600 font-bold text-sm ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviews = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Reviews</h2>
      {reviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">No reviews yet.</div>
      ) : (
        reviews.map((rev: any) => (
          <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-lg ${i < rev.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
              ))}
              <span className="text-slate-400 text-xs ml-2">{new Date(rev.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-700 text-sm mb-4">"{rev.comment}"</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">- {rev.user?.name || 'Anonymous'}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );


  const renderEarnings = () => {
    const uniqueClientsCount = new Set((earnings.sessions || []).map((s: any) => s.userId).filter(Boolean)).size;

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
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{earnings.sessions?.length || 0}</h3>
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
              {earnings.sessions?.length || 0} Transactions
            </span>
          </div>

          {(!earnings.sessions || earnings.sessions.length === 0) ? (
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
            <div className="space-y-3">
              {earnings.sessions.map((sess: any) => {
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
                onClick={() => setHistoryFilter(tab.id)}
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
              onChange={(e) => setHistorySearch(e.target.value)}
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
            {filteredHistory.map((h: any) => {
              const u = h.user || {};
              const startedDate = h.startedAt ? new Date(h.startedAt) : new Date(h.scheduledAt || h.createdAt);
              const completedDate = h.completedAt
                ? new Date(h.completedAt)
                : new Date(startedDate.getTime() + (h.durationMinutes || 60) * 60000);

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
      </div>
    );
  };


  const renderCallLogs = () => {
    const totalCalls = callLogs.length;
    const missedCalls = callLogs.filter((c: any) => c.status === "MISSED").length;

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
          <div className="space-y-3">
            {callLogs.map((log: any) => {
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
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Profile Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Set up your profile to start listening and helping others.</p>
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-sm transition disabled:opacity-60">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setProfilePhoto(e.target.files[0].name);
                }
              }}
              className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-colors"
            />
            {profilePhoto && <p className="text-xs text-teal-600 font-medium mt-2">✓ Current: {profilePhoto}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you appear to others"
              className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
          <textarea
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            placeholder="A little bit about you..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Languages</label>
          <div className="flex gap-2 flex-wrap">
            {['English', 'Hindi', 'Spanish', 'French', 'Kannada'].map(lang => (
              <label key={lang} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm cursor-pointer hover:bg-slate-100 text-slate-700 transition">
                <input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleArrayItem(lang, languages, setLanguages)} className="accent-teal-500 w-3.5 h-3.5" />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Areas I Can Listen To:</label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['Breakup', 'Relationship Problems', 'Loneliness', 'Moving On', 'Dating Experiences', 'General Conversation'].map(area => (
              <label key={area} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition">
                <input type="checkbox" checked={areasOfExpertise.includes(area)} onChange={() => toggleArrayItem(area, areasOfExpertise, setAreasOfExpertise)} className="accent-teal-500 w-4 h-4 rounded" />
                {area}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold font-serif text-slate-800 mb-4">Services</h3>
          <div className="mb-6">
            <div className="flex gap-6">
              {['Chat', 'Audio Call'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium text-sm transition">
                  <input type="checkbox" checked={sessionTypes.includes(type)} onChange={() => toggleArrayItem(type, sessionTypes, setSessionTypes)} className="accent-teal-500 w-4 h-4 rounded" />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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


