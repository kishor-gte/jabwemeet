"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Check, X, Calendar as CalendarIcon, Heart, Users, Sparkles, MapPin } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium text-xs font-serif">Loading match suggestions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 relative">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Lightbulb className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Match Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Connection Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Monitor the status of your match suggestions and fix a date when both clients approve.
          </p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center text-2xl mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-900">No Connections Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            You have not suggested any matches yet. Go to your clients page to run the AI Compatibility check and connect clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connections.map((conn) => (
            <div key={conn.id} className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
               <div className="flex justify-between items-center mb-6 relative">
                  {/* Client */}
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-rose-100" />
                    <span className="text-xs font-bold text-slate-900 text-center">{conn.client.name}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${conn.clientStatus === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : conn.clientStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {conn.clientStatus}
                    </span>
                  </div>

                  {/* Heart / Status */}
                  <div className="w-1/3 flex flex-col items-center justify-center relative z-10">
                     <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition ${conn.status === 'BothApproved' || conn.status === 'DateFixed' ? 'bg-[#7E2248] text-white shadow-[#7E2248]/25' : conn.status === 'Rejected' ? 'bg-rose-500 text-white shadow-rose-500/25' : 'bg-rose-50 text-slate-400 border border-rose-200'}`}>
                        {conn.status === 'BothApproved' || conn.status === 'DateFixed' ? (
                          <Heart className="w-5 h-5 fill-white text-white" />
                        ) : conn.status === 'Rejected' ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <Heart className="w-5 h-5 text-slate-400" />
                        )}
                     </div>
                  </div>

                  {/* Suggested */}
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-rose-100" />
                    <span className="text-xs font-bold text-slate-900 text-center">{conn.suggestedProfile.name}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${conn.suggestedStatus === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : conn.suggestedStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {conn.suggestedStatus}
                    </span>
                  </div>
                  
                  {/* Connection line */}
                  <div className="absolute top-8 left-[15%] right-[15%] h-0.5 bg-rose-100 z-0"></div>
               </div>

               <div className="mt-auto border-t border-rose-100 pt-4 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Sent: {new Date(conn.createdAt).toLocaleDateString()}
                  </span>
                  
                  {conn.status === 'BothApproved' && (
                     <button onClick={() => setActiveDateConn(conn)} className="px-4 py-2 bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7E2248]/20 transition cursor-pointer">
                       Fix Date
                     </button>
                  )}
                  {conn.status === 'DateFixed' && (
                     <div className="flex flex-col items-end gap-1">
                       <span className="px-3 py-1 bg-rose-50 text-[#7E2248] border border-rose-200 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-xs">
                         <CalendarIcon className="w-3 h-3 text-[#7E2248]" /> Date Fixed
                       </span>
                       {(conn.meetingLocation || conn.meetingVenue) && (
                         <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                           <MapPin className="w-3 h-3 text-slate-400" />
                           {conn.meetingVenue && conn.meetingVenue}{conn.meetingVenue && conn.meetingLocation && ', '}{conn.meetingLocation}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 sm:p-7 space-y-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-slate-900">Fix a Date</h2>
              <p className="text-xs text-slate-500 mt-0.5">Arrange an offline meeting for your connected clients.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAF3F6] p-3 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-[#7E2248] block mb-0.5">CLIENT 1</span>
                <span className="text-sm font-bold text-slate-900 truncate block">{activeDateConn.client.name}</span>
              </div>
              <div className="bg-[#FAF3F6] p-3 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-[#7E2248] block mb-0.5">CLIENT 2</span>
                <span className="text-sm font-bold text-slate-900 truncate block">{activeDateConn.suggestedProfile.name}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                <input 
                  type="datetime-local" 
                  min={new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">General Location (Users will select cafe) *</label>
                <input 
                  type="text"
                  list="location-suggestions"
                  placeholder="e.g. Indiranagar, Bangalore"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition" 
                />
                <datalist id="location-suggestions">
                  <option value="Indiranagar, Bangalore" />
                  <option value="Koramangala, Bangalore" />
                  <option value="Jayanagar, Bangalore" />
                  <option value="JP Nagar, Bangalore" />
                  <option value="Whitefield, Bangalore" />
                  <option value="HSR Layout, Bangalore" />
                  <option value="Malleswaram, Bangalore" />
                  <option value="Bandra, Mumbai" />
                  <option value="Andheri, Mumbai" />
                  <option value="Colaba, Mumbai" />
                  <option value="Connaught Place, Delhi" />
                  <option value="Hauz Khas, Delhi" />
                  <option value="Koregaon Park, Pune" />
                  <option value="Jubilee Hills, Hyderabad" />
                  <option value="Banjara Hills, Hyderabad" />
                  <option value="Salt Lake, Kolkata" />
                </datalist>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Introduction Note / Message</label>
                <textarea 
                  value={meetingMessage}
                  onChange={(e) => setMeetingMessage(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-rose-100">
              <button 
                onClick={() => setActiveDateConn(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleFixDate}
                className="flex-1 py-2.5 bg-[#7E2248] text-white rounded-xl text-xs font-bold transition shadow-md shadow-[#7E2248]/20 hover:bg-[#681938] cursor-pointer"
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
