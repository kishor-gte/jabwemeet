"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  HeartHandshake,
  Heart,
  DollarSign,
  X,
  Trash2,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminPackagesPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeletePackage(id: string, name: string) {
    const confirmed = await confirm({
      title: "Delete Service Package",
      message: `Are you sure you want to delete the package "${name}"? This will permanently remove it from available packages.`,
      type: "danger",
      confirmText: "Delete Package",
      isDestructive: true,
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/services/packages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast(`Package "${name}" deleted successfully`, "info");
        setPackages((prev) => prev.filter((p) => p.id !== id));
        if (modalOpen && editingPkg?.id === id) {
          setModalOpen(false);
        }
      } else {
        alert({
          title: "Deletion Failed",
          message: data.message || "Failed to delete package.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "An error occurred while deleting the package.",
        type: "danger",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const [form, setForm] = useState({
    type: "RELATIONSHIP_MANAGER",
    name: "",
    price: 3999,
    billingCycle: "MONTHLY",
    durationDays: 30,
    durationHours: 1,
    durationMinutes: 0,
    sessionLimit: 4,
    callLimit: 8,
    chatLimit: 100,
    description: "",
    isActive: true,
  });

  async function fetchPackages() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/packages", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPackages();
  }, []);

  function openCreate() {
    setEditingPkg(null);
    setForm({
      type: "RELATIONSHIP_MANAGER",
      name: "",
      price: 3999,
      billingCycle: "MONTHLY",
      durationDays: 30,
      durationHours: 1,
      durationMinutes: 0,
      sessionLimit: 4,
      callLimit: 8,
      chatLimit: 100,
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  }

  function openEdit(pkg: any) {
    setEditingPkg(pkg);
    setForm({
      type: pkg.type,
      name: pkg.name,
      price: pkg.price,
      billingCycle: pkg.billingCycle || "MONTHLY",
      durationDays: pkg.durationDays || 30,
      durationHours: pkg.durationHours !== undefined && pkg.durationHours !== null ? pkg.durationHours : 1,
      durationMinutes: pkg.durationMinutes !== undefined && pkg.durationMinutes !== null ? pkg.durationMinutes : 0,
      sessionLimit: pkg.sessionLimit || 4,
      callLimit: pkg.callLimit || 8,
      chatLimit: pkg.chatLimit || 100,
      description: pkg.description || "",
      isActive: Boolean(pkg.isActive),
    });
    setModalOpen(true);
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingPkg ? `/api/admin/services/packages/${editingPkg.id}` : "/api/admin/services/packages";
      const method = editingPkg ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast(editingPkg ? "Package updated successfully" : "Package created successfully", "success");
        setModalOpen(false);
        fetchPackages();
      } else {
        alert({
          title: "Save Failed",
          message: data.message || "Failed to save package details.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "An error occurred while saving the package.",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            Service Monetization
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Service Packages & Tiers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure pricing, session allowances, call quotas, and billing frequencies for RM and Buddy services.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Package</span>
        </button>
      </div>

      {/* PACKAGES GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 animate-pulse text-xs">
          Loading service packages...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-6 rounded-3xl bg-white border border-rose-100 hover:border-rose-200 transition shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      pkg.type === "RELATIONSHIP_MANAGER"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : pkg.type === "DATING"
                        ? "bg-rose-50 text-[#7E2248] border-rose-200"
                        : pkg.type === "HOST"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {pkg.type === "RELATIONSHIP_MANAGER"
                        ? "Matchmaking"
                        : pkg.type === "DATING"
                        ? "Dating Package"
                        : pkg.type === "HOST"
                        ? "Host Subscription"
                        : "Breakup Buddy"}
                    </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${pkg.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>

                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">{pkg.name}</h3>
                  <div className="text-2xl font-serif font-black text-slate-900 mt-1">
                    ₹{pkg.price.toLocaleString("en-IN")}
                    <span className="text-xs text-slate-500 font-normal"> / {pkg.billingCycle?.toLowerCase().replace("_", " ")}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>

                <div className="pt-2 border-t border-rose-100 space-y-1 text-xs text-slate-700">
                  {pkg.type === "HOST" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Events Quota:</span>
                        <span className="font-bold text-amber-700">
                          {pkg.sessionLimit ? `${pkg.sessionLimit} Events` : "Unlimited Events"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Validity:</span>
                        <span className="font-bold text-slate-900">{pkg.durationDays || 30} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Billing:</span>
                        <span className="text-slate-700">{pkg.billingCycle || "MONTHLY"}</span>
                      </div>
                    </>
                  ) : pkg.type === "BREAKUP_BUDDY" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-bold text-[#7E2248]">
                          {(() => {
                            const parts = [];
                            if (pkg.durationHours > 0) parts.push(`${pkg.durationHours} ${pkg.durationHours === 1 ? "Hour" : "Hours"}`);
                            if (pkg.durationMinutes > 0) parts.push(`${pkg.durationMinutes} ${pkg.durationMinutes === 1 ? "Min" : "Mins"}`);
                            return parts.length > 0 ? parts.join(" ") : (pkg.durationHours ? `${pkg.durationHours} Hours` : "0 Mins");
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Call Quota:</span>
                        <span className="font-bold text-emerald-700">Unlimited</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chat Quota:</span>
                        <span className="font-bold text-emerald-700">Unlimited</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span>{pkg.durationDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sessions:</span>
                        <span className="font-bold text-slate-900">{pkg.sessionLimit} sessions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation Calls:</span>
                        <span>{pkg.callLimit} calls</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-rose-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                  disabled={deletingId === pkg.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 border border-rose-200 transition disabled:opacity-50"
                  title="Delete Package"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === pkg.id ? "Deleting..." : "Delete"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-slate-700 border border-rose-200 transition shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {editingPkg ? "Edit Package Plan" : "Create Service Plan"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Service Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                  >
                    <option value="HOST">Host Subscription</option>
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                    <option value="BREAKUP_BUDDY">Breakup Buddy</option>
                    <option value="DATING">Dating Package</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basic Host / Pro Host / Starter"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white placeholder-slate-400"
                  />
                </div>
              </div>

              {form.type === "HOST" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Events Quota</label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="0 for unlimited"
                        value={form.sessionLimit}
                        onChange={(e) => setForm({ ...form, sessionLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Validity (Days)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.durationDays}
                        onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Billing Cycle</label>
                    <select
                      value={form.billingCycle}
                      onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUAL">Annual / Yearly</option>
                      <option value="ONE_TIME">One-Time Pass</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2 font-medium">
                    <span>🎟️</span>
                    <span>Allows the host to publish up to <strong>{form.sessionLimit === 0 ? "Unlimited" : (form.sessionLimit || 5)} events</strong> over <strong>{form.durationDays || 30} days</strong>.</span>
                  </div>
                </div>
              ) : form.type === "BREAKUP_BUDDY" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Duration (Hours)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.durationHours}
                        onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={form.durationMinutes}
                        onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2 font-medium">
                    <span>✨</span>
                    <span>
                      During these <strong>{(() => {
                        const parts = [];
                        if (form.durationHours > 0) parts.push(`${form.durationHours} ${form.durationHours === 1 ? 'hour' : 'hours'}`);
                        if (form.durationMinutes > 0) parts.push(`${form.durationMinutes} ${form.durationMinutes === 1 ? 'minute' : 'minutes'}`);
                        return parts.length > 0 ? parts.join(" and ") : "0 minutes";
                      })()}</strong>, both <strong>Calls and Chats are 100% Unlimited</strong>.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Billing Cycle</label>
                      <select
                        value={form.billingCycle}
                        onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="PER_SESSION">Per Session</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Validity (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.durationDays}
                        onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Sessions Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.sessionLimit}
                        onChange={(e) => setForm({ ...form, sessionLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Call Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.callLimit}
                        onChange={(e) => setForm({ ...form, callLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Chat Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.chatLimit}
                        onChange={(e) => setForm({ ...form, chatLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-rose-100">
                {editingPkg ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(editingPkg.id, editingPkg.name)}
                    disabled={deletingId === editingPkg.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition disabled:opacity-50 text-xs border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === editingPkg.id ? "Deleting..." : "Delete Plan"}</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-slate-700 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-md shadow-[#7E2248]/20"
                  >
                    {saving ? "Saving..." : "Save Package"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
