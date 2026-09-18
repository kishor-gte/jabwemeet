"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle2, AlertTriangle, Lock, UserCheck, Eye } from "lucide-react";

export default function SafetyPage() {
  const [content, setContent] = useState<any>({
    safetyPledge: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services/content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.content) {
          setContent(data.content);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b111e]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
              J
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </span>
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/#events" className="hover:text-white transition">Events</Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white transition"
            >
              Join Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <header className="pt-40 pb-20 px-6 text-center relative overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.12)_0%,transparent_60%)] border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            Trust & Community Safety
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-serif">
            Meet Confidently. Connect Safely.
          </h1>

          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Your physical safety, digital privacy, and peace of mind are the core foundations of every JabWeMeet experience.
          </p>

          <div className="max-w-3xl mx-auto pt-4">
            {loading ? (
              <div className="h-24 bg-white/5 animate-pulse rounded-2xl" />
            ) : (
              <div className="p-8 rounded-3xl bg-[#131d2e]/90 border border-emerald-500/30 backdrop-blur-sm text-left shadow-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Official Platform Safety Pledge</span>
                </div>
                <p className="text-slate-200 text-base leading-relaxed whitespace-pre-line">
                  {content.safetyPledge ||
                    "Every member profile is verified. Every event is hosted by background-vetted hosts in partner venues. Zero tolerance for harassment."}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SAFETY STANDARDS */}
      <section className="py-24 px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold font-serif text-white">Our 5-Point Safety Standard</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Rules and measures designed to protect everyone in our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#131d2e] border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">1. Strict Identity Verification</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every member confirms their active mobile number via SMS and provides valid personal identification before attending mixers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131d2e] border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">2. Public Vetted Venues</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              We exclusively partner with premier, well-lit cafes, restaurants, lounges, and event spaces in secure city districts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131d2e] border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">3. Dedicated Event Hosts</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every gathering is supervised on-ground by trained JabWeMeet hosts who guide icebreakers and maintain comfort.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#131d2e] border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">4. Consent-First Culture</h3>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sharing your phone number, social handles, or personal details is completely voluntary. Our platform respects boundaries.
            </p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Zero-Tolerance Policy</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Any report of harassment, inappropriate contact, discriminatory behavior, or boundary violations results in immediate removal and a lifetime ban from all platform services.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#070b14] border-t border-white/10 py-12 px-6 text-sm text-slate-400 text-center">
        <p>© 2026 JabWeMeet. Real People. Real Places. Real Connections. All rights reserved.</p>
      </footer>
    </div>
  );
}
