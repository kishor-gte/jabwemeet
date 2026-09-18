"use client";

import React, { useState, useEffect } from "react";
import { Wallet, DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

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
          setEarnings(data.earnings);
          const total = data.earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
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

  if (loading) return <div className="p-8 text-slate-500">Loading earnings...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Earnings & Payments</h1>
        <p className="text-slate-500 mt-1">Track your revenue share from client packages and dating fees.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Total Earnings</p>
            <h3 className="text-3xl font-black text-slate-800">₹{totalEarned.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 90% Revenue Share Applied
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            Transaction History
          </h3>
        </div>
        
        {earnings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {earnings.map((e) => (
              <div key={e.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Client Dating Package Purchase</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(e.createdAt).toLocaleDateString()}</span>
                      <span>Ref: {e.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-lg font-black text-emerald-600">+ ₹{Number(e.amount).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md mt-1 uppercase tracking-wide">
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-medium text-slate-600">No earnings recorded yet.</p>
            <p className="text-sm mt-1">When your clients purchase dating packages, your 90% share will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
