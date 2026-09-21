"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 border border-rose-200">
        <MessageSquare className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Communication</h1>
      <p className="text-slate-500 text-center max-w-md mb-4">
        This is your direct line to the System Admin. Do not use this section to contact users.
      </p>
      <p className="text-slate-400 text-sm text-center max-w-sm">
        (The live chat module is currently under construction. Check back soon for the full messaging experience!)
      </p>
    </div>
  );
}
