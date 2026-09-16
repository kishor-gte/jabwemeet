"use client";

import React from "react";
import {
  CreditCard,
  Download,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Sparkles,
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface PaymentsViewProps {
  registeredEvents: EventItem[];
  userName: string;
}

export default function PaymentsView({ registeredEvents, userName }: PaymentsViewProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          Financial & Billing
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Payments & Receipts
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your event ticket passes, receipts, and payment method safeguards.
        </p>
      </div>

      {/* Payment Security Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12222b] via-[#101b2c] to-[#0c1424] border border-emerald-500/20 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Payment Method & UPI Ready</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Encrypted checkout supported for UPI, Net Banking, and major cards via standard payment gateways.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-300 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0">
          Zero Recurring Subscriptions
        </span>
      </div>

      {/* Transaction History / Receipts */}
      <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#e06d53]" />
            <span>Event Entry Transactions ({registeredEvents.length})</span>
          </h4>
          <span className="text-xs text-slate-400">All prices in INR (₹)</span>
        </div>

        {registeredEvents.length > 0 ? (
          <div className="divide-y divide-white/5">
            {registeredEvents.map((evt) => (
              <div
                key={evt.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-bold text-white text-sm">{evt.title}</h5>
                  <p className="text-slate-400 mt-0.5">
                    Order Ref: JWM-INV-{evt.id.slice(-4).toUpperCase()} • {evt.city}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-extrabold text-white text-sm">
                    {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free Admission"}
                  </span>
                  <button
                    onClick={() =>
                      alert(`Invoice receipt for "${evt.title}" downloaded.`)
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-slate-300">No payment transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Event ticket purchases and paid passes will automatically generate receipts here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
