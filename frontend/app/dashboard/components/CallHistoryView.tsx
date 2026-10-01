"use client";

import React, { useEffect, useState } from "react";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Phone,
  AlertCircle,
  Headphones,
} from "lucide-react";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";

interface CallLogItem {
  id: string;
  requestId: string;
  type: "Incoming" | "Outgoing";
  status: "MISSED" | "COMPLETED" | "REJECTED" | "BUSY";
  durationSec: number;
  startedAt: string;
  endedAt?: string;
  buddy: {
    id: string;
    name: string;
    phone?: string;
    profilePhoto?: string;
  };
  request?: {
    id: string;
    topic?: string;
    sessionType?: string;
  };
}

export default function CallHistoryView() {
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "MISSED" | "COMPLETED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Active call overlay trigger from Call Back button
  const [activeCall, setActiveCall] = useState<{
    requestId: string;
    buddyId: string;
    buddyName: string;
  } | null>(null);

  const fetchCallHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services/call-history", { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        setError(data.message || "Failed to load call history");
      }
    } catch (err) {
      setError("Network error fetching call history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const totalCalls = logs.length;
  const missedCount = logs.filter((l) => l.status === "MISSED").length;
  const totalSeconds = logs.reduce((acc, l) => acc + (l.durationSec || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.buddy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.request?.topic || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === "MISSED") return log.status === "MISSED";
    if (filterStatus === "COMPLETED") return log.status === "COMPLETED";
    return true;
  });

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Voice Call Overlay Modal when calling back */}
      {activeCall && (
        <VoiceCallOverlay
          requestId={activeCall.requestId}
          buddyId={activeCall.buddyId}
          role="USER"
          isInitiator={true}
          callerName={activeCall.buddyName}
          onClose={() => {
            setActiveCall(null);
            fetchCallHistory();
          }}
        />
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-rose-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">Voice Call History</h2>
          </div>
          <p className="text-xs text-slate-600">
            View all your incoming, outgoing, and missed Breakup Buddy calls in one place.
          </p>
        </div>

        <button
          onClick={fetchCallHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-[#7E2248] transition border border-rose-200 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-rose-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shrink-0 shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-black text-slate-900">{totalCalls}</div>
            <div className="text-xs text-slate-500 font-medium">Total Calls</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-rose-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <PhoneMissed className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-black text-rose-800">{missedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Missed Calls</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-rose-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-black text-emerald-800">{totalMinutes} mins</div>
            <div className="text-xs text-slate-500 font-medium">Total Talk Duration</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white border border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search buddy name or topic..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-rose-50/30 border border-rose-100 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#7E2248] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
          {(["ALL", "MISSED", "COMPLETED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                filterStatus === status
                  ? "bg-[#7E2248] text-white shadow-xs"
                  : "bg-rose-50/50 text-slate-600 hover:text-[#7E2248] hover:bg-rose-50"
              }`}
            >
              {status === "ALL" ? `All Logs (${logs.length})` : status === "MISSED" ? `Missed (${missedCount})` : "Connected"}
            </button>
          ))}
        </div>
      </div>

      {/* Call History Table / List */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#7E2248] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading call logs...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] mx-auto shadow-xs">
            <PhoneCall className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-serif font-bold text-slate-900">No Call Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === "MISSED"
              ? "You have no missed Breakup Buddy calls."
              : "Voice call history will appear here once you initiate or receive calls from Breakup Buddies."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isMissed = log.status === "MISSED";
            const isCompleted = log.status === "COMPLETED";

            return (
              <div
                key={log.id}
                className={`p-4 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                  isMissed
                    ? "bg-rose-50/30 border-rose-200 hover:border-rose-300"
                    : "bg-white border-rose-100 hover:border-rose-200"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Call Icon / Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7E2248] to-[#5c1331] flex items-center justify-center font-bold text-white text-base shadow-xs">
                      {log.buddy.name ? log.buddy.name[0].toUpperCase() : "B"}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                        isMissed
                          ? "bg-rose-600"
                          : log.type === "Incoming"
                          ? "bg-emerald-600"
                          : "bg-[#7E2248]"
                      }`}
                    >
                      {isMissed ? (
                        <PhoneMissed className="w-3 h-3" />
                      ) : log.type === "Incoming" ? (
                        <PhoneIncoming className="w-3 h-3" />
                      ) : (
                        <PhoneOutgoing className="w-3 h-3" />
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-serif font-bold text-slate-900 truncate">{log.buddy.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMissed
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {isMissed ? "Missed Call" : log.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(log.startedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {isMissed ? "No answer" : formatDuration(log.durationSec)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Back Button */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() =>
                      setActiveCall({
                        requestId: log.requestId,
                        buddyId: log.buddy.id,
                        buddyName: log.buddy.name,
                      })
                    }
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-semibold transition shadow-md shadow-[#7E2248]/20 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Back</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
