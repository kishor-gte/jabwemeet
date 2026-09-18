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
  Wallet
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
    { name: "Suggestions", href: "/matchmaker/suggestions", icon: Lightbulb },
    { name: "Scheduling", href: "/matchmaker/scheduling", icon: CalendarDays },
    { name: "Feedback", href: "/matchmaker/feedback", icon: Star },
    { name: "Messages", href: "/matchmaker/messages", icon: MessageSquare },
    { name: "Earnings", href: "/matchmaker/earnings", icon: Wallet },
  ];

  return (
    <div className="w-64 bg-white border-r border-rose-100 flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-rose-50">
        <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
        <div className="ml-3">
          <h1 className="text-xl font-bold text-slate-800 leading-none">JabWeMeet</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Find Your Forever</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive 
                  ? "bg-rose-50 text-rose-600" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-rose-50">
        <button 
          onClick={() => {
            fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.href = "/");
          }}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-500 transition"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
