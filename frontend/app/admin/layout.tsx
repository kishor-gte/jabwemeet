"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
  MessageCircle,
  Coffee,
} from "lucide-react";
import { AdminDialogProvider } from "@/components/admin/AdminDialogProvider";

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
      { label: "Breakup Buddies", href: "/admin/breakup-buddies", icon: Heart },
      { label: "Relationship Managers", href: "/admin/relationship-managers", icon: HeartHandshake },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Event Control", href: "/admin/events", icon: Calendar },
      { label: "Cafe Partner", href: "/admin/cafe-partner", icon: Coffee },
    ],
  },
  {
    title: "Staff & Matchmaking",
    items: [
      { label: "Event Managers", href: "/admin/event-managers", icon: UserCheck },
      { label: "Buddy Sessions", href: "/admin/breakup-buddy/sessions", icon: Clock },
      { label: "Matchmaking Center", href: "/admin/matchmaking", icon: Sparkles },
      { label: "Date Scheduling", href: "/admin/matchmaking/dates", icon: Calendar },
      { label: "Messages", href: "/admin/messages", icon: MessageCircle },
    ],
  },
  {
    title: "Finance & Billing",
    items: [
      { label: "My Earnings", href: "/admin/earnings", icon: CreditCard },
      { label: "Payments & Revenue", href: "/admin/payments", icon: CreditCard },
      { label: "Invoices", href: "/admin/payments/invoices", icon: Receipt },
      { label: "Service Packages", href: "/admin/services/packages", icon: Package },
      { label: "Subscriptions", href: "/admin/services/subscriptions", icon: Repeat },
      { label: "Coupons & Offers", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    title: "Trust, Safety & Support",
    items: [
      { label: "Verification Center", href: "/admin/verification", icon: FileCheck },
      { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star },
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
    ],
  },
];

const ALL_NAV_HREFS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));

function isNavItemActive(itemHref: string, currentPathname: string): boolean {
  if (itemHref === "/admin") {
    return currentPathname === "/admin";
  }
  if (currentPathname === itemHref) {
    return true;
  }
  if (currentPathname.startsWith(itemHref + "/")) {
    const hasMoreSpecific = ALL_NAV_HREFS.some(
      (otherHref) =>
        otherHref !== itemHref &&
        (currentPathname === otherHref || currentPathname.startsWith(otherHref + "/")) &&
        otherHref.length > itemHref.length
    );
    return !hasMoreSpecific;
  }
  return false;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Save sidebar scroll position
  const handleSidebarScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("admin_sidebar_scroll", String(e.currentTarget.scrollTop));
  };

  const handleNavClick = () => {
    if (sidebarRef.current) {
      sessionStorage.setItem("admin_sidebar_scroll", String(sidebarRef.current.scrollTop));
    }
  };

  // Restore sidebar scroll position across navigation and loads, and reset main content scroll
  useEffect(() => {
    if (loading) return;
    const restoreScroll = () => {
      const saved = sessionStorage.getItem("admin_sidebar_scroll");
      if (saved && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(saved, 10);
      } else if (sidebarRef.current) {
        const activeElem = sidebarRef.current.querySelector('[data-active="true"]');
        if (activeElem) {
          activeElem.scrollIntoView({ block: "nearest" });
        }
      }
    };

    restoreScroll();
    const timer = setTimeout(restoreScroll, 50);

    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }

    return () => clearTimeout(timer);
  }, [pathname, loading]);

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
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#7E2248] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7E2248] text-sm font-serif font-bold tracking-wide">
            Authenticating Platform Control Center...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AdminDialogProvider>
      <div className="min-h-screen bg-[#FDFBF9] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#7E2248] selection:text-white">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[#7E2248] hover:bg-rose-100/60 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#7E2248] flex items-center justify-center font-black text-white text-base shadow-sm shadow-[#7E2248]/20 group-hover:scale-105 transition-transform">
              J
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base tracking-tight text-slate-900">
                  JabWeMeet
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block font-medium">
                Platform Control Center
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#FAF3F6]/70 border border-rose-100 text-slate-500 hover:border-rose-200 hover:text-slate-800 transition text-xs w-64 lg:w-80 shadow-xs cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Search users, events, tickets...</span>
          <kbd className="px-1.5 py-0.5 rounded-lg bg-white text-[10px] font-mono text-slate-500 border border-rose-200 shadow-2xs">
            Ctrl K
          </kbd>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Super Admin Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>SUPER ADMIN</span>
          </div>

          {/* Switch to Member View */}
          <a
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-xs font-bold text-[#7E2248] hover:bg-rose-100 transition cursor-pointer"
          >
            <span>Member View</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#7E2248]" />
          </a>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-rose-100">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-[#7E2248] text-xs shadow-2xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          ref={sidebarRef}
          onScroll={handleSidebarScroll}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="hidden lg:flex flex-col w-64 bg-white border-r border-rose-100 shrink-0 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden"
        >
          <div className="p-4 space-y-6">
            {NAV_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {section.title}
                </h4>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(item.href, pathname);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      scroll={false}
                      data-active={isActive}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium transition ${
                        isActive
                          ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 font-bold shadow-xs"
                          : "text-slate-600 hover:bg-rose-50/50 hover:text-[#7E2248]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#7E2248]" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-rose-100 bg-[#FDFBF9]">
            <div className="text-[11px] text-slate-400 flex items-center justify-between font-medium">
              <span>JabWeMeet Core v2.6</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-10 border-r border-rose-100 shadow-2xl overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-rose-100 bg-rose-50/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7E2248] flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    J
                  </div>
                  <span className="font-serif font-bold text-sm text-slate-900">JabWeMeet Admin</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {NAV_SECTIONS.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {section.title}
                    </h4>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavItemActive(item.href, pathname);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium transition ${
                            isActive
                              ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 font-bold shadow-xs"
                              : "text-slate-600 hover:bg-rose-50/50 hover:text-[#7E2248]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#7E2248]" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main ref={mainRef} className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 custom-scrollbar bg-[#FDFBF9]">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-rose-100 rounded-3xl shadow-2xl overflow-hidden z-10">
            <div className="p-4 border-b border-rose-100 flex items-center gap-3 bg-rose-50/30">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search by user name, email, event title, ticket code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              {searchLoading && (
                <div className="py-6 text-center text-slate-400">Searching platform database...</div>
              )}

              {!searchLoading && !searchResults && (
                <div className="py-6 text-center text-slate-400">
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
                          <Link
                            key={u.id}
                            href={`/admin/users/${u.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100/60 transition"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{u.name}</div>
                              <div className="text-[11px] text-slate-500">{u.email} • {u.city || "N/A"}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] font-bold text-[10px] border border-rose-200">
                              {u.role}
                            </span>
                          </Link>
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
                          <Link
                            key={e.id}
                            href={`/admin/events/${e.id}/registrations`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100/60 transition"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{e.title}</div>
                              <div className="text-[11px] text-slate-500">{e.category} • {e.city} • ₹{e.price}</div>
                            </div>
                            <span className="text-[#7E2248] font-bold text-[10px]">View Registrations →</span>
                          </Link>
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
                          <Link
                            key={p.id}
                            href="/admin/payments"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100/60 transition"
                          >
                            <div>
                              <div className="font-bold text-emerald-700">₹{p.amount} ({p.type})</div>
                              <div className="text-[11px] text-slate-500">ID: {p.id}</div>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.status}
                            </span>
                          </Link>
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
    </AdminDialogProvider>
  );
}
