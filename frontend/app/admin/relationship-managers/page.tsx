"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  Calendar,
  Eye,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
  Plus,
  RefreshCw,
  MapPin,
  BadgeCheck,
  Key,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminRelationshipManagersPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [managers, setManagers] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    experience: "",
    notes: "",
  });

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "RM@";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  }

  async function fetchRMs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/relationship-managers", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers || []);
        setPendingRequestsCount(data.pendingRequestsCount || 0);
      }
    } catch (e) {
      console.error("Failed to load RMs:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRMs();
  }, []);

  async function handleCreateRM(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim()) {
      alert({
        title: "Missing Fields",
        message: "Full Name, Email Address, Phone Number, and Temporary Password are required.",
        type: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          role: "MATCHMAKER",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Relationship Manager "${formData.name}" created successfully! Login credentials emailed.`, "success");
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          city: "",
          experience: "",
          notes: "",
        });
        fetchRMs();
      } else {
        alert({
          title: "Registration Failed",
          message: data.message || "Failed to create Relationship Manager account.",
          type: "danger",
        });
      }
    } catch (err: any) {
      alert({
        title: "Server Error",
        message: err.message || "An error occurred while connecting to the server.",
        type: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(manager: any) {
    const isCurrentlyActive = manager.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE";
    const actionLabel = isCurrentlyActive ? "Suspend" : "Reactivate";

    const confirmed = await confirm({
      title: `${actionLabel} Relationship Manager?`,
      message: isCurrentlyActive
        ? `Are you sure you want to SUSPEND ${manager.name}? Their matchmaking assignments will be paused, and an official suspension notification will be emailed to ${manager.email}.`
        : `Reactivate ${manager.name}? They will immediately be available to manage clients and curate matches, and an activation email will be sent.`,
      type: isCurrentlyActive ? "warning" : "confirm",
      confirmText: `${actionLabel} Account`,
      isDestructive: isCurrentlyActive,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${manager.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          reason: isCurrentlyActive ? "Administrative suspension" : "Account reactivated by administrator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Relationship Manager successfully ${nextStatus.toLowerCase()}! Email dispatched.`, "success");
        fetchRMs();
      } else {
        alert({
          title: "Action Failed",
          message: data.message || "Failed to update account status.",
          type: "danger",
        });
      }
    } catch (e: any) {
      alert({
        title: "Network Error",
        message: "Failed to communicate with server.",
        type: "danger",
      });
    }
  }

  async function handleToggleVerify(manager: any) {
    const nextVerify = !manager.isVerified;
    try {
      const res = await fetch(`/api/admin/staff/${manager.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: nextVerify }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Verified status ${nextVerify ? "granted to" : "revoked from"} ${manager.name}`, "success");
        setManagers((prev) =>
          prev.map((m) => (m.id === manager.id ? { ...m, isVerified: nextVerify } : m))
        );
      } else {
        alert({ title: "Failed", message: data.message || "Failed to update verification.", type: "danger" });
      }
    } catch (e) {
      alert({ title: "Error", message: "Network error updating verification status.", type: "danger" });
    }
  }

  // Filter managers
  const filteredManagers = managers.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.city || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return m.status === "ACTIVE";
    if (statusFilter === "SUSPENDED") return m.status === "SUSPENDED";
    return true;
  });

  const totalManagers = managers.length;
  const activeManagers = managers.filter((m) => m.status === "ACTIVE").length;
  const suspendedManagers = managers.filter((m) => m.status === "SUSPENDED").length;
  const totalAssignedClients = managers.reduce((acc, m) => acc + (m.assignedClientsCount || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Curated Matchmaking & Advisory Personnel
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Relationship Managers (RMs)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Register and govern dedicated Relationship Managers. Manage client portfolio assignments, monitor match suggestions and appointment schedules, toggle status, and inspect performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/matchmaking"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Pipeline ({pendingRequestsCount} new)</span>
          </Link>
          <button
            onClick={() => {
              generatePassword();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Relationship Manager</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total RMs</div>
            <div className="text-xl font-black text-white">{totalManagers}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active & Approved</div>
            <div className="text-xl font-black text-emerald-400">{activeManagers}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Suspended</div>
            <div className="text-xl font-black text-rose-400">{suspendedManagers}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clients Managed</div>
            <div className="text-xl font-black text-indigo-400">{totalAssignedClients}</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f172a] p-3 rounded-2xl border border-white/10">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === tab
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
              }`}
            >
              {tab === "ALL" ? `All (${totalManagers})` : tab === "ACTIVE" ? `Active (${activeManagers})` : `Suspended (${suspendedManagers})`}
            </button>
          ))}
          <button
            onClick={fetchRMs}
            title="Refresh List"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition border border-white/5 ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* RMs CARDS GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 animate-pulse text-sm">
          Loading Relationship Managers roster...
        </div>
      ) : filteredManagers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a] border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-base">No Relationship Managers Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No Relationship Managers match your search criteria. Try adjusting filters."
              : "No Relationship Managers registered yet. Click 'Add New Relationship Manager' to onboard one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredManagers.map((manager) => {
            const isActive = manager.status === "ACTIVE";
            return (
              <div
                key={manager.id}
                className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 shadow-xl hover:border-purple-500/30 transition flex flex-col justify-between group"
              >
                {/* CARD TOP ROW */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#182337] border border-white/10 flex items-center justify-center font-black text-white text-base overflow-hidden shrink-0 shadow-inner">
                        {manager.profileImage ? (
                          <img src={manager.profileImage} alt={manager.name} className="w-full h-full object-cover" />
                        ) : (
                          manager.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight group-hover:text-purple-400 transition">
                          {manager.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{manager.city || "Online / Flexible"}</span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS PILL */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                        {manager.status || "ACTIVE"}
                      </span>

                      {/* VERIFIED BADGE TOGGLE */}
                      <button
                        onClick={() => handleToggleVerify(manager)}
                        title={manager.isVerified ? "Verified Manager (Click to Revoke)" : "Unverified (Click to Verify)"}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                          manager.isVerified
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                            : "bg-white/5 text-slate-500 border-white/10 hover:text-slate-300"
                        }`}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        <span>{manager.isVerified ? "Verified" : "Unverified"}</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTACT INFO */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{manager.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{manager.phone || "No phone registered"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Joined {manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : "Recently"}</span>
                    </div>
                  </div>

                  {/* QUICK STATS ROW */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-semibold">Clients</span>
                      <span className="font-black text-emerald-400 text-sm">{manager.assignedClientsCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-semibold">Suggestions</span>
                      <span className="font-black text-purple-400 text-sm">{manager.madeSuggestionsCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block font-semibold">Appointments</span>
                      <span className="font-black text-indigo-400 text-sm">{manager.appointmentsCount || 0}</span>
                    </div>
                  </div>

                  {/* EXPERIENCE SUMMARY */}
                  {manager.workExperience && (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300 flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{manager.workExperience}</p>
                    </div>
                  )}
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
                  <Link
                    href={`/admin/relationship-managers/${manager.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition border border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>View Details</span>
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(manager)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Register Relationship Manager</h2>
                  <p className="text-xs text-slate-400">Onboards a matchmaker & emails their credentials automatically.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRM} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name (Legal Name) <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="vikram@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone Number <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Temporary Password <span className="text-purple-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                  >
                    <Key className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-emerald-400 font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Password will be emailed to this Relationship Manager for logging into their matchmaker portal.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City / Region Base</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience / Background</label>
                  <input
                    type="text"
                    placeholder="e.g. 5+ years elite matchmaking"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Internal Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Senior matchmaker with background in psychology and executive dating..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
                >
                  {submitting ? "Registering & Sending Email..." : "Create & Send Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
