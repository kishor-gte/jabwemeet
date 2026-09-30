"use client";

import React from "react";
import { HeadphonesIcon } from "lucide-react";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <HeadphonesIcon className="w-3.5 h-3.5" />
            Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Help & Support Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage member inquiries, complaints, and help requests.
          </p>
        </div>
      </div>
      
      <div className="p-8 text-center rounded-2xl bg-[#0f172a] border border-white/10 mt-6">
        <HeadphonesIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No open support tickets</h3>
        <p className="text-slate-400 mt-2">New support requests will appear here.</p>
      </div>
    </div>
  );
}
