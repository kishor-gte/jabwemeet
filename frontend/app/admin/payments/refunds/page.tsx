"use client";

import React from "react";
import { RefreshCcw } from "lucide-react";

export default function AdminRefundsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <span>Refunds</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Refunds & Disputes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage refund requests and payment disputes.
          </p>
        </div>
      </div>
      
      <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 shadow-xs mt-6">
        <h3 className="text-lg font-serif font-bold text-slate-900">No pending refunds</h3>
        <p className="text-slate-500 mt-2 text-xs">Refund requests and dispute claims will appear here.</p>
      </div>
    </div>
  );
}
