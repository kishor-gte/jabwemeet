"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Headphones,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";

interface PremiumServicesSectionProps {
  userCity: string;
  userIntent: string | null;
  serviceRequests: {
    relationshipManager: boolean;
    breakupBuddy: boolean;
  };
  assignedManager?: {
    id: string;
    name: string;
    city: string | null;
    email: string;
    phone: string;
  } | null;
  latestMatchmakingRequest?: {
    id: string;
    goal: string;
    managerName: string | null;
    status: "New" | "Approved" | "Rejected";
  } | null;
  onRequestService: (service: "relationshipManager" | "breakupBuddy") => void;
}

export default function PremiumServicesSection({
  userCity,
  userIntent,
  serviceRequests,
  assignedManager,
  latestMatchmakingRequest,
  onRequestService,
}: PremiumServicesSectionProps) {
  const [activeModal, setActiveModal] = useState<"rm" | "bb" | null>(null);

  const isSeekingRelationship =
    !userIntent ||
    userIntent.toLowerCase().includes("relationship") ||
    userIntent.toLowerCase().includes("marriage") ||
    userIntent.toLowerCase().includes("dating");

  const isAssigned = Boolean(assignedManager);
  const isPending = !isAssigned && latestMatchmakingRequest?.status === "New";
  const isRejected = !isAssigned && latestMatchmakingRequest?.status === "Rejected";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Dedicated Human Support
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Need a More Personal Connection?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-2xl">
            Real human matchmakers and empathetic peer buddies operating actively across {userCity || "major metro regions"}.
          </p>
        </div>

        {/* Dynamic Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Your Services:</span>
          <span className="font-semibold text-white">
            {isAssigned
              ? "1 Assigned Manager"
              : isPending
              ? "1 Request Pending"
              : serviceRequests.breakupBuddy
              ? "1 Active Buddy Request"
              : "Standard Member Access"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Relationship Manager Card */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl transition group ${
            isAssigned
              ? "bg-gradient-to-br from-[#0f2621] via-[#131d2e] to-[#0f172a] border border-emerald-500/40 hover:border-emerald-500/60"
              : isPending
              ? "bg-gradient-to-br from-[#241c14] via-[#131d2e] to-[#0f172a] border border-amber-500/40 hover:border-amber-500/60"
              : "bg-gradient-to-br from-[#1b263b] via-[#131d2e] to-[#0f172a] border border-rose-500/20 hover:border-rose-500/40"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition ${
                  isAssigned
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : isPending
                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                }`}
              >
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                {isAssigned ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Matchmaker
                  </span>
                ) : isPending ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Review In Progress
                  </span>
                ) : isSeekingRelationship ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Recommended for You
                  </span>
                ) : null}
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30">
                  Certified Network
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-rose-200 transition">
                Relationship Manager
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
                Want someone to help you find a meaningful connection? Our Relationship Managers can understand your preferences, suggest compatible profiles and arrange offline dates.
              </p>
            </div>

            {/* Dynamic Status / Highlights */}
            {isAssigned && assignedManager ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">
                    Paired with {assignedManager.name} ({assignedManager.city || userCity || "Metro"})
                  </strong>
                  <span>Your certified manager is actively curating compatible introductions and date experiences.</span>
                </div>
              </div>
            ) : isPending && latestMatchmakingRequest ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-white block font-semibold">
                    Request Pending with {latestMatchmakingRequest.managerName || "Relationship Manager"}
                  </strong>
                  <span>Your request for "{latestMatchmakingRequest.goal}" is currently awaiting matchmaker review.</span>
                </div>
              </div>
            ) : isRejected ? (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-200">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Ready for New Request</strong>
                  <span>Previous request was not accommodated. You may choose another verified Relationship Manager.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  1-on-1 Consultation
                </span>
                <span>•</span>
                <span>Curated Introductions</span>
              </div>
            )}
          </div>

          <div className="pt-6 mt-4 flex items-center gap-3">
            {isAssigned ? (
              <Link
                href="/relationship-manager"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold hover:bg-emerald-500/30 transition"
              >
                <span>View Assigned Manager Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isPending ? (
              <Link
                href="/relationship-manager"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold hover:bg-amber-500/30 transition"
              >
                <span>Check Request Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/relationship-manager"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-[#e06d53] hover:from-rose-600 hover:to-[#c95940] text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition group-hover:shadow-rose-500/30"
              >
                <span>Meet a Relationship Manager</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Breakup Buddy Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#172033] via-[#131d2e] to-[#0f172a] border border-indigo-500/20 p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:border-indigo-500/40 transition group">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                <Headphones className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Premium
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition">
                Breakup Buddy
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-normal">
                Going through a breakup? Talk with a Breakup Buddy who can listen, understand and help you navigate the next step.
              </p>
            </div>

            {/* Dynamic Status / Highlights */}
            {serviceRequests.breakupBuddy ? (
              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Support Session Requested</strong>: A Breakup Buddy will connect with you via chat/call.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  100% Confidential
                </span>
                <span>•</span>
                <span>Peer Circles & Healing</span>
              </div>
            )}
          </div>

          <div className="pt-6 mt-4 flex items-center gap-3">
            {serviceRequests.breakupBuddy ? (
              <Link
                href="/breakup-buddy"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold hover:bg-indigo-500/30 transition"
              >
                <span>Go to Breakup Buddy Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => onRequestService("breakupBuddy")}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition group-hover:shadow-indigo-500/30"
              >
                <span>Talk to a Breakup Buddy</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
