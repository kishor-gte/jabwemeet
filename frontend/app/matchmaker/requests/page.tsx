"use client";

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Heart,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

interface ClientRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  profileImage: string | null;
  age: number | null;
  city: string;
  gender: string;
  relationshipIntent: string;
  assignedManagerId: string | null;
  goal: string;
  notes: string;
  targetMatchmakerId: string | null;
  targetMatchmakerName: string | null;
  status: "New" | "Pending" | "Approved" | "Accepted" | "Rejected";
  isClaimedByMe?: boolean;
  isClaimedByOther?: boolean;
  isClaimable?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RequestCounts {
  total: number;
  new: number;
  approved: number;
  rejected: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [counts, setCounts] = useState<RequestCounts>({
    total: 0,
    new: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/matchmaker/requests", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString(), { credentials: "include" });
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests || []);
        if (data.counts) setCounts(data.counts);
      } else {
        showToast(data.message || "Failed to load requests", "error");
      }
    } catch (err) {
      console.error("Error loading requests:", err);
      showToast("Network error loading requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Real-time socket listener for RM broadcast requests and claiming updates
  useEffect(() => {
    const s = io("http://localhost:5001", { withCredentials: true });
    s.on("new-rm-broadcast-request", (data: any) => {
      fetchRequests();
      showToast("⚡ New Client Introduction Request received! Review and claim now.", "info");
    });
    s.on("new-rm-request", () => {
      fetchRequests();
    });
    s.on("rm-request-claimed", (data: any) => {
      fetchRequests();
      if (data?.claimedByManagerName) {
        showToast(`🔒 A request was claimed by ${data.claimedByManagerName}.`, "info");
      }
    });
    s.on("rm-request-accepted", () => {
      fetchRequests();
    });

    // Also poll every 10 seconds to keep fresh
    const interval = setInterval(() => {
      fetchRequests();
    }, 10000);

    return () => {
      s.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleClaimRequest = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/matchmaker/requests/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        showToast("✓ Request accepted & claimed! Client assigned to your active roster.", "success");
        await fetchRequests();
      } else if (res.status === 409 || data.claimedByOther) {
        showToast("⚠️ Too Late! This client request was already claimed by another Relationship Manager.", "error");
        await fetchRequests();
      } else {
        showToast(data.message || "Failed to claim request", "error");
      }
    } catch (err) {
      console.error("Error claiming request:", err);
      showToast("Network error claiming request", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleUpdateStatus = async (
    id: string,
    status: "Approved" | "Rejected"
  ) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/matchmaker/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (data.success) {
        // Optimistic update in UI
        if (status === "Approved") {
          setRequests((prev) => prev.filter((r) => r.id !== id));
        } else {
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status } : r))
          );
        }

        // Update counts
        setCounts((prev) => {
          const oldReq = requests.find((r) => r.id === id);
          if (!oldReq || oldReq.status === status) return prev;
          const updated = { ...prev };
          if (oldReq.status === "New") updated.new = Math.max(0, updated.new - 1);
          if (oldReq.status === "Approved") updated.approved = Math.max(0, updated.approved - 1);
          if (oldReq.status === "Rejected") updated.rejected = Math.max(0, updated.rejected - 1);

          if (status === "Approved") updated.approved += 1;
          if (status === "Rejected") updated.rejected += 1;
          return updated;
        });

        showToast(
          status === "Approved"
            ? "Request approved! Client assigned to your roster."
            : "Request rejected.",
          "success"
        );
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Error updating request:", err);
      showToast("Failed to update status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRequest = async (id: string, clientName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the request from ${clientName}?`
      )
    ) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/matchmaker/requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        const deletedReq = requests.find((r) => r.id === id);
        setRequests((prev) => prev.filter((r) => r.id !== id));

        // Decrement counts
        setCounts((prev) => {
          const updated = { ...prev, total: Math.max(0, prev.total - 1) };
          if (deletedReq?.status === "New") updated.new = Math.max(0, updated.new - 1);
          if (deletedReq?.status === "Approved") updated.approved = Math.max(0, updated.approved - 1);
          if (deletedReq?.status === "Rejected") updated.rejected = Math.max(0, updated.rejected - 1);
          return updated;
        });

        showToast("Request permanently deleted.", "info");
      } else {
        showToast(data.message || "Failed to delete request", "error");
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      showToast("Failed to delete request", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Dynamic Toast Feedback - Centered */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 zoom-in-95 duration-200">
          <div
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-white font-medium text-xs sm:text-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/10 ${
              toastMessage.type === "success"
                ? "bg-emerald-600 shadow-emerald-500/30"
                : toastMessage.type === "error"
                ? "bg-rose-600 shadow-rose-500/30"
                : "bg-slate-800 shadow-slate-800/30"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 rounded-3xl p-6 sm:p-8 border border-rose-100/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
            <span>Matchmaking Intake Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Client Matchmaking Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Review incoming introduction and matchmaking requests from JabWeMeet members. Approve requests to assign clients to your active roster, or manage pending requests.
          </p>
        </div>

        {/* KPI Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-rose-100 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total
            </span>
            <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">
              {counts.total}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-100 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
              Pending
            </span>
            <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">
              {counts.new}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-100 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
              Approved
            </span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
              {counts.approved}
            </span>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-rose-100 shadow-sm text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
              Rejected
            </span>
            <span className="text-xl font-extrabold text-rose-500 mt-0.5 block">
              {counts.rejected}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-rose-100/60 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-rose-500 text-white shadow-sm shadow-rose-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({counts.total})
          </button>

          <button
            onClick={() => setStatusFilter("New")}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "New"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Pending Review ({counts.new})</span>
          </button>

          <button
            onClick={() => setStatusFilter("Approved")}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "Approved"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Approved / Claimed ({counts.approved})</span>
          </button>

          <button
            onClick={() => setStatusFilter("Rejected")}
            className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === "Rejected"
                ? "bg-rose-600 text-white shadow-sm shadow-rose-600/25"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Rejected ({counts.rejected})</span>
          </button>
        </div>

        {/* Search Input & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition"
            />
          </form>

          <button
            onClick={() => fetchRequests()}
            title="Refresh requests"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-3xl border border-rose-50 shadow-sm animate-pulse p-6"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-rose-100/60 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center text-2xl mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Requests Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {statusFilter !== "all" || searchQuery
              ? "No matchmaking requests match your active filters or search terms."
              : "There are currently no matchmaking requests submitted by members."}
          </p>
          {(statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="px-5 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isLoadingThis = actionLoadingId === req.id;
            const submittedDate = new Date(req.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-rose-100/70 p-6 shadow-sm hover:shadow-md transition-all duration-200 space-y-5"
              >
                {/* Card Top: Client Info & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {req.profileImage ? (
                        <img
                          src={req.profileImage}
                          alt={req.clientName}
                          className="w-14 h-14 rounded-2xl object-cover border border-rose-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {req.clientName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-800">
                          {req.clientName}
                        </h3>
                        {req.age && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {req.age} yrs
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                          • {req.gender}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {req.city}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {req.clientEmail}
                        </span>
                        {req.clientPhone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {req.clientPhone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Timestamp */}
                  <div className="flex sm:flex-col sm:items-end justify-between items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        req.isClaimedByOther
                          ? "bg-slate-100 text-slate-600 border border-slate-300"
                          : req.isClaimedByMe || req.status === "Approved" || req.status === "Accepted"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : req.status === "Rejected"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          req.isClaimedByOther
                            ? "bg-slate-400"
                            : req.isClaimedByMe || req.status === "Approved" || req.status === "Accepted"
                            ? "bg-emerald-500"
                            : req.status === "Rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500 animate-pulse"
                        }`}
                      />
                      {req.isClaimedByOther
                        ? "Claimed by Another RM"
                        : req.isClaimedByMe || req.status === "Approved" || req.status === "Accepted"
                        ? "Assigned to You"
                        : req.status === "Rejected"
                        ? "Rejected"
                        : "Pending Review"}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {submittedDate}
                    </span>
                  </div>
                </div>

                {/* Card Body: Request Goal & Notes */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Dating Goal:</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white text-slate-800 font-semibold border border-slate-200">
                        {req.goal}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Member Intent:</span>
                      <span className="font-medium text-slate-700">
                        {req.relationshipIntent}
                      </span>
                    </div>
                  </div>

                  {req.notes && (
                    <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/60">
                      <span className="font-bold text-slate-700 block mb-0.5">
                        Client Preferences & Notes:
                      </span>
                      <p className="italic leading-relaxed">"{req.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-rose-50">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {req.isClaimedByOther
                        ? "This client request was already claimed by another Relationship Manager."
                        : req.isClaimedByMe || req.status === "Approved" || req.status === "Accepted"
                        ? "Client is currently assigned to your active matchmaking roster."
                        : req.status === "Rejected"
                        ? "Request was declined."
                        : "Claiming will assign this client directly to your active matchmaking roster."}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Delete Request Button */}
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleDeleteRequest(req.id, req.clientName)}
                      title="Permanently delete request"
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Claimed by Other Badge */}
                    {req.isClaimedByOther && (
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center gap-1.5">
                        <span>🔒 Claimed by another RM (Too Late)</span>
                      </span>
                    )}

                    {/* Active in My Portfolio */}
                    {(req.isClaimedByMe || req.status === "Approved" || req.status === "Accepted") && !req.isClaimedByOther && (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>✓ Claimed by You (Active Client)</span>
                      </span>
                    )}

                    {/* If Claimable / New / Pending */}
                    {req.status !== "Approved" && req.status !== "Accepted" && !req.isClaimedByOther && (
                      <>
                        {req.status !== "Rejected" && (
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateStatus(req.id, "Rejected")}
                            className="px-4 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleClaimRequest(req.id)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-600/20"
                        >
                          {isLoadingThis ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          <span>Accept & Claim Client</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

