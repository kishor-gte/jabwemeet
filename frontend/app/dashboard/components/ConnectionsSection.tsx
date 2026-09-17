"use client";

import React, { useState } from "react";
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
}

export default function ConnectionsSection({
  userId,
  connections,
  userCity,
  registeredEventsCount,
  onExploreEvents,
  onUpdateConnection,
}: ConnectionsSectionProps) {
  const [activeTab, setActiveTab] = useState<"all" | "discover">("all");

  return (
    <div id="connections" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Matchmaker Network • {connections.length} Suggestions
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Your Connections
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Hand-picked matches selected by your Relationship Manager.
          </p>
        </div>
      </div>

      {activeTab === "all" && (
        <>
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {connections.map((conn) => {
                const isClient = conn.client.id === userId;
                const otherPerson = isClient ? conn.suggestedProfile : conn.client;
                const myStatus = isClient ? conn.clientStatus : conn.suggestedStatus;

                return (
                <div
                  key={conn.id}
                  className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 flex flex-col justify-between gap-4 shadow hover:border-white/20 transition relative overflow-hidden"
                >
                  {conn.status === "DateFixed" && (
                     <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold text-center py-1">
                        IT'S A DATE!
                     </div>
                  )}

                  <div className={`flex items-center gap-3 min-w-0 ${conn.status === 'DateFixed' ? 'mt-4' : ''}`}>
                    {otherPerson.profileImage ? (
                      <img src={otherPerson.profileImage} alt={otherPerson.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
                        {otherPerson.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">{otherPerson.name}</h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{otherPerson.city}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Suggested by {conn.matchmaker.name}</p>
                    </div>
                  </div>

                  {conn.status === "DateFixed" ? (
                    <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20 text-center">
                      <div className="flex justify-center mb-1"><Gift className="w-4 h-4 text-rose-400" /></div>
                      <p className="text-xs font-bold text-white mb-1">
                        {new Date(conn.meetingDate).toLocaleDateString()} at {new Date(conn.meetingDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {(conn.meetingLocation || conn.meetingVenue) && (
                        <p className="text-[10px] text-white/70 mb-1 flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" /> 
                          {conn.meetingVenue && <span className="font-bold">{conn.meetingVenue}</span>}
                          {conn.meetingVenue && conn.meetingLocation && <span>, </span>}
                          {conn.meetingLocation && <span>{conn.meetingLocation}</span>}
                        </p>
                      )}
                      <p className="text-[10px] text-rose-300 font-medium">
                        {conn.meetingMessage}
                      </p>
                    </div>
                  ) : myStatus === "Pending" && conn.status !== "Rejected" ? (
                    <div className="flex flex-col gap-3 mt-2">
                       <div className="bg-purple-500/10 rounded-lg p-2.5 border border-purple-500/20">
                          <p className="text-[11px] text-purple-300 leading-tight">
                            <Sparkles className="w-3 h-3 inline mr-1 text-purple-400 -mt-0.5" />
                            Your Relationship Manager found this highly compatible match for you!
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => onUpdateConnection(conn.id, "Approve")} className="flex-1 flex justify-center items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded-lg text-xs font-bold transition">
                            <Check className="w-3 h-3" /> Approve
                         </button>
                         <button onClick={() => onUpdateConnection(conn.id, "Reject")} className="flex-1 flex justify-center items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded-lg text-xs font-bold transition">
                            <X className="w-3 h-3" /> Pass
                         </button>
                       </div>
                    </div>
                  ) : myStatus === "Approved" && conn.status !== "BothApproved" && conn.status !== "Rejected" ? (
                     <div className="text-center py-2 bg-white/5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 font-medium">Waiting for {otherPerson.name}'s response</span>
                     </div>
                  ) : conn.status === "BothApproved" ? (
                     <div className="text-center py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400 font-bold">Both Approved! Matchmaker is arranging a date.</span>
                     </div>
                  ) : (
                     <div className="text-center py-2 bg-rose-500/5 rounded-lg border border-rose-500/10">
                        <span className="text-[10px] text-rose-400 font-medium">Not a Match</span>
                     </div>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                No active connections right now.
              </h3>
              <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                Your Relationship Manager is looking for highly compatible matches for you. 
                You will see them here once suggested!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
