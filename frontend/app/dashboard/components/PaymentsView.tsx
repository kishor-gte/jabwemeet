"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Sparkles,
  Heart
} from "lucide-react";
import { EventItem } from "./UpcomingEventsSection";

interface PaymentsViewProps {
  registeredEvents: EventItem[];
  userName: string;
}

export default function PaymentsView({ registeredEvents, userName }: PaymentsViewProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/payments", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPayments(data.payments);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
          <CreditCard className="w-3.5 h-3.5 text-[#7E2248]" />
          Financial & Billing
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Subscriptions & Payments
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Review your dating packages, event ticket passes, and payment method safeguards.
        </p>
      </div>

      {/* Payment Security Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50/60 via-white to-white border border-emerald-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Payment Method & UPI Ready</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Encrypted checkout supported for UPI, Net Banking, and major cards via standard payment gateways.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-900 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 shrink-0">
          Zero Recurring Subscriptions
        </span>
      </div>

      {/* Dating Packages / Subscriptions History */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <h4 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#7E2248]" />
            <span>Dating Packages & Subscriptions ({payments.length})</span>
          </h4>
          <span className="text-xs text-slate-400">All prices in INR (₹)</span>
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-500 text-sm">Loading payments...</div>
        ) : payments.length > 0 ? (
          <div className="divide-y divide-rose-100">
            {payments.map((p) => (
              <div
                key={p.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-serif font-bold text-slate-900 text-sm">{p.type === 'DATING_PACKAGE' ? 'Dating Package' : p.type}</h5>
                  <p className="text-slate-500 mt-0.5">
                    Order Ref: {p.id} • {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-serif font-extrabold text-slate-900 text-sm">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm font-serif font-semibold text-slate-900">No dating packages purchased yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Your first date is free! Subsequent dates require a package.
            </p>
          </div>
        )}
      </div>

      {/* Transaction History / Receipts */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <h4 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#7E2248]" />
            <span>Event Entry Transactions ({registeredEvents.length})</span>
          </h4>
          <span className="text-xs text-slate-400">All prices in INR (₹)</span>
        </div>

        {registeredEvents.length > 0 ? (
          <div className="divide-y divide-rose-100">
            {registeredEvents.map((evt) => (
              <div
                key={evt.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-serif font-bold text-slate-900 text-sm">{evt.title}</h5>
                  <p className="text-slate-500 mt-0.5">
                    Order Ref: JWM-INV-{evt.id.slice(-4).toUpperCase()} • {evt.city}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-serif font-extrabold text-slate-900 text-sm">
                    {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free Admission"}
                  </span>
                  <button
                    onClick={() =>
                      alert(`Invoice receipt for "${evt.title}" downloaded.`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 transition font-medium"
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
            <p className="text-sm font-serif font-semibold text-slate-900">No event transactions yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Event ticket purchases and paid passes will automatically generate receipts here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
