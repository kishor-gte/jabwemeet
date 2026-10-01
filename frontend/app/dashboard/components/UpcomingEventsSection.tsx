"use client";

import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  CheckCircle2,
  Filter,
  Search,
  X,
  Compass,
  Users,
  QrCode,
  ShieldCheck,
  Minus,
  Plus,
  CreditCard,
  Loader2,
} from "lucide-react";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  date: string;
  price: number;
  maxAttendees?: number;
  confirmedBookings?: number; // real-time count from backend
  bookedSpots?: number; // spots booked by this user
}

interface UpcomingEventsSectionProps {
  events: EventItem[];
  userCity: string;
  userName: string;
  registeredEventIds: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onRegisterEvent: (event: EventItem, spots?: number) => void;
  onExploreClick: () => void;
}

export default function UpcomingEventsSection({
  events,
  userCity,
  userName,
  registeredEventIds,
  selectedCategory,
  onSelectCategory,
  onRegisterEvent,
  onExploreClick,
}: UpcomingEventsSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);
  const [bookingModalEvent, setBookingModalEvent] = useState<EventItem | null>(null);
  const [selectedSpots, setSelectedSpots] = useState<number>(1);
  const [onlyLocal, setOnlyLocal] = useState<boolean>(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState<boolean>(false);

  // Derive unique categories dynamically
  const categories = ["ALL", ...Array.from(new Set(events.map((e) => e.category).filter(Boolean)))];

  // Dynamic relative time calculator
  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Upcoming";
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    if (diffMs < 0) return "Ended";
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 14) return "Next week";
    return `In ${Math.ceil(diffDays / 7)} weeks`;
  };

  const filteredEvents = events.filter((evt) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      evt.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(evt.category?.toLowerCase());

    const matchesCity =
      !onlyLocal || evt.city?.toLowerCase() === (userCity || "").toLowerCase();

    const matchesSearch =
      !searchQuery ||
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesCity && matchesSearch;
  });

  const getCategoryColor = (cat: string) => {
    const lower = cat?.toLowerCase() || "";
    if (lower.includes("speed")) return { badge: "bg-amber-50 text-amber-900 border-amber-200", gradient: "from-amber-100/60 via-amber-50/40 to-white" };
    if (lower.includes("mixer") || lower.includes("singles")) return { badge: "bg-rose-50 text-[#7E2248] border-rose-200", gradient: "from-rose-100/60 via-[#FAF3F6] to-white" };
    if (lower.includes("blind")) return { badge: "bg-purple-50 text-purple-900 border-purple-200", gradient: "from-purple-100/60 via-purple-50/40 to-white" };
    if (lower.includes("dance")) return { badge: "bg-emerald-50 text-emerald-900 border-emerald-200", gradient: "from-emerald-100/60 via-emerald-50/40 to-white" };
    if (lower.includes("travel") || lower.includes("trip")) return { badge: "bg-sky-50 text-sky-900 border-sky-200", gradient: "from-sky-100/60 via-sky-50/40 to-white" };
    return { badge: "bg-rose-50 text-[#7E2248] border-rose-200", gradient: "from-rose-100/60 via-[#FAF3F6] to-white" };
  };

  return (
    <div id="events" className="space-y-6">
      {/* Section Header with Live Counts */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
            <Calendar className="w-3.5 h-3.5 text-[#7E2248]" />
            Live Event Feed • {filteredEvents.length} Gatherings Listed
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Your Upcoming Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real dates, confirmed venues, and intentional crowd limits for genuine connection.
          </p>
        </div>

        {/* Search & Local City Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOnlyLocal(!onlyLocal)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition border ${
              onlyLocal
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                : "bg-white border-slate-200 text-slate-700 hover:text-[#7E2248] hover:border-rose-200"
            }`}
          >
            📍 In {userCity || "My City"} Only
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, city or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 mr-1 font-semibold">
            <Filter className="w-3 h-3 text-[#7E2248]" /> Category:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "ALL"
                ? events.length
                : events.filter((e) => e.category?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition shrink-0 uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#7E2248] text-white shadow-xs font-bold"
                    : "bg-white text-slate-600 hover:text-[#7E2248] border border-slate-200 hover:border-rose-200"
                }`}
              >
                <span>{cat === "ALL" ? "All Events" : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white font-bold" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Events Grid or Empty State */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isRegistered = registeredEventIds.includes(evt.id);
            const style = getCategoryColor(evt.category);
            const eventDate = new Date(evt.date);
            const formattedDate = !isNaN(eventDate.getTime())
              ? eventDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : evt.date;

            const formattedTime = !isNaN(eventDate.getTime())
              ? eventDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "7:00 PM";

            const relativeTime = getRelativeTime(evt.date);
            const isLocalCity = evt.city?.toLowerCase() === (userCity || "").toLowerCase();
            const capacity = evt.maxAttendees || 40;
            // Real booking count from backend
            const bookedCount = evt.confirmedBookings ?? 0;
            const spotsRemaining = Math.max(0, capacity - bookedCount);
            const isPast = !isNaN(eventDate.getTime()) && eventDate.getTime() < new Date().getTime();

            return (
              <div
                key={evt.id}
                className="group rounded-3xl bg-white border border-rose-100 hover:border-[#7E2248]/40 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Visual Header / Banner */}
                <div className={`p-5 bg-gradient-to-br ${style.gradient} border-b border-rose-100/70 relative`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${style.badge}`}
                    >
                      {evt.category || "Social"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLocalCity && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          In Your City
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-rose-100 shadow-2xs">
                        {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free Entry"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold font-serif text-slate-900 tracking-tight line-clamp-1 group-hover:text-[#7E2248] transition">
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                    <span className="truncate">{evt.location}, {evt.city}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-rose-100/60 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formattedDate} ({relativeTime})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Time
                      </span>
                      <span className="font-semibold text-slate-800">{formattedTime}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Availability
                      </span>
                      <span className={`font-semibold text-xs ${spotsRemaining === 0 ? "text-rose-600" : spotsRemaining <= 5 ? "text-amber-700" : "text-emerald-700"}`}>
                        {spotsRemaining === 0
                          ? "Sold Out"
                          : `${spotsRemaining} of ${capacity} spots open`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Ticket className="w-3.5 h-3.5 text-slate-400" />
                        Status
                      </span>
                      {isRegistered ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Spot Confirmed
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-600">
                          {isPast ? "Event Ended" : "Open for RSVP"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isRegistered ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveModalEvent(evt)}
                          className="flex-1 px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center justify-center gap-1.5"
                        >
                          <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Ticket Pass ({evt.bookedSpots || 1})</span>
                        </button>
                        {spotsRemaining > 0 && !isPast && (
                          <button
                            onClick={() => {
                              setSelectedSpots(1);
                              setBookingModalEvent(evt);
                            }}
                            className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7E2248] text-xs font-bold border border-rose-200 transition"
                            title="Book additional tickets"
                          >
                            + Add Seats
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => setActiveModalEvent(evt)}
                          className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                        <button
                          disabled={spotsRemaining === 0 || isPast}
                          onClick={() => {
                            setSelectedSpots(1);
                            setBookingModalEvent(evt);
                          }}
                          className={`px-4 py-2.5 rounded-full text-white text-xs font-bold shadow-md transition cursor-pointer ${
                            isPast || spotsRemaining === 0
                              ? "bg-slate-300 opacity-50 cursor-not-allowed text-slate-500"
                              : "bg-[#7E2248] hover:bg-[#681938] shadow-[#7E2248]/20"
                          }`}
                        >
                          {isPast ? "Event Ended" : spotsRemaining === 0 ? "Sold Out" : "Book Tickets"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl bg-white border border-rose-100 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">
            {events.length === 0 ? "There are no events right now" : "No events match your current filter"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-sm mx-auto leading-relaxed">
            {events.length === 0
              ? "New events will automatically appear here as soon as hosts or administrators schedule them. Check back soon for gatherings in your city."
              : onlyLocal
              ? `We didn't find events specifically in ${userCity}. Try viewing events across all cities or exploring other categories.`
              : "Try adjusting your search or category filter to discover other gatherings."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {events.length > 0 && (
              <button
                onClick={() => {
                  onSelectCategory("ALL");
                  setOnlyLocal(false);
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={onExploreClick}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold uppercase tracking-wider shadow-md transition"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Concepts</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Digital Ticket & Event Details Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                  {activeModalEvent.category}
                </span>
                <h3 className="text-xl font-bold font-serif text-slate-900 mt-2">
                  {activeModalEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeModalEvent.description}
            </p>

            {/* If Registered, Show Live Digital Admission Pass */}
            {registeredEventIds.includes(activeModalEvent.id) ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-rose-50 border border-emerald-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Confirmed Entry Pass
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800">
                    PASS-JWM-{activeModalEvent.id.slice(-4).toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Attendee</span>
                    <p className="font-bold text-slate-900 truncate">{userName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Pass Status</span>
                    <p className="font-bold text-emerald-700">Active & Verified</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Date & Time</span>
                    <p className="font-semibold text-slate-800">
                      {new Date(activeModalEvent.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase">Admit</span>
                    <p className="font-semibold text-slate-800">
                      {activeModalEvent.bookedSpots ? `${activeModalEvent.bookedSpots} ${activeModalEvent.bookedSpots > 1 ? 'Guests' : 'Guest'}` : '1 Guest'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-[11px] text-emerald-800">
                  <span>Show this pass at venue door</span>
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            ) : (
              /* Standard Details */
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#7E2248]" />
                  <span>
                    <strong>Venue:</strong> {activeModalEvent.location}, {activeModalEvent.city}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#7E2248]" />
                  <span>
                    <strong>Date:</strong>{" "}
                    {new Date(activeModalEvent.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-[#7E2248]" />
                  <span>
                    <strong>Entry Fee:</strong>{" "}
                    {activeModalEvent.price > 0
                      ? `₹${activeModalEvent.price.toLocaleString("en-IN")}`
                      : "Free Admission"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>Max Capacity:</strong> {activeModalEvent.maxAttendees || 40} guests
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveModalEvent(null)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>

              {registeredEventIds.includes(activeModalEvent.id) ? (
                <div className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pass Confirmed</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedSpots(1);
                    setBookingModalEvent(activeModalEvent);
                    setActiveModalEvent(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#7E2248]/20 transition cursor-pointer"
                >
                  Book Tickets
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Ticket Booking & Quantity Selection Modal */}
      {bookingModalEvent && (() => {
        const capacity = bookingModalEvent.maxAttendees || 40;
        const booked = bookingModalEvent.confirmedBookings ?? 0;
        const remaining = Math.max(0, capacity - booked);
        const maxSelectable = Math.max(1, remaining);
        const unitPrice = bookingModalEvent.price || 0;
        const totalPrice = unitPrice * selectedSpots;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                    {bookingModalEvent.category || "Event Pass"}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-slate-900 mt-2">
                    Book Tickets: {bookingModalEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#7E2248]" />
                    <span>{bookingModalEvent.location}, {bookingModalEvent.city}</span>
                  </div>
                </div>
                <button
                  onClick={() => setBookingModalEvent(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Availability Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Available Seats</span>
                </div>
                <span className="font-bold text-emerald-700">
                  {remaining > 0 ? `${remaining} of ${capacity} spots open` : "Sold Out"}
                </span>
              </div>

              {/* Quantity Stepper & Counter */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Number of Seats
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Up to {remaining} {remaining === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={selectedSpots <= 1}
                      onClick={() => setSelectedSpots((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 flex items-center justify-center font-bold text-base transition border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={maxSelectable}
                      value={selectedSpots}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val)) setSelectedSpots(1);
                        else setSelectedSpots(Math.max(1, Math.min(maxSelectable, val)));
                      }}
                      className="w-16 h-10 text-center font-extrabold text-lg text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#7E2248]"
                    />

                    <button
                      type="button"
                      disabled={selectedSpots >= remaining}
                      onClick={() => setSelectedSpots((prev) => Math.min(remaining, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 flex items-center justify-center font-bold text-base transition border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick-Select Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {[1, 2, 4].filter((n) => n <= remaining).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedSpots(n)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          selectedSpots === n
                            ? "bg-[#7E2248] text-white border-[#7E2248]"
                            : "bg-white text-slate-700 border-slate-200 hover:border-rose-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    {remaining > 1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSpots(remaining)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          selectedSpots === remaining
                            ? "bg-[#7E2248] text-white border-[#7E2248]"
                            : "bg-white text-[#7E2248] border-rose-200 hover:bg-rose-50"
                        }`}
                      >
                        All ({remaining})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Price per ticket</span>
                  <span className="font-semibold text-slate-900">
                    {unitPrice > 0 ? `₹${unitPrice.toLocaleString("en-IN")}` : "Free"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Quantity</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSpots} {selectedSpots === 1 ? "seat" : "seats"}
                  </span>
                </div>

                <div className="border-t border-rose-200/60 pt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-extrabold text-xl text-[#7E2248] font-serif">
                    {unitPrice > 0 ? `₹${totalPrice.toLocaleString("en-IN")}` : "Free Admission"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isProcessingBooking}
                  onClick={() => setBookingModalEvent(null)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={remaining === 0 || isProcessingBooking}
                  onClick={async () => {
                    const evtToBook = bookingModalEvent;
                    const spotsToBook = selectedSpots;
                    setIsProcessingBooking(true);
                    try {
                      await onRegisterEvent(evtToBook, spotsToBook);
                    } finally {
                      setIsProcessingBooking(false);
                      setBookingModalEvent(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#7E2248]/20 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Razorpay...</span>
                    </>
                  ) : unitPrice > 0 ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Pay ₹{totalPrice.toLocaleString("en-IN")}</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Confirm Free Booking ({selectedSpots} {selectedSpots === 1 ? 'Seat' : 'Seats'})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
