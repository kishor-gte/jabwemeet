"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminSafetyPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Trust & Safety
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Safety Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage reports, background checks, and platform safety violations.
          </p>
        </div>
      </div>
      
      <div className="p-8 text-center rounded-2xl bg-[#0f172a] border border-white/10 mt-6">
        <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No active safety alerts</h3>
        <p className="text-slate-400 mt-2">Safety reports and flags will appear here.</p>
      </div>
    </div>
  );
}
