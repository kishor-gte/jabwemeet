"use client";

import { Star } from "lucide-react";

export default function FeedbackPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <Star className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Feedback</h1>
      <p className="text-slate-500 text-center max-w-md">
        This module is currently under construction. Check back soon for the full feedback experience!
      </p>
    </div>
  );
}
