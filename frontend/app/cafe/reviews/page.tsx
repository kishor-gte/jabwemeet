"use client";
import { useState, useEffect } from "react";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cafe/reviews", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setReviews(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`/api/cafe/reviews/${id}/reply`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (data.success) { setReplyingTo(null); setReplyText(""); fetchReviews(); }
    } catch (e) { console.error(e); }
  };

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Reviews & Ratings</h1>
      
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center mb-8 max-w-md mx-auto">
        <p className="text-slate-400 text-sm mb-2">Overall Rating</p>
        <div className="flex items-center gap-2">
          <Star className="w-8 h-8 text-amber-400 fill-amber-400"/>
          <span className="text-4xl font-bold text-white">{avgRating}</span>
          <span className="text-xl text-slate-500 mt-2">/ 5</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Based on {reviews.length} reviews</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
        {loading ? <div className="text-slate-400">Loading reviews...</div> : reviews.length === 0 ? <div className="text-slate-500 bg-[#131d2e] p-6 rounded-2xl text-center border border-white/5">No reviews yet.</div> : reviews.map((r) => (
          <div key={r.id} className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-white">{r.customerName}</h4>
                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1">{[...Array(5)].map((_, idx) => <Star key={idx} className={`w-4 h-4 ${idx < r.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />)}</div>
            </div>
            <p className="text-slate-300 text-sm italic mb-4">"{r.text || 'No comment provided'}"</p>
            
            {r.isReplied ? (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-4">
                <p className="text-xs text-amber-400 font-bold mb-1">Your Reply:</p>
                <p className="text-sm text-slate-300">{r.reply}</p>
              </div>
            ) : replyingTo === r.id ? (
              <div className="mt-4 flex gap-2">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply..." className="flex-1 bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                <button onClick={() => handleReply(r.id)} className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 text-sm">Send</button>
                <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="px-4 py-2 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setReplyingTo(r.id)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition">Reply to review</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
