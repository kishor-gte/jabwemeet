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
  IndianRupee,
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
  Loader2,
  AlertCircle,
  PartyPopper,
  Heart,
  Crown,
  ShieldAlert,
  HelpCircle,
  Trash2,
  Info,
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

const getMinLocalDateTime = () => {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatToLocalDateTimeString = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [subscribingPkgId, setSubscribingPkgId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  // Cute & Professional Dynamic Popup Modal State
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info" | "confirm";
    title: string;
    message: string;
    sticker?: string;
    badgeText?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    sticker: "✨",
  });

  // Dynamic Floating Toast State
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
    sticker: string;
  }>({
    isOpen: false,
    message: "",
    type: "success",
    sticker: "✨",
  });

  const showPopup = (config: {
    type?: "success" | "error" | "warning" | "info" | "confirm";
    title: string;
    message: string;
    sticker?: string;
    badgeText?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => {
    setPopupConfig({
      isOpen: true,
      type: config.type || "info",
      title: config.title,
      message: config.message,
      sticker:
        config.sticker ||
        (config.type === "success"
          ? "🎉"
          : config.type === "error"
          ? "🚨"
          : config.type === "warning"
          ? "⚠️"
          : config.type === "confirm"
          ? "🤔"
          : "✨"),
      badgeText: config.badgeText,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
    });
  };

  const closePopup = () => {
    setPopupConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const showToast = (
    msg: string,
    type: "success" | "error" | "warning" | "info" = "success",
    sticker?: string
  ) => {
    const defaultSticker =
      type === "success" ? "🎉" : type === "error" ? "🚨" : type === "warning" ? "⚠️" : "✨";
    setToastConfig({
      isOpen: true,
      message: msg,
      type,
      sticker: sticker || defaultSticker,
    });
    setTimeout(() => {
      setToastConfig((prev) => ({ ...prev, isOpen: false }));
    }, 4200);
  };

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Track seen counts per section so badges disappear once viewed and do not appear again
  const [mounted, setMounted] = useState(false);
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>({});
  const storageKey = `jwm_host_sidebar_seen_${user?.id || "default"}`;

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSeenCounts(JSON.parse(stored));
      }
    } catch (e) {}
  }, [storageKey]);

  const markSectionAsSeen = (section: string, currentCount: number) => {
    setSeenCounts((prev) => {
      const updated = {
        ...prev,
        [section]: Math.max(prev[section] || 0, currentCount),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Automatically mark section as seen if user is currently on that section
  useEffect(() => {
    if (!mounted) return;
    if (activeSection === "events" && stats.totalEvents > 0) {
      markSectionAsSeen("events", stats.totalEvents);
    } else if (activeSection === "attendees" && bookings.length > 0) {
      markSectionAsSeen("attendees", bookings.length);
    }
  }, [activeSection, stats.totalEvents, bookings.length, mounted, storageKey]);

  const getUnseenCount = (section: string, totalCount: number) => {
    if (!mounted) return 0;
    if (activeSection === section) return 0;
    const seen = seenCounts[section] || 0;
    return Math.max(0, totalCount - seen);
  };

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
      const [statsRes, bookingsRes, subRes, plansRes] = await Promise.all([
        fetch("/api/events/host/stats", { credentials: "include" }),
        fetch("/api/events/host/bookings", { credentials: "include" }),
        fetch("/api/subscription/status", { credentials: "include" }),
        fetch("/api/subscription/plans", { credentials: "include" }),
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

      if (plansRes && plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.success) {
          setAvailablePackages(plansData.packages || []);
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
            ? "Reservation marked as cancelled. 📋"
            : "Reservation status restored to confirmed. 💖",
          newStatus === "CANCELLED" ? "warning" : "success",
          newStatus === "CHECKED_IN" ? "🎟️" : newStatus === "CANCELLED" ? "📋" : "💖"
        );
      } else {
        showPopup({
          type: "error",
          title: "Update Failed 😿",
          message: data.message || "Failed to update attendee status. Please try again.",
          sticker: "😿",
        });
      }
    } catch (err) {
      showPopup({
        type: "error",
        title: "Network Error ⚠️",
        message: "An unexpected error occurred while updating the attendee status.",
        sticker: "📡",
      });
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

  const handleBuyPlan = async (pkgOrPlan: any) => {
    const pkgId = typeof pkgOrPlan === "object" ? pkgOrPlan.id : null;
    const planName = typeof pkgOrPlan === "object" ? pkgOrPlan.name : pkgOrPlan;
    setSubscribingPkgId(pkgId || planName);

    try {
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId, plan: planName }),
        credentials: "include",
      });
      const data = await orderRes.json();

      if (!data.success) {
        showPopup({
          type: "error",
          title: "Order Failed ⚠️",
          message: data.message || "Unable to initiate package purchase order.",
          sticker: "💳",
        });
        setSubscribingPkgId(null);
        return;
      }

      // Handle development / mock order fallback
      if (data.order?.id?.startsWith("order_mock_")) {
        const verifyRes = await fetch("/api/subscription/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: data.order.id,
            razorpay_payment_id: "pay_mock_" + Date.now(),
            razorpay_signature: "mock_signature",
            packageId: pkgId,
            plan: planName,
          }),
          credentials: "include",
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          showPopup({
            type: "success",
            title: "Plan Upgraded! 👑🎉",
            message: `Woohoo! You have successfully upgraded to the ${planName} plan. Your new hosting powers are active now!`,
            sticker: "👑",
            confirmText: "Awesome! 🚀",
          });
          loadHostData();
        } else {
          showPopup({
            type: "error",
            title: "Verification Failed 😿",
            message: verifyData.message || "Payment verification failed.",
            sticker: "💔",
          });
        }
        setSubscribingPkgId(null);
        return;
      }

      const res = await loadRazorpay();
      if (!res) {
        showPopup({
          type: "error",
          title: "Connection Error 🌐",
          message: "Razorpay SDK failed to load. Please verify your internet connection and try again.",
          sticker: "📡",
        });
        setSubscribingPkgId(null);
        return;
      }

      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RIlD5bEKRjyn3h",
        amount: data.order.amount,
        currency: data.order.currency,
        name: "JabWeMeet",
        description: `Upgrade to ${planName} Plan`,
        order_id: data.order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/subscription/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: pkgId,
              plan: planName,
            }),
            credentials: "include",
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            showPopup({
              type: "success",
              title: "Payment Successful! 👑🎉",
              message: `Congratulations! You are now subscribed to the ${planName} plan.`,
              sticker: "👑",
              confirmText: "Explore Features ✨",
            });
            loadHostData();
          } else {
            showPopup({
              type: "error",
              title: "Verification Failed 😿",
              message: verifyData.message || "Payment verification could not be completed.",
              sticker: "💔",
            });
          }
          setSubscribingPkgId(null);
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
      paymentObject.on("payment.failed", function (resp: any) {
        showPopup({
          type: "error",
          title: "Payment Unsuccessful 💳",
          message: resp.error?.description || "Payment was cancelled or could not be processed by your bank.",
          sticker: "😿",
        });
        setSubscribingPkgId(null);
      });
      paymentObject.open();
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Subscription Error ⚠️",
        message: "Something went wrong while processing your plan subscription.",
        sticker: "⚠️",
      });
      setSubscribingPkgId(null);
    }
  };

  const handleOpenCreateModal = () => {
    if (subStatus && !subStatus.canCreateEvent) {
      showPopup({
        type: "warning",
        title: "Event Limit Reached 👑✨",
        message: "You've reached the event creation quota for your current plan. Upgrade to host unlimited community gatherings!",
        sticker: "👑",
        confirmText: "View Upgrade Plans 🚀",
        cancelText: "Maybe Later",
        onConfirm: () => setActiveSection("subscriptions"),
      });
      return;
    }
    setEditingEventId(null);
    setFormErrors({});
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
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingEventId(null);
    setFormErrors({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field] || formErrors.general) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  };

  const handleDateChange = (val: string) => {
    setFormData((prev) => ({ ...prev, date: val }));
    const d = new Date(val);
    if (!val) {
      setFormErrors((prev) => ({ ...prev, date: "Start date and time is required." }));
    } else if (isNaN(d.getTime())) {
      setFormErrors((prev) => ({ ...prev, date: "Please enter a valid date and time." }));
    } else if (d.getTime() < Date.now() - 60 * 1000) {
      setFormErrors((prev) => ({
        ...prev,
        date: "Event date cannot be in the past or yesterday. Please choose a future date.",
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.date;
        delete next.general;
        return next;
      });
    }
  };

  const handleEndDateChange = (val: string) => {
    setFormData((prev) => ({ ...prev, endDate: val }));
    const endD = new Date(val);
    const startD = new Date(formData.date);
    if (!val && formData.category === "Singles Travels") {
      setFormErrors((prev) => ({ ...prev, endDate: "Return / End date is required for Singles Travels." }));
    } else if (val && !isNaN(endD.getTime()) && !isNaN(startD.getTime()) && endD.getTime() <= startD.getTime()) {
      setFormErrors((prev) => ({
        ...prev,
        endDate: "Return date must be after the start date and time.",
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.endDate;
        delete next.general;
        return next;
      });
    }
  };

  const validateEventForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title || !formData.title.trim()) {
      errors.title = "Event title is required.";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Event title must be at least 3 characters.";
    }

    if (!formData.description || !formData.description.trim()) {
      errors.description = "Event description is required.";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Please provide at least 10 characters describing the event.";
    }

    if (!formData.category) {
      errors.category = "Please select an event category.";
    }

    if (!formData.city || !formData.city.trim()) {
      errors.city = "City is required (e.g. Bangalore, Mumbai).";
    }

    if (!formData.location || !formData.location.trim()) {
      errors.location = "Venue or location address is required.";
    }

    if (!formData.date) {
      errors.date = "Start date and time is required.";
    } else {
      const selectedDate = new Date(formData.date);
      if (isNaN(selectedDate.getTime())) {
        errors.date = "Please enter a valid date and time.";
      } else if (selectedDate.getTime() < Date.now() - 60 * 1000) {
        errors.date = "Event date cannot be in the past or yesterday. Please select a future date and time.";
      }
    }

    if (formData.category === "Singles Travels") {
      if (!formData.endDate) {
        errors.endDate = "Return / End date is required for Singles Travels.";
      } else {
        const endD = new Date(formData.endDate);
        const startD = new Date(formData.date);
        if (isNaN(endD.getTime())) {
          errors.endDate = "Please enter a valid return date.";
        } else if (!isNaN(startD.getTime()) && endD.getTime() <= startD.getTime()) {
          errors.endDate = "Return date must be after the start date.";
        }
      }
    } else if (formData.endDate && formData.date) {
      const endD = new Date(formData.endDate);
      const startD = new Date(formData.date);
      if (!isNaN(endD.getTime()) && !isNaN(startD.getTime()) && endD.getTime() <= startD.getTime()) {
        errors.endDate = "End date must be after the start date.";
      }
    }

    if (formData.price < 0) {
      errors.price = "Ticket price cannot be negative.";
    }

    if (formData.maxAttendees === undefined || formData.maxAttendees === null || formData.maxAttendees < 2) {
      errors.maxAttendees = "Capacity must be at least 2 attendees.";
    } else if (formData.maxAttendees > 10000) {
      errors.maxAttendees = "Capacity cannot exceed 10,000 attendees.";
    }

    if (formData.category === "Speed dating" && !formData.ageRange?.trim()) {
      errors.ageRange = "Please specify an age bracket (e.g. 24 - 32).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEventForm()) {
      showToast("⚠️ Please fix highlighted errors before publishing.", "warning", "⚠️");
      return;
    }

    setFormSubmitting(true);
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
        setFormErrors({});
        showPopup({
          type: "success",
          title: editingEventId ? "Event Updated! ✨" : "Event Published! 🚀🎉",
          message: editingEventId
            ? `Your event "${formData.title}" was updated successfully.`
            : `Hooray! "${formData.title}" is now published! An invitation email broadcast has been dispatched to all active users. 💌`,
          sticker: editingEventId ? "✏️" : "🎉",
          confirmText: "Awesome! 💖",
        });
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
        setShowCreateModal(false);
        showPopup({
          type: "warning",
          title: "Event Limit Reached 👑",
          message: "You've reached your maximum allowed active events on this plan. Upgrade your subscription to continue publishing new gatherings.",
          sticker: "👑",
          confirmText: "Upgrade Plan 🚀",
          cancelText: "Later",
          onConfirm: () => setActiveSection("subscriptions"),
        });
      } else {
        const msg = data.message || `Failed to ${editingEventId ? "update" : "create"} event`;
        showPopup({
          type: "error",
          title: "Submission Error 😿",
          message: msg,
          sticker: "⚠️",
        });
        setFormErrors((prev) => ({ ...prev, general: msg }));
      }
    } catch (error) {
      showPopup({
        type: "error",
        title: "Network Error ⚠️",
        message: `Failed to connect to the server while ${editingEventId ? "updating" : "publishing"} your event.`,
        sticker: "📡",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = (id: string, title?: string) => {
    showPopup({
      type: "confirm",
      title: "Delete This Event? 💔",
      message: `Are you sure you want to delete "${title || 'this event'}"? All attendee reservations will be cancelled. This action cannot be undone.`,
      sticker: "🗑️",
      badgeText: "Permanent Action",
      confirmText: "Yes, Delete Event 🗑️",
      cancelText: "Keep Event 💖",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/events/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json();
          if (data.success) {
            showToast("Event removed successfully! 🗑️", "info", "✨");
            loadHostData();
          } else {
            showPopup({
              type: "error",
              title: "Delete Failed 😿",
              message: data.message || "Could not delete this event.",
              sticker: "⚠️",
            });
          }
        } catch (error) {
          showPopup({
            type: "error",
            title: "Network Error ⚠️",
            message: "Failed to connect to the server while deleting the event.",
            sticker: "📡",
          });
        }
      },
    });
  };

  const openEditModal = (evt: Event) => {
    setEditingEventId(evt.id);
    setFormErrors({});
    setFormData({
      title: evt.title,
      description: evt.description,
      category: evt.category,
      location: evt.location,
      city: evt.city,
      date: formatToLocalDateTimeString(evt.date),
      endDate: evt.endDate ? formatToLocalDateTimeString(evt.endDate) : "",
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
                markSectionAsSeen("events", stats.totalEvents);
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
              {getUnseenCount("events", stats.totalEvents) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {getUnseenCount("events", stats.totalEvents)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("attendees");
                markSectionAsSeen("attendees", bookings.length);
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
              {getUnseenCount("attendees", bookings.length) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30">
                  {getUnseenCount("attendees", bookings.length)}
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
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
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
          onClick={handleOpenCreateModal}
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
                onClick={handleOpenCreateModal}
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
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-300">₹{stats.totalRevenue.toLocaleString("en-IN")}</span>
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
                      onClick={handleOpenCreateModal}
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
                              {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free Pass"}
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
                              className="text-xs font-bold text-[#fca5a5] hover:text-white flex items-center gap-1.5 transition cursor-pointer"
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
                              <div className="text-amber-400 text-[11px]">₹{b.totalAmount.toLocaleString("en-IN")}</div>
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
                  onClick={handleOpenCreateModal}
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
                          {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free"}
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
                          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#fca5a5] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          Manage Roster ({activeCount} booked / {checkedIn} checked in)
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="flex-1 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
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
                        <th className="px-4 py-3">Seats Booked</th>
                        <th className="px-4 py-3">Amount</th>
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
                          <td className="px-4 py-3 font-bold text-amber-300">
                            🎟️ {b.spots || 1} {(b.spots || 1) === 1 ? 'seat' : 'seats'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-400">
                            {b.totalAmount ? `₹${b.totalAmount.toLocaleString("en-IN")}` : "Free"}
                          </td>
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
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs transition cursor-pointer"
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
                    <p className="text-3xl font-extrabold text-amber-300">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
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
            {activeSection === "subscriptions" && (
              <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" /> Host Subscriptions & Plans
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage your event hosting subscription quota and validities.
                  </p>
                </div>

                {(() => {
                  const isPaidActive = Boolean(
                    subStatus?.hasActivePlan &&
                    subStatus?.currentPlan &&
                    subStatus?.currentPlan !== "STARTER" &&
                    (subStatus?.eventsRemaining ?? 0) > 0 &&
                    new Date(subStatus?.expiresAt).getTime() > Date.now()
                  );

                  const eventsUsed = subStatus?.eventsUsed || 0;
                  const maxEvents = subStatus?.maxEvents || 1;
                  const eventsRemaining = subStatus?.eventsRemaining || 0;
                  const isExpired = subStatus?.expiresAt ? new Date(subStatus.expiresAt).getTime() <= Date.now() : false;
                  const isQuotaExhausted = !isExpired && eventsRemaining <= 0;
                  const daysLeft = subStatus?.expiresAt
                    ? Math.max(0, Math.ceil((new Date(subStatus.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0;

                  // 1. ACTIVE PAID SUBSCRIPTION: Hide buy cards until quota or validity runs out
                  if (isPaidActive) {
                    const usagePercent = Math.min(100, Math.round((eventsUsed / maxEvents) * 100));

                    return (
                      <div className="space-y-6">
                        {/* Active Subscription Banner Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0b111e] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
                          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="relative z-10 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                              <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  Active Subscription
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black text-white capitalize">
                                  {subStatus.currentPlan}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  Your host subscription is active and in good standing.
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  setActiveSection("events");
                                  handleOpenCreateModal();
                                }}
                                className="px-5 py-3 rounded-2xl bg-[#e06d53] hover:bg-[#d05c42] text-white text-sm font-bold shadow-lg shadow-[#e06d53]/25 flex items-center justify-center gap-2 transition self-start sm:self-auto shrink-0"
                              >
                                <Plus className="w-4 h-4" /> Create An Event
                              </button>
                            </div>

                            {/* Quota & Validity Metric Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Events Remaining</div>
                                <div className="text-3xl font-extrabold text-[#e06d53] mt-1">
                                  {eventsRemaining}
                                  <span className="text-sm font-semibold text-slate-400"> / {maxEvents} total</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {eventsUsed} event{eventsUsed === 1 ? "" : "s"} already hosted
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Valid Until</div>
                                <div className="text-lg font-bold text-white mt-1">
                                  {new Date(subStatus.expiresAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Hosting Status</div>
                                <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Authorized to Host
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  Instant attendee check-in enabled
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-xs text-slate-400 font-medium">
                                <span>Event Quota Used ({usagePercent}%)</span>
                                <span>{eventsRemaining} slot{eventsRemaining === 1 ? "" : "s"} available</span>
                              </div>
                              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#e06d53] rounded-full transition-all duration-500"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Info Callout */}
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 flex items-start gap-3">
                              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-300">Subscription is Active: </span>
                                You have active event slots remaining. To keep your dashboard focused, package purchase options are paused and will automatically reappear here once your events run out or when your subscription period concludes.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. SUBSCRIPTION HAS RUN OUT OR STARTER PLAN: Show renewal/upgrade packages
                  return (
                    <div className="space-y-6">
                      {/* Alert banner if plan ran out */}
                      {isQuotaExhausted && subStatus?.currentPlan !== "STARTER" && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                          <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm text-white">Event Quota Exhausted</div>
                            You have created all <strong>{maxEvents}</strong> events permitted by your <strong>{subStatus?.currentPlan}</strong> plan (0 events remaining). Select a package below to renew your quota and host more events.
                          </div>
                        </div>
                      )}

                      {isExpired && subStatus?.currentPlan !== "STARTER" && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
                          <Ban className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm text-white">Subscription Expired</div>
                            Your <strong>{subStatus?.currentPlan}</strong> plan expired on {new Date(subStatus.expiresAt).toLocaleDateString()}. Please select an active package below to reactivate your hosting privileges.
                          </div>
                        </div>
                      )}

                      {subStatus?.currentPlan === "STARTER" && (
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Free Starter Tier</span>
                            <div className="text-sm font-semibold text-white mt-0.5">
                              You have {eventsRemaining} free event slot{eventsRemaining === 1 ? "" : "s"} remaining. Upgrade to host unlimited or regular events!
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Package Grid */}
                      {availablePackages.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-8 bg-[#0b111e]/50 mt-4">
                          <Sparkles className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-white">No Subscription Plans Available</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            There are currently no active host subscription plans published by the administrator. Please check back later.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                          {availablePackages.map((pkg, idx) => {
                            const isSubscribing = subscribingPkgId === pkg.id || subscribingPkgId === pkg.name;
                            const featuresList = Array.isArray(pkg.features)
                              ? pkg.features
                              : typeof pkg.features === "string"
                              ? (() => {
                                  try {
                                    return JSON.parse(pkg.features);
                                  } catch {
                                    return [pkg.features];
                                  }
                                })()
                              : [];

                            const colorAccents = [
                              { tag: "text-blue-400", border: "hover:border-blue-500/50" },
                              { tag: "text-amber-400", border: "hover:border-amber-500/50" },
                              { tag: "text-purple-400", border: "hover:border-purple-500/50" },
                              { tag: "text-emerald-400", border: "hover:border-emerald-500/50" },
                            ];
                            const accent = colorAccents[idx % colorAccents.length];

                            return (
                              <div
                                key={pkg.id}
                                className={`bg-[#0b111e] border border-white/10 ${accent.border} rounded-2xl p-6 flex flex-col justify-between h-full transition relative group`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h3 className={`font-bold text-lg capitalize ${accent.tag}`}>{pkg.name}</h3>
                                    {pkg.billingCycle && (
                                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400">
                                        {pkg.billingCycle}
                                      </span>
                                    )}
                                  </div>

                                  {pkg.description && (
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{pkg.description}</p>
                                  )}

                                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                                    <p className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span>{pkg.sessionLimit ? `${pkg.sessionLimit} Event Creations` : "Unlimited Events"}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                      <span>{pkg.durationDays || 30} Days Validity</span>
                                    </p>
                                    {featuresList.map((feat: any, fIdx: number) => {
                                      const featText = typeof feat === "string" ? feat : feat?.title || feat?.name;
                                      if (!featText) return null;
                                      return (
                                        <p key={fIdx} className="flex items-center gap-2">
                                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                          <span>{featText}</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-white/10 text-center">
                                  <div className="mb-4">
                                    <p className="text-2xl font-extrabold text-white">₹{pkg.price}</p>
                                    <span className="text-[11px] text-slate-400">for {pkg.durationDays || 30} days</span>
                                  </div>
                                  <button
                                    onClick={() => handleBuyPlan(pkg)}
                                    disabled={isSubscribing}
                                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-[#e06d53] hover:bg-[#d05c42] text-white shadow-lg shadow-[#e06d53]/20 ${
                                      isSubscribing ? "opacity-60 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    {isSubscribing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                      </>
                                    ) : (
                                      `Subscribe to ${pkg.name}`
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            </div>
          )}

        </main>
      </div>

      {/* Individual Event Attendees Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-[#131d2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0 bg-[#131d2e]">
              <div>
                <div className="text-xs font-semibold text-[#fca5a5] uppercase">{selectedEventForModal.category}</div>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedEventForModal.title}</h3>
                <p className="text-xs text-slate-400">
                  {selectedEventForModal.location}, {selectedEventForModal.city} • {new Date(selectedEventForModal.date).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6 space-y-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Confirmed Attendees for this Event
              </h4>

              {bookings.filter((b) => b.eventId === selectedEventForModal.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm bg-[#0b111e] rounded-2xl">
                  No attendees have reserved a spot for this event yet.
                </div>
              ) : (
                <div className="space-y-3">
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
                              🎟️ {b.spots || 1} {(b.spots || 1) === 1 ? 'seat' : 'seats'} • {b.totalAmount ? `₹${b.totalAmount.toLocaleString("en-IN")}` : 'Free Pass'} • Status: <span className="font-bold">{b.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.status !== "CHECKED_IN" ? (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Check In
                            </button>
                          ) : (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                            >
                              Revert
                            </button>
                          )}
                          {b.status !== "CANCELLED" && (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CANCELLED")}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
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

            {/* Sticky Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0c1322] flex justify-end shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-[#131d2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-white/10 shrink-0 bg-[#131d2e]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e06d53]/15 text-[#fca5a5] text-xs font-bold mb-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Experience Creation
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Post an offline single event, speed dating night, dance dating party, or group travel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateEvent} className="flex-1 flex flex-col overflow-hidden">
              <div
                className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6 space-y-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Validation Error Alert Banner */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formErrors.general || "Please fix the highlighted validation errors before saving."}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Event Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Event Title *
                    </label>
                    <input
                      required
                      placeholder="e.g. Bangalore Friday Speed Dating Mixer"
                      name="title"
                      value={formData.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.title ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Description *
                    </label>
                    <textarea
                      required
                      placeholder="Describe the vibe, icebreakers, agenda, and what participants should expect..."
                      name="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.description ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition h-24`}
                    />
                    {formErrors.description && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => handleFieldChange("category", e.target.value)}
                      className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      City *
                    </label>
                    <input
                      required
                      placeholder="e.g. Bangalore, Mumbai, Delhi"
                      name="city"
                      value={formData.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.city ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                    />
                    {formErrors.city && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Venue / Location *
                    </label>
                    <input
                      required
                      placeholder="e.g. The Bier Library, Koramangala"
                      name="location"
                      value={formData.location}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.location ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                    />
                    {formErrors.location && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.location}
                      </p>
                    )}
                  </div>

                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Start Date & Time *
                    </label>
                    <input
                      required
                      type="datetime-local"
                      min={getMinLocalDateTime()}
                      name="date"
                      value={formData.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.date ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Must be a future date and time (past dates and yesterday are disabled).
                    </p>
                    {formErrors.date && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.date}
                      </p>
                    )}
                  </div>

                  {/* Return / End Date or Ticket Price */}
                  {formData.category === "Singles Travels" ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Return / End Date *
                      </label>
                      <input
                        required
                        type="datetime-local"
                        min={formData.date || getMinLocalDateTime()}
                        name="endDate"
                        value={formData.endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className={`w-full bg-[#0b111e] border ${
                          formErrors.endDate ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                        } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Must be after the start date and time.
                      </p>
                      {formErrors.endDate && (
                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.endDate}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Ticket Price (₹) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={(e) => handleFieldChange("price", Number(e.target.value))}
                        className={`w-full bg-[#0b111e] border ${
                          formErrors.price ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                        } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                      />
                      {formErrors.price && (
                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.price}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Trip Package Price (Singles Travels) */}
                  {formData.category === "Singles Travels" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Trip Package Price (₹) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={(e) => handleFieldChange("price", Number(e.target.value))}
                        className={`w-full bg-[#0b111e] border ${
                          formErrors.price ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                        } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                      />
                      {formErrors.price && (
                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.price}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Max Capacity */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Max Capacity / Attendees *
                    </label>
                    <input
                      required
                      type="number"
                      min="2"
                      max="10000"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={(e) => handleFieldChange("maxAttendees", Number(e.target.value))}
                      className={`w-full bg-[#0b111e] border ${
                        formErrors.maxAttendees ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                      } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                    />
                    {formErrors.maxAttendees && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.maxAttendees}
                      </p>
                    )}
                  </div>

                  {/* Speed Dating Age Range */}
                  {formData.category === "Speed dating" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Age Bracket (e.g. 24 - 32 years) *
                      </label>
                      <input
                        name="ageRange"
                        placeholder="24 - 32"
                        value={formData.ageRange}
                        onChange={(e) => handleFieldChange("ageRange", e.target.value)}
                        className={`w-full bg-[#0b111e] border ${
                          formErrors.ageRange ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-white/10 focus:border-[#e06d53]"
                        } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition`}
                      />
                      {formErrors.ageRange && (
                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.ageRange}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Singles Travels Itinerary */}
                  {formData.category === "Singles Travels" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Travel Itinerary & Inclusions
                      </label>
                      <textarea
                        name="itinerary"
                        placeholder="Day 1: Arrival & Sunset Beach Mixer... Day 2: Trekking & Bonfire..."
                        value={formData.itinerary}
                        onChange={(e) => handleFieldChange("itinerary", e.target.value)}
                        className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#e06d53] h-20"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0c1322] flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#c95940] hover:to-[#b04b34] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-lg shadow-[#e06d53]/25 cursor-pointer inline-flex items-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingEventId ? "Save Changes" : "Publish Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cute & Professional Dynamic Popup Modal */}
      {popupConfig.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#131d2e]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-center space-y-5 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Ambient background glow */}
            <div
              className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                popupConfig.type === "success"
                  ? "bg-emerald-500/20"
                  : popupConfig.type === "error"
                  ? "bg-rose-500/25"
                  : popupConfig.type === "warning"
                  ? "bg-amber-500/25"
                  : popupConfig.type === "confirm"
                  ? "bg-[#e06d53]/25"
                  : "bg-sky-500/20"
              }`}
            />

            {/* Top Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Dynamic Animated Sticker */}
            <div className="relative pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-2xl border border-white/10 select-none transform hover:scale-105 transition ${
                  popupConfig.type === "success"
                    ? "bg-emerald-500/15 ring-4 ring-emerald-500/20"
                    : popupConfig.type === "error"
                    ? "bg-rose-500/15 ring-4 ring-rose-500/20"
                    : popupConfig.type === "warning"
                    ? "bg-amber-500/15 ring-4 ring-amber-500/20"
                    : popupConfig.type === "confirm"
                    ? "bg-[#e06d53]/15 ring-4 ring-[#e06d53]/20"
                    : "bg-sky-500/15 ring-4 ring-sky-500/20"
                }`}
              >
                <span className="animate-bounce inline-block">{popupConfig.sticker || "✨"}</span>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                  popupConfig.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : popupConfig.type === "error"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : popupConfig.type === "warning"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : popupConfig.type === "confirm"
                    ? "bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                }`}
              >
                {popupConfig.badgeText ||
                  (popupConfig.type === "success"
                    ? "✨ Success"
                    : popupConfig.type === "error"
                    ? "🚨 Attention"
                    : popupConfig.type === "warning"
                    ? "👑 Plan Notice"
                    : popupConfig.type === "confirm"
                    ? "🤔 Please Confirm"
                    : "ℹ️ Notification")}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {popupConfig.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal px-2">
                {popupConfig.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {popupConfig.type === "confirm" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (popupConfig.onCancel) popupConfig.onCancel();
                      closePopup();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
                  >
                    {popupConfig.cancelText || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (popupConfig.onConfirm) popupConfig.onConfirm();
                      closePopup();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {popupConfig.confirmText || "Confirm"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {popupConfig.cancelText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (popupConfig.onCancel) popupConfig.onCancel();
                        closePopup();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
                    >
                      {popupConfig.cancelText}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (popupConfig.onConfirm) popupConfig.onConfirm();
                      closePopup();
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#f07d63] hover:to-[#d96950] text-white font-extrabold text-sm shadow-lg shadow-[#e06d53]/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {popupConfig.confirmText || "Got It! ✨"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cute Floating Toast Notification - Centered */}
      {toastConfig.isOpen && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[130] w-full max-w-md px-4 animate-in slide-in-from-top-4 zoom-in-95 duration-200 pointer-events-auto">
          <div
            className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#0e1626]/98 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-left ${
              toastConfig.type === "success"
                ? "border-emerald-500/40 text-emerald-200 ring-2 ring-emerald-500/10"
                : toastConfig.type === "warning"
                ? "border-amber-500/40 text-amber-200 ring-2 ring-amber-500/10"
                : toastConfig.type === "error"
                ? "border-rose-500/40 text-rose-200 ring-2 ring-rose-500/10"
                : "border-sky-500/40 text-sky-200 ring-2 ring-sky-500/10"
            }`}
          >
            <span className="text-2xl shrink-0 select-none animate-bounce">{toastConfig.sticker}</span>
            <div className="flex-1 text-xs sm:text-sm font-semibold text-white leading-snug">
              {toastConfig.message}
            </div>
            <button
              onClick={() => setToastConfig((prev) => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
