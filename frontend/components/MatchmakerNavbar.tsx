"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { useEffect, useState } from "react";

export default function MatchmakerNavbar() {
  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setManager(d.user); })
      .catch(() => {});
  }, []);

  return (
    <header className="h-20 bg-white border-b border-rose-100 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-slate-500 hover:text-slate-800">
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-slate-50 rounded-full px-4 py-2 flex-1 max-w-xl border border-slate-100 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clients, requests, or profiles..." 
            className="bg-transparent border-none outline-none w-full ml-3 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-slate-600 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <img 
            src={manager?.profileImage || "https://i.pravatar.cc/150?img=5"} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border-2 border-rose-100"
          />
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-800">{manager?.name || "Loading..."}</p>
            <p className="text-xs text-slate-500">Relationship Manager</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 hidden md:block" />
        </div>
      </div>
    </header>
  );
}
