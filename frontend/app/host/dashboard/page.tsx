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

  // Dynamic Popup Modal State
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

  // Track seen counts per section
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
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
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
          color: "#7E2248",
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
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center text-slate-900 space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium font-serif">Loading Host Operations Hub...</p>
      </div>
    );
  }

  // Sidebar content markup
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-rose-100 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-rose-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7E2248] to-[#5c1333] flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-[#7E2248]/20 group-hover:scale-105 transition">
            J
          </div>
          <div>
            <div className="font-serif font-bold text-xl tracking-tight text-slate-900 flex items-center gap-1">
              Jab<span className="text-[#7E2248]">We</span>Meet
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#7E2248]">
              Host & Event Manager
            </div>
          </div>
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-rose-50 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-rose-100">
        {/* MAIN NAVIGATION */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Event Operations
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveSection("overview");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSection === "overview"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    activeSection === "overview" ? "text-[#7E2248]" : "text-slate-400"
                  }`}
                />
                <span>Dashboard Overview</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => {
                setActiveSection("events");
                markSectionAsSeen("events", stats.totalEvents);
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSection === "events"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 ${activeSection === "events" ? "text-[#7E2248]" : "text-slate-400"}`} />
                <span>My Hosted Events</span>
              </div>
              {getUnseenCount("events", stats.totalEvents) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] border border-rose-200">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSection === "attendees"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className={`w-4 h-4 ${activeSection === "attendees" ? "text-[#7E2248]" : "text-slate-400"}`} />
                <span>Attendees & RSVPs</span>
              </div>
              {getUnseenCount("attendees", bookings.length) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#7E2248] border border-rose-200">
                  {getUnseenCount("attendees", bookings.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("analytics");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSection === "analytics"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className={`w-4 h-4 ${activeSection === "analytics" ? "text-[#7E2248]" : "text-slate-400"}`} />
                <span>Sales & Revenue</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("subscriptions");
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSection === "subscriptions"
                  ? "bg-rose-50 text-[#7E2248] border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${activeSection === "subscriptions" ? "text-[#7E2248]" : "text-slate-400"}`} />
                <span>Subscription & Plans</span>
              </div>
              {subStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  subStatus.currentPlan === 'STARTER' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                  subStatus.currentPlan === 'BASIC' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  subStatus.currentPlan === 'PRO' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-[#7E2248] border border-rose-200'
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
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-rose-50/60 transition"
            >
              <ArrowLeftRight className="w-4 h-4 text-slate-400" />
              <span>Switch to Member View</span>
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 transition border border-rose-200 bg-rose-50/50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#7E2248]" />
                <span>Admin Console</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-rose-100 bg-[#FAF3F6]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-[#7E2248] font-bold flex items-center justify-center text-sm shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "HM"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-slate-900 flex flex-col font-sans selection:bg-[#7E2248] selection:text-white">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-rose-50"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-serif font-bold text-lg text-slate-900">
            Jab<span className="text-[#7E2248]">We</span>Meet Host
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Create
        </button>
      </div>

      <div className="flex flex-1">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 shadow-sm border-r border-rose-100 z-20">
          {sidebarContent}
        </aside>

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Dashboard Area */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Banner */}
          <div className="bg-white border border-rose-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute right-0 top-0 w-96 h-96 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-[#7E2248]">
                <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
                Event Host Operations Hub
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
                Welcome back, {user?.name || "Host"}!
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                Manage your speed dating mixers, dance dating nights, single travels, and live guest check-ins with real-time sync.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <button
                onClick={loadHostData}
                className="px-4 py-2.5 bg-[#FAF3F6] hover:bg-[#F3E8EE] border border-rose-200 text-slate-700 hover:text-slate-900 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#7E2248] hover:bg-[#681938] px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition shadow-md shadow-[#7E2248]/20"
              >
                <Plus className="w-4 h-4" />
                Create New Event
              </button>
            </div>
          </div>

          {/* Key Metrics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-rose-100 rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Events</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-slate-900">{stats.totalEvents}</span>
                <span className="text-xs text-slate-500">active & past</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total RSVPs</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#7E2248]">{stats.totalAttendees}</span>
                <span className="text-xs text-slate-500">confirmed spots</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Checked In</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-emerald-700">{stats.checkedInCount}</span>
                <span className="text-xs text-slate-500">
                  {stats.totalAttendees > 0
                    ? `(${Math.round((stats.checkedInCount / stats.totalAttendees) * 100)}% attendance)`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString("en-IN")}</span>
                <span className="text-xs text-emerald-700 font-semibold">verified sales</span>
              </div>
            </div>
          </div>

          {/* Section: Overview or Specific Tabs */}
          {activeSection === "overview" && (
            <div className="space-y-8">
              {/* Hosted Events Header + Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#7E2248]" />
                    Your Event Portfolio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Filter by experience category</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["All", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? "bg-[#7E2248] text-white shadow-sm"
                          : "bg-white text-slate-600 hover:text-slate-900 hover:bg-rose-50 border border-rose-200 font-medium"
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
                  <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center text-3xl mx-auto">
                      🎉
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-900">No Events in this Category</h3>
                    <p className="text-slate-600 max-w-md mx-auto text-sm">
                      Create an event under "{selectedCategory}" to start accepting attendee registrations.
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="bg-[#7E2248] hover:bg-[#681938] px-6 py-2.5 rounded-full font-bold text-sm text-white inline-flex items-center gap-2 transition shadow-sm"
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
                        className="bg-white rounded-3xl p-6 border border-rose-100 hover:border-rose-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-rose-50 rounded-full text-xs font-semibold text-[#7E2248] border border-rose-200">
                              {evt.category}
                            </span>
                            <span className="text-sm font-bold text-[#7E2248]">
                              {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free Pass"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#7E2248] transition line-clamp-1">
                              {evt.title}
                            </h3>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{evt.description}</p>
                          </div>

                          <div className="space-y-2 pt-2 text-xs text-slate-600 border-t border-rose-100/70">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{new Date(evt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{evt.location}, {evt.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>
                                <strong className="text-slate-900">{activeCount}</strong> / {evt.maxAttendees} spots booked ({checkedIn} checked-in)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-5 pt-4 border-t border-rose-100 space-y-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#7E2248] to-rose-400 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (activeCount / (evt.maxAttendees || 50)) * 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setSelectedEventForModal(evt)}
                              className="text-xs font-bold text-[#7E2248] hover:text-[#681938] flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Manage Attendees ({activeCount})
                            </button>
                            <span className="text-[11px] text-slate-500 font-medium">
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
              <div className="bg-white border border-rose-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      Live Attendee Roster & RSVPs
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
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
                        className="bg-[#FDFBF9] border border-rose-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#FDFBF9] border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    >
                      <option value="All">All Statuses</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No reservations matching current search or filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#FAF3F6] text-slate-600 uppercase text-[10px] tracking-wider border-b border-rose-100">
                        <tr>
                          <th className="px-4 py-3 rounded-l-xl font-bold">Attendee</th>
                          <th className="px-4 py-3 font-bold">Event Title</th>
                          <th className="px-4 py-3 font-bold">Spots / Amount</th>
                          <th className="px-4 py-3 font-bold">Booking Date</th>
                          <th className="px-4 py-3 font-bold">Status</th>
                          <th className="px-4 py-3 text-right rounded-r-xl font-bold">Venue Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-rose-50/40 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7E2248] to-rose-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                  {b.user.name ? b.user.name.slice(0, 2).toUpperCase() : "U"}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{b.user.name}</div>
                                  <div className="text-slate-500 flex items-center gap-2">
                                    <span>{b.user.email}</span>
                                    {b.user.phone && <span>• {b.user.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">{b.event.title}</div>
                              <div className="text-slate-500 text-[11px]">{b.event.category} • {b.event.city}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{b.spots} spot(s)</div>
                              <div className="text-[#7E2248] font-bold text-[11px]">₹{b.totalAmount.toLocaleString("en-IN")}</div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  b.status === "CHECKED_IN"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : b.status === "CONFIRMED"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
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
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-xs disabled:opacity-50 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    Check In
                                  </button>
                                )}
                                {b.status === "CHECKED_IN" && (
                                  <button
                                    disabled={updatingBookingId === b.id}
                                    onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                                  >
                                    Revert
                                  </button>
                                )}
                                {b.status !== "CANCELLED" && (
                                  <button
                                    disabled={updatingBookingId === b.id}
                                    onClick={() => handleStatusChange(b.id, "CANCELLED")}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
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
                  <h2 className="text-xl font-serif font-bold text-slate-900">All Hosted Events</h2>
                  <p className="text-xs text-slate-500">Review attendance and event configurations</p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-[#7E2248] hover:bg-[#681938] px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition shadow-sm"
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
                    <div key={evt.id} className="bg-white rounded-3xl p-6 border border-rose-100 space-y-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-rose-50 rounded-full text-xs font-semibold text-[#7E2248] border border-rose-200">
                          {evt.category}
                        </span>
                        <span className="font-bold text-[#7E2248] text-sm">
                          {evt.price > 0 ? `₹${evt.price.toLocaleString("en-IN")}` : "Free"}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{evt.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                      <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-rose-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.location}, {evt.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(evt.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                        <button
                          onClick={() => setSelectedEventForModal(evt)}
                          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-[#7E2248] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          Manage Roster ({activeCount} booked / {checkedIn} checked in)
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(evt)}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="bg-white border border-rose-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-900">All Event Guests & RSVPs</h2>
                    <p className="text-xs text-slate-500">Manage all registered spots across all your hosted events</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#FDFBF9] border border-rose-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[#FDFBF9] border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    >
                      <option value="All">All</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CHECKED_IN">Checked In</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#FAF3F6] text-slate-600 uppercase text-[10px] tracking-wider border-b border-rose-100">
                      <tr>
                        <th className="px-4 py-3 font-bold">Attendee</th>
                        <th className="px-4 py-3 font-bold">Event</th>
                        <th className="px-4 py-3 font-bold">Seats Booked</th>
                        <th className="px-4 py-3 font-bold">Amount</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-rose-50/40 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{b.user.name}</div>
                            <div className="text-slate-500 text-[11px]">{b.user.email} • {b.user.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-900 font-semibold">{b.event.title}</div>
                            <div className="text-slate-500 text-[11px]">{b.event.city}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            🎟️ {b.spots || 1} {(b.spots || 1) === 1 ? 'seat' : 'seats'}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#7E2248]">
                            {b.totalAmount ? `₹${b.totalAmount.toLocaleString("en-IN")}` : "Free"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === "CHECKED_IN"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : b.status === "CONFIRMED"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.status !== "CHECKED_IN" ? (
                              <button
                                onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
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
              <div className="bg-white border border-rose-100 rounded-3xl p-8 space-y-6 shadow-sm">
                <h2 className="text-xl font-serif font-bold text-slate-900">Event Performance & Revenue</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#FAF3F6] p-6 rounded-2xl border border-rose-100 space-y-2">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Gross Ticket Sales</span>
                    <p className="text-3xl font-serif font-bold text-[#7E2248]">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-500">From {stats.totalAttendees} confirmed spots</p>
                  </div>
                  <div className="bg-[#FAF3F6] p-6 rounded-2xl border border-rose-100 space-y-2">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Average Attendance</span>
                    <p className="text-3xl font-serif font-bold text-emerald-700">
                      {stats.totalEvents > 0 ? (stats.totalAttendees / stats.totalEvents).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-slate-500">Guests per event</p>
                  </div>
                  <div className="bg-[#FAF3F6] p-6 rounded-2xl border border-rose-100 space-y-2">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Checked-In Rate</span>
                    <p className="text-3xl font-serif font-bold text-blue-700">
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
              <div className="bg-white border border-rose-100 rounded-3xl p-8 space-y-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Host Subscriptions & Plans
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
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
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-rose-50/40 to-emerald-50/30 border border-emerald-200/80 p-6 sm:p-8 shadow-xs">
                          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
                          <div className="relative z-10 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-6">
                              <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Subscription
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 capitalize">
                                  {subStatus.currentPlan}
                                </h3>
                                <p className="text-xs text-slate-600 mt-1">
                                  Your host subscription is active and in good standing.
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  setActiveSection("events");
                                  handleOpenCreateModal();
                                }}
                                className="px-5 py-3 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white text-sm font-bold shadow-md shadow-[#7E2248]/20 flex items-center justify-center gap-2 transition self-start sm:self-auto shrink-0 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Create An Event
                              </button>
                            </div>

                            {/* Quota & Validity Metric Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs">
                                <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Events Remaining</div>
                                <div className="text-3xl font-serif font-bold text-[#7E2248] mt-1">
                                  {eventsRemaining}
                                  <span className="text-sm font-semibold text-slate-500"> / {maxEvents} total</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {eventsUsed} event{eventsUsed === 1 ? "" : "s"} already hosted
                                </div>
                              </div>

                              <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs">
                                <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Valid Until</div>
                                <div className="text-lg font-bold text-slate-900 mt-1">
                                  {new Date(subStatus.expiresAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
                                </div>
                              </div>

                              <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs">
                                <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Hosting Status</div>
                                <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Authorized to Host
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  Instant attendee check-in enabled
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-xs text-slate-600 font-medium">
                                <span>Event Quota Used ({usagePercent}%)</span>
                                <span>{eventsRemaining} slot{eventsRemaining === 1 ? "" : "s"} available</span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-[#7E2248] rounded-full transition-all duration-500"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Info Callout */}
                            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 flex items-start gap-3">
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-900">Subscription is Active: </span>
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
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
                          <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm text-slate-900">Event Quota Exhausted</div>
                            You have created all <strong>{maxEvents}</strong> events permitted by your <strong>{subStatus?.currentPlan}</strong> plan (0 events remaining). Select a package below to renew your quota and host more events.
                          </div>
                        </div>
                      )}

                      {isExpired && subStatus?.currentPlan !== "STARTER" && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs">
                          <Ban className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm text-slate-900">Subscription Expired</div>
                            Your <strong>{subStatus?.currentPlan}</strong> plan expired on {new Date(subStatus.expiresAt).toLocaleDateString()}. Please select an active package below to reactivate your hosting privileges.
                          </div>
                        </div>
                      )}

                      {subStatus?.currentPlan === "STARTER" && (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Free Starter Tier</span>
                            <div className="text-sm font-semibold text-slate-900 mt-0.5">
                              You have {eventsRemaining} free event slot{eventsRemaining === 1 ? "" : "s"} remaining. Upgrade to host unlimited or regular events!
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Package Grid */}
                      {availablePackages.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-rose-200 rounded-2xl p-8 bg-rose-50/30 mt-4">
                          <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-slate-900">No Subscription Plans Available</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            There are currently no active host subscription plans published by the administrator. Please check back later.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-rose-100">
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

                            return (
                              <div
                                key={pkg.id}
                                className="bg-white border border-rose-200 hover:border-[#7E2248] rounded-2xl p-6 flex flex-col justify-between h-full transition relative group shadow-sm hover:shadow-md"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-serif font-bold text-lg capitalize text-[#7E2248]">{pkg.name}</h3>
                                    {pkg.billingCycle && (
                                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-50 text-[#7E2248] border border-rose-200">
                                        {pkg.billingCycle}
                                      </span>
                                    )}
                                  </div>

                                  {pkg.description && (
                                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pkg.description}</p>
                                  )}

                                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                                    <p className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>{pkg.sessionLimit ? `${pkg.sessionLimit} Event Creations` : "Unlimited Events"}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>{pkg.durationDays || 30} Days Validity</span>
                                    </p>
                                    {featuresList.map((feat: any, fIdx: number) => {
                                      const featText = typeof feat === "string" ? feat : feat?.title || feat?.name;
                                      if (!featText) return null;
                                      return (
                                        <p key={fIdx} className="flex items-center gap-2">
                                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                          <span>{featText}</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-rose-100 text-center">
                                  <div className="mb-4">
                                    <p className="text-2xl font-serif font-bold text-slate-900">₹{pkg.price}</p>
                                    <span className="text-[11px] text-slate-500">for {pkg.durationDays || 30} days</span>
                                  </div>
                                  <button
                                    onClick={() => handleBuyPlan(pkg)}
                                    disabled={isSubscribing}
                                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-[#7E2248] hover:bg-[#681938] text-white shadow-md shadow-[#7E2248]/20 cursor-pointer ${
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
            </div>
          )}
        </main>
      </div>

      {/* Individual Event Attendees Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-white border border-rose-100 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-rose-100 shrink-0 bg-white">
              <div>
                <div className="text-xs font-semibold text-[#7E2248] uppercase">{selectedEventForModal.category}</div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">{selectedEventForModal.title}</h3>
                <p className="text-xs text-slate-500">
                  {selectedEventForModal.location}, {selectedEventForModal.city} • {new Date(selectedEventForModal.date).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6 space-y-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Confirmed Attendees for this Event
              </h4>

              {bookings.filter((b) => b.eventId === selectedEventForModal.id).length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm bg-[#FAF3F6] rounded-2xl border border-rose-100">
                  No attendees have reserved a spot for this event yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings
                    .filter((b) => b.eventId === selectedEventForModal.id)
                    .map((b) => (
                      <div
                        key={b.id}
                        className="bg-[#FAF3F6] p-4 rounded-2xl border border-rose-100 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7E2248] to-rose-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {b.user.name ? b.user.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{b.user.name}</div>
                            <div className="text-xs text-slate-500">
                              {b.user.email} {b.user.phone && `• ${b.user.phone}`}
                            </div>
                            <div className="text-[11px] text-[#7E2248] font-semibold mt-0.5">
                              🎟️ {b.spots || 1} {(b.spots || 1) === 1 ? 'seat' : 'seats'} • {b.totalAmount ? `₹${b.totalAmount.toLocaleString("en-IN")}` : 'Free Pass'} • Status: <span className="font-bold">{b.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {b.status !== "CHECKED_IN" ? (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CHECKED_IN")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Check In
                            </button>
                          ) : (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Revert
                            </button>
                          )}
                          {b.status !== "CANCELLED" && (
                            <button
                              disabled={updatingBookingId === b.id}
                              onClick={() => handleStatusChange(b.id, "CANCELLED")}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
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
            <div className="p-4 sm:p-5 border-t border-rose-100 bg-[#FAF3F6]/50 flex justify-end shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setSelectedEventForModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-rose-100 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-rose-100 shrink-0 bg-white">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-bold mb-1.5 border border-rose-200">
                  <Plus className="w-3.5 h-3.5" />
                  New Experience Creation
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Post an offline single event, speed dating night, dance dating party, or group travel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
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
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formErrors.general || "Please fix the highlighted validation errors before saving."}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Event Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Event Title *
                    </label>
                    <input
                      required
                      placeholder="e.g. Bangalore Friday Speed Dating Mixer"
                      name="title"
                      value={formData.title}
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.title ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Description *
                    </label>
                    <textarea
                      required
                      placeholder="Describe the vibe, icebreakers, agenda, and what participants should expect..."
                      name="description"
                      value={formData.description}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.description ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition h-24`}
                    />
                    {formErrors.description && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => handleFieldChange("category", e.target.value)}
                      className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      City *
                    </label>
                    <input
                      required
                      placeholder="e.g. Bangalore, Mumbai, Delhi"
                      name="city"
                      value={formData.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.city ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                    />
                    {formErrors.city && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Venue / Location *
                    </label>
                    <input
                      required
                      placeholder="e.g. The Bier Library, Koramangala"
                      name="location"
                      value={formData.location}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.location ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                    />
                    {formErrors.location && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.location}
                      </p>
                    )}
                  </div>

                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Start Date & Time *
                    </label>
                    <input
                      required
                      type="datetime-local"
                      min={getMinLocalDateTime()}
                      name="date"
                      value={formData.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.date ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Must be a future date and time (past dates and yesterday are disabled).
                    </p>
                    {formErrors.date && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.date}
                      </p>
                    )}
                  </div>

                  {/* Return / End Date or Ticket Price */}
                  {formData.category === "Singles Travels" ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Return / End Date *
                      </label>
                      <input
                        required
                        type="datetime-local"
                        min={formData.date || getMinLocalDateTime()}
                        name="endDate"
                        value={formData.endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className={`w-full bg-[#FDFBF9] border ${
                          formErrors.endDate ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                        } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Must be after the start date and time.
                      </p>
                      {formErrors.endDate && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.endDate}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Ticket Price (₹) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={(e) => handleFieldChange("price", Number(e.target.value))}
                        className={`w-full bg-[#FDFBF9] border ${
                          formErrors.price ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                        } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                      />
                      {formErrors.price && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.price}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Trip Package Price (Singles Travels) */}
                  {formData.category === "Singles Travels" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Trip Package Price (₹) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        name="price"
                        value={formData.price}
                        onChange={(e) => handleFieldChange("price", Number(e.target.value))}
                        className={`w-full bg-[#FDFBF9] border ${
                          formErrors.price ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                        } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                      />
                      {formErrors.price && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.price}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Max Capacity */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className={`w-full bg-[#FDFBF9] border ${
                        formErrors.maxAttendees ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                      } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                    />
                    {formErrors.maxAttendees && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {formErrors.maxAttendees}
                      </p>
                    )}
                  </div>

                  {/* Speed Dating Age Range */}
                  {formData.category === "Speed dating" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Age Bracket (e.g. 24 - 32 years) *
                      </label>
                      <input
                        name="ageRange"
                        placeholder="24 - 32"
                        value={formData.ageRange}
                        onChange={(e) => handleFieldChange("ageRange", e.target.value)}
                        className={`w-full bg-[#FDFBF9] border ${
                          formErrors.ageRange ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30" : "border-rose-200 focus:border-[#7E2248] focus:bg-white"
                        } rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition`}
                      />
                      {formErrors.ageRange && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.ageRange}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Singles Travels Itinerary */}
                  {formData.category === "Singles Travels" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Travel Itinerary & Inclusions
                      </label>
                      <textarea
                        name="itinerary"
                        placeholder="Day 1: Arrival & Sunset Beach Mixer... Day 2: Trekking & Bonfire..."
                        value={formData.itinerary}
                        onChange={(e) => handleFieldChange("itinerary", e.target.value)}
                        className="w-full bg-[#FDFBF9] border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#7E2248] focus:bg-white transition h-20"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-4 sm:p-5 border-t border-rose-100 bg-[#FAF3F6]/50 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-rose-50 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-md shadow-[#7E2248]/25 cursor-pointer inline-flex items-center gap-2"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingEventId ? "Save Changes" : "Publish Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Popup Modal */}
      {popupConfig.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-rose-50 transition cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Dynamic Animated Sticker */}
            <div className="relative pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-md border select-none transform hover:scale-105 transition ${
                  popupConfig.type === "success"
                    ? "bg-emerald-50 border-emerald-200 ring-4 ring-emerald-50"
                    : popupConfig.type === "error"
                    ? "bg-rose-50 border-rose-200 ring-4 ring-rose-50"
                    : popupConfig.type === "warning"
                    ? "bg-amber-50 border-amber-200 ring-4 ring-amber-50"
                    : popupConfig.type === "confirm"
                    ? "bg-rose-50 border-rose-200 ring-4 ring-rose-50"
                    : "bg-sky-50 border-sky-200 ring-4 ring-sky-50"
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
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : popupConfig.type === "error"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : popupConfig.type === "warning"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : popupConfig.type === "confirm"
                    ? "bg-rose-50 text-[#7E2248] border border-rose-200"
                    : "bg-sky-50 text-sky-800 border border-sky-200"
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
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {popupConfig.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal px-2">
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
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                  >
                    {popupConfig.cancelText || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (popupConfig.onConfirm) popupConfig.onConfirm();
                      closePopup();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                      className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
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
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#7E2248] hover:bg-[#681938] text-white font-extrabold text-sm shadow-md shadow-[#7E2248]/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {popupConfig.confirmText || "Got It! ✨"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification - Centered */}
      {toastConfig.isOpen && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[130] w-full max-w-md px-4 animate-in slide-in-from-top-4 zoom-in-95 duration-200 pointer-events-auto">
          <div
            className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white/98 backdrop-blur-2xl border shadow-xl text-left ${
              toastConfig.type === "success"
                ? "border-emerald-200 text-emerald-900"
                : toastConfig.type === "warning"
                ? "border-amber-200 text-amber-900"
                : toastConfig.type === "error"
                ? "border-rose-200 text-rose-900"
                : "border-sky-200 text-sky-900"
            }`}
          >
            <span className="text-2xl shrink-0 select-none animate-bounce">{toastConfig.sticker}</span>
            <div className="flex-1 text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
              {toastConfig.message}
            </div>
            <button
              onClick={() => setToastConfig((prev) => ({ ...prev, isOpen: false }))}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
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
