"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, Users, Wallet, CalendarCheck2, TrendingUp, ArrowRight, LineChart } from "lucide-react";
import Link from "next/link";

export default function CafeDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/cafe/stats", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setStats(data.data); })
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1><p className="text-slate-400">Here's what's happening with your cafe today.</p></div>
        <div className="flex gap-3"><Link href="/cafe/orders" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition">View Orders</Link><Link href="/cafe/menu" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition shadow-lg shadow-amber-500/20">Manage Menu</Link></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Active Menu Items" value={stats ? stats.totalMenu : "..."} change="+0%" icon={ShoppingBag} color="blue" />
        <KpiCard title="Reservations" value={stats ? stats.reservations.value : "..."} change="+0%" icon={CalendarCheck2} color="emerald" />
        <KpiCard title="Monthly Revenue" value={stats ? stats.monthlyRevenue.value : "..."} change="+0%" icon={Wallet} color="amber" />
        <KpiCard title="Customers" value={stats ? stats.customers.value : "..."} change="+0%" icon={Users} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">Revenue Overview</h2></div>
            <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
              <div className="text-center"><LineChart className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" /><p className="text-slate-500 text-sm">Revenue Chart (API pending)</p></div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Top Selling Items</h2>
            <div className="text-sm text-slate-500 text-center py-8">Not enough data to calculate top items yet.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function KpiCard({ title, value, change, icon: Icon, color }: any) {
  const colors = { blue: "text-blue-400 bg-blue-400/10 border-blue-400/20", emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", amber: "text-amber-400 bg-amber-400/10 border-amber-400/20", purple: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  return (
    <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition">
      <div className="flex items-start justify-between mb-4"><div><p className="text-slate-400 text-sm font-medium mb-1">{title}</p><h3 className="text-2xl font-bold text-white">{value}</h3></div><div className={`p-3 rounded-xl border ${colors[color as keyof typeof colors]}`}><Icon className="w-5 h-5" /></div></div>
      <div className="flex items-center gap-2 text-xs font-medium"><span className="flex items-center text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-1" />{change}</span><span className="text-slate-500">vs last period</span></div>
    </div>
  );
}
