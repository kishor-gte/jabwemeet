"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Send,
  MessageCircle,
  Heart,
  Lock,
  Smile,
  Sparkles,
} from "lucide-react";

export default function BreakupBuddyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState("1-on-1 Listening Session");
  const [preferredMode, setPreferredMode] = useState("Confidential Chat");
  const [feelingDescription, setFeelingDescription] = useState("");
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
      const saved = localStorage.getItem(`jwm_bb_req_${user.id}`);
      if (saved) setRequestSubmitted(true);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitted(true);
    if (user?.id) {
      try {
        localStorage.setItem(
          `jwm_bb_req_${user.id}`,
          JSON.stringify({ sessionType, preferredMode, feelingDescription })
        );
        const services = JSON.parse(localStorage.getItem(`jwm_services_${user.id}`) || "{}");
        services.breakupBuddy = true;
        localStorage.setItem(`jwm_services_${user.id}`, JSON.stringify(services));
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="bg-[#0d1526]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back to Member Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Logged in as <strong className="text-white">{user?.name}</strong>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Safe Space
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172038] via-[#131d2e] to-[#0c1424] border border-indigo-500/20 p-8 sm:p-12 shadow-2xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Headphones className="w-4 h-4 text-indigo-400" />
              Confidential Healing & Closure
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Talk to a Compassionate <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
                Breakup Buddy
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Breakups can feel isolating. Whether you need an empathetic listening ear, practical perspective to break the texting loop, or a peer closure circle, our verified buddies are here with non-judgmental support.
            </p>
          </div>

          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        </div>

        {/* The 3 Safe Support Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Non-Judgmental Listening</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Express your feelings, vent, or unpack what went wrong without unsolicited advice or fear of judgment.
            </p>
          </div>

          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">No-Contact Support</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Need accountability to resist reaching back out? Text your Breakup Buddy whenever the urge strikes.
            </p>
          </div>

          <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Breakup Community Circle</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect with peers who are also turning a new leaf. Share laughter, stories, and healthy moving-on rituals.
            </p>
          </div>
        </div>

        {/* Interactive Booking / Active Status */}
        <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-8 sm:p-10 shadow-xl">
          {requestSubmitted ? (
            <div className="text-center max-w-md mx-auto space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Support Session Confirmed!</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Thank you, <strong>{user?.name}</strong>. A certified Breakup Buddy has received your confidential request. You will receive a warm, private message via your preferred contact channel shortly.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg"
                >
                  Return to Dashboard
                </Link>
                <button
                  onClick={() => setRequestSubmitted(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white">Connect with a Breakup Buddy</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Everything you share is strictly confidential and protected by member privacy safeguards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Session Format
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1-on-1 Listening Session">1-on-1 Listening Session</option>
                    <option value="No-Contact Accountability Texting">
                      No-Contact Accountability Texting
                    </option>
                    <option value="Peer Closure Circle (Group)">
                      Peer Closure Circle (Group)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Communication
                  </label>
                  <select
                    value={preferredMode}
                    onChange={(e) => setPreferredMode(e.target.value)}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Confidential Chat / WhatsApp">
                      Confidential Chat / WhatsApp
                    </option>
                    <option value="Private Voice Call">Private Voice Call</option>
                    <option value="In-Person Coffee Meetup (Partner Cafe)">
                      In-Person Coffee Meetup (Partner Cafe)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  How are you feeling right now? (Optional)
                </label>
                <textarea
                  rows={4}
                  value={feelingDescription}
                  onChange={(e) => setFeelingDescription(e.target.value)}
                  placeholder="Share as much or as little as you want. There's zero pressure to explain everything..."
                  className="w-full bg-[#0b111e] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confidential & Private</span>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Support Session</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
