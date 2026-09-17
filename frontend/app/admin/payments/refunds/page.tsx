"use client";

import React, { useEffect, useState } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminRefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRefunds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRefunds();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Controlled Dispute Resolution
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Refund Requests & Reversals
          </h1>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Refund ID</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Processed By</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading refunds...
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    No refund requests pending or recorded.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-300">{r.id}</td>
                    <td className="px-4 py-4 font-bold text-white">{r.userName}</td>
                    <td className="px-4 py-4 text-emerald-400 font-bold text-sm">₹{r.amount}</td>
                    <td className="px-4 py-4 text-slate-300 max-w-xs">{r.reason}</td>
                    <td className="px-4 py-4 text-purple-300">{r.processedBy || "Finance Admin"}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
