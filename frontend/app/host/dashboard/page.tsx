"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Plus, X } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  date: string;
  endDate?: string;
  price: number;
  maxAttendees: number;
  ageRange?: string;
  itinerary?: string;
};

const CATEGORIES = [
  "Single events",
  "Speed dating",
  "Dance Dating",
  "Singles Travels"
];

export default function HostDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Single events",
    location: "",
    city: "",
    date: "",
    endDate: "",
    price: 0,
    maxAttendees: 50,
    ageRange: "",
    itinerary: "",
  });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          router.replace("/login");
        } else if (d.user.role !== "HOST" && d.user.role !== "ADMIN" && d.user.role !== "EVENT_MANAGER") {
          router.replace("/dashboard");
        } else {
          setUser(d.user);
          fetchEvents();
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const fetchEvents = () => {
    fetch("/api/events/host", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.success) setEvents(d.events);
        setLoading(false);
      });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchEvents();
        // Reset form
        setFormData({
          title: "", description: "", category: "Single events", location: "", city: "", date: "", endDate: "", price: 0, maxAttendees: 50, ageRange: "", itinerary: "",
        });
      } else {
        alert(data.message || "Failed to create event");
      }
    } catch (error) {
      alert("Error creating event");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen bg-[#0b111e] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Event Manager Dashboard</h1>
            <p className="text-slate-400 mt-2">Manage your events: Single events, Speed dating, Dance Dating, and Singles Travels.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Welcome, {user?.name}</span>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#e06d53] hover:bg-[#c95a43] px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Create Event
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full bg-[#131d2e] rounded-3xl p-12 text-center border border-white/10 shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#e06d53]/15 text-[#e06d53] flex items-center justify-center text-3xl mx-auto">
                🎉
              </div>
              <h3 className="text-xl font-bold">No Events Created Yet</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                Get started by creating your first offline event: Single Events, Speed Dating, Dance Dating, or Singles Travels.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-[#e06d53] hover:bg-[#c95a43] px-6 py-3 rounded-full font-bold text-sm inline-flex items-center gap-2 transition shadow-lg shadow-[#e06d53]/25"
                >
                  <Plus size={18} />
                  Create Your First Event
                </button>
              </div>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-[#131d2e] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="inline-block px-3 py-1 bg-[#23324c] rounded-full text-xs font-semibold text-[#e06d53] mb-4">
                  {event.category}
                </div>
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    <span>{new Date(event.date).toLocaleDateString()} {event.endDate && `- ${new Date(event.endDate).toLocaleDateString()}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-500" />
                    <span>{event.location}, {event.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-500" />
                    <span>Max: {event.maxAttendees}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="font-bold text-lg">${event.price}</span>
                  <button className="text-[#e06d53] text-sm hover:underline">Manage Attendees</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Event Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-[#131d2e] rounded-2xl p-8 w-full max-w-2xl border border-white/10 relative my-8">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Event Title</label>
                    <input required name="title" value={formData.title} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2 h-24" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Venue / Location</label>
                    <input required name="location" value={formData.location} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date & Time</label>
                    <input required type="datetime-local" name="date" value={formData.date} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>

                  {formData.category === "Singles Travels" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date & Time</label>
                      <input required type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Ticket Price ($)</label>
                    <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Max Attendees</label>
                    <input required type="number" name="maxAttendees" value={formData.maxAttendees} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                  </div>

                  {formData.category === "Speed dating" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Age Range (e.g. 25-35)</label>
                      <input name="ageRange" value={formData.ageRange} onChange={handleChange} className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2" />
                    </div>
                  )}

                  {formData.category === "Singles Travels" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Travel Itinerary</label>
                      <textarea name="itinerary" value={formData.itinerary} onChange={handleChange} placeholder="Day 1: Arrival... Day 2: City Tour..." className="w-full bg-[#0b111e] border border-white/10 rounded-lg px-4 py-2 h-24" />
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-[#e06d53] hover:bg-[#c95a43] px-6 py-2 rounded-lg font-medium transition-colors">
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
