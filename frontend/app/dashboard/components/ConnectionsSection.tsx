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
  Gift
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
      // Optionally decrement locally to reflect usage of the free date immediately
      setEligibility(prev => prev ? { ...prev, freeDatesRemaining: Math.max(0, prev.freeDatesRemaining - 1) } : null);
    }
  };

  const handlePurchasePackage = async (pkg: any) => {
    if (!pendingConnId) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/auth/payments/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, amount: pkg.price }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        // Increment free dates locally so they have remaining dates to use
        setEligibility(prev => prev ? { ...prev, freeDatesRemaining: prev.freeDatesRemaining + (pkg.sessionLimit || 1) } : null);
        setShowPaymentModal(false);
        onUpdateConnection(pendingConnId, "Approve");
        setPendingConnId(null);
        alert("Payment Successful! Connection approved.");
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing payment");
    } finally {
      setIsProcessing(false);
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
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Your Connections</h2>
        <p className="text-slate-400 mt-1">Matches suggested by your Relationship Manager</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div className="bg-[#121b2b] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3 mb-2 text-rose-400">
            <Heart className="w-5 h-5" />
            <h3 className="font-bold text-sm">Matched</h3>
          </div>
          <p className="text-3xl font-black text-white">{connectedCount}</p>
        </div>
        <div className="bg-[#121b2b] border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3 mb-2 text-amber-400">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-bold text-sm">Pending</h3>
          </div>
          <p className="text-3xl font-black text-white">{pendingCount}</p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-3xl bg-[#121b2b]/50 border border-white/5 p-12 text-center max-w-2xl">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Match Suggestions Yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
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
              <div key={conn.id} className="bg-[#131d2e] rounded-2xl p-5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition duration-500" />
                
                {conn.status === "DateFixed" && (
                   <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold text-center py-1 z-20">
                      IT'S A DATE!
                   </div>
                )}

                <div>
                  <div className={`flex items-start gap-4 mb-5 relative z-10 ${conn.status === 'DateFixed' ? 'mt-4' : ''}`}>
                    <img 
                      src={otherPerson.profileImage || `https://ui-avatars.com/api/?name=${otherPerson.name}&background=1e293b&color=fff`} 
                      alt={otherPerson.name} 
                      className="w-14 h-14 rounded-full object-cover shadow-lg border border-white/10" 
                    />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">{otherPerson.name}</h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{otherPerson.city}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Suggested by {conn.matchmaker?.name || "Matchmaker"}</p>
                    </div>
                  </div>

                  {conn.status === "DateFixed" ? (
                    <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20 text-center relative z-10">
                      <div className="flex justify-center mb-1"><Gift className="w-4 h-4 text-rose-400" /></div>
                      <p className="text-xs font-bold text-white mb-1">
                        {conn.meetingDate ? new Date(conn.meetingDate).toLocaleDateString() : ''} at {conn.meetingDate ? new Date(conn.meetingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
                      {(conn.meetingLocation || conn.meetingVenue) && (
                        <p className="text-[10px] text-white/70 mb-1 flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" /> 
                          {conn.meetingVenue && <span className="font-bold">{conn.meetingVenue}</span>}
                          {conn.meetingVenue && conn.meetingLocation && <span>, </span>}
                          {conn.meetingLocation && <span>{conn.meetingLocation}</span>}
                        </p>
                      )}
                      <p className="text-[10px] text-rose-300 font-medium mb-3">
                        {conn.meetingMessage}
                      </p>
                      <button onClick={() => onChat?.(conn.id)} className="w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3 h-3" /> Chat with {otherPerson.name}
                      </button>
                    </div>
                  ) : myStatus === "Pending" && conn.status !== "Rejected" ? (
                    <div className="flex flex-col gap-3 mt-2 relative z-10">
                       <div className="bg-purple-500/10 rounded-lg p-2.5 border border-purple-500/20">
                          <p className="text-[11px] text-purple-300 leading-tight">
                            <Sparkles className="w-3 h-3 inline mr-1 text-purple-400 -mt-0.5" />
                            Your Relationship Manager found this highly compatible match for you!
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => handleApprove(conn.id)} className="flex-1 flex justify-center items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded-lg text-xs font-bold transition">
                            <Check className="w-3 h-3" /> Approve
                         </button>
                         <button onClick={() => onUpdateConnection(conn.id, "Reject")} className="flex-1 flex justify-center items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded-lg text-xs font-bold transition">
                            <X className="w-3 h-3" /> Pass
                         </button>
                       </div>
                    </div>
                  ) : myStatus === "Approved" && conn.status !== "BothApproved" && conn.status !== "Rejected" ? (
                     <div className="text-center py-2 bg-white/5 rounded-lg border border-white/5 relative z-10">
                        <span className="text-[10px] text-slate-400 font-medium">Waiting for {otherPerson.name}'s response</span>
                     </div>
                  ) : conn.status === "BothApproved" ? (
                     <div className="flex flex-col gap-2 relative z-10">
                       <div className="text-center py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <span className="text-[10px] text-emerald-400 font-bold">Both Approved! Matchmaker is arranging a date.</span>
                       </div>
                       <button onClick={() => onChat?.(conn.id)} className="w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                         <MessageCircle className="w-3 h-3" /> Chat with {otherPerson.name}
                       </button>
                     </div>
                  ) : (
                     <div className="text-center py-2 bg-rose-500/5 rounded-lg border border-rose-500/10 relative z-10">
                        <span className="text-[10px] text-rose-400 font-medium">Not a Match</span>
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPaymentModal && eligibility && (
        <div className="fixed inset-0 z-[100] bg-[#0c1424]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121b2b] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20 shadow-inner">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Unlock Your Next Date</h2>
              <p className="text-slate-400 mb-8 max-w-lg leading-relaxed">
                Your first date was complimentary! To continue meeting curated matches and arrange your next date, please select a dating package.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {eligibility.packages.length > 0 ? (
                  eligibility.packages.map(pkg => (
                    <div key={pkg.id} className="p-5 rounded-2xl border border-white/10 bg-[#162136] hover:border-rose-500/40 hover:bg-[#1a2741] transition group flex flex-col justify-between shadow-lg">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-white text-lg">{pkg.name}</h4>
                          <span className="text-rose-400 font-black text-xl">₹{pkg.price}</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">{pkg.description}</p>
                      </div>
                      <button
                        disabled={isProcessing}
                        onClick={() => handlePurchasePackage(pkg)}
                        className="w-full py-2.5 bg-white/10 group-hover:bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition"
                      >
                        {isProcessing ? "Processing..." : `Get ${pkg.name}`}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-slate-400 text-sm">No dating packages available right now.</p>
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
