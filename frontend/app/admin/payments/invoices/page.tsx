"use client";

import React, { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  CheckCircle2,
  ArrowLeft,
  FileText,
  DollarSign,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminInvoicesPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invoices", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1">
            <Receipt className="w-3.5 h-3.5" />
            Billing & Invoicing
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Generated GST Invoices & Receipts
          </h1>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Taxable (₹)</th>
                <th className="px-4 py-3.5">GST (18%)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 italic">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-white">{inv.userName}</div>
                      <span className="text-[10px] text-slate-500">{inv.userEmail}</span>
                    </td>
                    <td className="px-4 py-4">{inv.paymentType?.replace("_", " ") || "Service"}</td>
                    <td className="px-4 py-4 font-bold text-emerald-400">₹{inv.amount}</td>
                    <td className="px-4 py-4 text-slate-400">₹{inv.taxAmount}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/invoices/${inv.id}/send`, {
                              method: "POST",
                              credentials: "include",
                            });
                            const data = await res.json();
                            if (data.success) {
                              toast(data.message || "Invoice emailed successfully to user.", "success");
                            } else {
                              alert({
                                title: "Email Failed",
                                message: data.message || "Failed to send invoice email.",
                                type: "danger",
                              });
                            }
                          } catch (e) {
                            alert({
                              title: "Server Error",
                              message: "Failed to send invoice email due to a network error.",
                              type: "danger",
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Email Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
