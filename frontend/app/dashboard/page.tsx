"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string | null;
  relationshipIntent: string | null;
  role: string;
  createdAt: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  date: string;
  price: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Real authenticated session check
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.replace("/login");
          return;
        }

        // Fetch real database events
        const eventRes = await fetch("/api/events");
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          if (eventData.success) {
            setEvents(eventData.events || []);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Network error while loading dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {}
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your JabWeMeet dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="bg-[#131d2e] border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white">
              J
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </span>
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full ml-2">
              Member Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:inline">
              Welcome, <strong className="text-white">{user.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border border-[#e06d53] text-[#e06d53] hover:bg-[#e06d53] hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full space-y-10">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#182337] to-[#121c2c] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div>
            <div className="inline-block bg-[#e06d53]/20 text-[#fca5a5] text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Role: {user.role} • Verified Account
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {user.name.split(" ")[0]}! Ready to meet in real life?
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Here are your upcoming curated experiences, hand-picked introductions, and community gatherings in {user.city}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/#experiences"
              className="bg-[#e06d53] hover:bg-[#c95940] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg transition"
            >
              Explore Experiences
            </a>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 space-y-4 shadow">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Your Profile</span>
              <span className="text-xs text-emerald-400 font-normal">Active</span>
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">
                Email: <span className="text-white font-medium">{user.email}</span>
              </p>
              <p className="text-slate-400">
                Phone: <span className="text-white font-medium">{user.phone}</span>
              </p>
              <p className="text-slate-400">
                City: <span className="text-white font-medium">{user.city}</span>
              </p>
              <p className="text-slate-400">
                Intent:{" "}
                <span className="text-white font-medium">
                  {user.relationshipIntent || "Not specified"}
                </span>
              </p>
              <p className="text-slate-400">
                Gender:{" "}
                <span className="text-white font-medium">
                  {user.gender || "Not specified"}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 space-y-4 shadow">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Matchmaking & Introductions
            </h2>
            <p className="text-sm text-slate-300">
              Our human matchmakers are actively curating introductions matching your preferences in {user.city}.
            </p>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300">
              💡 <strong>Pro Tip:</strong> Attend our upcoming Speed Dating or Singles Mixer to meet 10+ singles in one evening.
            </div>
          </div>

          <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 space-y-4 shadow">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Breakup Community Circle
            </h2>
            <p className="text-sm text-slate-300">
              Need a sympathetic ear or looking to share stories with peers moving forward?
            </p>
            <button
              onClick={() => alert("Connecting you to a Breakup Buddy...")}
              className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Request a Breakup Buddy
            </button>
          </div>
        </div>

        {/* Real Events Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
            <span>Upcoming Real-World Events in {user.city} & Nationwide</span>
            <span className="text-xs text-slate-400 font-normal">
              {events.length} Events Available
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#182337] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-[#e06d53]/50 transition shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#fca5a5] bg-[#e06d53]/20 px-2.5 py-1 rounded-md">
                      {evt.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      ₹{evt.price}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{evt.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{evt.description}</p>
                </div>

                <div className="pt-4 border-t border-white/10 text-xs text-slate-300 space-y-1">
                  <p>📍 {evt.location}, {evt.city}</p>
                  <p>📅 {new Date(evt.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                  <button
                    onClick={() => alert(`Spot reserved for ${evt.title}! Your confirmation details have been sent.`)}
                    className="w-full mt-3 py-2 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition"
                  >
                    Reserve Spot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
