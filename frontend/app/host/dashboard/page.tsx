"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  X,
  Search,
  Check,
  Ban,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserCheck,
  Menu,
  Sparkles,
  ArrowLeftRight,
  LogOut,
  RefreshCw,
  Mail,
  Phone,
  Edit,
  Trash,
} from "lucide-react";

type Booking = {
  id: string;
  eventId: string;
  userId: string;
  status: "CONFIRMED" | "CHECKED_IN" | "CANCELLED";
  spots: number;
  totalAmount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    profilePhoto?: string;
  };
  event: {
    id: string;
    title: string;
    category: string;
    date: string;
    endDate?: string;
    location: string;
    city: string;
    price: number;
    maxAttendees: number;
  };
};

type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  date: string;
  endDate?: string;
  price: number;
  maxAttendees: number;
  ageRange?: string;
  itinerary?: string;
  bookings?: Booking[];
};

type HostStats = {
  totalEvents: number;
  totalAttendees: number;
  checkedInCount: number;
  totalRevenue: number;
};

const CATEGORIES = [
  "Single events",
  "Speed dating",
  "Dance Dating",
  "Singles Travels",
];

export default function HostDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<HostStats>({
    totalEvents: 0,
    totalAttendees: 0,
    checkedInCount: 0,
    totalRevenue: 0,
  });
  const [activeSection, setActiveSection] = useState<"overview" | "events" | "attendees" | "analytics" | "profile" | "subscriptions">("overview");
  const [subStatus, setSubStatus] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form state for creating event
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Single events",
    location: "",
    city: "",
    date: "",
    endDate: "",
    price: 0,
    maxAttendees: 50,
    ageRange: "",
    itinerary: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          router.replace("/login");
        } else if (d.user.role !== "HOST" && d.user.role !== "ADMIN" && d.user.role !== "EVENT_MANAGER") {
          router.replace("/dashboard");
        } else {
          setUser(d.user);
          loadHostData();
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const loadHostData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes, subRes] = await Promise.all([
        fetch("/api/events/host/stats", { credentials: "include" }),
        fetch("/api/events/host/bookings", { credentials: "include" }),
        fetch("/api/subscription/status", { credentials: "include" }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
          setEvents(statsData.events || []);
        }
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.success) {
          setBookings(bookingsData.bookings || []);
        }
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.success) {
          setSubStatus(subData.data);
        }
      }
    } catch (e) {
      console.error("Error loading host data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: "CONFIRMED" | "CHECKED_IN" | "CANCELLED") => {
    try {
      setUpdatingBookingId(bookingId);
      const res = await fetch(`/api/events/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        // Update local state immediately
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
        // Refresh full metrics in the background
        fetch("/api/events/host/stats", { credentials: "include" })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              setStats(d.stats);
              setEvents(d.events || []);
            }
          });

        showToast(
          newStatus === "CHECKED_IN"
            ? "Attendee checked in successfully! 🎉"
            : newStatus === "CANCELLED"
            ? "Reservation marked as cancelled."
            : "Reservation status restored to confirmed."
        );
      } else {
        alert(data.message || "Failed to update attendee status");
      }
    } catch (err) {
      alert("Error updating status");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleBuyPlan = async (plan: string) => {
    const res = await loadRazorpay();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
        credentials: "include",
      });
      const data = await orderRes.json();

      if (!data.success) {
        alert(data.message || "Failed to create order");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "JabWeMeet",
        description: `Upgrade to ${plan} Plan`,
        order_id: data.order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/subscription/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            }),
            credentials: "include",
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            showToast(`Successfully upgraded to ${plan} plan! 🎉`);
            loadHostData();
          } else {
            alert(verifyData.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#e06d53",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEventId ? `/api/events/${editingEventId}` : "/api/events";
      const method = editingEventId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        showToast(`Event "${formData.title}" ${editingEventId ? "updated" : "published"} successfully! 🚀`);
        loadHostData();
        setEditingEventId(null);
        setFormData({
          title: "",
          description: "",
          category: "Single events",
          location: "",
          city: "",
          date: "",
          endDate: "",
          price: 0,
          maxAttendees: 50,
          ageRange: "",
          itinerary: "",
        });
      } else if (res.status === 403) {
        // Subscription limit reached – redirect to upgrade page
        setShowCreateModal(false);
        setActiveSection("subscriptions");
        showToast("⚠️ Event limit reached! Please upgrade your plan to create more events.");
      } else {
        showToast(data.message || `Failed to ${editingEventId ? "update" : "create"} event`);
      }
    } catch (error) {
      showToast(`Error ${editingEventId ? "updating" : "creating"} event. Please try again.`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Event deleted successfully!");
        loadHostData();
      } else {
        showToast(data.message || "Failed to delete event");
      }
    } catch (error) {
      showToast("Error deleting event. Please try again.");
    }
  };

  const openEditModal = (evt: Event) => {
    setEditingEventId(evt.id);
    setFormData({
      title: evt.title,
      description: evt.description,
      category: evt.category,
      location: evt.location,
      city: evt.city,
      date: new Date(evt.date).toISOString().slice(0, 16),
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : "",
      price: evt.price || 0,
      maxAttendees: evt.maxAttendees || 50,
      ageRange: evt.ageRange || "",
      itinerary: evt.itinerary || "",
    });
    setShowCreateModal(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
  };

  const filteredEvents = events.filter((e) =>
    selectedCategory === "All" ? true : e.category === selectedCategory
  );

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "All" ? true : b.status === statusFilter;
    const matchesSearch =
      b.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#0b111e] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#e06d53]/30 border-t-[#e06d53] animate-spin" />
        <p className="text-slate-400 font-medium">Loading Host Manager Portal...</p>
      </div>
    );
  }

  // Sidebar content markup
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d1526] text-slate-200 border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-[#e06d53]/25 group-hover:scale-105 transition">
            J
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Jab<span className="text-[#e06d53]">We</span>Meet
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#e06d53]">
              Host & Event Manager
            </div>
          </div>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {/* MAIN NAVIGATION */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Event Management
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveSection("overview");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "overview"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    activeSection === "overview" ? "text-[#e06d53]" : "text-slate-400"
                  }`}
                />
                <span>Dashboard Overview</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>

            <button
              onClick={() => {
                setActiveSection("events");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "events"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>My Hosted Events</span>
              </div>
              {stats.totalEvents > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {stats.totalEvents}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("attendees");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "attendees"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Attendees & RSVPs</span>
              </div>
              {bookings.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30">
                  {bookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("analytics");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "analytics"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Sales & Revenue</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                ${stats.totalRevenue}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("subscriptions");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeSection === "subscriptions"
                  ? "bg-[#e06d53]/15 text-[#fca5a5] border border-[#e06d53]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>Subscription & Plans</span>
              </div>
              {subStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  subStatus.currentPlan === 'STARTER' ? 'bg-white/10 text-slate-300' :
                  subStatus.currentPlan === 'BASIC' ? 'bg-blue-500/20 text-blue-300' :
                  subStatus.currentPlan === 'PRO' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-purple-500/20 text-purple-300'
                }`}>
                  {subStatus.currentPlan}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Actions</span>
            <Sparkles className="w-3.5 h-3.5 text-[#e06d53]" />
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                if (subStatus && !subStatus.canCreateEvent) {
                  setActiveSection("subscriptions");
                  showToast("Please upgrade your plan to create more events.");
                } else {
                  setShowCreateModal(true);
                }
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#c95940] hover:to-[#b04b34] transition shadow-md shadow-[#e06d53]/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Event</span>
            </button>
          </div>
        </div>

        {/* ACCOUNT & SWITCH */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-400" />
              <span>Switch to Member View</span>
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 transition border border-red-500/20"
              >
                <CheckCircle2 className="w-4 h-4 text-red-400" />
                <span>Admin Console</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-white/10 bg-[#0a101d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e06d53]/20 border border-[#e06d53]/40 text-[#e06d53] font-extrabold flex items-center justify-center text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "HM"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131d2e] border border-[#e06d53]/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e06d53] animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0d1526] border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-extrabold text-lg text-white">
            Jab<span className="text-[#e06d53]">We</span>Meet Host
          </div>
        </div>
        <button
          onClick={() => {
            if (subStatus && !subStatus.canCreateEvent) {
              setActiveSection("subscriptions");
              showToast("⚠️ Event limit reached! Please upgrade your plan to create more events.");
            } else {
              setShowCreateModal(true);
            }
          }}
          className="bg-[#e06d53] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          Create
        </button>
      </div>

      <div className="flex flex-1">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 shadow-2xl z-20">
          {sidebarContent}
        </aside>

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] h-full z-10 animate-slide-right">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Dashboard Area */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Banner */}
          <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#e06d53]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e06d53]/15 border border-[#e06d53]/30 text-xs font-bold text-[#fca5a5]">
                <Sparkles className="w-3.5 h-3.5 text-[#e06d53]" />
                Event Host Operations Hub
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Welcome back, {user?.name || "Host"}!
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Manage your speed dating mixers, dance dating nights, single travels, and live guest check-ins with real-time sync.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <button
                onClick={loadHostData}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#c95940] hover:to-[#b04b34] px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition shadow-lg shadow-[#e06d53]/25"
              >
                <Plus className="w-4 h-4" />
                Create New Event
              </button>
            </div>
          </div>

          {/* Key Metrics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:border-[#e06d53]/30 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Events</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{stats.totalEvents}</span>
                <span className="text-xs text-slate-400">active & past</span>
              </div>
            </div>

            <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:border-[#e06d53]/30 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total RSVPs</span>
                <div className="w-9 h-9 rounded-xl bg-[#e06d53]/15 text-[#e06d53] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#fca5a5]">{stats.totalAttendees}</span>
                <span className="text-xs text-slate-400">confirmed spots</span>
              </div>
            </div>

            <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:border-[#e06d53]/30 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Checked In</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">{stats.checkedInCount}</span>
                <span className="text-xs text-slate-400">
                  {stats.totalAttendees > 0
                    ? `(${Math.round((stats.checkedInCount / stats.totalAttendees) * 100)}% attendance)`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 relative overflow-hidden hover:border-[#e06d53]/30 transition group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-300">${stats.totalRevenue}</span>
                <span className="text-xs text-emerald-400">verified sales</span>
              </div>
            </div>
          </div>

          {/* Section: Overview or Specific Tabs */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              {/* Hosted Events Header + Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#e06d53]" />
                    Your Event Portfolio
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Filter by experience category</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? "bg-[#e06d53] text-white shadow-md shadow-[#e06d53]/25"
                          : "bg-[#131d2e] text-slate-300 hover:text-white border border-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length === 0 ? (
                  <div className="col-span-full bg-[#131d2e] rounded-3xl p-12 text-center border border-white/10 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#e06d53]/15 text-[#e06d53] flex items-center justify-center text-3xl mx-auto">
                      🎉
                    </div>
                    <h3 className="text-xl font-bold text-white">No Events in this Category</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">
                      Create an event under "{selectedCategory}" to start accepting attendee registrations.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-[#e06d53] hover:bg-[#c95940] px-6 py-2.5 rounded-full font-bold text-sm text-white inline-flex items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Create Event Now
                    </button>
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const eventBookings = bookings.filter((b) => b.eventId === evt.id);
                    const activeCount = eventBookings.filter((b) => b.status !== "CANCELLED").reduce((acc, b) => acc + (b.spots || 1), 0);
                    const checkedIn = eventBookings.filter((b) => b.status === "CHECKED_IN").length;

                    return (
                      <div
                        key={evt.id}
                        className="bg-[#131d2e] rounded-3xl p-6 border border-white/10 hover:border-[#e06d53]/40 transition flex flex-col justify-between group shadow-lg"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-[#23324c] rounded-full text-xs font-semibold text-[#fca5a5] border border-[#e06d53]/20">
                              {evt.category}
                            </span>
                            <span className="text-sm font-extrabold text-amber-300">
                              {evt.price > 0 ? `$${evt.price}` : "Free Pass"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-[#fca5a5] transition line-clamp-1">
                              {evt.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{evt.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 text-xs text-slate-300 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                              <span>{new Date(evt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="truncate">{evt.location}, {evt.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-500 shrink-0" />
                              <span>
                                <strong>{activeCount}</strong> / {evt.maxAttendees} spots booked ({checkedIn} checked-in)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                          <div className="w-full bg-[#0b111e] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#e06d53] to-emerald-400 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (activeCount / (evt.maxAttendees || 50)) * 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setSelectedEventForModal(evt)}
                              className="text-xs font-bold text-[#fca5a5] hover:text-white flex items-center gap-1.5 transition"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Manage Attendees ({activeCount})
                            </button>
                            <span className="text-[11px] text-slate-400">
                              {Math.max(0, (evt.maxAttendees || 50) - activeCount)} left
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Real-Time Live Attendees Table */}
              <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      Live Attendee Roster & RSVPs
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check in guests at the venue door in real-time or manage spot statuses.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search attendee or event..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0b111e] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#e06d53]"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#0b111e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e06d53]"
                    >
                      <option value="All">All Statuses</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No reservations matching current search or filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0b111e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 rounded-l-xl">Attendee</th>
                          <th className="px-4 py-3">Event Title</th>
                          <th className="px-4 py-3">Spots / Amount</th>
                          <th className="px-4 py-3">Booking Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right rounded-r-xl">Venue Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#e06d53] to-amber-500 text-white font-bold flex items-center justify-center text-xs">
                                  {b.user.name ? b.user.name.slice(0, 2).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{b.user.name}</div>
                                  <div className="text-slate-400 flex items-center gap-2">
                                    <span>{b.user.email}</span>
                                    {b.user.phone && <span>• {b.user.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-white">{b.event.title}</div>
                              <div className="text-slate-400 text-[11px]">{b.event.category} • {b.event.city}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-white">{b.spots} spot(s)</div>
                              <div className="text-amber-400 text-[11px]">${b.totalAmount}</div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-400">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  b.status === "CHECKED_IN"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : b.status === "CONFIRMED"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                                }`}
                              >
                                {b.status === "CHECKED_IN" && <Check className="w-3 h-3" />}
                                {b.status === "CONFIRMED" && <Clock className="w-3 h-3" />}
                                {b.status === "CANCELLED" && <Ban className="w-3 h-3" />}
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {b.status !== "CHECKED_IN" && (
                                  <button
                                    disabled={updatingBookingId === b.id}
                                    onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow disabled:opacity-50"
                                  >
                                    <Check className="w-3 h-3" />
                                    Check In
                                  </button>
                                )}
                                {b.status === "CHECKED_IN" && (
                                  <button
                                    disabled={updatingBookingId === b.id}
                                    onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs transition disabled:opacity-50"
                                  >
                                    Revert
                                  </button>
                                )}
                                {b.status !== "CANCELLED" && (
                                  <button
                                    disabled={updatingBookingId === b.id}
                                    onClick={() => handleStatusChange(b.id, "CANCELLED")}
                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition disabled:opacity-50"
                                    title="Cancel Reservation"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Events Tab */}
          {activeSection === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">All Hosted Events</h2>
                  <p className="text-xs text-slate-400">Review attendance and event configurations</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#e06d53] hover:bg-[#c95940] px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => {
                  const eventBookings = bookings.filter((b) => b.eventId === evt.id);
                  const activeCount = eventBookings.filter((b) => b.status !== "CANCELLED").reduce((acc, b) => acc + (b.spots || 1), 0);
                  const checkedIn = eventBookings.filter((b) => b.status === "CHECKED_IN").length;

                  return (
                    <div key={evt.id} className="bg-[#131d2e] rounded-3xl p-6 border border-white/10 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-[#23324c] rounded-full text-xs font-semibold text-[#fca5a5]">
                          {evt.category}
                        </span>
                        <span className="font-bold text-amber-300 text-sm">
                          {evt.price > 0 ? `$${evt.price}` : "Free"}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white">{evt.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
                      <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{evt.location}, {evt.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(evt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={() => setSelectedEventForModal(evt)}
                          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#fca5a5] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Manage Roster ({activeCount} booked / {checkedIn} checked in)
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="flex-1 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                          >
                            <Trash className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Attendees Tab */}
          {activeSection === "attendees" && (
            <div className="space-y-6">
              <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">All Event Guests & RSVPs</h2>
                    <p className="text-xs text-slate-400">Manage all registered spots across all your hosted events</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0b111e] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#0b111e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="All">All</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#0b111e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3">Attendee</th>
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Spots</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white">{b.user.name}</div>
                            <div className="text-slate-400 text-[11px]">{b.user.email} • {b.user.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{b.event.title}</div>
                            <div className="text-slate-400 text-[11px]">{b.event.city}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">{b.spots}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === "CHECKED_IN"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : b.status === "CONFIRMED"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.status !== "CHECKED_IN" ? (
                              <button
                                onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs"
                              >
                                Revert
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Analytics Tab */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-8 space-y-6">
                <h2 className="text-xl font-bold text-white">Event Performance & Revenue</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#0b111e] p-6 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Gross Ticket Sales</span>
                    <p className="text-3xl font-extrabold text-amber-300">${stats.totalRevenue}</p>
                    <p className="text-xs text-slate-500">From {stats.totalAttendees} confirmed spots</p>
                  </div>
                  <div className="bg-[#0b111e] p-6 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Average Attendance</span>
                    <p className="text-3xl font-extrabold text-emerald-400">
                      {stats.totalEvents > 0 ? (stats.totalAttendees / stats.totalEvents).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-slate-500">Guests per event</p>
                  </div>
                  <div className="bg-[#0b111e] p-6 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Checked-In Rate</span>
                    <p className="text-3xl font-extrabold text-blue-400">
                      {stats.totalAttendees > 0
                        ? `${Math.round((stats.checkedInCount / stats.totalAttendees) * 100)}%`
                        : "0%"}
                    </p>
                    <p className="text-xs text-slate-500">On-site attendance rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Subscriptions */}
          {activeSection === "subscriptions" && (
            <div className="space-y-6">
              <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> Host Subscriptions & Plans</h2>
                  <p className="text-xs text-slate-400 mt-1">Upgrade your plan to host more events and reach more attendees.</p>
                </div>

                {subStatus && (
                  <div className="p-5 rounded-2xl bg-[#0b111e] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Plan</span>
                      <p className="text-lg font-bold text-white mt-1">{subStatus.currentPlan}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Expires: {new Date(subStatus.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Events Remaining</span>
                      <p className="text-2xl font-extrabold text-[#e06d53] mt-1">{subStatus.eventsRemaining} <span className="text-sm font-semibold text-slate-500">/ {subStatus.maxEvents}</span></p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                  {[
                    { name: "Basic", price: 999, events: 5, days: 30, color: "text-blue-400" },
                    { name: "Pro", price: 2499, events: 15, days: 90, color: "text-amber-400" },
                    { name: "Unlimited", price: 4999, events: "Unlimited", days: 365, color: "text-purple-400" },
                  ].map((plan) => (
                    <div key={plan.name} className="bg-[#0b111e] border border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full hover:border-[#e06d53]/50 transition">
                      <div>
                        <h3 className={`font-bold text-lg ${plan.color}`}>{plan.name} Plan</h3>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {plan.events} Events</p>
                          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {plan.days} Days Validity</p>
                          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority Support</p>
                        </div>
                      </div>
                      <div className="mt-8 pt-4 border-t border-white/10 text-center">
                        <p className="text-2xl font-extrabold text-white mb-4">₹{plan.price}</p>
                        <button 
                          onClick={() => handleBuyPlan(plan.name.toUpperCase())}
                          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
                        >
                          Upgrade to {plan.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Individual Event Attendees Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#131d2e] rounded-3xl p-6 md:p-8 w-full max-w-3xl border border-white/10 relative my-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-semibold text-[#fca5a5] uppercase">{selectedEventForModal.category}</div>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedEventForModal.title}</h3>
                <p className="text-xs text-slate-400">
                  {selectedEventForModal.location}, {selectedEventForModal.city} • {new Date(selectedEventForModal.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Confirmed Attendees for this Event
              </h4>

              {bookings.filter((b) => b.eventId === selectedEventForModal.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm bg-[#0b111e] rounded-2xl">
                  No attendees have reserved a spot for this event yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {bookings
                    .filter((b) => b.eventId === selectedEventForModal.id)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-[#0b111e] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#e06d53] to-amber-500 text-white font-bold flex items-center justify-center text-xs">
                            {b.user.name ? b.user.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{b.user.name}</div>
                            <div className="text-xs text-slate-400">
                              {b.user.email} {b.user.phone && `• ${b.user.phone}`}
                            </div>
                            <div className="text-[11px] text-amber-400 mt-0.5">
                              {b.spots} spot(s) • Status: <span className="font-bold">{b.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.status !== "CHECKED_IN" ? (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Check In
                            </button>
                          ) : (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs transition"
                            >
                              Revert
                            </button>
                          )}
                          {b.status !== "CANCELLED" && (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CANCELLED")}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                              title="Cancel"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#131d2e] rounded-3xl p-6 md:p-8 w-full max-w-2xl border border-white/10 relative my-8 shadow-2xl">
            <button
              onClick={() => { setShowCreateModal(false); setEditingEventId(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e06d53]/15 text-[#fca5a5] text-xs font-bold mb-2">
                <Plus className="w-3.5 h-3.5" />
                New Experience Creation
              </div>
              <h2 className="text-2xl font-extrabold text-white">{editingEventId ? "Edit Event" : "Create New Event"}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Post an offline single event, speed dating night, dance dating party, or group travel.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Event Title *
                  </label>
                  <input
                    required
                    placeholder="e.g. Bangalore Friday Speed Dating Mixer"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    required
                    placeholder="Describe the vibe, icebreakers, agenda, and what participants should expect..."
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53] h-24"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    City *
                  </label>
                  <input
                    required
                    placeholder="e.g. Bangalore, Mumbai, Delhi"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Venue / Location *
                  </label>
                  <input
                    required
                    placeholder="e.g. The Bier Library, Koramangala"
                    name="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Start Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                {formData.category === "Singles Travels" ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Return / End Date *
                    </label>
                    <input
                      required
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Ticket Price ($ or ₹)
                    </label>
                    <input
                      required
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>
                )}

                {formData.category === "Singles Travels" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Trip Package Price ($ or ₹)
                    </label>
                    <input
                      required
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Max Capacity / Attendees
                  </label>
                  <input
                    required
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={(e) => setFormData({ ...formData, maxAttendees: Number(e.target.value) })}
                    className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                  />
                </div>

                {formData.category === "Speed dating" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Age Bracket (e.g. 24 - 32 years)
                    </label>
                    <input
                      name="ageRange"
                      placeholder="24 - 32"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                    />
                  </div>
                )}

                {formData.category === "Singles Travels" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Travel Itinerary & Inclusions
                    </label>
                    <textarea
                      name="itinerary"
                      placeholder="Day 1: Arrival & Sunset Beach Mixer... Day 2: Trekking & Bonfire..."
                      value={formData.itinerary}
                      onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53] h-20"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingEventId(null); }}
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#c95940] hover:to-[#b04b34] px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-lg shadow-[#e06d53]/25"
                >
                  {editingEventId ? "Save Changes" : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
