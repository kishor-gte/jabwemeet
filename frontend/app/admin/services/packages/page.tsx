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

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeletePackage(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete the package "${name}"? This will permanently remove it from available packages.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/services/packages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        if (modalOpen && editingPkg?.id === id) {
          setModalOpen(false);
        }
      } else {
        alert(data.message || "Failed to delete package");
      }
    } catch (e) {
      alert("Error deleting package");
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
      durationHours: pkg.durationHours || 1,
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
        setModalOpen(false);
        fetchPackages();
      } else {
        alert(data.message || "Failed to save package");
      }
    } catch (e) {
      alert("Error saving package");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            Service Monetization
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Service Packages & Tiers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure pricing, session allowances, call quotas, and billing frequencies for RM and Buddy services.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
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
              className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 hover:border-white/20 transition shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pkg.type === "RELATIONSHIP_MANAGER"
                        ? "bg-purple-500/20 text-purple-300"
                        : pkg.type === "DATING"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {pkg.type === "RELATIONSHIP_MANAGER" ? "Matchmaking" : pkg.type === "DATING" ? "Dating Package" : "Breakup Buddy"}
                    </span>
                  <span className={`w-2 h-2 rounded-full ${pkg.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ₹{pkg.price.toLocaleString("en-IN")}
                    <span className="text-xs text-slate-400 font-normal"> / {pkg.billingCycle?.toLowerCase().replace("_", " ")}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{pkg.description}</p>

                <div className="pt-2 border-t border-white/5 space-y-1 text-xs text-slate-300">
                  {pkg.type === "BREAKUP_BUDDY" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Duration:</span>
                        <span className="font-bold text-indigo-400">{pkg.durationHours || 1} {pkg.durationHours === 1 ? "Hour" : "Hours"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Call Quota:</span>
                        <span className="font-bold text-emerald-400">Unlimited</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chat Quota:</span>
                        <span className="font-bold text-emerald-400">Unlimited</span>
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
                        <span className="font-bold text-white">{pkg.sessionLimit} sessions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consultation Calls:</span>
                        <span>{pkg.callLimit} calls</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                  disabled={deletingId === pkg.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 hover:text-red-300 transition disabled:opacity-50"
                  title="Delete Package"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === pkg.id ? "Deleting..." : "Delete"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition"
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPkg ? "Edit Package Plan" : "Create Service Plan"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                    <option value="BREAKUP_BUDDY">Breakup Buddy</option>
                    <option value="DATING">Dating Package</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Hour Pass / 24 Hours Pass"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>
              </div>

              {form.type === "BREAKUP_BUDDY" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Duration (Hours)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={form.durationHours || 1}
                        onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2 font-medium">
                    <span>✨</span>
                    <span>During these <strong>{form.durationHours || 1} hours</strong>, both <strong>Calls and Chats are 100% Unlimited</strong>.</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Billing Cycle</label>
                      <select
                        value={form.billingCycle}
                        onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="PER_SESSION">Per Session</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.durationDays}
                        onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Sessions Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.sessionLimit}
                        onChange={(e) => setForm({ ...form, sessionLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Call Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.callLimit}
                        onChange={(e) => setForm({ ...form, callLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Chat Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={form.chatLimit}
                        onChange={(e) => setForm({ ...form, chatLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                {editingPkg ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePackage(editingPkg.id, editingPkg.name)}
                    disabled={deletingId === editingPkg.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold transition disabled:opacity-50 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === editingPkg.id ? "Deleting..." : "Delete Plan"}</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50"
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
