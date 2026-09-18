"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Check, X, Calendar as CalendarIcon, Heart, Users } from "lucide-react";

export default function SuggestionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date modal state
  const [activeDateConn, setActiveDateConn] = useState<any>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [meetingMessage, setMeetingMessage] = useState("Your first date is on us! Try it for free!");

  const fetchConnections = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const { user } = await meRes.json();
      
      const res = await fetch(`/api/matchmaker/connections?matchmakerId=${user.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleFixDate = async () => {
    try {
      const res = await fetch(`/api/matchmaker/connections/${activeDateConn.id}/date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingDate, meetingLocation, meetingVenue, meetingMessage }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setActiveDateConn(null);
        fetchConnections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading suggestions...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 relative">
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-6 sm:p-8 border border-emerald-100/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
            <Lightbulb className="w-3.5 h-3.5 fill-emerald-500" />
            <span>Match Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Connection Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Monitor the status of your match suggestions and fix a date when both clients approve.
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100/60 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Connections Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            You have not suggested any matches yet. Go to your clients page to run the AI Compatibility check and connect clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connections.map((conn) => (
            <div key={conn.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-center mb-6 relative">
                  {/* Client */}
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                    <span className="text-xs font-bold text-slate-800 text-center">{conn.client.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${conn.clientStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : conn.clientStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {conn.clientStatus}
                    </span>
                  </div>

                  {/* Heart / Status */}
                  <div className="w-1/3 flex flex-col items-center justify-center relative z-10">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${conn.status === 'BothApproved' || conn.status === 'DateFixed' ? 'bg-emerald-500 shadow-emerald-500/40' : conn.status === 'Rejected' ? 'bg-rose-500 shadow-rose-500/40' : 'bg-slate-100 border border-slate-200'}`}>
                        {conn.status === 'BothApproved' || conn.status === 'DateFixed' ? (
                          <Heart className="w-5 h-5 text-white fill-white" />
                        ) : conn.status === 'Rejected' ? (
                          <X className="w-5 h-5 text-white" />
                        ) : (
                          <Heart className="w-5 h-5 text-slate-300" />
                        )}
                     </div>
                  </div>

                  {/* Suggested */}
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white" />
                    <span className="text-xs font-bold text-slate-800 text-center">{conn.suggestedProfile.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${conn.suggestedStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : conn.suggestedStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {conn.suggestedStatus}
                    </span>
                  </div>
                  
                  {/* Connection line */}
                  <div className="absolute top-8 left-[15%] right-[15%] h-0.5 bg-slate-100 z-0"></div>
               </div>

               <div className="mt-auto border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">
                    Sent: {new Date(conn.createdAt).toLocaleDateString()}
                  </span>
                  
                  {conn.status === 'BothApproved' && (
                     <button onClick={() => setActiveDateConn(conn)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition">
                       Fix Date
                     </button>
                  )}
                  {conn.status === 'DateFixed' && (
                     <div className="flex flex-col items-end gap-1">
                       <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                         <CalendarIcon className="w-3 h-3" /> Date Fixed
                       </span>
                       {(conn.meetingLocation || conn.meetingVenue) && (
                         <span className="text-[9px] text-slate-500 font-medium">
                           📍 {conn.meetingVenue && conn.meetingVenue}{conn.meetingVenue && conn.meetingLocation && ', '}{conn.meetingLocation}
                         </span>
                       )}
                     </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Modal */}
      {activeDateConn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Fix a Date</h2>
            <p className="text-xs text-slate-500 mb-4">Arrange a meeting for your clients.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">CLIENT 1</span>
                <span className="text-sm font-bold text-slate-800">{activeDateConn.client.name}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">CLIENT 2</span>
                <span className="text-sm font-bold text-slate-800">{activeDateConn.suggestedProfile.name}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Area</label>
                  <input 
                    type="text"
                    placeholder="e.g. Indiranagar"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Place of Meet (Venue)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Starbucks"
                    value={meetingVenue}
                    onChange={(e) => setMeetingVenue(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attractive Message (Keep the free quote!)</label>
                <textarea 
                  value={meetingMessage}
                  onChange={(e) => setMeetingMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setActiveDateConn(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleFixDate}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
