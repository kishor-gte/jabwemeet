"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  Search, 
  Star, 
  Coffee, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Compass, 
  X,
  Navigation,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Artisan Coffee",
  "Aesthetic / Cozy",
  "Work Friendly",
  "Bakery & Cafe"
];

const POPULAR_INDIAN_CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Pune",
  "Hyderabad",
  "Jaipur",
  "Goa",
  "Kolkata",
  "Chennai",
  "Chandigarh",
  "Ahmedabad",
  "Kochi",
  "Mysuru",
  "Lucknow",
  "Indore",
  "Udaipur",
  "Shimla",
  "Varanasi"
];

function CafesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || "Bengaluru";

  const [currentCity, setCurrentCity] = useState(initialCity);
  const [citySearchInput, setCitySearchInput] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterQuery, setFilterQuery] = useState("");
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeJoinDropdownId, setActiveJoinDropdownId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Recommend place form state
  const [recommendName, setRecommendName] = useState("");
  const [recommendCity, setRecommendCity] = useState(initialCity);
  const [recommendArea, setRecommendArea] = useState("");
  const [recommendNote, setRecommendNote] = useState("");
  const [recommendSuccess, setRecommendSuccess] = useState(false);

  // Autocomplete dropdown state
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Toast / Share State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Fetch Live Real Cafes from Place API
  const fetchCafes = async (cityName: string, category: string = "All", query: string = "") => {
    if (!cityName.trim()) return;
    setLoading(true);
    try {
      const url = new URL("/api/places/cafes", window.location.origin);
      url.searchParams.set("city", cityName.trim());
      if (category && category !== "All") url.searchParams.set("category", category);
      if (query) url.searchParams.set("q", query);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.cafes) {
          setCafes(data.cafes);
        } else {
          setCafes([]);
        }
      } else {
        setCafes([]);
      }
    } catch (err) {
      console.error("Error fetching live cafes from Place API:", err);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync with URL search params
  useEffect(() => {
    const cityFromUrl = searchParams.get("city") || "Bengaluru";
    setCurrentCity(cityFromUrl);
    setCitySearchInput(cityFromUrl);
    fetchCafes(cityFromUrl, selectedCategory, filterQuery);
  }, [searchParams]);

  // Handle City Search Form Submit
  const handleCitySearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = citySearchInput.trim();
    if (!target) return;
    setShowSuggestions(false);
    setCurrentCity(target);
    router.push(`/cafes?city=${encodeURIComponent(target)}`);
  };

  // Live Autocomplete for Indian Cities
  useEffect(() => {
    if (!citySearchInput.trim() || citySearchInput.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/cities?q=${encodeURIComponent(citySearchInput.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.cities) {
            setCitySuggestions(data.cities);
          }
        }
      } catch (e) {
        console.error("Error searching cities:", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [citySearchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (cityName: string) => {
    setCitySearchInput(cityName);
    setShowSuggestions(false);
    setCurrentCity(cityName);
    router.push(`/cafes?city=${encodeURIComponent(cityName)}`);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    fetchCafes(currentCity, cat, filterQuery);
  };

  const handleShareCafe = (cafe: any) => {
    const text = `Check out ${cafe.name} in ${cafe.city}, India: ${cafe.address}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied details for "${cafe.name}" to clipboard!`);
    } else {
      showToast(`📍 Selected ${cafe.name}`);
    }
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

  const handleRecommendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecommendSuccess(true);
    setTimeout(() => {
      setRecommendSuccess(false);
      setShowRecommendModal(false);
      setRecommendName("");
      setRecommendArea("");
      setRecommendNote("");
      showToast("🎉 Thank you! Your cafe recommendation has been submitted.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-rose-200 text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl shadow-rose-950/15 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#7E2248]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Link href="/" className="hover:text-[#7E2248] transition">
              HOME
            </Link>
            <Link href="/experiences" className="hover:text-[#7E2248] transition">
              EXPERIENCES
            </Link>
            <Link href="/#how-it-works" className="hover:text-[#7E2248] transition">
              OUR STORIES
            </Link>
            <Link href="/cafes" className="text-[#7E2248] font-extrabold border-b-2 border-[#7E2248] pb-1">
              CAFES
            </Link>
            <Link href="/#about" className="hover:text-[#7E2248] transition">
              ABOUT
            </Link>
            <button
              onClick={() => setShowRecommendModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 transition"
            >
              <span>📍</span> Recommend a Cafe
            </button>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs text-[#7E2248] font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
              <span>{currentCity}</span>
              <span className="text-slate-400">, India 🇮🇳</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-xs font-bold tracking-wider uppercase text-slate-700 hover:text-[#7E2248] transition px-3 py-2"
              >
                MEMBER'S PORTAL
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO / CITY SEARCH HEADER */}
      {/* ========================================================================= */}
      <header className="py-14 px-6 relative overflow-hidden bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white border-b border-rose-100/70">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold uppercase tracking-wider text-[#7E2248]">
            <Compass className="w-3.5 h-3.5" /> Curated Cafe Partners • India 🇮🇳
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-serif">
            Aesthetic Cafes in <span className="text-[#7E2248] italic font-normal">{currentCity}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Live real-time cafes, artisan roasters, and cozy meetup venues in {currentCity}, India. Search any Indian city below to explore handpicked date spots.
          </p>

          {/* MAIN CITY SEARCH FORM */}
          <div ref={suggestionsRef} className="relative max-w-2xl mx-auto pt-3">
            <form onSubmit={handleCitySearchSubmit} className="relative flex items-center">
              <MapPin className="w-5 h-5 text-[#7E2248] absolute left-4.5 z-10" />
              <input
                type="text"
                required
                value={citySearchInput}
                onChange={(e) => {
                  setCitySearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter any Indian city (e.g. Mumbai, Bengaluru, Pune, Jaipur, Delhi...)"
                className="w-full pl-12 pr-28 py-3.5 bg-white border-2 border-slate-200 hover:border-rose-300 focus:border-[#7E2248] rounded-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold rounded-full shadow-md shadow-[#7E2248]/20 transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </form>

            {/* Live Autocomplete Suggestions for Indian Cities */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-rose-100 rounded-2xl shadow-2xl z-50 overflow-hidden text-left max-h-60 overflow-y-auto p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-1.5">
                  Matching Indian Cities
                </div>
                {citySuggestions.map((cityObj) => (
                  <button
                    key={cityObj.name}
                    type="button"
                    onClick={() => handleSelectCity(cityObj.name)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
                      <div>
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-[#7E2248]">
                          {cityObj.name}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">{cityObj.state}, India</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#7E2248] font-bold">Search →</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Popular Indian Cities Bar */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
            <span className="mr-1 text-slate-700 font-semibold">Popular Cities:</span>
            {POPULAR_INDIAN_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleSelectCity(city)}
                className={`px-3 py-1 rounded-full border transition text-xs ${
                  currentCity.toLowerCase() === city.toLowerCase()
                    ? "bg-[#7E2248] border-[#7E2248] text-white font-bold shadow-xs"
                    : "bg-white hover:bg-rose-50 border-slate-200 text-slate-700 hover:text-[#7E2248] hover:border-rose-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-[#7E2248] text-white shadow-sm font-bold"
                  : "bg-white hover:bg-rose-50 text-slate-600 hover:text-[#7E2248] border border-slate-200 hover:border-rose-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-rose-100 pb-4">
          <div>
            Showing <strong className="text-slate-900 font-bold">{cafes.length}</strong> real cafes in{" "}
            <span className="text-[#7E2248] font-bold">{currentCity}, India</span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-[#7E2248]" /> Real-time Place API results
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-rose-100 rounded-3xl p-5 space-y-4 animate-pulse shadow-xs"
              >
                <div className="w-full h-48 bg-rose-50/70 rounded-2xl" />
                <div className="h-5 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : cafes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-[#FAF3F6]/50 border border-rose-100 rounded-3xl p-8 max-w-xl mx-auto space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-white border border-rose-200 text-[#7E2248] flex items-center justify-center mx-auto text-3xl shadow-xs">
              ☕
            </div>
            <h3 className="text-xl font-bold font-serif text-slate-900">No cafes found in "{currentCity}"</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Try searching for another Indian city like Bengaluru, Mumbai, Delhi NCR, Pune, Jaipur, Goa, or Kolkata.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {POPULAR_INDIAN_CITIES.slice(0, 5).map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className="px-4 py-2 bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-semibold rounded-full shadow transition"
                >
                  Search {city}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Cafes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="bg-white border border-rose-100 hover:border-[#7E2248]/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-56 w-full overflow-hidden bg-rose-50">
                  <img
                    src={cafe.image || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"}
                    alt={cafe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                  {/* Category Pill */}
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md border border-rose-200 px-3 py-1 rounded-full text-[11px] font-bold text-[#7E2248] shadow-xs">
                    {cafe.category || "Artisan Cafe"}
                  </div>

                  {/* Rating Pill */}
                  <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-700 flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{cafe.rating || 4.8}</span>
                    <span className="text-[9px] text-slate-500 font-normal">({cafe.reviewsCount || 100}+)</span>
                  </div>

                  {/* Location Area Pill */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow-md">
                    <MapPin className="w-3.5 h-3.5 text-rose-300" />
                    <span>{cafe.area || cafe.city}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-serif text-slate-900 group-hover:text-[#7E2248] transition leading-snug">
                      {cafe.name}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {cafe.description || `Popular date-friendly cafe in ${cafe.area || cafe.city}, ${cafe.city}, India.`}
                    </p>

                    {/* Highlights */}
                    {cafe.highlights && cafe.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cafe.highlights.slice(0, 3).map((hl: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-[#7E2248]"
                          >
                            ✨ {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata: Price & Timings */}
                  <div className="pt-3 border-t border-rose-100/70 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{cafe.priceForTwo || "₹500 for two"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                      <span className="truncate">{cafe.timings || "8 AM - 11 PM"}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-[11px] text-slate-400 truncate" title={cafe.address}>
                    📍 {cafe.address}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 grid grid-cols-2 gap-2.5">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.mapQuery || `${cafe.name} ${cafe.city} India`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-[#7E2248] text-[#7E2248] hover:text-white text-xs font-bold rounded-full border border-rose-200 hover:border-[#7E2248] transition text-center shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View on Maps
                    </a>

                    <button
                      onClick={() => handleShareCafe(cafe)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#7E2248] text-xs font-semibold rounded-full border border-slate-200 hover:border-rose-200 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CAFE PARTNER CALLOUT SECTION */}
        {/* ========================================================================= */}
        <section className="mt-16 pt-12 border-t border-rose-100">
          <div className="rounded-3xl bg-[#FAF3F6]/60 border border-rose-200 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7E2248]">
                <Coffee className="w-4 h-4" /> Partner with JabWeMeet
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Do You Own or Manage a Cafe in India?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Join our network of premium cafe partners across India. Host curated singles mixers, private blind dates, and speed dating events during off-peak hours with verified guests.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href="/register?role=CAFE"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20 text-center"
              >
                Apply as Cafe Partner
              </Link>
              <button
                onClick={() => setShowRecommendModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-rose-50 text-slate-700 hover:text-[#7E2248] border border-slate-200 font-bold text-xs uppercase tracking-wider transition text-center"
              >
                Recommend a Venue
              </button>
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
      {/* RECOMMEND A CAFE MODAL */}
      {/* ========================================================================= */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl space-y-5">
            <button
              onClick={() => setShowRecommendModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 text-lg w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-[#7E2248] mb-2">
                ☕ Recommend a Venue
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">Suggest a Date-Friendly Cafe</h2>
              <p className="text-xs text-slate-500 mt-1">
                Know a hidden gem or charming cafe in your city? Tell us and we will invite them to JabWeMeet.
              </p>
            </div>

            {recommendSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <h4 className="font-bold text-sm">Recommendation Received!</h4>
                <p className="text-xs">Our team will reach out to this venue soon.</p>
              </div>
            ) : (
              <form onSubmit={handleRecommendSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cafe Name <span className="text-[#7E2248]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recommendName}
                    onChange={(e) => setRecommendName(e.target.value)}
                    placeholder="e.g. Third Wave Coffee, Blue Tokai, Glen's Bakehouse..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      City <span className="text-[#7E2248]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recommendCity}
                      onChange={(e) => setRecommendCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Neighborhood / Area
                    </label>
                    <input
                      type="text"
                      value={recommendArea}
                      onChange={(e) => setRecommendArea(e.target.value)}
                      placeholder="e.g. Indiranagar, Bandra"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Why do you recommend it?
                  </label>
                  <textarea
                    rows={2}
                    value={recommendNote}
                    onChange={(e) => setRecommendNote(e.target.value)}
                    placeholder="e.g. Cozy booths, quiet vibe, amazing sourdough pizza and cold brew..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#7E2248]/20 transition"
                >
                  Submit Recommendation
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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

export default function CafesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#7E2248] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-[#7E2248]">Loading Cafes...</span>
          </div>
        </div>
      }
    >
      <CafesContent />
    </Suspense>
  );
}
