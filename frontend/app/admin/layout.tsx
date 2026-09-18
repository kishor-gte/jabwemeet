"use client";

import React, { useEffect, useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  HeartHandshake,
  Heart,
  Sparkles,
  CreditCard,
  RotateCcw,
  Receipt,
  Package,
  Repeat,
  Tag,
  ShieldAlert,
  FileCheck,
  Star,
  LifeBuoy,
  BellRing,
  FileText,
  BarChart3,
  Shield,
  History,
  Settings,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffRole?: string;
}

const NAV_SECTIONS = [
  {
    title: "Platform Core",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Event Control", href: "/admin/events", icon: Calendar },
    ],
  },
  {
    title: "Staff & Matchmaking",
    items: [
      { label: "Event Managers", href: "/admin/event-managers", icon: UserCheck },
      { label: "Relationship Managers", href: "/admin/relationship-managers", icon: HeartHandshake },
      { label: "Breakup Buddies", href: "/admin/breakup-buddies", icon: Heart },
      { label: "Buddy Sessions", href: "/admin/breakup-buddy/sessions", icon: Clock },
      { label: "Matchmaking Center", href: "/admin/matchmaking", icon: Sparkles },
      { label: "Date Scheduling", href: "/admin/matchmaking/dates", icon: Calendar },
    ],
  },
  {
    title: "Finance & Billing",
    items: [
      { label: "Payments & Revenue", href: "/admin/payments", icon: CreditCard },
      { label: "Refund Requests", href: "/admin/payments/refunds", icon: RotateCcw },
      { label: "Invoices", href: "/admin/payments/invoices", icon: Receipt },
      { label: "Service Packages", href: "/admin/services/packages", icon: Package },
      { label: "Subscriptions", href: "/admin/services/subscriptions", icon: Repeat },
      { label: "Coupons & Offers", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    title: "Trust, Safety & Support",
    items: [
      { label: "Safety Center", href: "/admin/safety", icon: ShieldAlert },
      { label: "Verification Center", href: "/admin/verification", icon: FileCheck },
      { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star },
      { label: "Customer Support", href: "/admin/support", icon: LifeBuoy },
    ],
  },
  {
    title: "Governance & Content",
    items: [
      { label: "Notifications & Broadcast", href: "/admin/notifications", icon: BellRing },
      { label: "Content CMS", href: "/admin/content", icon: FileText },
      { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Admin Management", href: "/admin/staff", icon: Shield },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
      { label: "System Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Check auth and admin permissions
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    verifyAdmin();
  }, [router]);

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live search query
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Authenticating Platform Control Center...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#0d1627]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              J
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  JabWeMeet
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">
                Platform Control Center
              </span>
            </div>
          </a>
        </div>

        {/* Global Search Bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#131d2e] border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200 transition text-xs w-64 lg:w-80 shadow-inner"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="flex-1 text-left">Search users, events, tickets...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 border border-white/10">
            Ctrl K
          </kbd>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Super Admin Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>SUPER ADMIN</span>
          </div>

          {/* Switch to Member View */}
          <a
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <span>Member View</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-[#182337] border border-white/15 flex items-center justify-center font-bold text-white text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#0d1627] border-r border-white/10 shrink-0 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {NAV_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {section.title}
                </h4>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-red-600/90 to-rose-600/80 text-white font-bold shadow-md shadow-red-500/20"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-white/10 bg-[#080d1a]/50">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>JabWeMeet Core v2.6</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-[#0d1627] h-full flex flex-col z-10 border-r border-white/10 shadow-2xl overflow-y-auto">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-xs">
                    J
                  </div>
                  <span className="font-bold text-sm text-white">JabWeMeet Admin</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {NAV_SECTIONS.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {section.title}
                    </h4>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname === item.href || pathname.startsWith(item.href + "/");

                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                            isActive
                              ? "bg-red-600 text-white font-bold"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search by user name, email, event title, ticket code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {searchLoading && (
                <div className="py-6 text-center text-slate-400">Searching platform database...</div>
              )}

              {!searchLoading && !searchResults && (
                <div className="py-6 text-center text-slate-500">
                  Type at least 2 characters to search across Users, Events, Transactions, and Reports.
                </div>
              )}

              {!searchLoading && searchResults && (
                <div className="space-y-4">
                  {/* Users */}
                  {searchResults.users?.length > 0 && (
                    <div>
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
                        Users ({searchResults.users.length})
                      </h5>
                      <div className="space-y-1">
                        {searchResults.users.map((u: any) => (
                          <a
                            key={u.id}
                            href={`/admin/users/${u.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                          >
                            <div>
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-[11px] text-slate-400">{u.email} • {u.city || "N/A"}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold text-[10px]">
                              {u.role}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {searchResults.events?.length > 0 && (
                    <div>
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
                        Events ({searchResults.events.length})
                      </h5>
                      <div className="space-y-1">
                        {searchResults.events.map((e: any) => (
                          <a
                            key={e.id}
                            href={`/admin/events/${e.id}/registrations`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                          >
                            <div>
                              <div className="font-bold text-white">{e.title}</div>
                              <div className="text-[11px] text-slate-400">{e.category} • {e.city} • ₹{e.price}</div>
                            </div>
                            <span className="text-slate-400 text-[10px]">View Registrations →</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payments */}
                  {searchResults.payments?.length > 0 && (
                    <div>
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
                        Payments ({searchResults.payments.length})
                      </h5>
                      <div className="space-y-1">
                        {searchResults.payments.map((p: any) => (
                          <a
                            key={p.id}
                            href="/admin/payments"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                          >
                            <div>
                              <div className="font-bold text-emerald-400">₹{p.amount} ({p.type})</div>
                              <div className="text-[11px] text-slate-400">ID: {p.id}</div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              {p.status}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
