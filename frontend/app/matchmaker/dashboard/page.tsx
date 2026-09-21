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
  AlertCircle
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
        <div className="h-40 bg-rose-50 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-xl"></div>
          <div className="h-96 bg-white rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-slate-100">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Unable to load dashboard data</h2>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl p-8 md:p-10 relative overflow-hidden border border-rose-100/50 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            {getGreeting()}, {data.manager?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600 mb-4 max-w-lg">
            Here's what's happening with your assigned clients and matchmaking activities today.
          </p>
          <div className="flex items-center text-sm font-medium text-slate-500 bg-white/60 w-fit px-4 py-2 rounded-full shadow-sm backdrop-blur-sm">
            <CalendarIcon className="w-4 h-4 mr-2 text-rose-400" />
            {getFormattedDate()}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none hidden md:block">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute -right-10 -top-10 w-64 h-64 fill-rose-300">
            <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.6,-46.3C91.4,-33.5,98.1,-18.1,97.7,-3.1C97.3,12,89.9,26.7,80,39.2C70.1,51.6,57.7,61.9,43.9,69.5C30,77.2,15,82.2,-0.2,82.5C-15.4,82.8,-30.9,78.5,-44.5,70.5C-58.1,62.5,-69.9,50.8,-78.9,37C-87.9,23.1,-94.1,7.2,-93.3,-8.4C-92.5,-23.9,-84.6,-38.9,-74,-51C-63.5,-63.1,-50.2,-72.1,-36.3,-79.3C-22.4,-86.5,-7.9,-91.7,3.5,-97.5C14.9,-103.3,29.8,-110,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute right-10 bottom-10 hidden md:block text-right">
          <p className="font-serif text-2xl text-rose-300/80 italic transform -rotate-6">Real People</p>
          <p className="font-serif text-2xl text-rose-300/80 italic transform -rotate-6 ml-4">Real Connections <Heart className="inline w-5 h-5 text-rose-300/80" /></p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard title="Assigned Clients" count={data.stats.assignedClients} subtitle="Active clients" icon={Users} color="bg-rose-100 text-rose-600" />
        <KpiCard title="Matchmaking Requests" count={data.stats.pendingRequests} subtitle="Pending review" icon={Heart} color="bg-purple-100 text-purple-600" />
        <KpiCard title="Suggestions" count={data.stats.suggestions} subtitle="New matches suggested" icon={Lightbulb} color="bg-emerald-100 text-emerald-600" />
        <KpiCard title="Upcoming Schedule" count={data.stats.upcomingSchedules} subtitle="Today's meetings" icon={CalendarDays} color="bg-blue-100 text-blue-600" />
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
                <div className="divide-y divide-slate-100">
                  {data.assignedClients.map((client: any) => (
                    <div key={client.id} className="py-4 flex items-center justify-between group hover:bg-slate-50 -mx-4 px-4 transition rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={client.profileImage} alt={client.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.age} yrs • {client.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={client.status} />
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
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
                <div className="divide-y divide-slate-100">
                  {data.requests.map((req: any) => (
                    <div key={req.id} className="py-4 flex items-center justify-between group hover:bg-slate-50 -mx-4 px-4 transition rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img src={req.profileImage} alt={req.clientName} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{req.clientName}</p>
                          <p className="text-xs text-slate-500">{req.age} yrs • {req.city}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Looking for: {req.lookingFor}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400">
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
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚡</span> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction icon={Users} label="View All Clients" sub="Check assigned clients" color="bg-rose-50 text-rose-600" />
              <QuickAction icon={Heart} label="View Requests" sub="Review new requests" color="bg-purple-50 text-purple-600" />
              <QuickAction icon={Lightbulb} label="See Suggestions" sub="Explore matches" color="bg-emerald-50 text-emerald-600" />
              <QuickAction icon={CalendarDays} label="Manage Schedule" sub="View & update meetings" color="bg-blue-50 text-blue-600" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Schedule & Messages */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Upcoming Schedule */}
          <DashboardCard title="Upcoming Schedule" icon={CalendarDays} link="/matchmaker/scheduling" bg="bg-[#f8faff]">
            {data.schedule.length === 0 ? (
              <EmptyState message="No meetings scheduled today." />
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {data.schedule.map((appt: any, i: number) => (
                  <div key={appt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6 last:mb-0">
                    
                    <div className="flex items-center justify-center w-2 h-2 rounded-full border-2 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-4 md:left-1/2 z-10"></div>
                    
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] ml-12 md:ml-0 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-600">{appt.time}</span>
                        {appt.mode === 'Video Call' ? <Video className="w-3 h-3 text-slate-400" /> : <Phone className="w-3 h-3 text-slate-400" />}
                      </div>
                      <p className="text-sm font-bold text-slate-800">{appt.type}</p>
                      <p className="text-xs text-slate-500 mt-1">{appt.clientName}</p>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Recent Messages */}
          <DashboardCard title="Messages with Admin" icon={MessageCircle} link="/matchmaker/messages">
            <div className="divide-y divide-slate-100">
              <div className="py-4 flex items-start justify-between group hover:bg-slate-50 -mx-4 px-4 transition rounded-xl cursor-pointer">
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center border border-rose-200">
                      <span className="text-rose-600 font-bold text-lg">A</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      System Admin
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-1 text-slate-500">
                      Welcome to your dashboard. Reach out here for support.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[10px] text-slate-400">
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer flex items-center justify-between group">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mb-1 group-hover:text-rose-600 transition">{count}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function DashboardCard({ title, icon: Icon, link, bg = "bg-white", children }: any) {
  return (
    <div className={`${bg} rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Icon className="w-5 h-5 text-rose-400" />
          {title}
        </h2>
        <Link href={link} className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center">
          View All <ChevronRight className="w-3 h-3 ml-0.5" />
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
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-rose-100 transition cursor-pointer group flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${color} group-hover:scale-110 transition`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-slate-800 mb-0.5">{label}</p>
      <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'new': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'under review': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStyles()}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 opacity-60">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 text-center">{message}</p>
    </div>
  );
}
