"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cafe/notifications", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setNotifs(data.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Notifications</h1>
      <div className="space-y-4">
        {loading ? <div className="text-white">Loading notifications...</div> : notifs.length === 0 ? <div className="text-slate-500 bg-[#131d2e] p-6 rounded-2xl text-center border border-white/5">No notifications yet.</div> : notifs.map((n) => (
          <div key={n.id} className="flex items-center gap-4 p-4 bg-[#131d2e] border border-white/5 rounded-2xl hover:bg-white/[0.02] transition">
            <div className={`p-3 rounded-full ${n.isRead ? 'bg-white/5 text-slate-400' : 'bg-amber-500/10 text-amber-400'}`}><Bell className="w-5 h-5"/></div>
            <div className="flex-1">
              <p className={`font-medium ${n.isRead ? 'text-slate-300' : 'text-white'}`}>{n.message}</p>
              <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
