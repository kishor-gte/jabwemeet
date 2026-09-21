"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Calendar, CreditCard, ShieldCheck } from "lucide-react";

export default function AdminEarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch("/api/admin/earnings", { credentials: "include" });
        const data = await res.json();
        
        if (data.success) {
          setEarnings(data.earnings);
          setTotalEarned(data.totalEarned);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-400 flex items-center justify-center h-64">
        <div className="animate-pulse text-lg font-bold">Loading earnings data...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Earnings & Commission</h1>
        <p className="text-slate-400 mt-1">
          Track platform revenue sharing (5% commission on Breakup Buddy packages and 10% on dating packages).
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121b2b] rounded-3xl p-8 border border-emerald-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              Lifetime Revenue
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 mb-1">Total Admin Revenue</p>
            <h3 className="text-4xl font-black text-white">₹{totalEarned.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 5% Commission on Packages & 10% Dating Revenue
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#0b1221] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Platform Earnings & Commission History
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{earnings.length} Transactions</span>
        </div>
        
        {earnings.length > 0 ? (
          <div className="divide-y divide-white/5">
            {earnings.map((e) => (
              <div key={e.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-white/5 transition">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {e.userName || "User"} ({e.userEmail || "No email"})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {e.commissionRate || (e.type?.includes("5%") ? "5%" : "10%")} Commission
                      </span>
                    </div>
                    <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                      {e.type || e.description || "Package Purchase"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {new Date(e.createdAt).toLocaleString()}
                      </span>
                      <span>Ref: {e.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between">
                  <span className="text-xl font-black text-emerald-400">+ ₹{Number(e.amount).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    from total package amount ₹{Number(e.sourceAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-white/10 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No admin earnings recorded yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              When users purchase packages from the dashboard, the 5% platform commission will automatically appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
