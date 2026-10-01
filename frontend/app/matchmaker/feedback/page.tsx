"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageCircle, User, MapPin, Sparkles } from "lucide-react";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Male" | "Female">("Male");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const { user } = await meRes.json();
        
        const res = await fetch(`/api/matchmaker/feedbacks?matchmakerId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setFeedbacks(data.feedbacks || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const maleFeedbacks = feedbacks.filter((f) => f.gender?.toLowerCase() === "male");
  const femaleFeedbacks = feedbacks.filter((f) => f.gender?.toLowerCase() === "female");
  const displayFeedbacks = activeTab === "Male" ? maleFeedbacks : femaleFeedbacks;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium text-xs font-serif">Loading client feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Star className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Client Sentiments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Post-Date Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Review ratings and experiences shared by your assigned clients after their curated dates.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 bg-[#FAF3F6] p-1.5 rounded-2xl border border-rose-200">
          <button
            onClick={() => setActiveTab("Male")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "Male"
                ? "bg-white text-[#7E2248] shadow-sm border border-rose-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Male Clients ({maleFeedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab("Female")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "Female"
                ? "bg-white text-[#7E2248] shadow-sm border border-rose-100"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Female Clients ({femaleFeedbacks.length})
          </button>
        </div>
      </div>

      {/* Feedback List */}
      {displayFeedbacks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center text-2xl mx-auto">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-bold text-slate-900">No Feedback Yet</h3>
          <p className="text-xs text-slate-500">
            There is no post-date feedback available for {activeTab.toLowerCase()} clients at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayFeedbacks.map((f) => {
            const isNegative = f.sentiment === 'NEGATIVE';
            
            return (
              <div key={f.id} className={`rounded-3xl p-6 border shadow-sm transition-all duration-300 flex flex-col justify-between relative ${
                isNegative ? 'bg-rose-50/50 border-rose-300 shadow-rose-100' : 'bg-white border-rose-100 hover:shadow-md'
              }`}>
                {isNegative && (
                  <div className="absolute -top-3 -right-3 bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                    AI Flagged: Negative
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={f.userImage || `https://ui-avatars.com/api/?name=${f.userName}&background=${isNegative ? 'f43f5e' : '7E2248'}&color=fff`} 
                      alt={f.userName}
                      className="w-12 h-12 rounded-full object-cover shadow-xs border border-rose-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isNegative ? 'text-rose-900' : 'text-slate-900'}`}>{f.userName}</h4>
                      <p className={`text-xs ${isNegative ? 'text-rose-600' : 'text-slate-500'}`}>{new Date(f.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`border px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 shadow-xs ${
                      isNegative ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <Star className={`w-3.5 h-3.5 ${isNegative ? 'fill-rose-500 text-rose-500' : 'fill-amber-500 text-amber-500'}`} />
                      <span className="font-bold text-xs">{f.rating}/5</span>
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl p-4 border relative ${
                    isNegative ? 'bg-white/80 border-rose-200' : 'bg-[#FAF3F6] border-rose-100'
                  }`}>
                    <MessageCircle className={`absolute top-4 left-4 w-4 h-4 ${isNegative ? 'text-rose-400' : 'text-[#7E2248]'}`} />
                    <p className={`text-xs pl-6 leading-relaxed italic ${isNegative ? 'text-rose-900' : 'text-slate-700'}`}>
                      "{f.feedback}"
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-rose-100">
                  <p className={`text-[10px] font-medium ${isNegative ? 'text-rose-500' : 'text-slate-400'}`}>
                    Ref Match: {f.matchId?.slice(-6)}
                  </p>
                  {isNegative ? (
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this negative feedback?")) {
                          try {
                            const res = await fetch(`/api/matchmaker/feedbacks/${f.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setFeedbacks(prev => prev.filter(item => item.id !== f.id));
                            }
                          } catch (e) {
                            console.error("Failed to delete", e);
                          }
                        }
                      }}
                      className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Delete Comment
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const newStatus = !f.isPublished;
                          const res = await fetch(`/api/matchmaker/feedbacks/${f.id}/publish`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isPublished: newStatus })
                          });
                          if (res.ok) {
                            setFeedbacks(prev => prev.map(item => item.id === f.id ? { ...item, isPublished: newStatus } : item));
                          }
                        } catch (e) {
                          console.error("Failed to publish", e);
                        }
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs ${
                        f.isPublished 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-[#7E2248] text-white hover:bg-[#681938] shadow-[#7E2248]/20'
                      }`}
                    >
                      {f.isPublished ? '✓ Published on Home' : 'Publish to Home Page'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
