"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  CreditCard,
  HeartHandshake,
  Heart,
  ShieldAlert,
  LifeBuoy,
  FileCheck,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Bell,
  Sparkles,
  Ticket,
  DollarSign,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  X,
  RefreshCw,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminOverviewPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [range, setRange] = useState<string>("30d");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: "",
    category: "Singles Events",
    city: "Mumbai",
    location: "",
    date: "",
    price: 1200,
    maxAttendees: 40,
    description: "",
  });

  const [packageForm, setPackageForm] = useState({
    type: "RELATIONSHIP_MANAGER",
    name: "",
    price: 3999,
    billingCycle: "MONTHLY",
    durationDays: 30,
    sessionLimit: 4,
    description: "",
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountAmount: 20,
    applicableService: "ALL",
    minOrderAmount: 500,
    maxUses: 100,
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    targetAudience: "All Users",
  });

  async function fetchOverview() {
    try {
      setRefreshing(true);
      const [ovRes, anRes] = await Promise.all([
        fetch("/api/admin/overview", { credentials: "include" }),
        fetch(`/api/admin/analytics?range=${range}`, { credentials: "include" }),
      ]);
      const ovData = await ovRes.json();
      const anData = await anRes.json();

      if (ovData.success) {
        setStats(ovData.stats);
        setAlerts(ovData.alerts || []);
      }
      if (anData.success) {
        setAnalytics(anData.data);
      }
    } catch (e) {
      console.error("Failed to load admin overview", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, [range]);

  // Handle Event Creation
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventForm),
      });
      const data = await res.json();
      if (data.success) {
        toast("Event published successfully to catalog!", "success");
        setActionSuccess("Event published successfully to catalog!");
        setActiveModal(null);
        fetchOverview();
      } else {
        alert({
          title: "Failed to Create Event",
          message: data.message || "Please check the event details and try again.",
          type: "danger",
        });
      }
    } catch (err) {
      alert({
        title: "Server Error",
        message: "An unexpected error occurred while creating the event.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  // Handle Package Creation
  async function handleCreatePackage(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/admin/services/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(packageForm),
      });
      const data = await res.json();
      if (data.success) {
        toast("Service package created successfully!", "success");
        setActionSuccess("Service package created successfully!");
        setActiveModal(null);
        fetchOverview();
      } else {
        alert({
          title: "Package Creation Failed",
          message: data.message || "Failed to create service package.",
          type: "danger",
        });
      }
    } catch (err) {
      alert({
        title: "Server Error",
        message: "An error occurred while creating the service package.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  // Handle Coupon Creation
  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(couponForm),
      });
      const data = await res.json();
      if (data.success) {
        toast("Discount coupon code generated!", "success");
        setActionSuccess("Discount coupon code generated!");
        setActiveModal(null);
        fetchOverview();
      } else {
        alert({
          title: "Coupon Creation Failed",
          message: data.message || "Failed to create coupon code.",
          type: "danger",
        });
      }
    } catch (err) {
      alert({
        title: "Server Error",
        message: "An error occurred while creating the coupon.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  // Handle Announcement
  async function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    const confirmed = await confirm({
      title: "Broadcast Announcement",
      message: `Are you sure you want to broadcast this announcement to ${announcementForm.targetAudience.replace("_", " ")}?`,
      type: "confirm",
      confirmText: "Broadcast Now",
    });
    if (!confirmed) return;

    setModalLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(announcementForm),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || "Announcement broadcasted successfully!", "success");
        setActionSuccess(data.message);
        setActiveModal(null);
        fetchOverview();
      } else {
        alert({
          title: "Broadcast Failed",
          message: data.message || "Could not broadcast announcement.",
          type: "danger",
        });
      }
    } catch (err) {
      alert({
        title: "Server Error",
        message: "An error occurred while sending the announcement broadcast.",
        type: "danger",
      });
    } finally {
      setModalLoading(false);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-rose-100/40 rounded-3xl border border-rose-100" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-white border border-rose-100 rounded-3xl shadow-xs" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER & TOP BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Platform Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            JabWeMeet Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Real People. Real Places. Real Connections. Monitor live registrations, matchmaker pipelines, breakup buddy circles, and transactions.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => fetchOverview()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-slate-700 hover:text-[#7E2248] transition active:scale-95 disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#7E2248]" : "text-slate-500"}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white border border-rose-100 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">
          Quick Actions
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveModal("event")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-sm shadow-[#7E2248]/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>

          <a
            href="/admin/relationship-managers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 text-slate-700 hover:text-[#7E2248] text-xs font-bold transition"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Manage RMs</span>
          </a>

          <a
            href="/admin/breakup-buddies"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 text-slate-700 hover:text-[#7E2248] text-xs font-bold transition"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Manage Buddies</span>
          </a>

          <button
            onClick={() => setActiveModal("package")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 text-slate-700 hover:text-[#7E2248] text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Create Package</span>
          </button>

          <button
            onClick={() => setActiveModal("coupon")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 text-slate-700 hover:text-[#7E2248] text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Create Coupon</span>
          </button>

          <button
            onClick={() => setActiveModal("announcement")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 text-slate-700 hover:text-[#7E2248] text-xs font-bold transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Send Announcement</span>
          </button>
        </div>
      </div>

      {/* ALERT CENTER */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Admin Alert Center</span>
            </h3>
            <span className="text-xs text-slate-400">Direct navigation to active queues</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((a) => (
              <a
                key={a.id}
                href={a.link}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-100 hover:border-rose-200 transition-all flex items-center justify-between group shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    a.count > 0 ? "bg-rose-100 text-[#7E2248] border border-rose-200" : "bg-slate-100 text-slate-500"
                  }`}>
                    {a.count}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#7E2248] transition">
                      {a.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">{a.badge}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#7E2248] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* REAL DATABASE KPI CARDS */}
      <div className="space-y-3">
        <h3 className="text-sm font-serif font-bold text-slate-900">Platform Key Performance Indicators</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Total Users</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.totalUsers || 0}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span>{stats?.activeUsers || 0} Active accounts</span>
            </div>
          </div>

          {/* Verified Users */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Verified Members</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.verifiedUsers || 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              ID & Profile verified
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Upcoming Events</span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.upcomingEvents || 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active on public schedule</div>
          </div>

          {/* Today's Registrations */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Today&apos;s Passes</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.todayRegistrations || 0}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">Real-time venue bookings</div>
          </div>

          {/* Total Revenue */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Total Revenue</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-700">
              ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">All processed transactions</div>
          </div>

          {/* Monthly Revenue */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Monthly Run-Rate</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
              ₹{(stats?.monthlyRevenue || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Current calendar month</div>
          </div>

          {/* RM Subscribers */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">RM Clients</span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-[#7E2248] flex items-center justify-center border border-rose-100">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.rmSubscribers || 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Assigned to Matchmakers</div>
          </div>

          {/* Open Support Tickets */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Support Cases</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-slate-900">{stats?.openSupportTickets || 0}</div>
            <div className="text-[11px] text-slate-400 mt-1">Awaiting staff response</div>
          </div>
        </div>
      </div>

      {/* CHARTS & ANALYTICS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7E2248]" />
            <span>Platform Analytics & Trends</span>
          </h3>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-rose-200 self-start sm:self-auto shadow-2xs">
            {["7d", "30d", "90d", "1y"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                  range === r ? "bg-[#7E2248] text-white shadow-xs" : "text-slate-500 hover:text-[#7E2248]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Category Breakdown */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">
              Revenue by Product Stream ({range.toUpperCase()})
            </h4>
            <div className="space-y-3 pt-2">
              {analytics?.revenueByCategory?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">No transaction records in this timeframe.</p>
              ) : (
                analytics?.revenueByCategory?.map((item: any) => (
                  <div key={item.type} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{item.type.replace("_", " ")}</span>
                      <span className="text-emerald-700 font-bold">₹{item.total.toLocaleString("en-IN")} ({item.transactions} orders)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-rose-50 border border-rose-100/60 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7E2248] via-rose-500 to-[#7E2248] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(15, (item.total / (stats?.totalRevenue || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Cities Distribution */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">
              Geographical Distribution (Top Cities)
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {analytics?.cityDistribution?.map((c: any) => (
                <div key={c.city} className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#7E2248] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 capitalize">{c.city}</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#7E2248] px-2.5 py-0.5 rounded-full bg-white border border-rose-200">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {activeModal === "event" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div
            className="relative w-full max-w-xl bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">Create New Real-World Event</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rooftop Singles Mixer & Cocktails"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition cursor-pointer"
                  >
                    <option value="Singles Events">Singles Mixer</option>
                    <option value="Speed Dating">Speed Dating</option>
                    <option value="Blind Dates">Blind Date</option>
                    <option value="Dance Dates">Dance Date</option>
                    <option value="Singles Travel">Singles Travel</option>
                    <option value="Breakup Community">Breakup Community</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Bangalore"
                    value={eventForm.city}
                    onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sky Lounge, Indiranagar"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ticket Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({ ...eventForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Capacity</label>
                  <input
                    type="number"
                    min="5"
                    value={eventForm.maxAttendees}
                    onChange={(e) => setEventForm({ ...eventForm, maxAttendees: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed breakdown of the experience, dress code, icebreakers..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-sm shadow-[#7E2248]/20 cursor-pointer"
                >
                  {modalLoading ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {activeModal === "package" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">Create Service Package</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Type</label>
                  <select
                    value={packageForm.type}
                    onChange={(e) => setPackageForm({ ...packageForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition cursor-pointer"
                  >
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                    <option value="BREAKUP_BUDDY">Breakup Buddy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Harmony Circle"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billing Cycle</label>
                  <select
                    value={packageForm.billingCycle}
                    onChange={(e) => setPackageForm({ ...packageForm, billingCycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition cursor-pointer"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="PER_SESSION">Per Session</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-sm shadow-[#7E2248]/20 cursor-pointer"
                >
                  {modalLoading ? "Creating..." : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {activeModal === "coupon" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">Create Promotional Coupon</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMERLOVE25"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 uppercase font-mono focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Amount</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={couponForm.discountAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, discountAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-sm shadow-[#7E2248]/20 cursor-pointer"
                >
                  {modalLoading ? "Saving..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND ANNOUNCEMENT MODAL */}
      {activeModal === "announcement" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">Broadcast Platform Announcement</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                <select
                  value={announcementForm.targetAudience}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition cursor-pointer"
                >
                  <option value="All Users">All Verified Users</option>
                  <option value="Event Attendees">Upcoming Event Attendees</option>
                  <option value="RM Subscribers">Relationship Manager Subscribers</option>
                  <option value="Buddy Subscribers">Breakup Buddy Community</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Singles Mixers Announced for Bangalore & Mumbai!"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Compose notification text..."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-sm shadow-[#7E2248]/20 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{modalLoading ? "Broadcasting..." : "Send Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
