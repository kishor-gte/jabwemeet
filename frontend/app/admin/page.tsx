"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
  Ticket,
  Activity,
  Bell,
  Heart,
  Star,
  BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "overview" | "events" | "bookings" | "approvals" | "users";

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    HOST: { label: "Event Host", cls: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    MATCHMAKER: { label: "Rel. Manager", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    BREAKUP_BUDDY: { label: "Breakup Buddy", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    ADMIN: { label: "Admin", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
    USER: { label: "Member", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  };
  const r = map[role] ?? { label: role, cls: "bg-white/10 text-white border-white/20" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.cls}`}>
      {r.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    CHECKED_IN: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
    PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${map[status] ?? "bg-white/10 text-white border-white/10"}`}>
      {status}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Admin",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "events", label: "Platform Events", icon: Calendar },
      { id: "bookings", label: "Attendee RSVPs", icon: UserCheck },
    ],
  },
  {
    group: "Management",
    items: [
      { id: "approvals", label: "Staff & Host Approvals", icon: ShieldCheck },
      { id: "users", label: "All Users", icon: Users },
    ],
  },
  {
    group: "Navigate To",
    items: [
      { id: "__member", label: "Member Dashboard", icon: Heart, href: "/dashboard" },
      { id: "__host", label: "Host Dashboard", icon: Calendar, href: "/host/dashboard" },
      { id: "__home", label: "Homepage", icon: Activity, href: "/" },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({ totalUsers: 0, totalEvents: 0, totalBookings: 0, totalRevenue: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success && data.user?.role === "ADMIN") {
          setUser(data.user);
          loadAll();
        } else {
          router.replace(data.user ? "/dashboard" : "/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function loadAll() {
    setDataLoading(true);
    await Promise.all([fetchPending(), fetchOverview()]);
    setDataLoading(false);
  }

  async function fetchPending() {
    try {
      const res = await fetch("/api/admin/pending", { credentials: "include" });
      const d = await res.json();
      if (d.success) setPendingUsers(d.data);
    } catch {}
  }

  async function fetchOverview() {
    try {
      const res = await fetch("/api/admin/events-overview", { credentials: "include" });
      const d = await res.json();
      if (d.success) {
        setEventsData(d.events || []);
        setRecentBookings(d.recentBookings || []);
        setAdminStats(d.stats);
      }
    } catch {}
  }

  async function approveUser(id: string) {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, { method: "POST", credentials: "include" });
      const d = await res.json();
      if (d.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        showToast("✅ Application approved successfully!");
      } else showToast("❌ " + (d.message || "Failed to approve."));
    } catch { showToast("❌ Network error."); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  function navigate(section: Section) {
    setActiveSection(section);
    setMobileOpen(false);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg mx-auto animate-pulse">A</div>
          <p className="text-slate-400 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const confirmedRsvps = recentBookings.filter((b) => b.status !== "CANCELLED").length;

  // ════════════════════════════════════════════════════════════════════════════
  // Sidebar content — same markup used for both desktop fixed + mobile drawer
  // ════════════════════════════════════════════════════════════════════════════
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d1526] text-slate-200 border-r border-white/10 select-none">

      {/* Brand header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-[#e06d53]/25 group-hover:scale-105 transition">
            J
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Admin Console
            </div>
          </div>
        </Link>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                // Badge counts
                const badge =
                  item.id === "approvals" && pendingUsers.length > 0 ? pendingUsers.length
                    : item.id === "events" && eventsData.length > 0 ? eventsData.length
                    : item.id === "bookings" && confirmedRsvps > 0 ? confirmedRsvps
                    : null;

                if ("href" in item && item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id as Section)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#e06d53]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {badge !== null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                        item.id === "approvals"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/10 text-slate-300"
                      }`}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom — user card + logout */}
      <div className="p-4 border-t border-white/10 bg-[#0a101d]">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/5 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-[#e06d53] flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                <span>{user.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
              </div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-[#fca5a5] hover:bg-rose-500/10 rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans">

      {/* ── Desktop fixed sidebar ── */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── Main content area (offset by sidebar on desktop) ── */}
      <div className="lg:ml-72 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#0b111e]/95 backdrop-blur-md border-b border-white/10 px-5 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-white text-base">
                {activeSection === "overview" && "Dashboard Overview"}
                {activeSection === "events" && "Platform Events"}
                {activeSection === "bookings" && "Attendee RSVPs"}
                {activeSection === "approvals" && "Staff & Host Approvals"}
                {activeSection === "users" && "All Users"}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">JabWeMeet Admin Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingUsers.length > 0 && (
              <button
                onClick={() => navigate("approvals")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 transition"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pendingUsers.length} Pending</span>
                <span className="sm:hidden">{pendingUsers.length}</span>
              </button>
            )}
            <button
              onClick={loadAll}
              disabled={dataLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#182337] border border-white/15 text-white text-sm font-semibold shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            {toast}
          </div>
        )}

        {/* ═══ PAGE CONTENT ═══════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8 space-y-8">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeSection === "overview" && (
            <div className="space-y-8">

              {/* Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Platform Superadmin
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Welcome back, {user.name.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Real-time oversight of events, bookings, and partner applications.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: adminStats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", sub: "Registered platform-wide" },
                  { label: "Active Events", value: adminStats.totalEvents, icon: Calendar, color: "text-[#fca5a5]", bg: "bg-[#e06d53]/10 border-[#e06d53]/20", sub: "Singles, Speed, Dance, Travel" },
                  { label: "Confirmed RSVPs", value: adminStats.totalBookings, icon: Ticket, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", sub: "Active attendee bookings" },
                  { label: "Gross Revenue", value: `₹${adminStats.totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", sub: "Total ticket sales GMV" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl bg-[#131d2e] border ${s.bg} p-5 space-y-3`}>
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</p>
                      <p className="text-[10px] text-slate-500">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending alert */}
              {pendingUsers.length > 0 && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-200 text-sm">
                        {pendingUsers.length} Application{pendingUsers.length > 1 ? "s" : ""} Awaiting Review
                      </p>
                      <p className="text-xs text-amber-400">
                        Host and partner accounts need admin approval before they can log in.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => navigate("approvals")} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shrink-0">
                    Review Now →
                  </button>
                </div>
              )}

              {/* Two-col preview */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Recent events */}
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Recent Events</h3>
                    <button onClick={() => navigate("events")} className="text-[11px] text-[#e06d53] hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {eventsData.slice(0, 5).map((evt) => {
                      const booked = (evt.bookings || []).filter((b: any) => b.status !== "CANCELLED").length;
                      return (
                        <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition">
                          <div className="w-8 h-8 rounded-lg bg-[#e06d53]/15 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-[#e06d53]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-xs truncate">{evt.title}</p>
                            <p className="text-[11px] text-slate-400">{evt.category} · {evt.city}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-amber-300">{evt.price > 0 ? `₹${evt.price}` : "Free"}</p>
                            <p className="text-[10px] text-slate-500">{booked}/{evt.maxAttendees}</p>
                          </div>
                        </div>
                      );
                    })}
                    {eventsData.length === 0 && <p className="text-slate-500 text-xs italic text-center py-4">No events yet.</p>}
                  </div>
                </div>

                {/* Recent RSVPs */}
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Recent RSVPs</h3>
                    <button onClick={() => navigate("bookings")} className="text-[11px] text-[#e06d53] hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {recentBookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-xs truncate">{b.user?.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{b.event?.title}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                    {recentBookings.length === 0 && <p className="text-slate-500 text-xs italic text-center py-4">No RSVPs yet.</p>}
                  </div>
                </div>
              </div>

              {/* Pending approvals quick list */}
              {pendingUsers.length > 0 && (
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Pending Applications
                    </h3>
                    <button onClick={() => navigate("approvals")} className="text-[11px] text-[#e06d53] hover:underline flex items-center gap-1">
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pendingUsers.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 font-bold text-amber-300 text-sm">
                            {getInitials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{p.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <RoleBadge role={p.role} />
                          <button onClick={() => approveUser(p.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition">
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EVENTS ───────────────────────────────────────────────────── */}
          {activeSection === "events" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Events</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{eventsData.length} event{eventsData.length !== 1 ? "s" : ""} published</p>
                </div>
                <Link href="/host/dashboard" className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition shadow-md">
                  + Create Event
                </Link>
              </div>

              {eventsData.length === 0 ? (
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-16 text-center">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No events published yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsData.map((evt) => {
                    const booked = (evt.bookings || []).filter((b: any) => b.status !== "CANCELLED").length;
                    const fillPct = Math.min(100, (booked / (evt.maxAttendees || 50)) * 100);
                    return (
                      <div key={evt.id} className="rounded-2xl bg-[#131d2e] border border-white/10 hover:border-white/20 transition p-5 flex flex-col md:flex-row md:items-center gap-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/25">{evt.category}</span>
                            {evt.host && <span className="text-[10px] text-slate-400">by <strong className="text-slate-200">{evt.host.name}</strong></span>}
                          </div>
                          <h3 className="font-bold text-white text-sm">{evt.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{evt.city} · {evt.location}</span>
                            <span>📅 {new Date(evt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className="font-bold text-amber-300">{evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free"}</span>
                          </div>
                        </div>
                        <div className="shrink-0 w-full md:w-44 space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Capacity</span>
                            <span className="font-bold text-white">{booked}/{evt.maxAttendees}</span>
                          </div>
                          <div className="h-1.5 bg-[#0b111e] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-500" : fillPct >= 60 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${fillPct}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500">{Math.round(fillPct)}% filled</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── BOOKINGS ─────────────────────────────────────────────────── */}
          {activeSection === "bookings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Attendee RSVPs</h2>
                <p className="text-xs text-slate-400 mt-0.5">{recentBookings.length} reservation{recentBookings.length !== 1 ? "s" : ""} across all events</p>
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-3">
                {(["CONFIRMED", "CHECKED_IN", "CANCELLED"] as const).map((s) => {
                  const cnt = recentBookings.filter((b) => b.status === s).length;
                  return (
                    <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131d2e] border border-white/10 text-xs font-semibold">
                      <StatusBadge status={s} />
                      <span className="text-white">{cnt}</span>
                    </div>
                  );
                })}
              </div>

              {recentBookings.length === 0 ? (
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-16 text-center">
                  <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No RSVPs recorded yet.</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-[#0b111e] text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/10">
                          <th className="px-5 py-3.5">Attendee</th>
                          <th className="px-5 py-3.5">Event</th>
                          <th className="px-5 py-3.5">Spots</th>
                          <th className="px-5 py-3.5">Amount</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Booked At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-white">{b.user?.name}</p>
                              <p className="text-[11px] text-slate-500">{b.user?.email}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-white">{b.event?.title}</p>
                              <p className="text-[11px] text-slate-500">{b.event?.category} · {b.event?.city}</p>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-white">{b.spots}</td>
                            <td className="px-5 py-3.5 font-bold text-amber-300">₹{(b.totalAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                            <td className="px-5 py-3.5 text-slate-400">
                              {new Date(b.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── APPROVALS ────────────────────────────────────────────────── */}
          {activeSection === "approvals" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Staff & Host Approvals</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review and approve pending Host, Relationship Manager, and Breakup Buddy accounts
                </p>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">All Clear!</h3>
                  <p className="text-slate-400 text-sm">No pending applications right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-[#131d2e] border border-white/10 hover:border-white/20 transition p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0">
                              {getInitials(p.name)}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base leading-tight">{p.name}</h3>
                              <RoleBadge role={p.role} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-400">
                            <span>📧 {p.email}</span>
                            <span>📞 {p.phone}</span>
                            <span>🕐 Applied {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                          {(p.govIdProof || p.addressProof || p.eduCertificate || p.workExperience || p.idDocument) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                              <p className="w-full text-[10px] text-slate-500 font-bold uppercase tracking-wider">Submitted Documents</p>
                              {p.govIdProof && <a href={`/uploads/${p.govIdProof}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">📄 Govt ID</a>}
                              {p.addressProof && <a href={`/uploads/${p.addressProof}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">📄 Address Proof</a>}
                              {p.eduCertificate && <a href={`/uploads/${p.eduCertificate}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">📄 Education</a>}
                              {p.workExperience && <a href={`/uploads/${p.workExperience}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">📄 Work Exp</a>}
                              {p.idDocument && <a href={`/uploads/${p.idDocument}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">📄 {p.idType || "ID"}</a>}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => approveUser(p.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ALL USERS ─────────────────────────────────────────────────── */}
          {activeSection === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">All Users</h2>
                <p className="text-xs text-slate-400 mt-0.5">{adminStats.totalUsers} account{adminStats.totalUsers !== 1 ? "s" : ""} registered on the platform</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { role: "USER", label: "Members", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                  { role: "HOST", label: "Event Hosts", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                  { role: "MATCHMAKER", label: "Rel. Managers", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                  { role: "BREAKUP_BUDDY", label: "Breakup Buddies", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                ].map((r) => (
                  <div key={r.role} className={`rounded-2xl ${r.bg} border ${r.border} p-4 text-center space-y-1`}>
                    <RoleBadge role={r.role} />
                    <p className="text-xs text-slate-400">{r.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#131d2e] border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Active Attendees</h3>
                  <span className="text-[11px] text-slate-400">{recentBookings.length} booking records</span>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="p-10 text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs">No booking activity yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-[#0b111e] text-slate-400 text-[10px] uppercase tracking-widest border-b border-white/10">
                          <th className="px-5 py-3.5">Name</th>
                          <th className="px-5 py-3.5">Email</th>
                          <th className="px-5 py-3.5">Phone</th>
                          <th className="px-5 py-3.5">City</th>
                          <th className="px-5 py-3.5">Last Booking</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.from(new Map(recentBookings.map((b) => [b.user?.id, b])).values()).map((b) => (
                          <tr key={b.user?.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                                  {getInitials(b.user?.name || "?")}
                                </div>
                                <span className="font-bold text-white">{b.user?.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">{b.user?.email}</td>
                            <td className="px-5 py-3.5 text-slate-400">{b.user?.phone}</td>
                            <td className="px-5 py-3.5 text-slate-400">{b.user?.city || "—"}</td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
