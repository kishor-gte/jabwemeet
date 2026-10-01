"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowRight,
  ShieldCheck, 
  Coffee, 
  Sparkles, 
  Heart, 
  Users, 
  Compass, 
  Calendar, 
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";

export default function ExperiencesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [activeJoinDropdownId, setActiveJoinDropdownId] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const openRegisterModalWithRole = (role: string) => {
    setActiveJoinDropdownId(null);
    router.push(`/register?role=${role}`);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowLoginModal(false);
        router.push(data.redirectUrl || "/dashboard");
      } else {
        setLoginError(data.message || "Email/mobile or password is incorrect.");
      }
    } catch (e) {
      setLoginError("We couldn't connect right now. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCurrentUser(null);
    router.refresh();
  }

  const experiences = [
    {
      id: "mixers",
      tag: "🍸 Social Mixer",
      badgeColor: "bg-rose-50 text-[#7E2248] border-rose-200",
      title: "Singles Events & Mixers",
      description: "Curated social mixers, icebreaker trivia, and relaxed group conversations hosted at charming private cafe lounges.",
      image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "Curated 1:1 gender balance ratio",
        "Hosted icebreakers & fun casual games",
        "Reserved spaces in premium partner cafes"
      ],
      actionText: "Explore Singles Mixers",
      actionRole: "USER"
    },
    {
      id: "speed-dating",
      tag: "⚡ 5-Minute Rounds",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      title: "Curated Speed Dating",
      description: "Short, engaging 5-minute conversations. Real chemistry without endless texting, catfishing, or awkward delays.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "8 to 12 mini-dates in a single evening",
        "Confidential mutual match scorecard",
        "Mutual matches revealed privately next day"
      ],
      actionText: "Book Speed Dating",
      actionRole: "USER"
    },
    {
      id: "blind-dates",
      tag: "🕯️ 1-on-1 Curated",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      title: "Handpicked Blind Dates",
      description: "Let our dedicated human matchmaking team hand-pick and introduce you at a cozy public partner bistro.",
      image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "Hand-vetted based on values & lifestyle",
        "Complimentary welcome beverage included",
        "Reserved quiet table in vetted public cafe"
      ],
      actionText: "Request Blind Match",
      actionRole: "USER"
    },
    {
      id: "dance-dates",
      tag: "💃 Music & Movement",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      title: "Dance Dates & Socials",
      description: "Meet through music, rhythm, and natural movement. Salsa & Bachata socials with beginner-friendly guided lessons.",
      image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "Zero dance experience or partner required",
        "Rotation lessons that break all awkwardness",
        "High energy, laughter, and great vibes"
      ],
      actionText: "Join Dance Night",
      actionRole: "USER"
    },
    {
      id: "singles-travel",
      tag: "🏔️ Weekend Escape",
      badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
      title: "Singles Travel & Retreats",
      description: "Travel with adventurous singles and create unforgettable shared memories in scenic weekend destinations.",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "Curated small-group dynamics & campfires",
        "Guided outdoor treks, dining, and activities",
        "Safe, verified boutique accommodations"
      ],
      actionText: "Explore Travel Retreats",
      actionRole: "USER"
    },
    {
      id: "breakup-community",
      tag: "🌱 Healing & Support",
      badgeColor: "bg-rose-50 text-[#7E2248] border-rose-200",
      title: "Breakup Recovery Circle",
      description: "Connect, share, laugh, and move forward in a compassionate, uplifting, and strictly confidential peer space.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
      highlights: [
        "Guided by trained Breakup Buddies",
        "Zero judgment, 100% empathetic community",
        "Intimate coffee circles & wellness meetups"
      ],
      actionText: "Join Recovery Circle",
      actionRole: "USER"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Link href="/" className="hover:text-[#7E2248] transition">
              HOME
            </Link>
            <Link href="/experiences" className="text-[#7E2248] font-extrabold border-b-2 border-[#7E2248] pb-1">
              EXPERIENCES
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#7E2248] transition">
              OUR STORIES
            </Link>
            <Link href="/cafes" className="hover:text-[#7E2248] transition">
              CAFES
            </Link>
            <Link href="/#about" className="hover:text-[#7E2248] transition">
              ABOUT
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 hidden sm:inline">
                  Hi, <strong className="text-slate-900">{currentUser.name?.split(" ")[0] || "Member"}</strong>
                </span>
                <Link
                  href={
                    currentUser.role === "ADMIN" ? "/admin" :
                    currentUser.role === "MATCHMAKER" ? "/matchmaker/dashboard" :
                    currentUser.role === "BREAKUP_BUDDY" ? "/breakup-buddy/dashboard" :
                    currentUser.role === "HOST" ? "/host/dashboard" :
                    currentUser.role === "CAFE" ? "/cafe/dashboard" :
                    "/dashboard"
                  }
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#7E2248] text-white hover:bg-[#681938] transition shadow-sm"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#7E2248] border border-[#7E2248]/30 hover:bg-rose-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-xs font-bold tracking-wider uppercase text-slate-700 hover:text-[#7E2248] transition px-3 py-2"
                >
                  MEMBER'S PORTAL
                </button>
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveJoinDropdownId(activeJoinDropdownId === "nav" ? null : "nav")}
                    className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#7E2248] hover:bg-[#681938] text-white shadow-md shadow-rose-950/10 transition-all transform hover:-translate-y-0.5"
                  >
                    GET STARTED
                  </button>
                  {activeJoinDropdownId === "nav" && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-rose-100 rounded-2xl shadow-xl z-50 overflow-hidden text-left p-2 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => openRegisterModalWithRole("USER")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-rose-50 hover:text-[#7E2248] rounded-xl transition"
                      >
                        User / Member
                      </button>
                      <button 
                        onClick={() => openRegisterModalWithRole("HOST")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-[#7E2248] hover:bg-rose-50 rounded-xl transition"
                      >
                        Event Host / Organizer
                      </button>
                      <button 
                        onClick={() => openRegisterModalWithRole("CAFE")} 
                        className="block w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition"
                      >
                        Cafe Partner
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <header className="relative py-16 px-6 bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white border-b border-rose-100/70 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold uppercase tracking-wider text-[#7E2248]">
            <Sparkles className="w-3.5 h-3.5" /> Curated Offline Formats
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Six Real-World <span className="font-serif italic font-normal text-[#7E2248]">Experiences</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose the vibe that suits your personality and comfort zone. Every format is vetted, safe, and thoughtfully hosted in public partner venues across India.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-rose-100 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% ID Verified Members
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-rose-100 shadow-xs">
              <Coffee className="w-4 h-4 text-[#7E2248]" /> Handpicked Partner Cafes
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-rose-100 shadow-xs">
              <Heart className="w-4 h-4 text-rose-500" /> Pressure-Free Chemistry
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* EXPERIENCES GRID */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#7E2248]/40 transition-all duration-300 flex flex-col group"
            >
              {/* Image & Tag */}
              <div className="relative h-56 w-full overflow-hidden bg-rose-50">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md bg-white/95 shadow-xs ${exp.badgeColor}`}>
                    {exp.tag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#7E2248] transition font-serif">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* Highlights list */}
                  <div className="pt-2 space-y-2 border-t border-rose-50">
                    {exp.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={() => openRegisterModalWithRole(exp.actionRole)}
                    className="w-full py-3 rounded-full bg-rose-50 hover:bg-[#7E2248] text-[#7E2248] hover:text-white border border-rose-200 hover:border-[#7E2248] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{exp.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* WHY JABWEMEET EXPERIENCES SECTION */}
        {/* ========================================================================= */}
        <section className="mt-20 pt-16 border-t border-rose-100">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest font-bold text-[#7E2248]">
              The JabWeMeet Standard
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 font-serif">
              Why In-Person Beats Endless Swiping
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every detail is engineered so you can feel secure, relaxed, and genuinely excited to meet new people.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FAF3F6]/50 border border-rose-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-2xl shadow-xs">
                🛡️
              </div>
              <h4 className="text-base font-bold text-slate-900">Government ID Verified</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero fake profiles, zero bots. Every single member must verify their phone number and government identity before entering an event.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF3F6]/50 border border-rose-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-2xl shadow-xs">
                ☕
              </div>
              <h4 className="text-base font-bold text-slate-900">Vetted Partner Venues</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We only host at curated, upscale public cafes and bistros with warm lighting, cozy booths, and delicious refreshments.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF3F6]/50 border border-rose-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-2xl shadow-xs">
                🤝
              </div>
              <h4 className="text-base font-bold text-slate-900">On-Ground Friendly Hosts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You will never feel lost. Our trained event coordinators greet you at the entrance, introduce you, and keep conversation effortless.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CALL TO ACTION BANNER */}
        {/* ========================================================================= */}
        <section className="mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7E2248] via-[#982b57] to-[#5a1633] text-white p-10 sm:p-14 text-center shadow-xl">
            <div className="max-w-2xl mx-auto space-y-5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-rose-100">
                ✨ Ready to begin?
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
                Step Out of the Screen into Real Connection
              </h2>
              <p className="text-sm sm:text-base text-rose-100 leading-relaxed">
                Join thousands of verified singles attending events across Bengaluru, Mumbai, Pune, Delhi NCR, and other top cities.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => openRegisterModalWithRole("USER")}
                  className="px-8 py-3.5 rounded-full bg-white text-[#7E2248] hover:bg-rose-50 font-bold text-xs uppercase tracking-wider transition shadow-lg transform hover:-translate-y-0.5"
                >
                  Join as a Member
                </button>
                <Link
                  href="/#events"
                  className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-xs uppercase tracking-wider transition"
                >
                  Browse Live Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-rose-100 pt-16 pb-12 px-6 text-sm text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
                JABWEMEET
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              JabWeMeet brings people together through real-world experiences, singles events, speed dating, blind dates, dance socials, and genuine human connections.
            </p>
            <p className="text-xs font-semibold text-slate-700">
              A Reason to Meet. Not Another Dating App.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Experiences</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/experiences" className="hover:text-[#7E2248] transition">Singles Socials</Link></li>
              <li><Link href="/experiences" className="hover:text-[#7E2248] transition">Speed Dating</Link></li>
              <li><Link href="/experiences" className="hover:text-[#7E2248] transition">Blind Dates</Link></li>
              <li><Link href="/experiences" className="hover:text-[#7E2248] transition">Dance Dates</Link></li>
              <li><Link href="/experiences" className="hover:text-[#7E2248] transition">Travel Retreats</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#how-it-works" className="hover:text-[#7E2248] transition">How It Works</Link></li>
              <li><button onClick={() => setShowSafetyModal(true)} className="hover:text-[#7E2248] transition">Safety Standards</button></li>
              <li><Link href="/cafes" className="hover:text-[#7E2248] transition">Partner Cafes</Link></li>
              <li><button onClick={() => setShowLoginModal(true)} className="hover:text-[#7E2248] transition">Member Portal</button></li>
              <li><Link href="/register?role=HOST" className="hover:text-[#7E2248] transition">Host an Event</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Trust & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-[#7E2248] transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#7E2248] transition">Privacy Policy</Link></li>
              <li><button onClick={() => setShowSafetyModal(true)} className="hover:text-[#7E2248] transition">Safety Pledge</button></li>
              <li><a href="mailto:support@jabweemeet.com" className="hover:text-[#7E2248] transition">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-rose-100/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} JabWeMeet. Real People. Real Places. Real Connections. All rights reserved.</p>
          <p>Made with ❤️ for real human relationships.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* LOGIN MODAL */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="font-extrabold text-xl tracking-wider text-[#7E2248] uppercase block mb-1">
                JABWEMEET
              </span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">Ready to meet someone in the real world?</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#7E2248] hover:underline font-semibold">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/25 disabled:opacity-60"
              >
                {loginLoading ? "Signing in..." : "LOGIN"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push("/register");
                }}
                className="text-[#7E2248] font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAFETY MODAL */}
      {/* ========================================================================= */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <span className="text-2xl mb-1 block">🛡️</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">JabWeMeet Safety Pledge</h2>
              <p className="text-xs text-slate-500 mt-1">Our commitment to your security and peace of mind.</p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p><strong>1. Strict Verification:</strong> Every attendee must verify their mobile number and government identity before joining offline events.</p>
              <p><strong>2. Safe Public Venues:</strong> All events take place in vetted premium public cafes, restaurants, lounges, and dance studios.</p>
              <p><strong>3. On-Ground Event Hosts:</strong> Every experience is supervised by friendly on-ground coordinators who welcome you.</p>
              <p><strong>4. Consent-First Culture:</strong> Sharing phone numbers or personal contacts is always completely voluntary and never pressured.</p>
              <p><strong>5. Zero Tolerance Policy:</strong> Any harassment, disrespect, or inappropriate conduct leads to an immediate permanent ban.</p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-full py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
