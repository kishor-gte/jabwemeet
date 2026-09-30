"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ExperiencesPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-[#0b111e] font-sans text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0b111e]/90 backdrop-blur-md border-b border-white/10 h-20 flex items-center px-6">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white shadow-lg">
              J
            </div>
            <span className="font-extrabold text-xl text-white">Jab<span className="text-[#e06d53]">We</span>Meet</span>
          </Link>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition text-sm font-semibold">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <section className="py-12 px-6" id="experiences">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
                Curated Formats
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white mt-2">
                Six Real-World Experiences
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto mt-4 text-lg">
                Choose the vibe that suits your personality and comfort zone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center text-5xl">
                  🍸
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Singles Events</h3>
                    <p className="text-sm text-slate-400 mb-6">Meet people through curated social mixers, board games, and relaxed gatherings.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Explore Mixers
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-pink-900 to-pink-600 flex items-center justify-center text-5xl">
                  ⚡
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Speed Dating</h3>
                    <p className="text-sm text-slate-400 mb-6">Short conversations. Real chemistry without endless texting or awkward delays.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Book Speed Date
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-emerald-900 to-emerald-600 flex items-center justify-center text-5xl">
                  🕯️
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Blind Dates</h3>
                    <p className="text-sm text-slate-400 mb-6">Let our matchmaking team hand-pick and introduce you at a cozy public bistro.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Request Match
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-purple-900 to-purple-600 flex items-center justify-center text-5xl">
                  💃
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Dance Dates</h3>
                    <p className="text-sm text-slate-400 mb-6">Meet through music, movement and fun. Salsa & Bachata socials with beginner lessons.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Join Dance Night
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-amber-900 to-amber-600 flex items-center justify-center text-5xl">
                  🏔️
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Singles Travel</h3>
                    <p className="text-sm text-slate-400 mb-6">Travel with adventurous singles and create unforgettable shared memories.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Explore Trips
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#182337] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow-lg">
                <div className="h-40 bg-gradient-to-br from-indigo-900 to-indigo-600 flex items-center justify-center text-5xl">
                  🌱
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Breakup Community</h3>
                    <p className="text-sm text-slate-400 mb-6">Connect, share, laugh, and move forward in a compassionate, uplifting space.</p>
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                  >
                    Join Recovery Circle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-12 px-6 bg-[#070b14]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white text-sm">
              J
            </div>
            <span className="font-bold text-white">Jab<span className="text-[#e06d53]">We</span>Meet</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} JabWeMeet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
