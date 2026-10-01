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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            Dedicated Human Support
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Need a More Personal Connection?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
            Real human matchmakers and empathetic peer buddies operating actively across {userCity || "major metro regions"}.
          </p>
        </div>

        {/* Dynamic Status Pill */}
        <div className="flex items-center gap-2 text-xs bg-white px-3.5 py-1.5 rounded-full border border-rose-100 shadow-xs">
          <span className="text-slate-500">Your Services:</span>
          <span className="font-semibold text-slate-900">
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
          className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 group ${
            isAssigned
              ? "bg-gradient-to-br from-emerald-50/60 via-white to-white border border-emerald-200 hover:border-emerald-300"
              : isPending
              ? "bg-gradient-to-br from-amber-50/60 via-white to-white border border-amber-200 hover:border-amber-300"
              : "bg-white border border-rose-100 hover:border-rose-200"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-105 transition shadow-xs ${
                  isAssigned
                    ? "bg-emerald-100 border border-emerald-200 text-emerald-800"
                    : isPending
                    ? "bg-amber-100 border border-amber-200 text-amber-800"
                    : "bg-rose-50 border border-rose-200 text-[#7E2248]"
                }`}
              >
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isAssigned ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Matchmaker
                  </span>
                ) : isPending ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Review In Progress
                  </span>
                ) : isSeekingRelationship ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                    Recommended for You
                  </span>
                ) : null}
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                  Certified Network
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-[#7E2248] transition">
                Relationship Manager
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                Want someone to help you find a meaningful connection? Our Relationship Managers can understand your preferences, suggest compatible profiles and arrange offline dates.
              </p>
            </div>

            {/* Dynamic Status / Highlights */}
            {isAssigned && assignedManager ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">
                    Paired with {assignedManager.name} ({assignedManager.city || userCity || "Metro"})
                  </strong>
                  <span>Your certified manager is actively curating compatible introductions and date experiences.</span>
                </div>
              </div>
            ) : isPending && latestMatchmakingRequest ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-slate-900 block font-semibold">
                    Request Pending with {latestMatchmakingRequest.managerName || "Relationship Manager"}
                  </strong>
                  <span>Your request for "{latestMatchmakingRequest.goal}" is currently awaiting matchmaker review.</span>
                </div>
              </div>
            ) : isRejected ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                <ShieldCheck className="w-4 h-4 text-[#7E2248] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Ready for New Request</strong>
                  <span>Previous request was not accommodated. You may choose another verified Relationship Manager.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-rose-100">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-xs font-bold transition"
              >
                <span>View Assigned Manager Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isPending ? (
              <Link
                href="/relationship-manager"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition"
              >
                <span>Check Request Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/relationship-manager"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition transform hover:-translate-y-0.5 group-hover:shadow-lg"
              >
                <span>Meet a Relationship Manager</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Breakup Buddy Card */}
        <div className="relative rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 group-hover:scale-105 transition shadow-xs">
                <Headphones className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                Premium
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900 group-hover:text-purple-700 transition">
                Breakup Buddy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                Going through a breakup? Talk with a Breakup Buddy who can listen, understand and help you navigate the next step.
              </p>
            </div>

            {/* Dynamic Status / Highlights */}
            {serviceRequests.breakupBuddy ? (
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-2.5 text-xs text-purple-900">
                <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  <strong>Support Session Requested</strong>: A Breakup Buddy will connect with you via chat/call.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-rose-100">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-bold transition"
              >
                <span>Go to Breakup Buddy Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => onRequestService("breakupBuddy")}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-gradient-to-r from-purple-700 to-[#7E2248] hover:from-purple-800 hover:to-[#681938] text-white text-xs font-bold shadow-md shadow-purple-900/10 transition transform hover:-translate-y-0.5 group-hover:shadow-lg"
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
