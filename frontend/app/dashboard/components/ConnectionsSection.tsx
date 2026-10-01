"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Compass,
  Sparkles,
  MessageCircle,
  UserPlus,
  CheckCircle2,
  MapPin,
  Heart,
  Calendar,
  ShieldCheck,
  Check,
  X,
  Gift,
  Star
} from "lucide-react";

export interface ConnectionItem {
  id: string;
  status: string;
  clientStatus: string;
  suggestedStatus: string;
  meetingDate: string | null;
  meetingMessage: string | null;
  meetingLocation: string | null;
  meetingVenue: string | null;
  client: { id: string; name: string; profileImage: string | null; city: string; };
  suggestedProfile: { id: string; name: string; profileImage: string | null; city: string; };
  matchmaker: { id: string; name: string; };
}

interface ConnectionsSectionProps {
  userId?: string;
  connections: any[];
  userCity: string;
  registeredEventsCount: number;
  onExploreEvents: () => void;
  onUpdateConnection: (id: string, action: "Approve" | "Reject") => void;
  onChat?: (connId: string) => void;
}

export default function ConnectionsSection({ 
  userId, 
  connections, 
  userCity, 
  registeredEventsCount, 
  onExploreEvents, 
  onUpdateConnection, 
  onChat 
}: ConnectionsSectionProps) {
  const [eligibility, setEligibility] = useState<{ freeDatesRemaining: number; packages: any[] } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingConnId, setPendingConnId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [feedbackModalConnId, setFeedbackModalConnId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [cafeFinderLocation, setCafeFinderLocation] = useState<{connId: string, location: string, date: string | null} | null>(null);
  const [cafesList, setCafesList] = useState<any[]>([]);
  const [loadingCafes, setLoadingCafes] = useState(false);
  const [bookingCafe, setBookingCafe] = useState(false);

  const handleFindNearestCafe = async (connId: string, location: string, date: string | null) => {
    setCafeFinderLocation({ connId, location, date });
    setLoadingCafes(true);
    try {
      const res = await fetch(`/api/auth/cafes?location=${encodeURIComponent(location)}&dateTime=${encodeURIComponent(date || '')}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setCafesList(data.cafes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCafes(false);
    }
  };

  const handleBookCafe = async (cafeId: string, cafeName: string) => {
    if (!cafeFinderLocation) return;
    setBookingCafe(true);
    try {
      const d = cafeFinderLocation.date ? new Date(cafeFinderLocation.date) : null;
      const res = await fetch(`/api/auth/connections/${cafeFinderLocation.connId}/book-cafe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cafeId,
          cafeName,
          reservationDate: d ? d.toISOString().split('T')[0] : null,
          reservationTime: d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : "18:00",
          guests: 2
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Success! Table booked at " + cafeName);
        setCafeFinderLocation(null);
      } else {
        alert(data.message || "Failed to book cafe table.");
      }
    } catch (e) {
      console.error(e);
      alert("Error booking cafe table");
    } finally {
      setBookingCafe(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/dating-eligibility", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEligibility(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleApprove = (connId: string) => {
    if (eligibility && eligibility.freeDatesRemaining <= 0) {
      setPendingConnId(connId);
      setShowPaymentModal(true);
    } else {
      onUpdateConnection(connId, "Approve");
      setEligibility(prev => prev ? { ...prev, freeDatesRemaining: Math.max(0, prev.freeDatesRemaining - 1) } : null);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchasePackage = async (pkg: any) => {
    if (!pendingConnId) return;
    setIsProcessing(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/auth/payments/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.price }),
        credentials: "include"
      });
      const orderData = await res.json();
      
      if (!orderData.success) {
        alert(orderData.message || "Failed to initialize payment.");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JabWeMeet - Dating Package",
        description: `Unlock ${pkg.name}`,
        image: "https://jabwemeet.com/logo.png",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/auth/payments/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
                amount: pkg.price,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setEligibility(prev => prev ? { ...prev, freeDatesRemaining: prev.freeDatesRemaining + (pkg.sessionLimit || 1) } : null);
              setShowPaymentModal(false);
              onUpdateConnection(pendingConnId, "Approve");
              setPendingConnId(null);
              alert("Payment Successful! Connection approved.");
            } else {
              alert(verifyData.message || "Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            alert("Network error occurred while verifying payment.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#7E2248",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (response: any) => {
        alert(response.error?.description || "Payment transaction was declined.");
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (e) {
      console.error(e);
      alert("Error processing payment");
      setIsProcessing(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackModalConnId) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/auth/connections/${feedbackModalConnId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, feedback: feedbackText }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        alert("Thank you! Your feedback has been shared with your Relationship Manager.");
        setFeedbackModalConnId(null);
        setFeedbackText("");
        setFeedbackRating(5);
      } else {
        alert("Failed to submit feedback: " + (data.message || "Unknown error"));
        console.error("Backend error:", data);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error submitting feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const pendingCount = connections.filter(c => {
    const isClient = c.clientId === userId;
    return isClient ? c.clientStatus === 'Pending' : c.suggestedStatus === 'Pending';
  }).length;
  
  const connectedCount = connections.filter(c => c.status === 'BothApproved' || c.status === 'DateFixed').length;

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">Your Connections</h2>
        <p className="text-slate-500 mt-1 text-sm">Matches suggested by your Relationship Manager</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2 text-[#7E2248]">
            <Heart className="w-5 h-5" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Matched</h3>
          </div>
          <p className="text-3xl font-serif font-bold text-slate-900">{connectedCount}</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2 text-amber-700">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Pending</h3>
          </div>
          <p className="text-3xl font-serif font-bold text-slate-900">{pendingCount}</p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-3xl bg-white border border-rose-100 p-12 text-center max-w-2xl shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-rose-200 text-[#7E2248]">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-serif text-slate-900">No Match Suggestions Yet</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            Your Relationship Manager is currently looking for the perfect match. Suggestions will appear here once they find someone compatible.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map(conn => {
            const isClient = conn.clientId === userId || conn.client?.id === userId;
            const otherPerson = isClient ? conn.suggestedProfile : conn.client;
            const myStatus = isClient ? conn.clientStatus : conn.suggestedStatus;
            
            if (!otherPerson) return null;

            return (
              <div key={conn.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm hover:shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-[#7E2248]/30 transition group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/40 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition duration-500" />
                
                {conn.status === "DateFixed" && (
                   <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#7E2248] via-[#982b57] to-[#7E2248] text-white text-[10px] font-bold uppercase tracking-wider text-center py-1 z-20">
                      IT'S A DATE! 🥂
                   </div>
                )}

                <div>
                  <div className={`flex items-start gap-4 mb-5 relative z-10 ${conn.status === 'DateFixed' ? 'mt-4' : ''}`}>
                    <img 
                      src={otherPerson.profileImage || `https://ui-avatars.com/api/?name=${otherPerson.name}&background=7E2248&color=fff`} 
                      alt={otherPerson.name} 
                      className="w-14 h-14 rounded-full object-cover shadow-sm border border-rose-200" 
                    />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{otherPerson.name}</h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{otherPerson.city}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Suggested by {conn.matchmaker?.name || "Matchmaker"}</p>
                    </div>
                  </div>

                  {conn.status === "DateFixed" ? (
                    <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 text-center relative z-10 space-y-2">
                      <div className="flex justify-center mb-1"><Gift className="w-5 h-5 text-[#7E2248]" /></div>
                      <p className="text-xs font-bold text-slate-900">
                        {conn.meetingDate ? new Date(conn.meetingDate).toLocaleDateString() : ''} at {conn.meetingDate ? new Date(conn.meetingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
                      {(conn.meetingLocation || conn.meetingVenue) && (
                        <div className="flex flex-col items-center justify-center gap-1 mb-1">
                          <p className="text-[11px] text-slate-700 flex items-center justify-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#7E2248]" /> 
                            {conn.meetingVenue && <span className="font-bold">{conn.meetingVenue}</span>}
                            {conn.meetingVenue && conn.meetingLocation && <span>, </span>}
                            {conn.meetingLocation && <span>{conn.meetingLocation}</span>}
                          </p>
                          {conn.meetingLocation && !conn.meetingVenue && (
                             <button onClick={() => handleFindNearestCafe(conn.id, conn.meetingLocation!, conn.meetingDate)} className="mt-1 bg-white hover:bg-rose-50 text-[#7E2248] font-bold px-3 py-1 rounded-full text-[10px] transition border border-rose-200 shadow-2xs flex items-center gap-1">
                               <MapPin className="w-3 h-3" /> Find nearest cafe
                             </button>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        "{conn.meetingMessage}"
                      </p>
                      <div className="flex flex-col gap-2 pt-2">
                        <button onClick={() => onChat?.(conn.id)} className="w-full py-2 bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs">
                          <MessageCircle className="w-3.5 h-3.5" /> Chat with {otherPerson.name}
                        </button>
                        <button onClick={() => setFeedbackModalConnId(conn.id)} className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5">
                          <Star className="w-3.5 h-3.5" /> Share Experience
                        </button>
                      </div>
                    </div>
                  ) : myStatus === "Pending" && conn.status !== "Rejected" ? (
                    <div className="flex flex-col gap-3 mt-2 relative z-10">
                       <div className="bg-rose-50/70 rounded-2xl p-3 border border-rose-200">
                          <p className="text-xs text-rose-950 leading-relaxed">
                            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-[#7E2248] -mt-0.5" />
                            Your Relationship Manager found this highly compatible match for you!
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => handleApprove(conn.id)} className="flex-1 flex justify-center items-center gap-1 bg-[#7E2248] hover:bg-[#681938] text-white py-2 rounded-full text-xs font-bold transition shadow-xs">
                            <Check className="w-3.5 h-3.5" /> Approve
                         </button>
                         <button onClick={() => onUpdateConnection(conn.id, "Reject")} className="flex-1 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-full text-xs font-semibold transition">
                            <X className="w-3.5 h-3.5" /> Pass
                         </button>
                       </div>
                    </div>
                  ) : myStatus === "Approved" && conn.status !== "BothApproved" && conn.status !== "Rejected" ? (
                     <div className="text-center py-2.5 bg-rose-50/50 rounded-2xl border border-rose-100 relative z-10">
                        <span className="text-xs text-slate-500 font-medium">Waiting for {otherPerson.name}'s response</span>
                     </div>
                  ) : conn.status === "BothApproved" ? (
                     <div className="flex flex-col gap-2 relative z-10">
                       <div className="text-center py-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <span className="text-xs text-emerald-800 font-bold">Both Approved! Matchmaker is arranging a date.</span>
                       </div>
                       <button onClick={() => onChat?.(conn.id)} className="w-full py-2 bg-[#7E2248] hover:bg-[#681938] text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
                         <MessageCircle className="w-3.5 h-3.5" /> Chat with {otherPerson.name}
                       </button>
                     </div>
                  ) : (
                     <div className="text-center py-2.5 bg-slate-50 rounded-2xl border border-slate-200 relative z-10">
                        <span className="text-xs text-slate-500 font-medium">Not a Match</span>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dating Packages Modal */}
      {showPaymentModal && eligibility && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative p-8">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="w-16 h-16 bg-rose-50 text-[#7E2248] rounded-2xl flex items-center justify-center mb-4 border border-rose-200 shadow-2xs">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-2">Unlock Your Next Date</h2>
              <p className="text-slate-600 mb-6 max-w-lg text-xs sm:text-sm leading-relaxed">
                Your first date was complimentary! To continue meeting curated matches and arrange your next date, please select a dating package.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                {eligibility.packages.length > 0 ? (
                  eligibility.packages.map(pkg => (
                    <div key={pkg.id} className="p-5 rounded-2xl border border-rose-100 bg-[#FAF3F6]/50 hover:border-[#7E2248]/40 hover:bg-white transition group flex flex-col justify-between shadow-2xs">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>
                          <span className="text-[#7E2248] font-serif font-bold text-lg">₹{pkg.price}</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4">{pkg.description}</p>
                      </div>
                      <button
                        disabled={isProcessing}
                        onClick={() => handlePurchasePackage(pkg)}
                        className="w-full py-2.5 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition"
                      >
                        {isProcessing ? "Processing..." : `Get ${pkg.name}`}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-slate-500 text-xs">No dating packages available right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Feedback Modal */}
      {feedbackModalConnId && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative p-8">
            <button onClick={() => setFeedbackModalConnId(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="w-14 h-14 bg-rose-50 text-[#7E2248] rounded-2xl flex items-center justify-center mb-4 border border-rose-200">
                <Star className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-1">How was your date?</h2>
              <p className="text-slate-500 mb-5 text-xs">
                Share your experience privately with your Relationship Manager. This helps us find better matches for you!
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Rate your experience</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star} 
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-xl transition ${feedbackRating >= star ? 'bg-amber-50 text-amber-500 border border-amber-200' : 'bg-slate-50 text-slate-300 border border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Star className={`w-6 h-6 ${feedbackRating >= star ? 'fill-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Your Feedback</label>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you liked, what could be better, or if you felt a connection..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 text-xs focus:border-[#7E2248] focus:bg-white outline-none h-28 resize-none"
                  />
                </div>

                <button 
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback || !feedbackText.trim()}
                  className="w-full py-3 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cafe Finder Modal */}
      {cafeFinderLocation && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-rose-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative p-8">
            <button onClick={() => setCafeFinderLocation(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="w-14 h-14 bg-rose-50 text-[#7E2248] rounded-2xl flex items-center justify-center mb-4 border border-rose-200">
                <MapPin className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-2">Cafes in {cafeFinderLocation.location}</h2>
              <p className="text-slate-500 mb-6 text-xs max-w-lg leading-relaxed">
                Select a cafe from our verified partners to book a table for your date.
              </p>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {loadingCafes ? (
                  <div className="text-center py-10 text-slate-400 text-xs">Finding cafes...</div>
                ) : cafesList.length > 0 ? (
                  cafesList.map(cafe => (
                    <div key={cafe.id} className="p-4 rounded-2xl border border-rose-100 bg-[#FAF3F6]/50 hover:border-[#7E2248]/40 hover:bg-white transition group flex flex-col sm:flex-row items-center justify-between shadow-2xs gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cafe.cafeName}</h4>
                        <p className="text-xs text-slate-500">{cafe.address || cafe.city}</p>
                      </div>
                      <button
                        disabled={bookingCafe || cafe.isBooked}
                        onClick={() => handleBookCafe(cafe.id, cafe.cafeName)}
                        className={`w-full sm:w-auto px-6 py-2 rounded-full text-xs font-bold transition ${cafe.isBooked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#7E2248] hover:bg-[#681938] text-white shadow-xs'}`}
                      >
                        {cafe.isBooked ? "Fully Booked" : bookingCafe ? "Booking..." : "Book Table"}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 text-xs">No registered partner cafes found in this area.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
