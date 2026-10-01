"use client";

import { Bell, Search, ChevronDown, Menu, Sparkles, Heart } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function MatchmakerNavbar() {
  const [manager, setManager] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch profile
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setManager(d.user); })
      .catch(() => {});

    // Fetch dashboard data for notifications
    fetch('/api/matchmaker/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const notifs = [];
          if (d.stats?.pendingRequests > 0) {
            notifs.push({
              id: 'req',
              title: 'New Matchmaking Requests',
              message: `You have ${d.stats.pendingRequests} new matchmaking request(s) awaiting review.`,
              time: 'Just now'
            });
          }
          if (d.messages && d.messages.length > 0) {
            const unreadMessages = d.messages.filter((m: any) => m.unreadCount > 0);
            unreadMessages.forEach((m: any) => {
              notifs.push({
                id: `msg-${m.id}`,
                title: `New Message from ${m.clientName}`,
                message: m.lastMessage,
                time: new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              });
            });
          }
          if (d.stats?.upcomingSchedules > 0) {
             notifs.push({
              id: 'sched',
              title: 'Upcoming Schedules',
              message: `You have ${d.stats.upcomingSchedules} schedule(s) for today.`,
              time: 'Today'
            });
          }
          setNotifications(notifs);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-rose-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Brand Monogram */}
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7E2248] to-[#5c1333] flex items-center justify-center font-bold text-white text-sm">
            J
          </div>
          <span className="font-serif font-bold text-slate-900 text-base">Jab<span className="text-[#7E2248]">We</span>Meet</span>
        </Link>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-[#FDFBF9] rounded-2xl px-4 py-2 flex-1 max-w-md border border-rose-200 focus-within:border-[#7E2248] focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clients, matchmaking requests, or profiles..." 
            className="bg-transparent border-none outline-none w-full ml-3 text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Portal Status Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-[#7E2248]">
          <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
          <span>Matchmaker Portal</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-rose-50 rounded-xl transition cursor-pointer focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-[#7E2248] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-84 bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-rose-100 bg-[#FAF3F6] flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-slate-900">Notifications</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] border border-rose-200">
                  {notifications.length} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-rose-50">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-rose-50/50 cursor-pointer transition">
                      <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{notif.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-rose-100">
          <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-[#7E2248] font-bold flex items-center justify-center text-xs shadow-xs">
            {manager?.name ? manager.name.slice(0, 2).toUpperCase() : "MM"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{manager?.name || "Matchmaker"}</p>
            <p className="text-[10px] text-slate-500">Relationship Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
