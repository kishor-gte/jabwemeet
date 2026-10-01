"use client";

import React, { useState, useEffect } from "react";
import { Wallet, DollarSign, TrendingUp, Calendar, CreditCard, Sparkles, IndianRupee } from "lucide-react";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const { user } = await meRes.json();
        
        const res = await fetch(`/api/matchmaker/earnings?matchmakerId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setEarnings(data.earnings || []);
          const total = (data.earnings || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
          setTotalEarned(total);
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium text-xs font-serif">Loading earnings & payout data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Financials & Payouts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Earnings & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Track your revenue share from client consultation packages and matchmaking success fees.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-50 text-[#7E2248] border border-rose-100 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Earned</p>
            <h3 className="text-3xl font-serif font-bold text-slate-900">₹{totalEarned.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> 90% Revenue Share Applied
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-rose-100 flex items-center justify-between bg-[#FAF3F6]">
          <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#7E2248]" />
            Transaction History
          </h3>
        </div>
        
        {earnings.length > 0 ? (
          <div className="divide-y divide-rose-100">
            {earnings.map((e) => (
              <div key={e.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-rose-50/40 transition">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center shrink-0 shadow-xs font-bold">
                    ₹
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Client Dating Package Purchase</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(e.createdAt).toLocaleDateString()}</span>
                      <span>• Ref: {e.id.slice(-8)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-lg font-serif font-bold text-[#7E2248]">+ ₹{Number(e.amount).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full mt-1 uppercase tracking-wide">
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center text-2xl mx-auto mb-3">
              <Wallet className="w-7 h-7" />
            </div>
            <p className="font-serif font-bold text-slate-900 text-base">No earnings recorded yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">When your clients purchase matchmaking packages, your revenue share will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
