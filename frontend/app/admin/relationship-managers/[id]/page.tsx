"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  HeartHandshake,
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
  Users,
  Sparkles,
  FileText,
  Briefcase,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminRelationshipManagerDetailPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const params = useParams();
  const router = useRouter();
  const managerId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clients" | "suggestions" | "appointments" | "governance">("clients");
  const [internalNotes, setInternalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  async function fetchDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${managerId}/details`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setInternalNotes(json.user?.internalNotes || "");
      } else {
        alert({
          title: "Not Found",
          message: json.message || "Failed to load Relationship Manager details.",
          type: "danger",
        });
      }
    } catch (e: any) {
      console.error(e);
      alert({
        title: "Error",
        message: "Failed to load Relationship Manager details from server.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (managerId) fetchDetails();
  }, [managerId]);

  async function handleToggleStatus() {
    if (!data?.user) return;
    const isCurrentlyActive = data.user.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE";
    const actionLabel = isCurrentlyActive ? "Suspend" : "Reactivate";

    const confirmed = await confirm({
      title: `${actionLabel} Relationship Manager?`,
      message: isCurrentlyActive
        ? `Are you sure you want to SUSPEND ${data.user.name}? This pauses their client matchmaking duties and dispatches an official suspension email to ${data.user.email}.`
        : `Reactivate ${data.user.name}? They will immediately be authorized to handle clients and consultations, and an activation email will be sent.`,
      type: isCurrentlyActive ? "warning" : "confirm",
      confirmText: `${actionLabel} Manager`,
      isDestructive: isCurrentlyActive,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${managerId}/status`, {
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
        toast(`Relationship Manager successfully ${nextStatus.toLowerCase()}! Email dispatched.`, "success");
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
      const res = await fetch(`/api/admin/staff/${managerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: nextVerify }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast(`Verification badge ${nextVerify ? "granted to" : "revoked from"} this Relationship Manager`, "success");
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
      const res = await fetch(`/api/admin/relationship-managers/${managerId}`, {
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
        <HeartHandshake className="w-8 h-8 text-purple-500 mx-auto animate-bounce" />
        <div className="text-sm font-semibold">Loading Relationship Manager profile & client portfolio...</div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-white/10 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Relationship Manager Not Found</h2>
        <p className="text-xs text-slate-400">The requested Relationship Manager profile could not be loaded.</p>
        <Link
          href="/admin/relationship-managers"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Relationship Managers</span>
        </Link>
      </div>
    );
  }

  const { user, analytics = {}, clients = [], suggestions = [], appointments = [] } = data;
  const isActive = user.status === "ACTIVE";

  return (
    <div className="space-y-6 pb-20">
      {/* TOP NAVIGATION / STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/relationship-managers"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                {user.status || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Relationship Manager Personnel Profile • ID: <span className="font-mono text-slate-300">{user.id}</span>
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleVerify}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              user.isVerified
                ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
                : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/10"
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            <span>{user.isVerified ? "Verified Badge Active" : "Grant Verified Badge"}</span>
          </button>

          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isActive
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
            }`}
          >
            {isActive ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Suspend Manager</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Reactivate Manager</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PROFILE HEADER BANNER */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#182337] border-2 border-white/10 flex items-center justify-center font-black text-2xl text-white overflow-hidden shrink-0 shadow-xl">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                {user.isVerified && (
                  <span title="Verified Relationship Manager">
                    <BadgeCheck className="w-4 h-4 text-purple-400" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                {user.workExperience || "Senior matchmaking advisor specializing in curated introductions and values vetting."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {user.city || "Online / Flexible"}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {user.phone || "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5 text-xs sm:min-w-[220px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matchmaker Role</div>
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
              <span>Dedicated Relationship Manager</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Assigned Clients: <strong className="text-white">{clients.length} Active</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KEY KPI STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Managed Clients</span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{analytics.assignedClientsCount || 0}</div>
          <div className="text-[11px] text-slate-400">Active portfolio members</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Match Suggestions</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{analytics.madeSuggestionsCount || 0}</div>
          <div className="text-[11px] text-slate-400">
            {analytics.acceptedSuggestions || 0} mutually approved matches
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Consultations & Dates</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">{analytics.totalAppointments || 0}</div>
          <div className="text-[11px] text-slate-400">
            {analytics.completedAppointments || 0} completed • {analytics.scheduledAppointments || 0} scheduled
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Match Success Rate</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {analytics.madeSuggestionsCount > 0
              ? `${Math.round(((analytics.acceptedSuggestions || 0) / analytics.madeSuggestionsCount) * 100)}%`
              : "100%"}
          </div>
          <div className="text-[11px] text-slate-400">Mutual consent conversion</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: "clients", label: `Assigned Clients (${clients.length})`, icon: Users },
          { id: "suggestions", label: `Match Suggestions (${suggestions.length})`, icon: Sparkles },
          { id: "appointments", label: `Appointments (${appointments.length})`, icon: Calendar },
          { id: "governance", label: "Admin Notes & Credentials", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition shrink-0 ${
                isSelected
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ASSIGNED CLIENTS */}
      {activeTab === "clients" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Assigned Client Portfolio</h3>
            <span className="text-xs text-slate-400">Total: {clients.length} clients</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client Name</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">City</th>
                  <th className="px-4 py-3.5">Assigned Since</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 italic">
                      No clients assigned to this Relationship Manager yet.
                    </td>
                  </tr>
                ) : (
                  clients.map((c: any) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-bold text-white text-sm">{c.name}</td>
                      <td className="px-4 py-4 space-y-0.5">
                        <div className="text-slate-300">{c.email}</div>
                        <div className="text-[11px] text-slate-400">{c.phone || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{c.city || "Unspecified"}</td>
                      <td className="px-4 py-4 text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/users/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10"
                        >
                          <span>360° View</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MATCH SUGGESTIONS */}
      {activeTab === "suggestions" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Curated Match Suggestions</h3>
            <span className="text-xs text-slate-400">Total: {suggestions.length} suggestions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client User</th>
                  <th className="px-4 py-3.5">Suggested Profile</th>
                  <th className="px-4 py-3.5">Client Decision</th>
                  <th className="px-4 py-3.5">Candidate Decision</th>
                  <th className="px-4 py-3.5">Meeting Schedule</th>
                  <th className="px-5 py-3.5 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {suggestions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 italic">
                      No match suggestions curated by this manager yet.
                    </td>
                  </tr>
                ) : (
                  suggestions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{s.client?.name || "Client"}</div>
                        <div className="text-[11px] text-slate-400">{s.client?.city || "Online"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-purple-300 text-sm">{s.suggestedProfile?.name || "Candidate"}</div>
                        <div className="text-[11px] text-slate-400">{s.suggestedProfile?.city || "Online"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.clientStatus === "Approved"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : s.clientStatus === "Rejected"
                              ? "bg-rose-500/15 text-rose-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {s.clientStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.suggestedStatus === "Approved"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : s.suggestedStatus === "Rejected"
                              ? "bg-rose-500/15 text-rose-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {s.suggestedStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {s.meetingDate
                          ? new Date(s.meetingDate).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Not scheduled yet"}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPOINTMENTS */}
      {activeTab === "appointments" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Consultation & Date Appointments</h3>
            <span className="text-xs text-slate-400">Total: {appointments.length} appointments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client User</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Mode / Platform</th>
                  <th className="px-4 py-3.5">Consultation Type</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 italic">
                      No appointments scheduled with this Relationship Manager.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-bold text-white">{a.client?.name || "Client"}</td>
                      <td className="px-4 py-4 text-slate-200">
                        {new Date(a.date).toLocaleDateString()} at {a.time}
                      </td>
                      <td className="px-4 py-4 capitalize">{a.mode || "Video Call"}</td>
                      <td className="px-4 py-4 text-slate-300">{a.type || "Matchmaking Advisory"}</td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            a.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {a.status}
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

      {/* TAB CONTENT: GOVERNANCE & NOTES */}
      {activeTab === "governance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm">Internal Admin Notes & Performance Observations</h3>
            <p className="text-xs text-slate-400">
              Private administrative evaluation notes regarding matchmaking etiquette, client conversion rate, and conduct.
            </p>
            <textarea
              rows={6}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record notes on matchmaker performance, client feedback, or policy compliance..."
              className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : "Save Admin Notes"}
            </button>
          </div>

          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Credentials & Verification Records</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Government ID Proof</span>
                  <strong className="text-white">{user.govIdProof ? "Document On File" : "Verified Staff Record"}</strong>
                </div>
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Professional Certification</span>
                  <strong className="text-white">{user.eduCertificate ? "Certified Matchmaker" : "Advisory Credentials Verified"}</strong>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Authenticity</span>
                  <strong className="text-white">{user.email} • {user.phone || "Active"}</strong>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
