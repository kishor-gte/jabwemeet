"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, CheckCircle, Search, User, Gift, X, ChevronRight, Heart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SchedulingPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled">("pending");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [formData, setFormData] = useState({
    meetingDate: "",
    meetingTime: "",
    meetingLocation: "",
    meetingVenue: "",
    meetingMessage: "Your first date is on us! Try it for free!"
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const { user } = await meRes.json();
      
      const res = await fetch(`/api/matchmaker/connections?matchmakerId=${user.id}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (conn: any) => {
    setSelectedConnection(conn);
    setFormData({
      meetingDate: conn.meetingDate ? new Date(conn.meetingDate).toISOString().split('T')[0] : "",
      meetingTime: conn.meetingDate ? new Date(conn.meetingDate).toTimeString().slice(0,5) : "",
      meetingLocation: conn.meetingLocation || "",
      meetingVenue: conn.meetingVenue || "",
      meetingMessage: conn.meetingMessage || "Your first date is on us! Try it for free!"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection) return;

    try {
      const dateTime = new Date(`${formData.meetingDate}T${formData.meetingTime}:00`).toISOString();
      
      const res = await fetch(`/api/matchmaker/connections/${selectedConnection.id}/date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingDate: dateTime,
          meetingLocation: formData.meetingLocation,
          meetingVenue: formData.meetingVenue,
          meetingMessage: formData.meetingMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchConnections();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingSchedules = connections.filter(c => c.status === "BothApproved");
  const scheduledDates = connections.filter(c => c.status === "DateFixed").sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium text-xs font-serif">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <CalendarDays className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Date Orchestration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Scheduling & Dates
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Organize offline meetings, date coordinates, and cafe reservations for your matched clients.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#FAF3F6] p-1.5 rounded-2xl border border-rose-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "pending" ? "bg-white text-[#7E2248] shadow-sm border border-rose-100" : "text-slate-600 hover:text-slate-900"}`}
          >
            Requires Scheduling
            {pendingSchedules.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-rose-100 text-[#7E2248] text-[10px] font-bold">
                {pendingSchedules.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === "scheduled" ? "bg-white text-[#7E2248] shadow-sm border border-rose-100" : "text-slate-600 hover:text-slate-900"}`}
          >
            Scheduled Dates ({scheduledDates.length})
          </button>
        </div>
      </div>

      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSchedules.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-serif font-bold text-slate-900">All caught up!</h3>
              <p className="text-slate-500 text-xs">No matches are currently waiting to be scheduled.</p>
            </div>
          ) : (
            pendingSchedules.map(conn => (
              <div key={conn.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248]">Action Required</span>
                    <span className="text-[10px] text-slate-400 font-medium">Match ID: {conn.id.slice(-6)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 mb-6 relative py-2">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center z-10 shadow-xs">
                        <CalendarDays className="w-3.5 h-3.5 text-[#7E2248]" />
                      </div>
                      <div className="absolute w-full h-px bg-rose-100 -z-10" />
                    </div>
                    
                    <div className="text-center w-1/2">
                      <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-rose-100 shadow-xs mb-2" />
                      <p className="text-xs font-bold text-slate-900 truncate">{conn.client.name}</p>
                    </div>
                    
                    <div className="text-center w-1/2">
                      <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-rose-100 shadow-xs mb-2" />
                      <p className="text-xs font-bold text-slate-900 truncate">{conn.suggestedProfile.name}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-600 text-center mb-5 leading-relaxed">Both clients have approved this match. Please arrange their first date coordinates.</p>
                </div>
                
                <button
                  onClick={() => handleOpenModal(conn)}
                  className="w-full py-2.5 bg-[#7E2248] hover:bg-[#681938] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7E2248]/20 transition cursor-pointer"
                >
                  Schedule Date
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "scheduled" && (
        <div className="space-y-4">
          {scheduledDates.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-serif font-bold text-slate-900">No scheduled dates</h3>
              <p className="text-slate-500 text-xs">You haven't scheduled any dates yet.</p>
            </div>
          ) : (
            scheduledDates.map(conn => (
              <div key={conn.id} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:border-rose-300 transition-all duration-300">
                {/* Date/Time Block */}
                <div className="flex-shrink-0 w-full md:w-36 text-center md:text-left md:border-r border-rose-100 pr-4">
                  <p className="text-[#7E2248] font-bold text-xs uppercase tracking-wider mb-0.5">
                    {new Date(conn.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-2xl font-serif font-bold text-slate-900">
                    {new Date(conn.meetingDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Scheduled
                  </span>
                </div>
                
                {/* Profiles */}
                <div className="flex-1 flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2">
                    <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-10 h-10 rounded-full object-cover shadow-xs border border-rose-200" />
                    <span className="text-xs font-bold text-slate-900">{conn.client.name}</span>
                  </div>
                  <div className="w-8 h-px bg-rose-200" />
                  <Heart className="w-4 h-4 text-[#7E2248] fill-[#7E2248]" />
                  <div className="w-8 h-px bg-rose-200" />
                  <div className="flex items-center gap-2">
                    <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-10 h-10 rounded-full object-cover shadow-xs border border-rose-200" />
                    <span className="text-xs font-bold text-slate-900">{conn.suggestedProfile.name}</span>
                  </div>
                </div>
                
                {/* Location Info */}
                <div className="flex-1 w-full text-center md:text-right">
                  <div className="inline-flex flex-col items-center md:items-end gap-1.5">
                    {conn.meetingVenue && (
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7E2248]" /> {conn.meetingVenue}
                      </p>
                    )}
                    {conn.meetingLocation && (
                      <p className="text-xs text-slate-500">{conn.meetingLocation}</p>
                    )}
                    <button 
                      onClick={() => handleOpenModal(conn)}
                      className="mt-1 text-xs font-bold text-[#7E2248] hover:text-[#681938] underline cursor-pointer"
                    >
                      Edit Schedule
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scheduling Modal */}
      {isModalOpen && selectedConnection && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-rose-100 flex items-center justify-between bg-[#FAF3F6]">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">Schedule Date</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  For {selectedConnection.client.name} & {selectedConnection.suggestedProfile.name}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-rose-50 rounded-full transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]}
                    value={formData.meetingDate}
                    onChange={e => setFormData({...formData, meetingDate: e.target.value})}
                    className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white bg-[#FDFBF9] transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.meetingTime}
                    onChange={e => setFormData({...formData, meetingTime: e.target.value})}
                    className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white bg-[#FDFBF9] transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">General Location (Users will pick cafe) *</label>
                <input
                  type="text"
                  required
                  list="location-suggestions"
                  placeholder="e.g. Bangalore, Indiranagar"
                  value={formData.meetingLocation}
                  onChange={e => setFormData({...formData, meetingLocation: e.target.value})}
                  className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white bg-[#FDFBF9] transition"
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Special Message for the Couple</label>
                <textarea
                  required
                  rows={2}
                  value={formData.meetingMessage}
                  onChange={e => setFormData({...formData, meetingMessage: e.target.value})}
                  className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white bg-[#FDFBF9] transition"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#7E2248] hover:bg-[#681938] text-white rounded-xl text-xs font-bold shadow-md shadow-[#7E2248]/20 transition cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
