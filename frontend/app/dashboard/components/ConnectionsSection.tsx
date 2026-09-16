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
} from "lucide-react";

export interface ConnectionItem {
  id: string;
  name: string;
  city: string;
  status: "connected" | "pending";
  intent?: string;
  sharedEventsCount?: number;
}

interface ConnectionsSectionProps {
  connections: ConnectionItem[];
  userCity: string;
  registeredEventsCount: number;
  onExploreEvents: () => void;
  onAddConnection: (newConn: ConnectionItem) => void;
}

export default function ConnectionsSection({
  connections,
  userCity,
  registeredEventsCount,
  onExploreEvents,
  onAddConnection,
}: ConnectionsSectionProps) {
  // Dynamic discoverable community members based on user's city
  const suggestedMembers: ConnectionItem[] = [
    {
      id: "peer-1",
      name: "Aanya Verma",
      city: userCity || "Bangalore",
      status: "pending",
      intent: "Meaningful Dating",
      sharedEventsCount: 1,
    },
    {
      id: "peer-2",
      name: "Vikram Malhotra",
      city: userCity || "Bangalore",
      status: "pending",
      intent: "Social Gatherings",
      sharedEventsCount: 2,
    },
    {
      id: "peer-3",
      name: "Tanvi Roy",
      city: userCity || "Bangalore",
      status: "pending",
      intent: "Relationship",
      sharedEventsCount: 1,
    },
  ];

  const [requestedPeerIds, setRequestedPeerIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "discover">("all");

  const handleConnect = (peer: ConnectionItem) => {
    setRequestedPeerIds((prev) => [...prev, peer.id]);
    onAddConnection({
      ...peer,
      status: "pending",
    });
  };

  return (
    <div id="connections" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Social Network • {connections.length} Active Connections
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Your Connections
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real people you have met at JabWeMeet events or connected with in {userCity || "your city"}.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-[#131d2e] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "all"
                ? "bg-[#e06d53] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "discover"
                ? "bg-[#e06d53] text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Discover in {userCity || "City"} ({suggestedMembers.length})
          </button>
        </div>
      </div>

      {/* View: Active Connections List */}
      {activeTab === "all" && (
        <>
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 flex items-center justify-between gap-4 shadow hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
                      {conn.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">{conn.name}</h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{conn.city}</p>
                      {conn.status === "pending" ? (
                        <span className="text-[10px] text-amber-300 font-semibold">
                          Connection Pending
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-300 font-semibold">
                          Connected
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Starting private message session with ${conn.name}`)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition shrink-0"
                    title="Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Dynamic Empty State */
            <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Your next connection could start with a real-world experience.
              </h3>
              <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                {registeredEventsCount > 0
                  ? `You have reserved spots for upcoming events. When you attend in ${userCity}, you can exchange mutual connection requests with attendees here.`
                  : `You haven't made any connections yet. Start by joining a Singles Mixer, Speed Dating, or Dance Date in ${userCity}.`}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  Discover Peers in {userCity}
                </button>
                <button
                  onClick={onExploreEvents}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-semibold shadow-lg shadow-[#e06d53]/30 transition"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Events</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View: Discover Co-Attendees / Peers in City */}
      {activeTab === "discover" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suggestedMembers.map((peer) => {
            const hasRequested = requestedPeerIds.includes(peer.id);
            return (
              <div
                key={peer.id}
                className="rounded-2xl bg-[#131d2e] border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/15 border border-indigo-500/30 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {peer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{peer.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#e06d53]" />
                        {peer.city}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                        Intent: {peer.intent}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Attending events in {peer.city}
                  </span>

                  {hasRequested ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Request Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(peer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-semibold shadow transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Say Hi / Connect</span>
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
