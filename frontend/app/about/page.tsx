"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Heart, Shield, Users, MapPin, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const [content, setContent] = useState<any>({
    aboutText: "",
    heroHeadline: "",
    heroSubheadline: "",
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
            <Link href="/#events" className="hover:text-white transition">Events</Link>
            <Link href="/safety" className="hover:text-white transition">Safety</Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white transition"
            >
              Join Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO / ABOUT HEADER */}
      <header className="pt-40 pb-20 px-6 text-center relative overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(224,109,83,0.15)_0%,transparent_60%)] border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 text-xs font-semibold text-[#fca5a5]">
            <Sparkles className="w-3.5 h-3.5" />
            About JabWeMeet
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-serif">
            A Place to Meet People in the Real World.
          </h1>

          <div className="max-w-3xl mx-auto pt-4">
            {loading ? (
              <div className="h-20 bg-white/5 animate-pulse rounded-2xl" />
            ) : (
              <div className="p-8 rounded-3xl bg-[#131d2e]/80 border border-white/10 backdrop-blur-sm text-base sm:text-lg text-slate-300 leading-relaxed whitespace-pre-line text-left shadow-xl">
                <p className="font-semibold text-rose-300 mb-2 text-sm uppercase tracking-wider">Our Core Vision:</p>
                <p>
                  {content.aboutText ||
                    "JabWeMeet is built on the truth that real chemistry happens in the real world. We combine safe real-world events, dedicated Relationship Managers, and empathetic Breakup Buddies."}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* THREE PILLARS */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">Our Foundation</span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">Why We Built JabWeMeet</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Endless swiping and algorithmic matches removed the magic of spontaneous human connection. We are putting real life back into dating.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-8 rounded-3xl bg-[#131d2e] border border-white/10 hover:border-white/20 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[#e06d53] flex items-center justify-center font-serif text-2xl font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Real People</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every member profile is verified with real contact details. No bots, no ghosting culture, and no endless texting cycles.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#131d2e] border border-white/10 hover:border-white/20 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-serif text-2xl font-bold">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Real Places</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Curated offline events hosted at top-tier cafes, rooftop lounges, dance studios, and picturesque travel retreats across India.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#131d2e] border border-white/10 hover:border-white/20 transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-serif text-2xl font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Real Connections</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Face-to-face interactions where eye contact, natural laughter, shared hobbies, and organic chemistry build lasting relationships.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white shadow-xl shadow-[#e06d53]/40 transition"
          >
            <span>Experience JabWeMeet Yourself</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#070b14] border-t border-white/10 py-12 px-6 text-sm text-slate-400 text-center">
        <p>© 2026 JabWeMeet. Real People. Real Places. Real Connections. All rights reserved.</p>
      </footer>
    </div>
  );
}
