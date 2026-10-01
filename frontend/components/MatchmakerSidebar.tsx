"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Heart, 
  Lightbulb, 
  CalendarDays, 
  MessageSquare,
  LogOut,
  Star,
  Wallet,
  ArrowLeftRight
} from "lucide-react";
import { useState, useEffect } from "react";

export default function MatchmakerSidebar() {
  const pathname = usePathname();
  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setManager(d.user); })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/matchmaker/dashboard", icon: Home },
    { name: "Assigned Clients", href: "/matchmaker/clients", icon: Users },
    { name: "Matchmaking Requests", href: "/matchmaker/requests", icon: Heart },
    { name: "Connection Requests", href: "/matchmaker/suggestions", icon: Lightbulb },
    { name: "Scheduling", href: "/matchmaker/scheduling", icon: CalendarDays },
    { name: "Profile & Availability", href: "/matchmaker/availability", icon: CalendarDays },
    { name: "Feedback", href: "/matchmaker/feedback", icon: Star },
    { name: "Messages", href: "/matchmaker/messages", icon: MessageSquare },
    { name: "Earnings", href: "/matchmaker/earnings", icon: Wallet },
  ];

  return (
    <div className="w-64 bg-white border-r border-rose-100 flex-col hidden md:flex shrink-0 select-none">
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
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#7E2248]">
              Matchmaker Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-rose-100">
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Matchmaker Console
        </div>
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
                  : "text-slate-600 hover:bg-rose-50/50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#7E2248]" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-rose-100/60 mt-4 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50/60 hover:text-slate-900 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-400" />
            <span>Switch to Member View</span>
          </Link>
          <button 
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.href = "/");
            }}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-left rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-rose-100 bg-[#FAF3F6]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-[#7E2248] font-bold flex items-center justify-center text-sm shadow-xs">
            {manager?.name ? manager.name.slice(0, 2).toUpperCase() : "MM"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{manager?.name || "Matchmaker"}</div>
            <div className="text-xs text-slate-500 truncate">{manager?.email || "Relationship Manager"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
