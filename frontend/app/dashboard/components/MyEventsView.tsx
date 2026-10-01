"use client";

import React from "react";
import {
  CalendarCheck,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface MyEventsViewProps {
  registeredEvents: EventItem[];
  userName: string;
  onExploreEvents: () => void;
}

export default function MyEventsView({
  registeredEvents,
  userName,
  onExploreEvents,
}: MyEventsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
          <CalendarCheck className="w-3.5 h-3.5 text-[#7E2248]" />
          My Reservations
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Your Confirmed Event Passes
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Digital entry tickets and venue instructions for your upcoming offline experiences.
        </p>
      </div>

      {registeredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registeredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Confirmed Entry Pass
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#7E2248] font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    PASS-JWM-{evt.id.slice(-4).toUpperCase()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
                    {evt.category}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mt-2">{evt.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{evt.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Attendee</span>
                    <p className="font-semibold text-slate-900 truncate">{userName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Entry Pass</span>
                    <p className="font-semibold text-[#7E2248]">
                      {evt.bookedSpots ? `${evt.bookedSpots} ${evt.bookedSpots > 1 ? 'Seats' : 'Seat'}` : '1 Seat'}
                      {evt.price > 0 ? ` • ₹${((evt.price || 0) * (evt.bookedSpots || 1)).toLocaleString("en-IN")}` : " • Complimentary"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Date & Time</span>
                    <p className="font-semibold text-slate-900">
                      {new Date(evt.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Venue & City</span>
                    <p className="font-semibold text-slate-900 truncate">{evt.location}, {evt.city}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-100">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confirmed Ticket Pass</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-medium">Ready at door</span>
                  <QrCode className="w-5 h-5 text-[#7E2248]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-rose-100 p-10 sm:p-16 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] mx-auto mb-4 shadow-xs">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">You have no active event reservations</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            Reserve your spot at upcoming mixers, speed dating sessions, or blind date experiences to see your digital entry passes here.
          </p>
          <button
            onClick={onExploreEvents}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition transform hover:-translate-y-0.5"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Upcoming Events</span>
          </button>
        </div>
      )}
    </div>
  );
}
