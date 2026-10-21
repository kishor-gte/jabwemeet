"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  CalendarCheck2,
  ShoppingBag,
  Users,
  UserSquare2,
  Ticket,
  Wallet,
  LineChart,
  Star,
  Bell,
  Settings,
  LogOut,
  ArrowLeftRight,
  CheckCircle2,
  Coffee,
} from "lucide-react";

export default function CafeSidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { name: "Dashboard Overview", href: "/cafe/dashboard", icon: LayoutDashboard },
    { name: "Cafe Profile", href: "/cafe/profile", icon: Store },
    { name: "Menu Management", href: "/cafe/menu", icon: UtensilsCrossed },
    { name: "Table Reservations", href: "/cafe/reservations", icon: CalendarCheck2 },
    { name: "Live Orders", href: "/cafe/orders", icon: ShoppingBag },
    { name: "Customers", href: "/cafe/customers", icon: Users },
    { name: "Staff Management", href: "/cafe/staff", icon: UserSquare2 },
    { name: "Offers & Coupons", href: "/cafe/offers", icon: Ticket },
    { name: "Payments & Revenue", href: "/cafe/payments", icon: Wallet },
    { name: "Analytics & Trends", href: "/cafe/analytics", icon: LineChart },
    { name: "Customer Reviews", href: "/cafe/reviews", icon: Star },
    { name: "Notifications", href: "/cafe/notifications", icon: Bell },
    { name: "Settings", href: "/cafe/settings", icon: Settings },
  ];

  const confirmLogout = async () => {
    localStorage.removeItem("token");
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    window.location.href = "/login";
  };

  return (
    <>
      <div className="flex flex-col w-64 bg-white border-r border-rose-100 h-screen sticky top-0 overflow-y-auto shrink-0 select-none scrollbar-thin scrollbar-thumb-rose-100">
        {/* Brand Header */}
        <div className="p-6 border-b border-rose-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7E2248] to-[#5c1333] flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-[#7E2248]/20 group-hover:scale-105 transition">
              J
            </div>
            <div>
              <div className="font-serif font-bold text-xl tracking-tight text-slate-900 flex items-center gap-1">
                Jab<span className="text-[#7E2248]">We</span>Meet
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#7E2248] flex items-center gap-1">
                <Coffee className="w-3 h-3 text-[#7E2248]" />
                Cafe Partner Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cafe Operations
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-[#7E2248]" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Navigation
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-rose-50/60 transition"
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Switch to Member View</span>
              </Link>

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 transition border border-rose-200 bg-rose-50/50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#7E2248] shrink-0" />
                  <span>Admin Console</span>
                </Link>
              )}

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile Card */}
        <div className="p-4 border-t border-rose-100 bg-[#FAF3F6]/50">
          <Link href="/cafe/profile" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-[#7E2248] font-bold flex items-center justify-center text-sm shadow-xs shrink-0 overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user?.name || "Cafe"} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : "CP"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-[#7E2248] transition">
                {user?.name || "Cafe Partner"}
              </div>
              <div className="text-xs text-slate-500 truncate">{user?.email || "cafe@jabwemeet.com"}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-rose-100 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 text-[#7E2248]">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">Ready to Leave?</h3>
            <p className="text-slate-500 mb-6 text-xs leading-relaxed">
              Are you sure you want to sign out from the Cafe Partner Portal? You can sign back in anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-[#7E2248] hover:bg-[#681938] text-white font-semibold rounded-xl transition shadow-md shadow-[#7E2248]/20 text-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

