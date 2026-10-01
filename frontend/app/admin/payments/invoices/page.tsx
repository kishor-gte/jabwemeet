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
          className="p-2 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-1">
            <Receipt className="w-3.5 h-3.5 text-[#7E2248]" />
            Billing & Invoicing
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
            Generated GST Invoices & Receipts
          </h1>
        </div>
      </div>

      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
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
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 animate-pulse">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{inv.userName}</div>
                      <span className="text-[10px] text-slate-500">{inv.userEmail}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-[#7E2248] border border-rose-200/60 font-semibold">
                        {inv.paymentType?.replace("_", " ") || "Service"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-700">₹{inv.amount}</td>
                    <td className="px-4 py-4 text-slate-500">₹{inv.taxAmount}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-[11px]">
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
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#7E2248] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#7E2248]" />
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
