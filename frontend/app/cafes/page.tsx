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
  ArrowLeft,
  X,
  Navigation
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

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] border border-[#e06d53] text-white px-5 py-3 rounded-xl shadow-2xl shadow-black/60 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#e06d53]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#0b111e]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
                J
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Jab<span className="text-[#e06d53]">We</span>Meet
              </span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#e06d53]" />
              <span className="font-semibold text-white">{currentCity}</span>
              <span className="text-slate-400">, India 🇮🇳</span>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO / CITY SEARCH HEADER */}
      <header className="pt-12 pb-10 px-6 relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(224,109,83,0.18)_0%,transparent_65%)] border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 text-xs font-semibold text-[#fca5a5]">
            <Compass className="w-3.5 h-3.5" /> Live Place Search • India Only 🇮🇳
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif">
            Cafes in <span className="text-[#e06d53]">{currentCity}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Live real-time cafes and coffee spots in {currentCity}, India. Search any Indian city below to explore cafes.
          </p>

          {/* MAIN CITY SEARCH FORM */}
          <div ref={suggestionsRef} className="relative max-w-2xl mx-auto pt-3">
            <form onSubmit={handleCitySearchSubmit} className="relative flex items-center">
              <MapPin className="w-5 h-5 text-[#e06d53] absolute left-4.5 z-10" />
              <input
                type="text"
                required
                value={citySearchInput}
                onChange={(e) => {
                  setCitySearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter any Indian city (e.g. Mumbai, Pune, Jaipur, Mysuru, Delhi...)"
                className="w-full pl-12 pr-28 py-3.5 bg-[#131d2e] border-2 border-white/20 hover:border-[#e06d53]/60 focus:border-[#e06d53] rounded-full text-sm text-white placeholder-slate-400 focus:outline-none shadow-xl transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold rounded-full shadow-md shadow-[#e06d53]/30 transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </form>

            {/* Live Autocomplete Suggestions for Indian Cities */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#131d2e] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden text-left max-h-60 overflow-y-auto animate-fade-in p-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 py-1.5">
                  Matching Indian Cities
                </div>
                {citySuggestions.map((cityObj) => (
                  <button
                    key={cityObj.name}
                    type="button"
                    onClick={() => handleSelectCity(cityObj.name)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-[#e06d53]" />
                      <div>
                        <span className="text-sm font-semibold text-white group-hover:text-[#fca5a5]">
                          {cityObj.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">{cityObj.state}, India</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#e06d53] font-medium">Search →</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Popular Indian Cities Bar */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="mr-1 text-slate-500 font-semibold">Popular Cities:</span>
            {POPULAR_INDIAN_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => handleSelectCity(city)}
                className={`px-3 py-1 rounded-full border transition ${
                  currentCity.toLowerCase() === city.toLowerCase()
                    ? "bg-[#e06d53] border-[#e06d53] text-white font-bold shadow-sm"
                    : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-[#e06d53] text-white shadow-md shadow-[#e06d53]/25"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-4">
          <div>
            Showing <strong className="text-white">{cafes.length}</strong> real cafes in{" "}
            <span className="text-[#e06d53] font-semibold">{currentCity}, India</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-[#e06d53]" /> Real-time Place API results
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#131d2e] border border-white/10 rounded-2xl p-5 space-y-4 animate-pulse"
              >
                <div className="w-full h-48 bg-white/5 rounded-xl" />
                <div className="h-5 bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-10 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : cafes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-[#131d2e]/50 border border-white/10 rounded-3xl p-8 max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 flex items-center justify-center mx-auto text-3xl">
              ☕
            </div>
            <h3 className="text-xl font-bold text-white">No cafes found in "{currentCity}"</h3>
            <p className="text-sm text-slate-400">
              Try searching for another Indian city like Mumbai, Bengaluru, Delhi NCR, Pune, Jaipur, Goa, or Kolkata.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {POPULAR_INDIAN_CITIES.slice(0, 5).map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className="px-4 py-2 bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-semibold rounded-full shadow transition"
                >
                  Search {city}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Cafes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="bg-[#131d2e] border border-white/10 hover:border-[#e06d53]/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-800">
                  <img
                    src={cafe.image || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"}
                    alt={cafe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131d2e] via-transparent to-transparent opacity-80" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 bg-[#0b111e]/80 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[11px] font-semibold text-[#fca5a5]">
                    {cafe.category || "Cafe"}
                  </div>

                  {/* Rating Pill */}
                  <div className="absolute top-3 right-3 bg-[#0b111e]/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{cafe.rating || 4.7}</span>
                    <span className="text-[9px] text-slate-400 font-normal">({cafe.reviewsCount || 100}+)</span>
                  </div>

                  {/* Location Area Pill */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-[#e06d53]" />
                    <span>{cafe.area || cafe.city}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#e06d53] transition leading-snug">
                      {cafe.name}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {cafe.description || `Popular cafe in ${cafe.area || cafe.city}, ${cafe.city}, India.`}
                    </p>

                    {/* Highlights */}
                    {cafe.highlights && cafe.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cafe.highlights.slice(0, 3).map((hl: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                          >
                            ✨ {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata: Price & Timings */}
                  <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{cafe.priceForTwo || "₹500 for two"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{cafe.timings || "8 AM - 11 PM"}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-[11px] text-slate-400 truncate" title={cafe.address}>
                    📍 {cafe.address}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.mapQuery || `${cafe.name} ${cafe.city} India`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/10 transition text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#e06d53]" /> Maps
                    </a>

                    <button
                      onClick={() => handleShareCafe(cafe)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#e06d53]/15 hover:bg-[#e06d53]/25 text-[#fca5a5] hover:text-white text-xs font-semibold rounded-xl border border-[#e06d53]/30 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CafesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b111e] flex items-center justify-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#e06d53] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold">Loading Cafes...</span>
          </div>
        </div>
      }
    >
      <CafesContent />
    </Suspense>
  );
}
