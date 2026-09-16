"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  Send,
  UserCheck,
  Lock,
  Clock,
} from "lucide-react";

export default function RelationshipManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    idealAgeRange: "24-32",
    preferredCity: "",
    relationshipGoal: "Long-term Relationship",
    coreValues: "Communication, Shared Ambition, Mutual Respect",
    additionalNotes: "",
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.user) {
          setUser(data.user);
          setPreferences((prev) => ({
            ...prev,
            preferredCity: data.user.city || "",
          }));
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Load existing request from local storage if any
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`jwm_rm_req_${user.id}`);
      if (saved) setRequestSubmitted(true);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
    if (user?.id) {
      try {
        localStorage.setItem(`jwm_rm_req_${user.id}`, JSON.stringify(preferences));
        const services = JSON.parse(localStorage.getItem(`jwm_services_${user.id}`) || "{}");
        services.relationshipManager = true;
        localStorage.setItem(`jwm_services_${user.id}`, JSON.stringify(services));
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#e06d53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white">
      {/* Top Navbar */}
      <nav className="bg-[#0d1526]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#e06d53]" />
            <span>Back to Member Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Logged in as <strong className="text-white">{user?.name}</strong>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-300 border border-rose-500/30">
              Premium Tier
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d263b] via-[#131d2e] to-[#0c1424] border border-rose-500/20 p-8 sm:p-12 shadow-2xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              1-on-1 Human Matchmaking
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Meet Your Dedicated <br />
              <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-[#e06d53] bg-clip-text text-transparent">
                Relationship Manager
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              No algorithms or swipe fatigue. Our certified human matchmakers take the time to understand your lifestyle, emotional goals, and values to arrange meaningful real-world introductions.
            </p>
          </div>

          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        </div>

        {/* How It Works (3 Steps) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white">Private Intake Consultation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A 30-minute confidential conversation to map your relationship goals, must-haves, and core boundaries.
            </p>
          </div>

          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white">Hand-Picked Introduction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your matchmaker selects verified singles in {user?.city || "your city"} and proposes mutual date arrangements at safe partner venues.
            </p>
          </div>

          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white">Post-Date Coaching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Constructive debriefing after each date to continuously refine future introductions with no pressure or games.
            </p>
          </div>
        </div>

        {/* Interactive Consultation Form / Active Status */}
        <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-8 sm:p-10 shadow-xl">
          {requestSubmitted ? (
            <div className="text-center max-w-md mx-auto space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Consultation Request Active!</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Thank you, <strong>{user?.name}</strong>. A dedicated Relationship Manager in <strong>{preferences.preferredCity || user?.city}</strong> has received your preferences and will reach out to you directly via phone or WhatsApp within 24 hours.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition shadow-lg"
                >
                  Return to Dashboard
                </Link>
                <button
                  onClick={() => setRequestSubmitted(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Submit Matchmaking Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tell us what kind of person you are hoping to connect with in real life.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target City
                  </label>
                  <input
                    type="text"
                    required
                    value={preferences.preferredCity}
                    onChange={(e) =>
                      setPreferences({ ...preferences, preferredCity: e.target.value })
                    }
                    placeholder="e.g. Bangalore, Mumbai, Delhi"
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ideal Age Range
                  </label>
                  <input
                    type="text"
                    required
                    value={preferences.idealAgeRange}
                    onChange={(e) =>
                      setPreferences({ ...preferences, idealAgeRange: e.target.value })
                    }
                    placeholder="e.g. 25-32"
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Relationship Intent
                </label>
                <select
                  value={preferences.relationshipGoal}
                  onChange={(e) =>
                    setPreferences({ ...preferences, relationshipGoal: e.target.value })
                  }
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Long-term Relationship">Long-term Relationship</option>
                  <option value="Marriage / Matrimonial">Marriage / Matrimonial</option>
                  <option value="Intentional Dating">Intentional Dating</option>
                  <option value="Companionship">Companionship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Top 3 Core Values / Qualities
                </label>
                <input
                  type="text"
                  required
                  value={preferences.coreValues}
                  onChange={(e) =>
                    setPreferences({ ...preferences, coreValues: e.target.value })
                  }
                  placeholder="e.g. Emotional maturity, fitness, travel enthusiasm"
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Additional Notes for Your Matchmaker (Optional)
                </label>
                <textarea
                  rows={3}
                  value={preferences.additionalNotes}
                  onChange={(e) =>
                    setPreferences({ ...preferences, additionalNotes: e.target.value })
                  }
                  placeholder="Any hobbies, dealbreakers, or special preferences you'd like your matchmaker to know..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Confidential & Secure</span>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-[#e06d53] hover:from-rose-600 hover:to-[#c95940] text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Matchmaker Consultation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
