"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageCircle, User, MapPin } from "lucide-react";

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
          setFeedbacks(data.feedbacks);
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
    return <div className="p-8 text-slate-500 text-center animate-pulse">Loading feedbacks...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Post-Date Feedback</h1>
        <p className="text-slate-500 mt-1">Review ratings and experiences shared by your assigned clients after their dates.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("Male")}
          className={`flex-1 py-4 text-center font-bold text-sm transition border-b-2 ${
            activeTab === "Male"
              ? "border-blue-500 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Male Clients ({maleFeedbacks.length})
        </button>
        <button
          onClick={() => setActiveTab("Female")}
          className={`flex-1 py-4 text-center font-bold text-sm transition border-b-2 ${
            activeTab === "Female"
              ? "border-rose-500 text-rose-600 bg-rose-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          Female Clients ({femaleFeedbacks.length})
        </button>
      </div>

      {/* Feedback List */}
      {displayFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Feedback Yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            There is no feedback available for {activeTab.toLowerCase()} clients at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayFeedbacks.map((f) => {
            const isNegative = f.sentiment === 'NEGATIVE';
            
            return (
              <div key={f.id} className={`rounded-2xl p-6 border shadow-sm transition flex flex-col relative ${
                isNegative ? 'bg-rose-50 border-rose-300 shadow-rose-100' : 'bg-white border-slate-200 hover:shadow-md'
              }`}>
                {isNegative && (
                  <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                    AI Flagged: Negative
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={f.userImage || `https://ui-avatars.com/api/?name=${f.userName}&background=${isNegative ? 'f43f5e' : 'e2e8f0'}&color=${isNegative ? 'fff' : '475569'}`} 
                    alt={f.userName}
                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold truncate ${isNegative ? 'text-rose-900' : 'text-slate-800'}`}>{f.userName}</h4>
                    <p className={`text-xs ${isNegative ? 'text-rose-600' : 'text-slate-500'}`}>{new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`border px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm ${
                    isNegative ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-600'
                  }`}>
                    <Star className={`w-4 h-4 ${isNegative ? 'fill-rose-500 text-rose-500' : 'fill-amber-500 text-amber-500'}`} />
                    <span className="font-bold text-sm">{f.rating}/5</span>
                  </div>
                </div>
                
                <div className={`rounded-xl p-4 border flex-1 relative ${
                  isNegative ? 'bg-white/60 border-rose-200' : 'bg-slate-50 border-slate-100'
                }`}>
                  <MessageCircle className={`absolute top-4 left-4 w-4 h-4 ${isNegative ? 'text-rose-300' : 'text-slate-300'}`} />
                  <p className={`text-sm pl-6 leading-relaxed italic ${isNegative ? 'text-rose-800' : 'text-slate-700'}`}>
                    "{f.feedback}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-[10px] ${isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
                    Ref Match: {f.matchId.slice(-6)}
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
                      className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition"
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
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        f.isPublished 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {f.isPublished ? '✓ Posted to Home' : 'Post to Home Page'}
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
