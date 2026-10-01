"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Heart, 
  Lightbulb, 
  CalendarDays, 
  ChevronRight,
  Clock,
  Video,
  Phone,
  MapPin,
  MessageCircle,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function MatchmakerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matchmaker/dashboard", { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-rose-50/60 border border-rose-100 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border border-rose-100 rounded-3xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-rose-100 rounded-3xl"></div>
          <div className="h-96 bg-white border border-rose-100 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl shadow-sm border border-rose-100 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-[#7E2248] mb-4" />
        <h2 className="text-xl font-serif font-bold text-slate-900">Unable to load dashboard data</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">Please refresh your connection or log in again to access the matchmaker console.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 bg-[#7E2248] hover:bg-[#681938] text-white rounded-full text-xs font-bold transition shadow-sm cursor-pointer">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-rose-100 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-[#7E2248]">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            Matchmaker Operations Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
            {getGreeting()}, {data.manager?.name?.split(' ')[0] || "Matchmaker"}! 👋
          </h1>
          <p className="text-slate-600 max-w-xl text-sm leading-relaxed">
            Here's what's happening with your assigned clients, intros, and matchmaking activities today.
          </p>
          <div className="pt-2">
            <div className="inline-flex items-center text-xs font-semibold text-slate-600 bg-[#FAF3F6] border border-rose-200 px-4 py-2 rounded-full shadow-xs">
              <CalendarIcon className="w-3.5 h-3.5 mr-2 text-[#7E2248]" />
              {getFormattedDate()}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Assigned Clients" count={data.stats.assignedClients} subtitle="Active clients in portfolio" icon={Users} color="bg-rose-50 text-[#7E2248] border border-rose-100" />
        <KpiCard title="Matchmaking Requests" count={data.stats.pendingRequests} subtitle="Pending your review" icon={Heart} color="bg-rose-50 text-[#7E2248] border border-rose-100" />
        <KpiCard title="Suggestions" count={data.stats.suggestions} subtitle="New curated matches" icon={Lightbulb} color="bg-emerald-50 text-emerald-700 border border-emerald-100" />
        <KpiCard title="Upcoming Schedule" count={data.stats.upcomingSchedules} subtitle="Today's calls & meets" icon={CalendarDays} color="bg-blue-50 text-blue-700 border border-blue-100" />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Clients & Requests & Actions */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Clients List */}
            <DashboardCard title="Assigned Clients" icon={Users} link="/matchmaker/clients">
              {data.assignedClients.length === 0 ? (
                <EmptyState message="No assigned clients yet." />
              ) : (
                <div className="divide-y divide-rose-100">
                  {data.assignedClients.map((client: any) => (
                    <div key={client.id} className="py-3.5 flex items-center justify-between group hover:bg-rose-50/50 -mx-3 px-3 transition rounded-2xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={client.profileImage} alt={client.name} className="w-10 h-10 rounded-full object-cover border border-rose-200 shadow-xs" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.age} yrs • {client.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={client.status} />
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#7E2248] transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>

            {/* Matchmaking Requests List */}
            <DashboardCard title="Recent Requests" icon={Heart} link="/matchmaker/requests">
              {data.requests.length === 0 ? (
                <EmptyState message="No pending requests." />
              ) : (
                <div className="divide-y divide-rose-100">
                  {data.requests.map((req: any) => (
                    <div key={req.id} className="py-3.5 flex items-center justify-between group hover:bg-rose-50/50 -mx-3 px-3 transition rounded-2xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={req.profileImage} alt={req.clientName} className="w-10 h-10 rounded-full object-cover border border-rose-200 shadow-xs" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition">{req.clientName}</p>
                          <p className="text-xs text-slate-500">{req.age} yrs • {req.city}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Looking for: {req.lookingFor}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚡</span> Quick Operations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/matchmaker/clients">
                <QuickAction icon={Users} label="View All Clients" sub="Assigned roster" color="bg-rose-50 text-[#7E2248] border border-rose-100" />
              </Link>
              <Link href="/matchmaker/requests">
                <QuickAction icon={Heart} label="View Requests" sub="Pending reviews" color="bg-rose-50 text-[#7E2248] border border-rose-100" />
              </Link>
              <Link href="/matchmaker/suggestions">
                <QuickAction icon={Lightbulb} label="See Suggestions" sub="Curated matches" color="bg-emerald-50 text-emerald-700 border border-emerald-100" />
              </Link>
              <Link href="/matchmaker/scheduling">
                <QuickAction icon={CalendarDays} label="Manage Schedule" sub="Bookings & dates" color="bg-blue-50 text-blue-700 border border-blue-100" />
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Schedule & Messages */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Upcoming Schedule */}
          <DashboardCard title="Upcoming Schedule" icon={CalendarDays} link="/matchmaker/scheduling">
            {data.schedule.length === 0 ? (
              <EmptyState message="No meetings scheduled today." />
            ) : (
              <div className="space-y-3">
                {data.schedule.map((appt: any) => (
                  <div key={appt.id} className="p-4 bg-[#FAF3F6] rounded-2xl border border-rose-100 hover:border-rose-300 transition cursor-pointer">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#7E2248]">{appt.time}</span>
                      {appt.mode === 'Video Call' ? <Video className="w-3.5 h-3.5 text-slate-400" /> : <Phone className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{appt.type}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{appt.clientName}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recent Messages */}
          <DashboardCard title="Messages with Admin" icon={MessageCircle} link="/matchmaker/messages">
            <div className="divide-y divide-rose-100">
              <div className="py-3 flex items-start justify-between group hover:bg-rose-50/50 -mx-3 px-3 transition rounded-2xl cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center border border-rose-200 text-[#7E2248] font-bold text-sm shrink-0">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition">
                      System Admin
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2 text-slate-500">
                      Welcome to your dashboard. Reach out here for operations and support.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Just now
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function KpiCard({ title, count, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center justify-between group">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{title}</p>
        <p className="text-3xl font-serif font-bold text-slate-900 mb-1 group-hover:text-[#7E2248] transition">{count}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-xs`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function DashboardCard({ title, icon: Icon, link, children }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 md:p-7 flex flex-col hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#7E2248]" />
          {title}
        </h2>
        <Link href={link} className="text-xs font-bold text-[#7E2248] hover:text-[#681938] flex items-center gap-1 transition">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, color }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${color} group-hover:scale-105 transition shadow-xs`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#7E2248] transition">{label}</p>
      <p className="text-[11px] text-slate-500 leading-tight">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'in progress': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'new': return 'bg-rose-50 text-[#7E2248] border border-rose-200';
      case 'under review': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getStyles()}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}
