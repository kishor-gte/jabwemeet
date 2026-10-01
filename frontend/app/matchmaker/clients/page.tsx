"use client";

import React, { useEffect, useState } from "react";
import { Users, Mail, Phone, MapPin, Search, Sparkles, X, Loader2, CheckCircle2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  age: number | null;
  city: string;
  gender: string;
  relationshipIntent: string;
  status: string;
  createdAt: string;
}

interface Match {
  id: string;
  name: string;
  profileImage: string | null;
  score: number;
  reason: string;
  isConnected?: boolean;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // AI Modal State
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [connectingMatchId, setConnectingMatchId] = useState<string | null>(null);
  const [connectNotice, setConnectNotice] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/matchmaker/clients", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Error fetching clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleShowCompatibility = async (client: Client) => {
    setActiveClient(client);
    setMatches([]);
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/matchmaker/clients/${client.id}/compatibility`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error("Error fetching matches", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleConnect = async (match: Match) => {
    if (!activeClient) return;
    setConnectingMatchId(match.id);
    setConnectNotice(null);
    try {
      const res = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          suggestedProfileId: match.id,
        }),
        credentials: "include",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        data = { success: res.ok, message: res.statusText };
      }

      if (!res.ok && !data?.success && !data?.alreadyConnected) {
        throw new Error(data?.message || "Failed to create connection request.");
      }

      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, isConnected: true } : m))
      );
      setConnectNotice(`✓ Connection request created for ${activeClient.name} & ${match.name}!`);
    } catch (err: any) {
      console.error("Connect error:", err);
      setConnectNotice(err.message || "Failed to send connection request.");
    } finally {
      setConnectingMatchId(null);
    }
  };

  const [genderFilter, setGenderFilter] = useState<string>("All");

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === "All" || (c.gender && c.gender.toLowerCase() === genderFilter.toLowerCase());
    return matchesSearch && matchesGender;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 relative">
      {/* AI Compatibility Modal */}
      {activeClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#7E2248] to-[#9c2f5d] text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-rose-200" />
                  <h2 className="text-xl font-serif font-bold">AI Compatibility Matches</h2>
                </div>
                <p className="text-rose-100 text-xs">Curated recommendations for {activeClient.name}</p>
              </div>
              <button 
                onClick={() => setActiveClient(null)}
                className="p-1.5 rounded-full hover:bg-white/20 transition text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {connectNotice && (
              <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                connectNotice.startsWith("✓")
                  ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-b border-amber-200"
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{connectNotice}</span>
              </div>
            )}
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Sparkles className="w-8 h-8 text-[#7E2248] animate-pulse" />
                  <p className="text-slate-600 text-xs font-medium animate-pulse">Gemini AI is analyzing compatibility scores...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No compatible matches found at this time.
                </div>
              ) : (
                matches.map((match, idx) => (
                  <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-rose-100 bg-[#FAF3F6]">
                    <div className="flex gap-4">
                      <div className="shrink-0 relative">
                        {match.profileImage ? (
                          <img src={match.profileImage} alt={match.name} className="w-12 h-12 rounded-full object-cover shadow-xs border border-rose-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7E2248] to-rose-400 flex items-center justify-center text-white font-bold shadow-xs">
                            {match.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                            {match.score}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-900 text-sm">{match.name}</h4>
                           {match.isConnected ? (
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1">
                               <CheckCircle2 className="w-3 h-3" /> Connected
                             </span>
                           ) : (
                             <button
                               disabled={connectingMatchId === match.id}
                               onClick={() => handleConnect(match)}
                               className="px-3.5 py-1 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                             >
                               {connectingMatchId === match.id ? (
                                 <>
                                   <Loader2 className="w-3 h-3 animate-spin" />
                                   <span>Connecting...</span>
                                 </>
                               ) : (
                                 <span>Connect</span>
                               )}
                             </button>
                           )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          <span className="font-semibold text-[#7E2248]">Why it works: </span>
                          {match.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Client Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Assigned Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Manage your active matchmaking roster. View client profiles, intents, and curate matches directly.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border border-rose-100 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, city..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Male", "Female", "Other"].map((gender) => (
            <button
              key={gender}
              onClick={() => setGenderFilter(gender)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                genderFilter === gender
                  ? "bg-[#7E2248] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-rose-200 hover:bg-rose-50 font-medium"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-rose-100 shadow-sm animate-pulse p-6" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center text-2xl mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-900">No Clients Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            You do not have any active clients matching your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleShowCompatibility(client)}
                  title="Check AI Compatibility"
                  className="p-2 rounded-xl bg-rose-50 text-[#7E2248] hover:bg-rose-100/80 transition shadow-xs border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Find Match</span>
                </button>
              </div>

              <div className="flex items-start gap-4">
                {client.profileImage ? (
                  <img src={client.profileImage} alt={client.name} className="w-14 h-14 rounded-full object-cover shadow-xs border border-rose-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7E2248] to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="pt-1 pr-24">
                  <h3 className="font-bold text-slate-900 group-hover:text-[#7E2248] transition">{client.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.city}</span>
                    {client.age && <span> • {client.age} yrs</span>}
                  </div>
                  <div className="mt-1.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {client.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2 border-t border-rose-100 pt-4 text-xs text-slate-600">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
