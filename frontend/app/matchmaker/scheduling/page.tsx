"use client";

import { CalendarDays } from "lucide-react";

export default function SchedulingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <CalendarDays className="w-10 h-10 text-blue-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Scheduling</h1>
      <p className="text-slate-500 text-center max-w-md">
        This module is currently under construction. Check back soon for the full scheduling experience!
      </p>
    </div>
  );
}
