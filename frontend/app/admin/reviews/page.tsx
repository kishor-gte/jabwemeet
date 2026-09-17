"use client";

import React, { useEffect, useState } from "react";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Heart,
  Calendar,
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchReviews() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <Star className="w-3.5 h-3.5" />
          Feedback Moderation
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Reviews & Member Ratings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor feedback submitted for Relationship Managers, Breakup Buddies, and Singles Mixer events.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Reviewer</th>
                <th className="px-4 py-3.5">Target Buddy / RM</th>
                <th className="px-4 py-3.5">Rating</th>
                <th className="px-4 py-3.5">Testimonial</th>
                <th className="px-5 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 italic">
                    No reviews submitted yet.
                  </td>
                </tr>
              ) : (
                reviews.map((rv) => (
                  <tr key={rv.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-bold text-white">
                      {rv.user?.name || "Member"}
                    </td>

                    <td className="px-4 py-4 text-blue-400 font-semibold">
                      {rv.buddy?.displayName || rv.buddy?.name || "Provider"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <span>★ {rv.rating} / 5</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-300 max-w-sm">
                      {rv.comment || "No written comment left."}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-400 text-[11px]">
                      {new Date(rv.createdAt).toLocaleDateString()}
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
