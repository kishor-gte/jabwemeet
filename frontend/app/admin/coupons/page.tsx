"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Percent,
  IndianRupee,
  Layers,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountAmount: number;
  applicableService: string;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  startDate: string;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountAmount: 15,
    applicableService: "ALL",
    minOrderAmount: 0,
    maxUses: 100,
    perUserLimit: 1,
    expiryDate: "",
    sendEmail: false,
  });

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  function openCreateModal() {
    setForm({
      code: "",
      discountType: "PERCENTAGE",
      discountAmount: 15,
      applicableService: "ALL",
      minOrderAmount: 0,
      maxUses: 100,
      perUserLimit: 1,
      expiryDate: "",
      sendEmail: false,
    });
    setErrorMsg("");
    setModalOpen(true);
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      setErrorMsg("Coupon code is required");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchCoupons();
      } else {
        setErrorMsg(data.message || "Failed to create coupon");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(coupon: Coupon) {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Derived metrics
  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedeemed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
  const expiredCount = coupons.filter(
    (c) => c.expiryDate && new Date(c.expiryDate) < new Date()
  ).length;

  const filteredCoupons = coupons.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.applicableService.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && c.isActive) ||
      (statusFilter === "INACTIVE" && !c.isActive);
    const matchService =
      serviceFilter === "ALL" || c.applicableService === serviceFilter;
    return matchSearch && matchStatus && matchService;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-900 via-[#7E2248] to-rose-950 border border-rose-200/20 rounded-3xl p-6 sm:p-8 shadow-md shadow-[#7E2248]/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-rose-100 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Promotions & Growth
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-rose-200" />
            Coupons & Offers
          </h1>
          <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-xl">
            Create and regulate promotional discount codes for events, RM packages, and Breakup Buddy sessions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="relative z-10 inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-[#7E2248] px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-xs w-fit active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500">Total Coupons</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mt-2">{coupons.length}</p>
          <span className="text-[11px] text-slate-400">Configured in system</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-emerald-700">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-emerald-700 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-400">Available at checkout</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#7E2248]">Redemptions</span>
            <Percent className="w-4 h-4 text-[#7E2248]" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-[#7E2248] mt-2">{totalRedeemed}</p>
          <span className="text-[11px] text-slate-400">Applied by users</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-amber-700">Expired</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-amber-700 mt-2">{expiredCount}</p>
          <span className="text-[11px] text-slate-400">Past validity date</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search promo code or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Applicable To:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Services</option>
              <option value="EVENT">Events Only</option>
              <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
              <option value="BREAKUP_BUDDY">Breakup Buddy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">Loading promo codes...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-serif font-semibold text-slate-700">No coupons match your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Create a new coupon to run campaigns</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-50/60 border-b border-rose-100 text-slate-500 text-[11px] font-serif font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Code</th>
                  <th className="py-4 px-4">Discount</th>
                  <th className="py-4 px-4">Target Service</th>
                  <th className="py-4 px-4">Min Spend</th>
                  <th className="py-4 px-4">Redemptions</th>
                  <th className="py-4 px-4">Expiry</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-xs text-slate-700">
                {filteredCoupons.map((c) => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-rose-50/30 transition">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-[#7E2248] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs tracking-wide">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {c.discountType === "PERCENTAGE" ? (
                          <span className="inline-flex items-center gap-1 text-[#7E2248]">
                            <Percent className="w-3.5 h-3.5" />
                            {c.discountAmount}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700">
                            <IndianRupee className="w-3.5 h-3.5" />
                            ₹{c.discountAmount} OFF
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5 bg-rose-50/70 border border-rose-100 px-2.5 py-1 rounded-lg text-[11px]">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {c.applicableService.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono">
                        ₹{c.minOrderAmount || 0}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-rose-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#7E2248] h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, ((c.usedCount || 0) / (c.maxUses || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono font-bold">
                            {c.usedCount || 0}/{c.maxUses}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {c.expiryDate ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isExpired ? "text-rose-600 font-bold" : "text-slate-600"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(c.expiryDate).toLocaleDateString()}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-slate-400">No Expiry</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {c.isActive && !isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-slate-500 border border-rose-100">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => toggleStatus(c)}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          {c.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl z-10">
            <div className="px-1 py-1 border-b border-rose-100 pb-4 mb-4 flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#7E2248]" />
                Create Promotional Coupon
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50, FESTIVE2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 font-mono uppercase focus:outline-none focus:border-[#7E2248] focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Discount Type
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Applicable Service
                  </label>
                  <select
                    value={form.applicableService}
                    onChange={(e) => setForm({ ...form, applicableService: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  >
                    <option value="ALL">All Services</option>
                    <option value="EVENT">Events Only</option>
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                    <option value="BREAKUP_BUDDY">Breakup Buddy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Total Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Uses Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                />
              </div>

              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                    className="w-4 h-4 rounded text-[#7E2248] border-rose-300 focus:ring-[#7E2248] focus:ring-offset-0"
                  />
                  <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                    <span>✉️</span> Blast Promotional Voucher to Members via Email
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-slate-700 border border-rose-200 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-[#7E2248]/20 transition"
                >
                  {submitting ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
