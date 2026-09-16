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
  Trash2,
  Compass,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface MyEventsViewProps {
  registeredEvents: EventItem[];
  userName: string;
  onCancelReservation: (eventId: string) => void;
  onExploreEvents: () => void;
}

export default function MyEventsView({
  registeredEvents,
  userName,
  onCancelReservation,
  onExploreEvents,
}: MyEventsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e06d53]/15 text-[#fca5a5] text-xs font-semibold mb-2 border border-[#e06d53]/30">
          <CalendarCheck className="w-3.5 h-3.5 text-[#e06d53]" />
          My Reservations
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Your Confirmed Event Passes
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Digital entry tickets and venue instructions for your upcoming offline experiences.
        </p>
      </div>

      {registeredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registeredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-3xl bg-gradient-to-br from-[#162238] via-[#121c2c] to-[#0c1424] border border-emerald-500/30 p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Confirmed Entry Pass
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    PASS-JWM-{evt.id.slice(-4).toUpperCase()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30">
                    {evt.category}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">{evt.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evt.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Attendee</span>
                    <p className="font-semibold text-white truncate">{userName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Entry Fee</span>
                    <p className="font-semibold text-emerald-300">
                      {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Complimentary"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Date & Time</span>
                    <p className="font-semibold text-white">
                      {new Date(evt.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Venue & City</span>
                    <p className="font-semibold text-white truncate">{evt.location}, {evt.city}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  onClick={() => onCancelReservation(evt.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold border border-rose-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel Reservation</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span>Ready at door</span>
                  <QrCode className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-10 sm:p-16 text-center max-w-lg mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#e06d53]/15 border border-[#e06d53]/30 flex items-center justify-center text-[#e06d53] mx-auto mb-4">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">You have no active event reservations</h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            Reserve your spot at upcoming mixers, speed dating sessions, or blind date experiences to see your digital entry passes here.
          </p>
          <button
            onClick={onExploreEvents}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold shadow-lg transition"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Upcoming Events</span>
          </button>
        </div>
      )}
    </div>
  );
}
