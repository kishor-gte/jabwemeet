"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Plus,
  MapPin,
  Ticket,
  Users,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
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
  const [selectedCreator, setSelectedCreator] = useState<string>("ALL");
  const [collapsedCreators, setCollapsedCreators] = useState<Record<string, boolean>>({});

  const toggleCreatorCollapse = (creatorId: string) => {
    setCollapsedCreators((prev) => ({
      ...prev,
      [creatorId]: !prev[creatorId],
    }));
  };

  // Group events based on who added them and calculate event counts
  const groupedByCreator = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        role: string;
        profileImage?: string;
        events: any[];
        totalRegistered: number;
        totalCapacity: number;
        totalCheckedIn: number;
      }
    >();

    events.forEach((evt) => {
      const creatorKey = evt.hostId || (evt.hostName ? `name-${evt.hostName}` : "admin-unassigned");
      const creatorName = evt.hostName || "Platform Administration";
      const creatorEmail = evt.hostEmail || "admin@jabweemeet.com";
      const creatorRole = evt.hostRole || (evt.hostId ? "HOST" : "ADMIN");
      const creatorImage = evt.hostImage;

      if (!map.has(creatorKey)) {
        map.set(creatorKey, {
          id: creatorKey,
          name: creatorName,
          email: creatorEmail,
          role: creatorRole,
          profileImage: creatorImage,
          events: [],
          totalRegistered: 0,
          totalCapacity: 0,
          totalCheckedIn: 0,
        });
      }

      const grp = map.get(creatorKey)!;
      grp.events.push(evt);
      grp.totalRegistered += Number(evt.registeredCount) || 0;
      grp.totalCapacity += Number(evt.maxAttendees) || 0;
      grp.totalCheckedIn += Number(evt.checkedInCount) || 0;
    });

    return Array.from(map.values()).sort((a, b) => b.events.length - a.events.length);
  }, [events]);

  const filteredGroups = useMemo(() => {
    if (selectedCreator === "ALL") return groupedByCreator;
    return groupedByCreator.filter((g) => g.id === selectedCreator);
  }, [groupedByCreator, selectedCreator]);

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
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events";
      const method = editingEvent ? "PATCH" : "POST";

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
          message: data.message || "Failed to save event.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to communicate with the server.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    const confirmed = await confirm({
      title: "Delete Event",
      message: "Are you sure you want to permanently delete this event? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete Event",
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
        toast("Event deleted successfully", "success");
        fetchEvents();
      } else {
        alert({
          title: "Delete Failed",
          message: data.message || "Failed to delete event.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to delete event due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#7E2248]" />
            Curated Real-World Experiences
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Event Operations & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage mixers, speed dating, blind dates, dance workshops, and singles travel meetups.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by event title, venue, or neighborhood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white"
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
              className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Hosts / Creators ({groupedByCreator.length})</option>
              {groupedByCreator.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.events.length} {g.events.length === 1 ? "event" : "events"})
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {/* Creator Selection Pills */}
        {groupedByCreator.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-rose-100 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#7E2248]" />
              Event Creators:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCreator("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCreator === "ALL"
                  ? "bg-[#7E2248] text-white shadow-xs"
                  : "bg-rose-50 hover:bg-rose-100 text-slate-600 hover:text-slate-900 border border-rose-100"
              }`}
            >
              <span>All Hosts</span>
              <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
                {events.length}
              </span>
            </button>
            {groupedByCreator.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedCreator(g.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCreator === g.id
                    ? "bg-rose-100 border border-rose-300 text-[#7E2248] font-bold"
                    : "bg-rose-50 hover:bg-rose-100 text-slate-600 hover:text-slate-900 border border-rose-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#7E2248]" />
                <span>{g.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-white text-[10px] text-slate-800 font-bold border border-rose-200/60">
                  {g.events.length} {g.events.length === 1 ? "event" : "events"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* EVENTS GROUPED BY CREATOR */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse text-xs">
          Loading events catalog...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-20 text-center text-slate-400 italic bg-white rounded-3xl border border-rose-100 shadow-xs text-xs">
          No events found matching current criteria.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            const isCollapsed = !!collapsedCreators[group.id];
            return (
              <div
                key={group.id}
                className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden"
              >
                {/* Creator Header Section */}
                <div className="p-4 sm:p-5 bg-rose-50/50 border-b border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar / Initials */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-[#7E2248] font-serif font-black text-lg shadow-xs">
                        {group.profileImage ? (
                          <img
                            src={group.profileImage}
                            alt={group.name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          group.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                          group.role === "ADMIN"
                            ? "bg-purple-600 text-white"
                            : group.role === "HOST"
                            ? "bg-[#7E2248] text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {group.role}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 tracking-tight">
                          {group.name}
                        </h2>
                        <span className="text-xs text-slate-500">
                          ({group.email})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Creator / Host Profile &middot; Added <span className="text-[#7E2248] font-bold">{group.events.length} {group.events.length === 1 ? "Event" : "Events"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Creator Metadata & Event Count */}
                  <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                    {/* Prominent count badge */}
                    <div className="px-3.5 py-1.5 rounded-xl bg-rose-100/70 border border-rose-200 text-[#7E2248] font-bold text-xs flex items-center gap-2 shadow-xs">
                      <Calendar className="w-4 h-4 text-[#7E2248]" />
                      <span>
                        {group.events.length}{" "}
                        {group.events.length === 1 ? "Event Added" : "Events Added"}
                      </span>
                    </div>

                    {/* Bookings Stat */}
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-700 text-xs flex items-center gap-1.5 shadow-xs">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {group.totalRegistered} / {group.totalCapacity} Booked
                      </span>
                    </div>

                    {/* Checked In Stat */}
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-700 text-xs flex items-center gap-1.5 shadow-xs">
                      <Ticket className="w-3.5 h-3.5 text-[#7E2248]" />
                      <span>{group.totalCheckedIn} Checked In</span>
                    </div>

                    {/* Collapse / Expand Button */}
                    <button
                      type="button"
                      onClick={() => toggleCreatorCollapse(group.id)}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-slate-900 border border-rose-200 transition flex items-center gap-1 text-xs shadow-xs"
                      title={isCollapsed ? "Expand Events" : "Collapse Events"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Events Grid for this creator */}
                {!isCollapsed && (
                  <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-rose-50/20">
                    {group.events.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded-3xl bg-white border border-rose-100 hover:border-rose-300 hover:shadow-md transition p-5 shadow-xs flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#7E2248] border border-rose-200/60">
                              {evt.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                evt.status === "PUBLISHED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : evt.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {evt.status || "PUBLISHED"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-serif font-bold text-slate-900 group-hover:text-[#7E2248] transition line-clamp-1">
                              {evt.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">
                                {evt.location}, {evt.city}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {new Date(evt.date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-100 text-xs">
                            <div className="p-2.5 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                              <span className="text-[10px] text-slate-500 block">
                                Entry Ticket
                              </span>
                              <span className="font-bold text-slate-800">
                                ₹{evt.price || "Free"}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-rose-50/40 border border-rose-100/60">
                              <span className="text-[10px] text-slate-500 block">
                                Bookings
                              </span>
                              <span className="font-bold text-emerald-700">
                                {evt.registeredCount || 0} /{" "}
                                {evt.maxAttendees || 50}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-rose-100 text-xs">
                          <a
                            href={`/admin/events/${evt.id}/registrations`}
                            className="inline-flex items-center gap-1.5 font-bold text-[#7E2248] hover:text-[#681938] transition"
                          >
                            <Ticket className="w-3.5 h-3.5 text-[#7E2248]" />
                            <span>
                              Attendance Desk ({evt.checkedInCount || 0} checked in)
                            </span>
                          </a>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(evt)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-slate-700 transition border border-rose-200"
                              title="Edit Event"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div
            className="relative w-full max-w-2xl bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {editingEvent ? "Edit Event Configuration" : "Create New Real-World Event"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
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
                  <label className="block text-slate-700 font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
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
                  <label className="block text-slate-700 font-semibold mb-1">Venue Name / Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Attendees</label>
                  <input
                    type="number"
                    min="5"
                    value={form.maxAttendees}
                    onChange={(e) => setForm({ ...form, maxAttendees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age Range</label>
                  <input
                    type="text"
                    value={form.ageRange}
                    onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dress Code</label>
                  <input
                    type="text"
                    value={form.dressCode}
                    onChange={(e) => setForm({ ...form, dressCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description & Flow</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-slate-700 hover:bg-rose-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition shadow-xs disabled:opacity-50"
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
