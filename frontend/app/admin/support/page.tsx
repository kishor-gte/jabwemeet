"use client";

import React from "react";
import { HeadphonesIcon } from "lucide-react";

export default function AdminSupportPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <HeadphonesIcon className="w-3.5 h-3.5" />
            Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Help & Support Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage member inquiries, complaints, and help requests.
          </p>
        </div>
      </div>
      
      <div className="p-12 text-center rounded-3xl bg-white border border-rose-100 shadow-xs mt-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#7E2248] flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <HeadphonesIcon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-serif font-bold text-slate-900">No open support tickets</h3>
        <p className="text-sm text-slate-500 mt-1">New support requests will appear here when submitted by members.</p>
      </div>
    </div>
  );
}
