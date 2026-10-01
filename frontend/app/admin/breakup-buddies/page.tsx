"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  MapPin,
  Eye,
  Star,
  Filter,
  RefreshCw,
  X,
  Key,
  Briefcase,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminBreakupBuddiesPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [buddies, setBuddies] = useState<any[]>([]);
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
    specialization: "",
    notes: "",
  });

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "BB@";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  }

  async function fetchBuddies() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/breakup-buddies", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBuddies(data.buddies || []);
      }
    } catch (e) {
      console.error("Failed to load buddies:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuddies();
  }, []);

  async function handleCreateBuddy(e: React.FormEvent) {
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
          role: "BREAKUP_BUDDY",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Breakup Buddy "${formData.name}" registered successfully! Login credentials emailed.`, "success");
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          city: "",
          experience: "",
          specialization: "",
          notes: "",
        });
        fetchBuddies();
      } else {
        alert({
          title: "Registration Failed",
          message: data.message || "Failed to create Breakup Buddy account.",
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

  async function handleToggleStatus(buddy: any) {
    const isCurrentlyActive = buddy.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE";
    const actionLabel = isCurrentlyActive ? "Suspend" : "Reactivate";

    const confirmed = await confirm({
      title: `${actionLabel} Breakup Buddy?`,
      message: isCurrentlyActive
        ? `Are you sure you want to SUSPEND ${buddy.displayName || buddy.name}? Their profile will be hidden from client searches, and an official suspension notification will be emailed to ${buddy.email}.`
        : `Reactivate ${buddy.displayName || buddy.name}? They will immediately be able to take client requests, and an activation email will be sent.`,
      type: isCurrentlyActive ? "warning" : "confirm",
      confirmText: `${actionLabel} Account`,
      isDestructive: isCurrentlyActive,
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${buddy.id}/status`, {
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
        toast(`Breakup Buddy successfully ${nextStatus.toLowerCase()}! Email dispatched.`, "success");
        fetchBuddies();
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

  async function handleToggleVerify(buddy: any) {
    const nextVerify = !buddy.isVerified;
    try {
      const res = await fetch(`/api/admin/staff/${buddy.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified: nextVerify }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Verified status ${nextVerify ? "granted to" : "revoked from"} ${buddy.name}`, "success");
        setBuddies((prev) =>
          prev.map((b) => (b.id === buddy.id ? { ...b, isVerified: nextVerify } : b))
        );
      } else {
        alert({ title: "Failed", message: data.message || "Failed to update verification.", type: "danger" });
      }
    } catch (e) {
      alert({ title: "Error", message: "Network error updating verification status.", type: "danger" });
    }
  }

  // Filter buddies
  const filteredBuddies = buddies.filter((b) => {
    const matchesSearch =
      (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return b.status === "ACTIVE";
    if (statusFilter === "SUSPENDED") return b.status === "SUSPENDED";
    return true;
  });

  const totalBuddies = buddies.length;
  const activeBuddies = buddies.filter((b) => b.status === "ACTIVE").length;
  const suspendedBuddies = buddies.filter((b) => b.status === "SUSPENDED").length;
  const totalSessionsConducted = buddies.reduce((acc, b) => acc + (b.sessionsCount || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 text-[#7E2248]" />
            Emotional Support & Listening Personnel
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Breakup Buddies Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Register and manage dedicated Breakup Buddies. Monitor conducted sessions, control account status (Active / Suspended), toggle verified trust badges, and review client satisfaction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/breakup-buddy/sessions"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50/50 text-slate-700 border border-rose-200 text-xs font-bold transition shadow-xs"
          >
            <Clock className="w-4 h-4 text-[#7E2248]" />
            <span>Session Logs</span>
          </Link>
          <button
            onClick={() => {
              generatePassword();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Breakup Buddy</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248]">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Buddies</div>
            <div className="text-xl font-serif font-black text-slate-900">{totalBuddies}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active & Available</div>
            <div className="text-xl font-serif font-black text-emerald-700">{activeBuddies}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Suspended</div>
            <div className="text-xl font-serif font-black text-rose-700">{suspendedBuddies}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-xl bg-[#FAF3F6] border border-rose-200 flex items-center justify-center text-[#7E2248]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sessions Taken</div>
            <div className="text-xl font-serif font-black text-slate-900">{totalSessionsConducted}</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-rose-100 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === tab
                  ? "bg-[#7E2248] text-white shadow-xs"
                  : "bg-rose-50 text-slate-600 hover:text-slate-900 hover:bg-rose-100"
              }`}
            >
              {tab === "ALL" ? `All (${totalBuddies})` : tab === "ACTIVE" ? `Active (${activeBuddies})` : `Suspended (${suspendedBuddies})`}
            </button>
          ))}
          <button
            onClick={fetchBuddies}
            title="Refresh List"
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-600 hover:text-slate-900 transition border border-rose-100 ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* BUDDIES CARDS GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 animate-pulse text-sm">
          Loading Breakup Buddies roster...
        </div>
      ) : filteredBuddies.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-[#7E2248]">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-slate-900 font-serif font-bold text-base">No Breakup Buddies Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No Breakup Buddies match your search filter criteria. Try clearing search or filter."
              : "No Breakup Buddies have been registered in the system yet. Click 'Add New Breakup Buddy' to register one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBuddies.map((buddy) => {
            const isActive = buddy.status === "ACTIVE";
            return (
              <div
                key={buddy.id}
                className="bg-white border border-rose-100 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-rose-300 transition flex flex-col justify-between group"
              >
                {/* CARD TOP ROW */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-serif font-bold text-[#7E2248] text-base overflow-hidden shrink-0 shadow-xs">
                        {buddy.profilePhoto ? (
                          <img src={buddy.profilePhoto} alt={buddy.name} className="w-full h-full object-cover" />
                        ) : (
                          buddy.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-[#7E2248] transition">
                            {buddy.displayName || buddy.name}
                          </h3>
                        </div>
                        {buddy.displayName && buddy.displayName !== buddy.name && (
                          <span className="text-[11px] text-slate-500 block font-normal">
                            Legal: {buddy.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{buddy.city || "Online / Nationwide"}</span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS PILL */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {buddy.status || "ACTIVE"}
                      </span>

                      {/* VERIFIED BADGE TOGGLE */}
                      <button
                        onClick={() => handleToggleVerify(buddy)}
                        title={buddy.isVerified ? "Verified Staff (Click to Revoke)" : "Unverified Staff (Click to Verify)"}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                          buddy.isVerified
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <BadgeCheck className="w-3 h-3 text-blue-600" />
                        <span>{buddy.isVerified ? "Verified" : "Unverified"}</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTACT INFO */}
                  <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{buddy.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{buddy.phone || "No phone registered"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Joined {buddy.createdAt ? new Date(buddy.createdAt).toLocaleDateString() : "Recently"}</span>
                    </div>
                  </div>

                  {/* QUICK STATS ROW */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/60">
                      <span className="text-[10px] text-slate-500 block font-semibold">Sessions</span>
                      <span className="font-bold text-[#7E2248] text-sm">{buddy.sessionsCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/60">
                      <span className="text-[10px] text-slate-500 block font-semibold">Requests</span>
                      <span className="font-bold text-slate-800 text-sm">{buddy.requestsCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/30 border border-rose-100/60">
                      <span className="text-[10px] text-slate-500 block font-semibold">Reviews</span>
                      <div className="flex items-center justify-center gap-1 font-bold text-amber-600 text-sm">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{buddy.avgRating ? Number(buddy.avgRating).toFixed(1) : (buddy.reviewsCount ? "5.0" : "N/A")}</span>
                      </div>
                    </div>
                  </div>

                  {/* EXPERTISE PILLS */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Specializations</div>
                    <div className="flex flex-wrap gap-1">
                      {buddy.areasOfExpertise && buddy.areasOfExpertise.length > 0 ? (
                        buddy.areasOfExpertise.slice(0, 3).map((exp: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-50 text-[#7E2248] text-[10px] font-medium border border-rose-200/60">
                            {exp}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Emotional Support & Listening</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="pt-4 mt-4 border-t border-rose-100 flex items-center gap-2">
                  <Link
                    href={`/admin/breakup-buddies/${buddy.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-700 text-xs font-bold transition border border-rose-200"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#7E2248]" />
                    <span>View Details</span>
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(buddy)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248]">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-slate-900">Register Breakup Buddy</h2>
                  <p className="text-xs text-slate-500">Creates an active account & dispatches credentials via email.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBuddy} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Name (Legal Name) <span className="text-[#7E2248]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-[#7E2248]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phone Number <span className="text-[#7E2248]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Temporary Password <span className="text-[#7E2248]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] text-[#7E2248] hover:text-[#681938] flex items-center gap-1 font-semibold"
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
                  className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-[#7E2248] font-mono font-bold focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  This password will be securely emailed to the personnel so they can log in at /login.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City / Base Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specialization / Expertise</label>
                  <input
                    type="text"
                    placeholder="e.g. Heartbreak recovery, Anxiety"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Experience / Background Summary</label>
                <input
                  type="text"
                  placeholder="e.g. 4+ years peer counseling & crisis listening"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Internal Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Interviewed on 24 Sep, cleared emotional empathy verification test..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-rose-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition disabled:opacity-50"
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
