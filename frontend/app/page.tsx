"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regGender, setRegGender] = useState("");
  const [regIntent, setRegIntent] = useState("Relationship");
  const [regTerms, setRegTerms] = useState(false);
  const [regPrivacy, setRegPrivacy] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/dashboard");

  const [activeJoinDropdownId, setActiveJoinDropdownId] = useState<string | null>(null);
  const [regRole, setRegRole] = useState("USER");

  const openRegisterModalWithRole = (role: string) => {
    setRegRole(role);
    setShowRegisterModal(true);
    setActiveJoinDropdownId(null);
  };

  // Real-time validation feedback
  const [emailFeedback, setEmailFeedback] = useState<{ msg: string; type: "valid" | "invalid" | "checking" | "" }>({ msg: "", type: "" });
  const [nameFeedback, setNameFeedback] = useState("");
  const [phoneFeedback, setPhoneFeedback] = useState("");
  const [pwFeedback, setPwFeedback] = useState("");
  const [confirmPwFeedback, setConfirmPwFeedback] = useState("");
  const [dobFeedback, setDobFeedback] = useState("");

  // Check user session on load
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

  // Real-time email validation + debounced check-email
  useEffect(() => {
    if (!regEmail.trim()) {
      setEmailFeedback({ msg: "", type: "" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setEmailFeedback({ msg: "Please enter a valid email address.", type: "invalid" });
      return;
    }

    setEmailFeedback({ msg: "Checking email...", type: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(regEmail.trim())}`);
        const data = await res.json();
        if (data.available) {
          setEmailFeedback({ msg: "✓ Email is available", type: "valid" });
        } else {
          setEmailFeedback({ msg: `✕ ${data.message || "This email is already registered."}`, type: "invalid" });
        }
      } catch (e) {
        setEmailFeedback({ msg: "✓ Valid email", type: "valid" });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regEmail]);

  // Real-time Name validation
  useEffect(() => {
    if (!regName) {
      setNameFeedback("");
    } else if (regName.trim().length >= 2) {
      setNameFeedback("✓ Name looks good");
    } else {
      setNameFeedback("✕ Please enter your full name (minimum 2 characters).");
    }
  }, [regName]);

  // Real-time Phone validation
  useEffect(() => {
    if (!regPhone) {
      setPhoneFeedback("");
    } else {
      const clean = regPhone.replace(/\s+/g, "");
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (phoneRegex.test(clean)) {
        setPhoneFeedback("✓ Valid mobile number");
      } else {
        setPhoneFeedback("✕ Please enter a valid 10-digit mobile number.");
      }
    }
  }, [regPhone]);

  // Real-time Password validation
  const isPwLen = regPassword.length >= 8;
  const isPwUpper = /[A-Z]/.test(regPassword);
  const isPwLower = /[a-z]/.test(regPassword);
  const isPwNum = /[0-9]/.test(regPassword);
  const isPwSpec = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]/.test(regPassword);
  const isPwAllMet = isPwLen && isPwUpper && isPwLower && isPwNum && isPwSpec;

  // Real-time Confirm Password
  useEffect(() => {
    if (!regConfirmPassword) {
      setConfirmPwFeedback("");
    } else if (regPassword === regConfirmPassword) {
      setConfirmPwFeedback("✓ Passwords match");
    } else {
      setConfirmPwFeedback("✕ Passwords do not match.");
    }
  }, [regPassword, regConfirmPassword]);

  // Real-time DOB & Age validation
  useEffect(() => {
    if (!regDob) {
      setDobFeedback("");
      return;
    }
    const bDate = new Date(regDob);
    const now = new Date();
    if (isNaN(bDate.getTime()) || bDate > now) {
      setDobFeedback("✕ Invalid date of birth.");
      return;
    }
    const age = Math.floor((now.getTime() - bDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      setDobFeedback("✕ Must be at least 18 years old.");
    } else {
      setDobFeedback(`✓ Age verified (${age} years)`);
    }
  }, [regDob]);

  const isRegValid =
    regName.trim().length >= 2 &&
    emailFeedback.type === "valid" &&
    phoneFeedback.startsWith("✓") &&
    isPwAllMet &&
    regPassword === regConfirmPassword &&
    dobFeedback.startsWith("✓") &&
    regCity.trim().length >= 2 &&
    regTerms &&
    regPrivacy;

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
      setLoginError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          confirmPassword: regConfirmPassword,
          dateOfBirth: regDob,
          city: regCity,
          gender: regGender,
          relationshipIntent: regIntent,
          role: regRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRedirectTarget(data.redirectUrl || "/dashboard");
        setRegSuccess(true);
      } else {
        setRegError(data.message || "Registration failed. Please check inputs.");
      }
    } catch (e) {
      setRegError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCurrentUser(null);
    router.refresh();
  }

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

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#events" className="hover:text-white transition">Events</a>
            <a href="#experiences" className="hover:text-white transition">Experiences</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#safety" className="hover:text-white transition">Safety</a>
            <a href="#about" className="hover:text-white transition">About</a>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300 hidden sm:inline">
                  Hi, <strong>{currentUser.name.split(" ")[0]}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#e06d53] border border-[#e06d53] hover:bg-[#e06d53] hover:text-white transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
                >
                  LOGIN
                </button>
                <div className="relative inline-block">
                  <button
                    onClick={() => setActiveJoinDropdownId(activeJoinDropdownId === 'nav' ? null : 'nav')}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white shadow-lg shadow-[#e06d53]/30 transition"
                  >
                    JOIN JABWEMEET
                  </button>
                  {activeJoinDropdownId === 'nav' && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#131d2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                      <button onClick={() => openRegisterModalWithRole('USER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">User</button>
                      <button onClick={() => openRegisterModalWithRole('MATCHMAKER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Relationship Manager</button>
                      <button onClick={() => openRegisterModalWithRole('BREAKUP_BUDDY')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Breakup Buddy</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-40 pb-28 px-6 text-center relative overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(224,109,83,0.15)_0%,transparent_60%)] border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 text-xs font-semibold text-[#fca5a5]">
            ✨ Real People • Real Places • Real Connections
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight font-serif">
            Not another dating app.<br />
            <span className="bg-gradient-to-r from-white via-slate-200 to-[#e06d53] bg-clip-text text-transparent">
              A reason to meet.
            </span>
          </h1>

          <p className="text-base sm:text-lg uppercase tracking-widest font-semibold text-slate-300">
            Real People. Real Places. Real Connections.
          </p>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Tired of endless swiping and conversations that never become real meetings?
            JabWeMeet creates opportunities to meet people offline through curated events, experiences and genuine human connections.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#experiences"
              className="px-8 py-3.5 rounded-full text-base font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition"
            >
              Explore Experiences
            </a>
            <div className="relative inline-block text-left">
              <button
                onClick={() => setActiveJoinDropdownId(activeJoinDropdownId === 'hero' ? null : 'hero')}
                className="px-8 py-3.5 rounded-full text-base font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white shadow-xl shadow-[#e06d53]/40 transition"
              >
                Join JabWeMeet
              </button>
              {activeJoinDropdownId === 'hero' && (
                <div className="absolute left-0 mt-2 w-56 bg-[#131d2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                  <button onClick={() => openRegisterModalWithRole('USER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">User</button>
                  <button onClick={() => openRegisterModalWithRole('MATCHMAKER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Relationship Manager</button>
                  <button onClick={() => openRegisterModalWithRole('BREAKUP_BUDDY')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Breakup Buddy</button>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-400 pt-2">
            Already a member?{" "}
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-[#e06d53] font-semibold underline underline-offset-4 hover:text-[#fca5a5]"
            >
              Login
            </button>
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-[#131d2e]/80 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-white mb-1">10,000+</div>
              <div className="text-xs text-slate-400 font-medium">Verified Members</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#131d2e]/80 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-white mb-1">250+</div>
              <div className="text-xs text-slate-400 font-medium">Curated Events</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#131d2e]/80 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-white mb-1">100%</div>
              <div className="text-xs text-slate-400 font-medium">Offline First</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#131d2e]/80 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl font-extrabold text-white mb-1">4.9 ★</div>
              <div className="text-xs text-slate-400 font-medium">Community Trust</div>
            </div>
          </div>
        </div>
      </header>

      {/* PROBLEM SECTION */}
      <section className="py-24 px-6 border-b border-white/10" id="problem">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
              The Dating Dilemma
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white mt-2">
              Tired of endless chatting?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3">
              Modern dating algorithms keep you swiping endlessly on screens rather than meeting in real life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-8 rounded-2xl bg-[#131d2e] border border-white/10 hover:border-[#e06d53]/40 transition">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-lg font-bold text-white mb-2">Endless Swiping</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Keep swiping, but never actually meet face to face.</p>
            </div>
            <div className="p-8 rounded-2xl bg-[#131d2e] border border-white/10 hover:border-[#e06d53]/40 transition">
              <div className="text-3xl mb-4">👻</div>
              <h3 className="text-lg font-bold text-white mb-2">Ghosting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Conversations disappear without warning or explanation.</p>
            </div>
            <div className="p-8 rounded-2xl bg-[#131d2e] border border-white/10 hover:border-[#e06d53]/40 transition">
              <div className="text-3xl mb-4">🎭</div>
              <h3 className="text-lg font-bold text-white mb-2">Digital Deception</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Online profiles don't always represent real people or true chemistry.</p>
            </div>
            <div className="p-8 rounded-2xl bg-[#131d2e] border border-white/10 hover:border-[#e06d53]/40 transition">
              <div className="text-3xl mb-4">⏳</div>
              <h3 className="text-lg font-bold text-white mb-2">Conversations That Go Nowhere</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Hours of texting that fizzle out before a date happens.</p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-r from-[#182337] to-[#121c2c] border border-[#e06d53]/30 max-w-2xl mx-auto shadow-xl">
            <h3 className="text-2xl font-bold font-serif text-white mb-1">
              Maybe your person isn't behind a screen.
            </h3>
            <p className="text-lg text-[#e06d53] italic font-serif">
              Maybe they're waiting at the next table.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT IS JABWEMEET */}
      <section className="py-24 px-6 bg-[#fbf9f5] text-slate-900" id="about">
        <div className="max-w-6xl mx-auto text-center space-y-16">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
              Our Foundation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mt-2">
              A place to meet people in the real world.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mt-3">
              JabWeMeet is a real-world connection platform designed around shared experiences instead of endless online chatting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif text-[#e06d53] font-bold mb-4">01</div>
              <h3 className="text-xl font-bold mb-2">REAL PEOPLE</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A community built around genuine members who are verified and genuinely looking to connect offline.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif text-[#e06d53] font-bold mb-4">02</div>
              <h3 className="text-xl font-bold mb-2">REAL PLACES</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Curated physical events hosted at premier cafes, rooftop restaurants, dance studios, and nature retreats.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif text-[#e06d53] font-bold mb-4">03</div>
              <h3 className="text-xl font-bold mb-2">REAL CONNECTIONS</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Face-to-face conversations where physical presence, genuine laughs, and natural chemistry lead the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCES SECTION */}
      <section className="py-24 px-6 border-b border-white/10" id="experiences">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
              Curated Formats
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white mt-2">
              Six Real-World Experiences
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3">
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
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
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
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full py-2.5 rounded-full border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white font-semibold text-xs transition"
                >
                  Join Recovery Circle
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-[#fbf9f5] text-slate-900" id="how-it-works">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
              Simple & Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mt-2">
              How JabWeMeet Works
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mt-3">
              From your initial profile to meeting face-to-face in four straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif font-bold text-[#e06d53] mb-3">01</div>
              <h3 className="text-lg font-bold mb-2">Join</h3>
              <p className="text-sm text-slate-600">Create your verified JabWeMeet account in less than two minutes.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif font-bold text-[#e06d53] mb-3">02</div>
              <h3 className="text-lg font-bold mb-2">Tell Us About You</h3>
              <p className="text-sm text-slate-600">Share your interests, city, and what kind of connection you are seeking.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif font-bold text-[#e06d53] mb-3">03</div>
              <h3 className="text-lg font-bold mb-2">Choose Experience</h3>
              <p className="text-sm text-slate-600">Events, speed dating, blind dates, dance socials, and group travel.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md">
              <div className="text-3xl font-serif font-bold text-[#e06d53] mb-3">04</div>
              <h3 className="text-lg font-bold mb-2">Meet In Real Life</h3>
              <p className="text-sm text-slate-600">Show up at the curated venue and see where the real-life spark goes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY JABWEMEET */}
      <section className="py-24 px-6 border-b border-white/10" id="why">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest font-bold text-[#e06d53]">
              The Real Difference
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white mt-2">
              Stop Swiping. Start Meeting.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📍", title: "Offline-First Experiences", desc: "Every interaction is designed to lead directly to a face-to-face meeting." },
              { icon: "🎟️", title: "Curated Events", desc: "Thoughtfully planned themes, balanced ratios, and friendly icebreakers." },
              { icon: "🛡️", title: "Verified Community", desc: "Real members with mobile and identity verification for peace of mind." },
              { icon: "🤝", title: "Human Matchmaking", desc: "Real human matchmakers assisting personal introductions." },
              { icon: "☕", title: "Safe Public Venues", desc: "Handpicked premium cafes, rooftop lounges, and private studios." },
              { icon: "🎙️", title: "Hosted Experiences", desc: "Warm on-ground hosts to guide conversations and ease social jitters." },
              { icon: "✈️", title: "Singles Travel", desc: "Curated group getaways for spontaneous, adventurous singles." },
              { icon: "❤️", title: "Social Communities", desc: "Supportive circles including our signature Breakup Recovery tribe." },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#131d2e] border border-white/10 space-y-2">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY SECTION */}
      <section className="py-24 px-6" id="safety">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#131d2e] to-[#182337] border border-white/10 rounded-3xl p-10 sm:p-16 text-center space-y-8 shadow-2xl">
          <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">
            Safety & Comfort
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white">
            Meet confidently. Connect safely.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-left pt-4">
            {[
              "Verified members",
              "Public venues",
              "Event hosts",
              "Community guidelines",
              "Consent-first interactions",
              "Report & block",
              "Privacy protection",
            ].map((pt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 font-bold">✓</span> {pt}
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setShowSafetyModal(true)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition"
            >
              Learn About Safety
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 px-6 text-center border-t border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(224,109,83,0.15)_0%,transparent_70%)]">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white">
            Your next connection could be one event away.
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Don't spend another night endlessly scrolling. Come meet people in the real world.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="relative inline-block text-left">
              <button
                onClick={() => setActiveJoinDropdownId(activeJoinDropdownId === 'cta' ? null : 'cta')}
                className="px-8 py-3.5 rounded-full text-base font-semibold bg-[#e06d53] hover:bg-[#c95940] text-white shadow-xl shadow-[#e06d53]/40 transition"
              >
                Join JabWeMeet
              </button>
              {activeJoinDropdownId === 'cta' && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#131d2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden text-left">
                  <button onClick={() => openRegisterModalWithRole('USER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">User</button>
                  <button onClick={() => openRegisterModalWithRole('MATCHMAKER')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Relationship Manager</button>
                  <button onClick={() => openRegisterModalWithRole('BREAKUP_BUDDY')} className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition">Breakup Buddy</button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-8 py-3.5 rounded-full text-base font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
            >
              Login
            </button>
            <a
              href="#experiences"
              className="px-8 py-3.5 rounded-full text-base font-semibold border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white transition"
            >
              Explore Events
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#070b14] border-t border-white/10 py-16 px-6 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white text-sm">
                J
              </div>
              <span className="font-extrabold text-xl text-white">Jab<span className="text-[#e06d53]">We</span>Meet</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              JabWeMeet brings people together through real-world experiences, singles events, speed dating, blind dates, dance experiences, social travel and genuine human connections.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Experiences</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#experiences" className="hover:text-white">Singles Events</a></li>
              <li><a href="#experiences" className="hover:text-white">Speed Dating</a></li>
              <li><a href="#experiences" className="hover:text-white">Blind Dates</a></li>
              <li><a href="#experiences" className="hover:text-white">Dance Dates</a></li>
              <li><a href="#experiences" className="hover:text-white">Singles Travel</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              <li><a href="#safety" className="hover:text-white">Safety Standards</a></li>
              <li><Link href="/login" className="hover:text-white">Member Login</Link></li>
              <li><Link href="/register" className="hover:text-white">Join Platform</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Trust & Support</h3>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => alert("Terms: Community respect and offline event safety.")} className="hover:text-white">Terms of Service</button></li>
              <li><button onClick={() => alert("Privacy: We protect your verified identity.")} className="hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => setShowSafetyModal(true)} className="hover:text-white">Safety Pledge</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 JabWeMeet. Real People. Real Places. Real Connections. All rights reserved.</p>
          <p>Not another dating app. A reason to meet.</p>
        </div>
      </footer>

      {/* ======================== MODALS ======================== */}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold font-serif text-white">Welcome back.</h2>
              <p className="text-xs text-slate-400 mt-1">Ready to meet someone in the real world?</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email or Mobile</label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@example.com or +91..."
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#e06d53] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition shadow-lg disabled:opacity-60"
              >
                {loginLoading ? "Signing in..." : "LOGIN"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
                className="text-[#e06d53] font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl w-full max-w-lg p-8 relative my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            {regSuccess ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold font-serif text-white mb-2">Welcome to JabWeMeet! 🎉</h2>
                <p className="text-sm text-slate-300 mb-6">Your account has been created successfully.</p>
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    router.push(redirectTarget);
                  }}
                  className="w-full py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition"
                >
                  LOGIN TO JABWEMEET
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-serif text-white">Join JabWeMeet</h2>
                  <p className="text-xs text-slate-400 mt-1">Real People. Real Places. Real Connections.</p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                    />
                    {nameFeedback && (
                      <div className={`text-xs mt-1 ${nameFeedback.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                        {nameFeedback}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="priya@example.com"
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      />
                      {emailFeedback.msg && (
                        <div className={`text-xs mt-1 ${emailFeedback.type === "valid" ? "text-emerald-400" : emailFeedback.type === "checking" ? "text-amber-400" : "text-red-400"}`}>
                          {emailFeedback.msg}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      />
                      {phoneFeedback && (
                        <div className={`text-xs mt-1 ${phoneFeedback.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                          {phoneFeedback}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                    />
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5 text-xs grid grid-cols-2 gap-1 text-slate-400">
                      <span className={isPwLen ? "text-emerald-400 font-medium" : ""}>{isPwLen ? "✓" : "✕"} 8+ chars</span>
                      <span className={isPwUpper ? "text-emerald-400 font-medium" : ""}>{isPwUpper ? "✓" : "✕"} Uppercase</span>
                      <span className={isPwLower ? "text-emerald-400 font-medium" : ""}>{isPwLower ? "✓" : "✕"} Lowercase</span>
                      <span className={isPwNum ? "text-emerald-400 font-medium" : ""}>{isPwNum ? "✓" : "✕"} Number</span>
                      <span className={isPwSpec ? "text-emerald-400 font-medium" : ""}>{isPwSpec ? "✓" : "✕"} Special char</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                    />
                    {confirmPwFeedback && (
                      <div className={`text-xs mt-1 ${confirmPwFeedback.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                        {confirmPwFeedback}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      />
                      {dobFeedback && (
                        <div className={`text-xs mt-1 ${dobFeedback.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>
                          {dobFeedback}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="e.g. Bangalore"
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#131d2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      >
                        <option value="">Select gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Looking For</label>
                      <select
                        value={regIntent}
                        onChange={(e) => setRegIntent(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#131d2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                      >
                        <option value="Relationship">Relationship</option>
                        <option value="Marriage">Marriage</option>
                        <option value="Friendship">Friendship</option>
                        <option value="Social Connections">Social Connections</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regTerms}
                        onChange={(e) => setRegTerms(e.target.checked)}
                        className="accent-[#e06d53]"
                        required
                      />
                      <span>I agree to the Terms & Conditions.</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regPrivacy}
                        onChange={(e) => setRegPrivacy(e.target.checked)}
                        className="accent-[#e06d53]"
                        required
                      />
                      <span>I agree to the Privacy Policy.</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!isRegValid || regLoading}
                    className="w-full py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition shadow-lg disabled:opacity-60"
                  >
                    {regLoading ? "Creating account..." : "CREATE MY ACCOUNT"}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-6">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setShowLoginModal(true);
                    }}
                    className="text-[#e06d53] font-semibold hover:underline"
                  >
                    Login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* SAFETY MODAL */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold font-serif text-white mb-4">JabWeMeet Safety Pledge</h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p><strong>1. Strict Verification:</strong> Every attendee must verify their mobile number and identity.</p>
              <p><strong>2. Safe Public Venues:</strong> All events take place in vetted public cafes, restaurants, and lounges.</p>
              <p><strong>3. On-Ground Event Hosts:</strong> Every experience is supervised by friendly on-ground coordinators.</p>
              <p><strong>4. Consent-First Culture:</strong> Sharing phone numbers or personal contacts is always completely voluntary.</p>
              <p><strong>5. Zero Tolerance:</strong> Any harassment or inappropriate conduct leads to an immediate permanent ban.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
