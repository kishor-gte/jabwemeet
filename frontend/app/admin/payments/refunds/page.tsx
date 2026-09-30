"use client";

import React from "react";
import { RefreshCcw } from "lucide-react";

export default function AdminRefundsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <span>Refunds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Refunds & Disputes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage refund requests and payment disputes.
          </p>
        </div>
      </div>
      
      <div className="p-8 text-center rounded-2xl bg-[#0f172a] border border-white/10 mt-6">
        <h3 className="text-lg font-bold text-white">No pending refunds</h3>
        <p className="text-slate-400 mt-2">Refund requests will appear here.</p>
      </div>
    </div>
  );
}

