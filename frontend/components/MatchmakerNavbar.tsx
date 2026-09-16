"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
              title: 'New Requests',
              message: `You have ${d.stats.pendingRequests} new matchmaking request(s).`,
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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-400 hover:text-slate-600 transition focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 bg-slate-50 font-semibold text-sm text-slate-700">
                Notifications
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition">
                      <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer group">
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
