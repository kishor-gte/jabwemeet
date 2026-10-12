"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Users,
  Wallet,
  CalendarCheck2,
  UtensilsCrossed,
  Sparkles,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Ticket,
  UserSquare2,
  Star,
  LineChart,
  Store,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function CafeDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const [statsRes, profileRes, ordersRes, resvRes, menuRes, reviewsRes] = await Promise.all([
        fetch("/api/cafe/stats", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/cafe/profile", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/cafe/orders", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/cafe/reservations", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/cafe/menu", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/cafe/reviews", { headers, credentials: "include" }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (profileRes?.success) setProfile(profileRes.data);
      if (ordersRes?.success && Array.isArray(ordersRes.data)) setOrders(ordersRes.data);
      if (resvRes?.success && Array.isArray(resvRes.data)) setReservations(resvRes.data);
      if (menuRes?.success && Array.isArray(menuRes.data)) setMenuItems(menuRes.data);
      if (reviewsRes?.success && Array.isArray(reviewsRes.data)) setReviews(reviewsRes.data);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/cafe/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const activeOrdersCount = orders.filter((o) => o.status !== "Completed" && o.status !== "Cancelled").length;
  const activeMenuCount = menuItems.length > 0 ? menuItems.length : (stats?.totalMenu ?? 0);
  const pendingReservationsCount = reservations.filter((r) => r.status === "Pending" || r.status === "Confirmed").length;
  const cafeDisplayName = profile?.cafeName || "Cafe Partner";

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 sm:p-8">
        <div className="h-44 bg-rose-50/60 border border-rose-100 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-rose-100 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-rose-100 rounded-3xl" />
          <div className="h-96 bg-white border border-rose-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 p-4 sm:p-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-rose-100 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-[#7E2248]">
              <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
              Cafe Operations Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
              {getGreeting()}, {cafeDisplayName}! ☕
            </h1>
            <p className="text-slate-600 max-w-xl text-sm leading-relaxed">
              Welcome to your live partner dashboard. Manage customer dining, live orders, table reservations, and menus in one place.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center text-xs font-semibold text-slate-600 bg-[#FAF3F6] border border-rose-200 px-4 py-2 rounded-full shadow-xs">
                <CalendarIcon className="w-3.5 h-3.5 mr-2 text-[#7E2248]" />
                {getFormattedDate()}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/cafe/orders"
              className="px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100/80 text-[#7E2248] border border-rose-200 text-xs font-bold transition shadow-xs flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Live Orders</span>
            </Link>
            <Link
              href="/cafe/menu"
              className="px-5 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold transition shadow-md shadow-[#7E2248]/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Menu</span>
            </Link>
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Active Menu Items"
          count={activeMenuCount}
          subtitle="Listed in cafe catalog"
          icon={UtensilsCrossed}
          color="bg-rose-50 text-[#7E2248] border border-rose-100"
          link="/cafe/menu"
        />
        <KpiCard
          title="Live Orders"
          count={activeOrdersCount || orders.length}
          subtitle="Active & today's orders"
          icon={ShoppingBag}
          color="bg-amber-50 text-amber-800 border border-amber-100"
          link="/cafe/orders"
        />
        <KpiCard
          title="Table Reservations"
          count={pendingReservationsCount || reservations.length}
          subtitle="Scheduled guest visits"
          icon={CalendarCheck2}
          color="bg-blue-50 text-blue-800 border border-blue-100"
          link="/cafe/reservations"
        />
        <KpiCard
          title="Estimated Revenue"
          count={stats?.monthlyRevenue?.value || "₹0"}
          subtitle="Current billing cycle"
          icon={Wallet}
          color="bg-emerald-50 text-emerald-800 border border-emerald-100"
          link="/cafe/payments"
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN: Orders, Reservations, Operations (col-span-2) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Orders Card */}
            <DashboardCard title="Live Orders" icon={ShoppingBag} link="/cafe/orders">
              {orders.length === 0 ? (
                <EmptyState message="No orders placed yet today." />
              ) : (
                <div className="divide-y divide-rose-100">
                  {orders.slice(0, 4).map((order: any) => (
                    <div
                      key={order.id}
                      className="py-3.5 flex items-center justify-between group hover:bg-rose-50/50 -mx-3 px-3 transition rounded-2xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#7E2248] font-bold text-xs shrink-0">
                          #{order.orderNumber || order.id?.slice(-4) || "ORD"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition truncate">
                            {order.customerName || "Walk-in Guest"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {order.items?.length
                              ? `${order.items.length} item(s) • ₹${order.total || 0}`
                              : `₹${order.total || 0}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={order.status || "New"} />
                        {order.status === "New" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "Preparing")}
                            disabled={updatingId === order.id}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                          >
                            Accept
                          </button>
                        )}
                        {order.status === "Preparing" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "Ready")}
                            disabled={updatingId === order.id}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer"
                          >
                            Ready
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>

            {/* Table Reservations Card */}
            <DashboardCard title="Table Reservations" icon={CalendarCheck2} link="/cafe/reservations">
              {reservations.length === 0 ? (
                <EmptyState message="No reservations booked yet." />
              ) : (
                <div className="divide-y divide-rose-100">
                  {reservations.slice(0, 4).map((resv: any) => (
                    <div
                      key={resv.id}
                      className="py-3.5 flex items-center justify-between group hover:bg-rose-50/50 -mx-3 px-3 transition rounded-2xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {resv.guests || 2}p
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition truncate">
                            {resv.guestName || resv.name || "Reserved Guest"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {resv.date || "Today"} • {resv.time || "Table Booking"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={resv.status || "Upcoming"} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Quick Operations Hub */}
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚡</span> Quick Operations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/cafe/menu">
                <QuickAction
                  icon={UtensilsCrossed}
                  label="Menu Catalog"
                  sub="Items & prices"
                  color="bg-rose-50 text-[#7E2248] border border-rose-100"
                />
              </Link>
              <Link href="/cafe/orders">
                <QuickAction
                  icon={ShoppingBag}
                  label="Order Queue"
                  sub="Live fulfillment"
                  color="bg-amber-50 text-amber-800 border border-amber-100"
                />
              </Link>
              <Link href="/cafe/reservations">
                <QuickAction
                  icon={CalendarCheck2}
                  label="Reservations"
                  sub="Table seating"
                  color="bg-blue-50 text-blue-800 border border-blue-100"
                />
              </Link>
              <Link href="/cafe/offers">
                <QuickAction
                  icon={Ticket}
                  label="Offers & Deals"
                  sub="Coupons & promos"
                  color="bg-emerald-50 text-emerald-800 border border-emerald-100"
                />
              </Link>
              <Link href="/cafe/staff">
                <QuickAction
                  icon={UserSquare2}
                  label="Staff Roster"
                  sub="Team & shifts"
                  color="bg-purple-50 text-purple-800 border border-purple-100"
                />
              </Link>
              <Link href="/cafe/customers">
                <QuickAction
                  icon={Users}
                  label="Customers"
                  sub="Loyal visitors"
                  color="bg-rose-50 text-[#7E2248] border border-rose-100"
                />
              </Link>
              <Link href="/cafe/reviews">
                <QuickAction
                  icon={Star}
                  label="Guest Reviews"
                  sub="Ratings & comments"
                  color="bg-amber-50 text-amber-800 border border-amber-100"
                />
              </Link>
              <Link href="/cafe/payments">
                <QuickAction
                  icon={Wallet}
                  label="Settlements"
                  sub="Payouts & ledger"
                  color="bg-emerald-50 text-emerald-800 border border-emerald-100"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Outlet Status, Popular Items, Reviews (col-span-1) */}
        <div className="space-y-6 md:space-y-8">
          {/* Cafe Outlet Status Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 md:p-7 space-y-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#7E2248]" />
                <h2 className="text-base font-serif font-bold text-slate-900">Outlet Profile</h2>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Open & Serving
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF3F6] border border-rose-100 space-y-2">
              <p className="text-sm font-bold text-slate-900">{profile?.cafeName || "JabWeMeet Partner Cafe"}</p>
              {profile?.city && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                  <span>{profile.city}</span>
                </p>
              )}
              {profile?.phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                  <span>{profile.phone}</span>
                </p>
              )}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-rose-200/50">
                <span>Timings:</span>
                <span className="font-semibold text-slate-800">
                  {profile?.openingTime || "09:00 AM"} — {profile?.closingTime || "11:00 PM"}
                </span>
              </div>
            </div>

            <Link
              href="/cafe/profile"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-[#7E2248] border border-rose-200 text-xs font-bold transition shadow-xs"
            >
              Update Outlet Profile <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Popular Menu Preview */}
          <DashboardCard title="Popular Menu Items" icon={UtensilsCrossed} link="/cafe/menu">
            {menuItems.length === 0 ? (
              <EmptyState message="No menu items listed yet." />
            ) : (
              <div className="divide-y divide-rose-100">
                {menuItems.slice(0, 4).map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.category || "Beverage"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#7E2248]">₹{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Guest Reviews Preview */}
          <DashboardCard title="Recent Guest Reviews" icon={Star} link="/cafe/reviews">
            {reviews.length === 0 ? (
              <EmptyState message="No guest reviews received yet." />
            ) : (
              <div className="divide-y divide-rose-100">
                {reviews.slice(0, 3).map((rev: any) => (
                  <div key={rev.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{rev.customerName || "Guest"}</p>
                      <div className="flex items-center text-amber-500 text-xs">
                        {"★".repeat(rev.rating || 5)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{rev.comment || "Great ambiance and experience!"}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Singles Event Collaboration Card */}
          <div className="bg-gradient-to-br from-rose-50 via-white to-[#FAF3F6] border border-rose-200 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#7E2248]">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-serif font-bold text-sm text-slate-900">Partner Perk: JabWeMeet Meetups</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your cafe is featured as a certified dating & meetup spot. Keep table availability open on weekends for high-intent couples.
            </p>
            <Link
              href="/cafe/reservations"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E2248] hover:underline"
            >
              View Reserved Tables <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function KpiCard({ title, count, subtitle, icon: Icon, color, link }: any) {
  const content = (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex items-center justify-between group">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{title}</p>
        <p className="text-3xl font-serif font-bold text-slate-900 mb-1 group-hover:text-[#7E2248] transition">
          {count}
        </p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-xs shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}

function DashboardCard({ title, icon: Icon, link, children }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 md:p-7 flex flex-col hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#7E2248]" />
          {title}
        </h2>
        {link && (
          <Link
            href={link}
            className="text-xs font-bold text-[#7E2248] hover:text-[#681938] flex items-center gap-1 transition"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, color }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${color} group-hover:scale-105 transition shadow-xs`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#7E2248] transition">{label}</p>
      <p className="text-[11px] text-slate-500 leading-tight">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case "ready":
      case "completed":
      case "active":
      case "confirmed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "preparing":
      case "in progress":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "new":
      case "pending":
      case "upcoming":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "cancelled":
      case "rejected":
        return "bg-rose-50 text-[#7E2248] border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getStyles()}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-3 text-[#7E2248]">
        <UtensilsCrossed className="w-5 h-5" />
      </div>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

