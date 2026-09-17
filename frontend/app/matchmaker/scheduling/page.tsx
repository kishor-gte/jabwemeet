"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, CheckCircle, Search, User, Gift, X, ChevronRight, Heart } from "lucide-react";
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
        setConnections(data.connections);
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
      // Combine date and time
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
    return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Scheduling & Dates</h1>
          <p className="text-slate-500 mt-1">Organize meetings and dates for your matched clients.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "pending" ? "bg-rose-50 text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Requires Scheduling
            {pendingSchedules.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-[10px]">
                {pendingSchedules.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === "scheduled" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Scheduled Dates
          </button>
        </div>
      </div>

      {activeTab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingSchedules.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
              <p className="text-slate-500 text-sm">No matches are currently waiting to be scheduled.</p>
            </div>
          ) : (
            pendingSchedules.map(conn => (
              <div key={conn.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Action Required</span>
                  <span className="text-[10px] text-slate-400">Match ID: {conn.id.slice(-6)}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4 mb-6 relative">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center z-10">
                      <CalendarDays className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="absolute w-full h-px bg-slate-100 -z-10" />
                  </div>
                  
                  <div className="text-center w-1/2">
                    <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-white shadow-sm mb-2" />
                    <p className="text-sm font-bold text-slate-800 truncate">{conn.client.name}</p>
                  </div>
                  
                  <div className="text-center w-1/2">
                    <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-white shadow-sm mb-2" />
                    <p className="text-sm font-bold text-slate-800 truncate">{conn.suggestedProfile.name}</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 text-center mb-4">Both clients have approved this match. Please arrange their first date.</p>
                
                <button
                  onClick={() => handleOpenModal(conn)}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-sm transition"
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
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <CalendarDays className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No scheduled dates</h3>
              <p className="text-slate-500 text-sm">You haven't scheduled any dates yet.</p>
            </div>
          ) : (
            scheduledDates.map(conn => (
              <div key={conn.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:border-blue-200 transition">
                {/* Date/Time Block */}
                <div className="flex-shrink-0 w-full md:w-32 text-center md:text-left md:border-r border-slate-100 pr-4">
                  <p className="text-rose-500 font-bold text-sm uppercase tracking-wider mb-1">
                    {new Date(conn.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {new Date(conn.meetingDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    Scheduled
                  </span>
                </div>
                
                {/* Profiles */}
                <div className="flex-1 flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2">
                    <img src={conn.client.profileImage || `https://ui-avatars.com/api/?name=${conn.client.name}`} alt={conn.client.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                    <span className="text-sm font-bold text-slate-700">{conn.client.name}</span>
                  </div>
                  <div className="w-8 h-px bg-slate-300" />
                  <Heart className="w-4 h-4 text-rose-400" />
                  <div className="w-8 h-px bg-slate-300" />
                  <div className="flex items-center gap-2">
                    <img src={conn.suggestedProfile.profileImage || `https://ui-avatars.com/api/?name=${conn.suggestedProfile.name}`} alt={conn.suggestedProfile.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                    <span className="text-sm font-bold text-slate-700">{conn.suggestedProfile.name}</span>
                  </div>
                </div>
                
                {/* Location Info */}
                <div className="flex-1 w-full text-center md:text-right">
                  <div className="inline-flex flex-col items-center md:items-end gap-1.5">
                    {conn.meetingVenue && (
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" /> {conn.meetingVenue}
                      </p>
                    )}
                    {conn.meetingLocation && (
                      <p className="text-xs text-slate-500">{conn.meetingLocation}</p>
                    )}
                    <button 
                      onClick={() => handleOpenModal(conn)}
                      className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Schedule Date</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For {selectedConnection.client.name} & {selectedConnection.suggestedProfile.name}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.meetingDate}
                    onChange={e => setFormData({...formData, meetingDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.meetingTime}
                    onChange={e => setFormData({...formData, meetingTime: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Venue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks, Central Park"
                  value={formData.meetingVenue}
                  onChange={e => setFormData({...formData, meetingVenue: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">City / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore, Indiranagar"
                  value={formData.meetingLocation}
                  onChange={e => setFormData({...formData, meetingLocation: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Special Message for the Couple</label>
                <textarea
                  required
                  rows={2}
                  value={formData.meetingMessage}
                  onChange={e => setFormData({...formData, meetingMessage: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition"
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
