"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Calendar,
  Star,
  Shield,
  ShieldAlert,
  MapPin,
  BadgeCheck,
  CreditCard,
  MessageCircle,
  FileText,
  User,
  ExternalLink,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminBreakupBuddyDetailPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const params = useParams();
  const router = useRouter();
  const buddyId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sessions" | "requests" | "reviews" | "calls" | "governance">("sessions");
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function fetchDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${buddyId}/details`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setInternalNotes(json.user?.internalNotes || "");
      } else {
        alert({
          title: "Not Found",
          message: json.message || "Failed to load Breakup Buddy details.",
          type: "danger",
        });
      }
    } catch (e: any) {
      console.error(e);
      alert({
        title: "Error",
        message: "Failed to load Breakup Buddy details from server.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (buddyId) fetchDetails();
  }, [buddyId]);

  async function handleToggleStatus() {
    if (!data?.user) return;
    const isCurrentlyActive = data.user.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE";
    const actionLabel = isCurrentlyActive ? "Suspend" : "Reactivate";

    const confirmed = await confirm({
      title: `${actionLabel} Breakup Buddy?`,
      message: isCurrentlyActive
        ? `Are you sure you want to SUSPEND ${data.user.displayName || data.user.name}? This disables client requests and sends an official suspension notification email.`
        : `Reactivate ${data.user.displayName || data.user.name}? They will immediately be available for client sessions, and an activation email will be sent.`,
      type: isCurrentlyActive ? "warning" : "confirm",
      confirmText: `${actionLabel} Buddy`,
      isDestructive: isCurrentlyActive,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${buddyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          reason: isCurrentlyActive ? "Administrative suspension" : "Account reactivated by administrator",
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast(`Breakup Buddy successfully ${nextStatus.toLowerCase()}! Email dispatched.`, "success");
        fetchDetails();
      } else {
        alert({ title: "Failed", message: resJson.message || "Could not update status.", type: "danger" });
      }
    } catch (err: any) {
      alert({ title: "Error", message: "Network error updating status.", type: "danger" });
    }
  }

  async function handleToggleVerify() {
    if (!data?.user) return;
    const nextVerify = !data.user.isVerified;
    try {
      const res = await fetch(`/api/admin/staff/${buddyId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: nextVerify }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast(`Verification badge ${nextVerify ? "granted to" : "revoked from"} this Breakup Buddy`, "success");
        setData((prev: any) => ({
          ...prev,
          user: { ...prev.user, isVerified: nextVerify },
        }));
      }
    } catch (err) {
      alert({ title: "Error", message: "Failed to update verification status.", type: "danger" });
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/breakup-buddies/${buddyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: internalNotes }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast("Internal notes updated successfully", "success");
      } else {
        alert({ title: "Failed", message: resJson.message || "Failed to save notes.", type: "danger" });
      }
    } catch (e) {
      alert({ title: "Error", message: "Failed to save internal notes.", type: "danger" });
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 animate-pulse space-y-3">
        <Heart className="w-8 h-8 text-[#7E2248] mx-auto animate-bounce" />
        <div className="text-sm font-semibold">Loading Breakup Buddy profile & session metrics...</div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-serif font-bold text-slate-900">Breakup Buddy Not Found</h2>
        <p className="text-xs text-slate-500">The requested Breakup Buddy account could not be located.</p>
        <Link
          href="/admin/breakup-buddies"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-700 text-xs font-bold transition border border-rose-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Breakup Buddies</span>
        </Link>
      </div>
    );
  }

  const { user, analytics = {}, sessions = [], requests = [], callLogs = [], reviews = [] } = data;
  const isActive = user.status === "ACTIVE";

  return (
    <div className="space-y-6 pb-20">
      {/* TOP BAR / NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/breakup-buddies"
            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-slate-900 border border-rose-200 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight">
                {user.displayName || user.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                {user.status || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Breakup Buddy Personnel Profile • ID: <span className="font-mono text-slate-600">{user.id}</span>
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleVerify}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              user.isVerified
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white hover:bg-rose-50 text-slate-600 border-rose-200"
            }`}
          >
            <BadgeCheck className="w-4 h-4 text-blue-600" />
            <span>{user.isVerified ? "Verified Badge Active" : "Grant Verified Badge"}</span>
          </button>

          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              isActive
                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isActive ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Suspend Buddy</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Reactivate Buddy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PROFILE HEADER BANNER */}
      <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-serif font-black text-2xl text-[#7E2248] overflow-hidden shrink-0 shadow-xs">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-slate-900">{user.displayName || user.name}</h2>
                {user.displayName && user.displayName !== user.name && (
                  <span className="text-xs text-slate-500">({user.name})</span>
                )}
                {user.isVerified && (
                  <span title="Verified Personnel">
                    <BadgeCheck className="w-4 h-4 text-blue-600" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                {user.shortBio || "Dedicated listener providing non-judgmental empathy and heartbreak healing support."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {user.city || "Online / Nationwide"}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {user.phone || "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* AVAILABILITY SUMMARY */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5 text-xs sm:min-w-[220px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Availability Window</div>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>
                {user.availableTimeStart && user.availableTimeEnd
                  ? `${user.availableTimeStart} - ${user.availableTimeEnd}`
                  : "09:00 - 22:00 (Standard)"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Active Days: {user.availableDays?.length > 0 ? user.availableDays.join(", ") : "All 7 Days"}
            </div>
          </div>
        </div>

        {/* EXPERTISE AND LANGUAGES */}
        <div className="pt-4 border-t border-rose-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Areas of Focus:</span>
            <div className="flex flex-wrap gap-1">
              {user.areasOfExpertise?.length > 0 ? (
                user.areasOfExpertise.map((area: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-[#7E2248] font-medium text-[11px] border border-rose-200/60">
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">Emotional Support, Listening</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Languages:</span>
            <div className="flex flex-wrap gap-1">
              {user.languages?.length > 0 ? (
                user.languages.map((lang: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 text-[11px]">English, Hindi</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 KEY KPI STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Sessions Conducted</span>
            <Clock className="w-3.5 h-3.5 text-[#7E2248]" />
          </div>
          <div className="text-2xl font-serif font-black text-slate-900">{analytics.totalSessions || 0}</div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {analytics.completedSessions || 0} completed • {analytics.scheduledSessions || 0} upcoming
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Call Minutes</span>
            <Phone className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-black text-blue-700">{analytics.totalCallMinutes || 0} min</div>
          <div className="text-[11px] text-slate-500">Total verified audio talk time</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Client Requests</span>
            <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-2xl font-serif font-black text-purple-700">{analytics.totalRequests || 0}</div>
          <div className="text-[11px] text-slate-500">{analytics.activeRequests || 0} active / ongoing</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Earnings Generated</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-black text-emerald-700">
            ₹{analytics.totalEarnings ? Number(analytics.totalEarnings).toLocaleString() : "0"}
          </div>
          <div className="text-[11px] text-slate-500">{analytics.packagesPurchased || 0} packages attributed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-1 col-span-2 md:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Client Rating</span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-center gap-1.5 text-2xl font-serif font-black text-amber-600">
            <span>{analytics.avgRating ? Number(analytics.avgRating).toFixed(1) : "5.0"}</span>
            <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
          </div>
          <div className="text-[11px] text-slate-500">{analytics.totalReviews || 0} verified client reviews</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-rose-100 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "sessions", label: `Session History (${sessions.length})`, icon: Clock },
          { id: "requests", label: `Connection Requests (${requests.length})`, icon: MessageCircle },
          { id: "reviews", label: `Client Reviews (${reviews.length})`, icon: Star },
          { id: "calls", label: `Call Logs (${callLogs.length})`, icon: Phone },
          { id: "governance", label: "Admin Notes & Governance", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
                isSelected
                  ? "bg-[#7E2248] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-rose-50 border border-rose-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: SESSIONS */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-900 text-sm">Conducted & Scheduled Buddy Sessions</h3>
            <span className="text-xs text-slate-500">Total: {sessions.length} sessions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="px-5 py-3.5">Client User</th>
                  <th className="px-4 py-3.5">Scheduled Date & Time</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Amount Earned</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No sessions recorded for this Breakup Buddy yet.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{s.user?.name || "Anonymous Member"}</div>
                        <div className="text-[11px] text-slate-500">{s.user?.email || "No email"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {new Date(s.scheduledAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-4">{s.durationMinutes || 30} mins</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-[11px] text-[#7E2248] border border-rose-200/60">
                          {s.sessionType || "Call / Chat"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-emerald-700">
                        ₹{s.amountEarned || 0}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            s.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-900 text-sm">Client Connection Requests</h3>
            <span className="text-xs text-slate-500">Total: {requests.length} requests</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="px-5 py-3.5">Client User</th>
                  <th className="px-4 py-3.5">Topic / Focus</th>
                  <th className="px-4 py-3.5">Time Consumed</th>
                  <th className="px-4 py-3.5">Package</th>
                  <th className="px-4 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                      No connection requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{r.user?.name || "Client"}</div>
                        <div className="text-[11px] text-slate-500">{r.user?.phone || r.user?.email || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700 max-w-xs truncate">
                        {r.topic || "General Healing & Listening"}
                      </td>
                      <td className="px-4 py-4">
                        {Math.round((r.timeUsedSeconds || 0) / 60)} min / {Math.round((r.chatLimitSeconds || 900) / 60)} min
                      </td>
                      <td className="px-4 py-4">
                        {r.packageName ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            {r.packageName} (₹{r.packagePrice || 0})
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Free Tier</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REVIEWS */}
      {activeTab === "reviews" && (
        <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-sm">Verified Client Reviews & Feedback</h3>
              <p className="text-xs text-slate-500">Ratings submitted by users after sessions.</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{analytics.avgRating ? Number(analytics.avgRating).toFixed(1) : "5.0"} Average</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              No reviews submitted for this Breakup Buddy yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic">
                    "{rev.comment || "Great listening and supportive conversation."}"
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-rose-100">
                    Client: <strong className="text-slate-800">{rev.user?.name || "Anonymous Member"}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CALL LOGS */}
      {activeTab === "calls" && (
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-900 text-sm">Call Logs & Voice Transcripts</h3>
            <span className="text-xs text-slate-500">Total: {callLogs.length} call records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="px-5 py-3.5">Caller</th>
                  <th className="px-4 py-3.5">Receiver</th>
                  <th className="px-4 py-3.5">Started At</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {callLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                      No call records found for this Breakup Buddy.
                    </td>
                  </tr>
                ) : (
                  callLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">{log.caller?.name || "User"}</td>
                      <td className="px-4 py-4 text-slate-700">{log.receiver?.name || "Buddy"}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(log.startedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-4 font-bold text-blue-700">
                        {Math.floor((log.durationSec || 0) / 60)}m {(log.durationSec || 0) % 60}s
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            log.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GOVERNANCE & INTERNAL NOTES */}
      {activeTab === "governance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-slate-900 text-sm">Internal Admin Notes & Compliance</h3>
            <p className="text-xs text-slate-500">
              Private notes visible only to platform administrators regarding performance, warnings, or background checks.
            </p>
            <textarea
              rows={6}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record administrative observations, client feedback notes, or probationary guidelines..."
              className="w-full p-3 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : "Save Admin Notes"}
            </button>
          </div>

          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-serif font-bold text-slate-900 text-sm">KYC & Identity Verification Summary</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">ID Document Type</span>
                  <strong className="text-slate-800">{user.idType || "Government National ID / Aadhaar"}</strong>
                </div>
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Email Verification</span>
                  <strong className="text-slate-800">{user.email}</strong>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Phone Verification</span>
                  <strong className="text-slate-800">{user.phone || "Verified"}</strong>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
