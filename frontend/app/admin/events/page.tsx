"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  Plus,
  MapPin,
  Ticket,
  Users,
  Eye,
  Edit2,
  Archive,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminEventsPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Singles Events",
    city: "Mumbai",
    location: "",
    address: "",
    date: "",
    price: 1200,
    maxAttendees: 40,
    ageRange: "21-35",
    dressCode: "Smart Casual",
    rules: "",
    description: "",
    status: "PUBLISHED",
  });

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category, city, status });
      const res = await fetch(`/api/admin/events?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [category, city, status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents();
  }

  function openCreateModal() {
    setEditingEvent(null);
    setForm({
      title: "",
      category: "Singles Events",
      city: "Mumbai",
      location: "",
      address: "",
      date: "",
      price: 1200,
      maxAttendees: 40,
      ageRange: "21-35",
      dressCode: "Smart Casual",
      rules: "",
      description: "",
      status: "PUBLISHED",
    });
    setModalOpen(true);
  }

  function openEditModal(evt: any) {
    setEditingEvent(evt);
    setForm({
      title: evt.title || "",
      category: evt.category || "Singles Events",
      city: evt.city || "Mumbai",
      location: evt.location || "",
      address: evt.address || "",
      date: evt.date ? new Date(evt.date).toISOString().slice(0, 16) : "",
      price: evt.price || 0,
      maxAttendees: evt.maxAttendees || 40,
      ageRange: evt.ageRange || "21-35",
      dressCode: evt.dressCode || "Smart Casual",
      rules: evt.rules || "",
      description: evt.description || "",
      status: evt.status || "PUBLISHED",
    });
    setModalOpen(true);
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const method = editingEvent ? "PATCH" : "POST";
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast(editingEvent ? "Event updated successfully" : "Event created successfully", "success");
        setModalOpen(false);
        fetchEvents();
      } else {
        alert({
          title: "Save Failed",
          message: data.message || "Failed to save event details.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "An error occurred while saving the event.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  async function handleArchiveEvent(id: string) {
    const confirmed = await confirm({
      title: "Archive Event",
      message: "Are you sure you want to archive this event? Attendees will no longer see it in active listings.",
      type: "warning",
      confirmText: "Archive Event",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast("Event archived successfully", "info");
        fetchEvents();
      } else {
        alert({
          title: "Archive Failed",
          message: data.message || "Failed to archive event.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to archive event due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Curated Real-World Experiences
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Event Operations & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage mixers, speed dating, blind dates, dance workshops, and singles travel meetups.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by event title, venue, or neighborhood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#162136] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Singles Events">Singles Mixer</option>
              <option value="Speed Dating">Speed Dating</option>
              <option value="Blind Dates">Blind Date</option>
              <option value="Dance Dates">Dance Date</option>
              <option value="Singles Travel">Singles Travel</option>
              <option value="Breakup Community">Breakup Community</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* EVENTS GRID / TABLE */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 animate-pulse text-xs">
          Loading events catalog...
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center text-slate-500 italic bg-[#0f172a] rounded-2xl border border-white/10 text-xs">
          No events found matching current criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="rounded-3xl bg-[#0f172a] border border-white/10 hover:border-white/20 transition p-5 shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                    {evt.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    evt.status === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : evt.status === "CANCELLED"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/10 text-slate-400"
                  }`}>
                    {evt.status || "PUBLISHED"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-red-400 transition line-clamp-1">
                    {evt.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{evt.location}, {evt.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{new Date(evt.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block">Entry Ticket</span>
                    <span className="font-bold text-white">₹{evt.price || "Free"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <span className="text-[10px] text-slate-400 block">Bookings</span>
                    <span className="font-bold text-emerald-400">
                      {evt.registeredCount || 0} / {evt.maxAttendees || 50}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <a
                  href={`/admin/events/${evt.id}/registrations`}
                  className="inline-flex items-center gap-1.5 font-bold text-red-400 hover:text-red-300 transition"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Attendance Desk ({evt.checkedInCount || 0} checked in)</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchiveEvent(evt.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition"
                    title="Archive Event"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div
            className="relative w-full max-w-2xl bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingEvent ? "Edit Event Configuration" : "Create New Real-World Event"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="Singles Events">Singles Mixer</option>
                    <option value="Speed Dating">Speed Dating</option>
                    <option value="Blind Dates">Blind Date</option>
                    <option value="Dance Dates">Dance Date</option>
                    <option value="Singles Travel">Singles Travel</option>
                    <option value="Breakup Community">Breakup Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="POSTPONED">POSTPONED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Venue Name / Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Attendees</label>
                  <input
                    type="number"
                    min="5"
                    value={form.maxAttendees}
                    onChange={(e) => setForm({ ...form, maxAttendees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Age Range</label>
                  <input
                    type="text"
                    value={form.ageRange}
                    onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dress Code</label>
                  <input
                    type="text"
                    value={form.dressCode}
                    onChange={(e) => setForm({ ...form, dressCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description & Flow</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
