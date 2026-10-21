"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  ShieldCheck,
  User,
  Clock,
  Lock,
  Phone
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/lib/socketUrl";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";

interface MessagesViewProps {
  userName: string;
  userId?: string;
  connections?: any[];
}

export default function MessagesView({ userName, userId, connections = [] }: MessagesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get("requestId");

  const [requests, setRequests] = useState<any[]>([]);
  const [activeReqId, setActiveReqId] = useState<string | null>(initialRequestId);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(30 * 60); // 30 mins shared pool
  const [chatLimitSeconds, setChatLimitSeconds] = useState(1800);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [packagesViewMode, setPackagesViewMode] = useState<"summary" | "plans">("plans");
  const [activeCallOverlay, setActiveCallOverlay] = useState<any | null>(null);
  const [bothActive, setBothActive] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRequests();
    fetchPackages();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for incoming calls and real-time buddy messages on /dashboard?tab=messages
  useEffect(() => {
    const s = io(getSocketUrl(), { withCredentials: true });
    s.on("connect", () => {
      if (userId) {
        s.emit("join-user-room", userId);
      }
    });

    // Global incoming calls handled by DashboardSidebar

    s.on("new-buddy-message", (data) => {
      if (data?.requestId && data.requestId === activeReqId) {
        fetchMessages();
      }
      fetchRequests();
    });

    return () => {
      s.disconnect();
    };
  }, [userId, activeReqId]);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/services/packages/breakup-buddy", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.packages) {
        setAvailablePackages(data.packages);
      }
    } catch (e) {}
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (pkg: any) => {
    if (!activeReqId) return;
    setPaymentStatus("processing");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay payment gateway.");
        setPaymentStatus("idle");
        return;
      }

      const orderRes = await fetch("/api/services/packages/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: pkg.id,
          requestId: activeReqId,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "Failed to create payment order.");
        setPaymentStatus("idle");
        return;
      }

      const options = {
        key: orderData.keyId || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JabWeMeet",
        description: pkg.name,
        order_id: orderData.orderId,
        theme: {
          color: "#7E2248",
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/services/packages/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                requestId: activeReqId,
                packageId: pkg.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setHasActivePackage(true);
              setPaymentStatus("success");
              await fetchMessages();
              await fetchRequests();
              setTimeout(() => {
                setShowSubscription(false);
                setPaymentStatus("idle");
                setPackagesViewMode("plans");
              }, 1500);
            } else {
              alert(verifyData.message || "Payment verification failed.");
              setPaymentStatus("idle");
            }
          } catch (e) {
            alert("Error verifying payment.");
            setPaymentStatus("idle");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      alert("Error activating subscription");
      setPaymentStatus("idle");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/services/my-buddy-requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {}
  };

  // Combine buddy requests and connections into a unified list
  const activeChats = [
    ...requests.map((req) => {
      const buddyName = req.buddy?.displayName || req.buddy?.name || "Breakup Buddy";
      return {
        id: req.id,
        type: "buddy" as const,
        name: buddyName,
        subtitle: "Breakup Buddy Support",
        initial: (buddyName[0] || "B").toUpperCase(),
        raw: req,
      };
    }),
    ...connections
      .filter((c) => c.status === "DateFixed" || c.status === "BothApproved")
      .map((conn) => {
        const isClient = conn.client.id === userId;
        const otherPerson = isClient ? conn.suggestedProfile : conn.client;
        return {
          id: conn.id,
          type: "connection" as const,
          name: otherPerson.name,
          subtitle: "Match Connection",
          initial: otherPerson.name[0],
          raw: conn,
        };
      }),
  ];

  const activeChat = activeChats.find((c) => c.id === activeReqId);

  useEffect(() => {
    // If activeReqId is invalid or null but we have chats, select the first one
    if ((!activeReqId || !activeChats.find((c) => c.id === activeReqId)) && activeChats.length > 0) {
      const initMatch = activeChats.find((c) => c.id === initialRequestId);
      setActiveReqId(initMatch ? initMatch.id : activeChats[0].id);
    }
  }, [requests, connections, activeReqId, initialRequestId]);

  useEffect(() => {
    if (!activeReqId || !activeChat) return;
    setQuotaLoaded(false);
    setShowSubscription(false);
    fetchMessages();
    sendPresence(true); // Notify Breakup Buddy ONCE when user enters chat

    const msgInterval = setInterval(fetchMessages, 3000);
    const presenceInterval = setInterval(() => sendPresence(false), 4000);

    // Visibility change to instantly pause when changing tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activeChat.type === "buddy") {
          navigator.sendBeacon(`/api/services/buddy-away/${activeReqId}`);
        }
      } else {
        sendPresence(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(msgInterval);
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (activeChat.type === "buddy") {
        navigator.sendBeacon(`/api/services/buddy-away/${activeReqId}`);
      }
    };
  }, [activeReqId, activeChat?.type]);

  const fetchMessages = async () => {
    if (!activeReqId || !activeChat) return;
    try {
      if (activeChat.type === "buddy") {
        const res = await fetch(`/api/services/buddy-chat/${activeReqId}?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          const limit = data.totalLimitSeconds ?? data.chatLimitSeconds ?? 1800;
          const used = data.totalUsedSeconds ?? ((data.timeUsedSeconds || 0) + (data.voiceCallSeconds || 0));
          const rem = data.remainingSeconds ?? Math.max(0, limit - used);
          setChatLimitSeconds(limit);
          setTimerSeconds(rem);
          setHasActivePackage(!!data.hasActivePackage);
          setQuotaLoaded(true);
          scrollToBottom();
        }
      } else if (activeChat.type === "connection") {
        const res = await fetch(`/api/auth/connections/${activeReqId}/messages?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              text: m.content,
              senderRole: m.senderId === userId ? "USER" : "OTHER",
              createdAt: m.createdAt,
            }))
          );
          scrollToBottom();
        }
      }
    } catch (e) {}
  };

  const sendPresence = async (isInitialEntry = false) => {
    if (!activeReqId || !activeChat) return;
    if (activeChat.type !== "buddy") return; // Presence only for buddy chat
    if (activeCallOverlay) return; // Do not double-count chat presence while in an active voice call
    try {
      const res = await fetch(`/api/services/buddy-presence/${activeReqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entered: isInitialEntry }),
      });
      const data = await res.json();
      if (data.success) {
        setBothActive(data.data.bothActive);
        const limit = data.data.totalLimitSeconds ?? data.data.chatLimitSeconds ?? 1800;
        const used = data.data.totalUsedSeconds ?? ((data.data.timeUsedSeconds || 0) + (data.data.voiceCallSeconds || 0));
        const rem = data.data.remainingSeconds ?? Math.max(0, limit - used);
        setChatLimitSeconds(limit);
        setTimerSeconds(rem);
        setHasActivePackage(!!data.data.hasActivePackage);
        setQuotaLoaded(true);
      }
    } catch (e) {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeChat?.type === "buddy" && bothActive && !activeCallOverlay && !showSubscription) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setShowSubscription(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bothActive, showSubscription, activeChat?.type, activeCallOverlay]);

  // Show subscription modal when the 30-min free quota hits 0
  useEffect(() => {
    if (
      activeChat?.type === "buddy" &&
      quotaLoaded &&
      timerSeconds === 0 &&
      !showSubscription &&
      paymentStatus === "idle"
    ) {
      setShowSubscription(true);
    }
  }, [timerSeconds, quotaLoaded, showSubscription, paymentStatus, activeChat?.type]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeReqId || !activeChat) return;
    if (activeChat.type === "buddy" && timerSeconds === 0) {
      setShowSubscription(true);
      return;
    }

    try {
      const text = newMessage;
      setNewMessage(""); // Optimistic clear

      if (activeChat.type === "buddy") {
        const res = await fetch(`/api/services/buddy-chat/${activeReqId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!data.success && data.limitReached) {
          setTimerSeconds(0);
          setShowSubscription(true);
          return;
        }
      } else {
        await fetch(`/api/auth/connections/${activeReqId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: text }),
        });
      }
      fetchMessages();
    } catch (e) {}
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const usedSeconds = Math.max(0, chatLimitSeconds - timerSeconds);

  return (
    <div className="space-y-6 relative">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
          <MessageCircle className="w-3.5 h-3.5 text-[#7E2248]" />
          Direct Communication
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Member Messages
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Chat securely with Relationship Managers, Breakup Buddies, and verified connections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-3xl bg-white border border-rose-100 overflow-hidden shadow-sm min-h-[550px]">
        {/* Sidebar */}
        <div className="border-r border-rose-100 flex flex-col bg-rose-50/20">
          <div className="p-4 border-b border-rose-100">
            <h3 className="text-sm font-serif font-bold text-slate-900 mb-1">Active Chats</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeChats.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-4">No active chats</p>
            ) : (
              activeChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveReqId(chat.id)}
                  className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${
                    activeReqId === chat.id
                      ? "bg-white border border-rose-200 shadow-xs"
                      : "hover:bg-rose-50/60"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs ${
                      chat.type === "buddy"
                        ? "bg-gradient-to-br from-[#7E2248] to-[#5c1331]"
                        : "bg-gradient-to-br from-[#7E2248] to-[#9b315b]"
                    }`}
                  >
                    {chat.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-slate-900 truncate">{chat.name}</span>
                      {chat.type === "buddy" && chat.raw?.remainingSeconds !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-[#7E2248] bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                          {formatTime(chat.id === activeReqId ? timerSeconds : chat.raw.remainingSeconds)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{chat.subtitle}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active Chat Thread */}
        <div className="md:col-span-2 flex flex-col h-[550px] bg-white relative">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs ${
                      activeChat.type === "buddy"
                        ? "bg-gradient-to-br from-[#7E2248] to-[#5c1331]"
                        : "bg-gradient-to-br from-[#7E2248] to-[#9b315b]"
                    }`}
                  >
                    {activeChat.initial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-serif font-bold text-slate-900">{activeChat.name}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">{activeChat.subtitle}</p>
                  </div>
                </div>

                {activeChat.type === "buddy" && (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => {
                        if (timerSeconds <= 0) {
                          setShowSubscription(true);
                          return;
                        }
                        setActiveCallOverlay({
                          requestId: activeReqId,
                          buddyId: activeChat.raw?.buddyId,
                          callerName: userName,
                          targetName: activeChat.name,
                          role: "USER",
                          isInitiator: true,
                        });
                      }}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        timerSeconds === 0
                          ? "bg-red-100 border-red-300 text-red-800"
                          : timerSeconds < 300
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-rose-50 border-rose-200 text-[#7E2248]"
                      }`}
                      title="Shared 30-minute free quota across Call & Chat (counts only when both are active)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-mono font-bold">
                        {formatTime(timerSeconds)} left
                      </span>
                      <span className="text-[10px] font-mono opacity-75 hidden sm:inline">
                        (Used {formatTime(usedSeconds)}/{formatTime(chatLimitSeconds)})
                      </span>
                    </div>

                    {hasActivePackage && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-800">
                        <span className="text-[10px] font-bold">Pass Active</span>
                      </div>
                    )}

                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        bothActive ? "text-emerald-700" : "text-amber-700"
                      }`}
                      title={
                        bothActive
                          ? "Both you and Breakup Buddy are active — timer is counting"
                          : "Waiting for both to be active — timer is paused"
                      }
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          bothActive ? "bg-emerald-600 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {bothActive ? "Live" : "Paused"}
                    </span>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FDFBF9]">
                {messages.length === 0 && (
                  <div className="text-center mt-10">
                    <p className="text-xs text-slate-500">No messages yet. Say hi!</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.senderRole === "USER" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.senderRole === "USER"
                          ? "bg-[#7E2248] text-white rounded-br-none shadow-xs"
                          : "bg-white text-slate-800 rounded-bl-none border border-rose-100 shadow-2xs"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-rose-100 bg-white flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    activeChat.type === "buddy" && timerSeconds === 0
                      ? "30-minute free session ended. Subscription required."
                      : "Type your message..."
                  }
                  disabled={activeChat.type === "buddy" && timerSeconds === 0}
                  className="flex-1 bg-[#FDFBF9] border border-rose-200 rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {activeChat.type === "buddy" && timerSeconds === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowSubscription(true)}
                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Buy Pass</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={activeChat.type === "buddy" && timerSeconds === 0}
                    className="px-5 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a chat to view messages
            </div>
          )}
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      {showSubscription && activeChat?.type === "buddy" && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative transition-all">
            {paymentStatus === "success" ? (
              <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Subscription Activated!</h2>
                <p className="text-slate-600 text-sm">Unlimited calls and chats are now active with {activeChat.name}.</p>
              </div>
            ) : paymentStatus === "processing" ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 border-4 border-[#7E2248]/30 border-t-[#7E2248] rounded-full animate-spin mx-auto"></div>
                <h2 className="text-xl font-serif font-bold text-slate-900 animate-pulse">Activating Subscription...</h2>
              </div>
            ) : (
              <>
                <div className="text-center space-y-3 mb-6">
                  <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                    30-Minute Free Session Ended
                  </h2>

                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      You have completed your <strong>30 minutes of free Call &amp; Chat</strong> with{" "}
                      <strong>{activeChat.name}</strong>.
                    </p>

                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 max-w-md mx-auto">
                      ⚠️ To continue calling or chatting with {activeChat.name}, please subscribe to a package below.
                    </div>
                  </div>
                </div>

                {packagesViewMode === "summary" ? (
                  <div className="space-y-3 max-w-md mx-auto">
                    <button
                      onClick={() => setPackagesViewMode("plans")}
                      className="w-full py-3 px-4 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#7E2248]/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>⭐ Select a Subscription Plan</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSubscription(false);
                        router.push("/dashboard?tab=packages");
                      }}
                      className="w-full py-3 px-4 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7E2248] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>View All Packages</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        onClick={() => setShowSubscription(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 transition underline cursor-pointer"
                      >
                        Close &amp; View Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                      <span className="text-xs text-slate-600 font-semibold">Choose a Pass</span>
                      <span className="text-xs text-emerald-800 font-bold">Unlimited Calls &amp; Chats</span>
                    </div>

                    {availablePackages.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs bg-rose-50/40 rounded-2xl border border-rose-100 space-y-3">
                        <p>No packages currently loaded.</p>
                        <button
                          onClick={() => {
                            setShowSubscription(false);
                            router.push("/dashboard?tab=packages");
                          }}
                          className="px-4 py-2 rounded-full bg-[#7E2248] text-white font-bold text-xs cursor-pointer"
                        >
                          Go to Packages Tab
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                        {availablePackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="p-4 rounded-2xl bg-white border border-rose-100 hover:border-emerald-300 transition flex flex-col justify-between text-left shadow-xs"
                          >
                            <div>
                              <h4 className="text-sm font-serif font-bold text-slate-900">{pkg.name}</h4>
                              <div className="text-xs text-purple-700 font-semibold mt-0.5">
                                {pkg.durationHours || 1} {pkg.durationHours === 1 ? "Hour" : "Hours"} Pass
                              </div>
                              <div className="text-lg font-serif font-black text-emerald-700 mt-2">₹{pkg.price}</div>
                              {pkg.description && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handlePayment(pkg)}
                              className="mt-3 w-full py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              Buy &amp; Continue
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex text-slate-400 text-[11px] items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> 100% Secure &amp; Confidential
                      </div>
                      <button
                        onClick={() => setShowSubscription(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 transition underline cursor-pointer"
                      >
                        Close &amp; View Chat
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Voice Call Overlay Modal */}
      {activeCallOverlay && (
        <VoiceCallOverlay
          requestId={activeCallOverlay.requestId}
          buddyId={activeCallOverlay.buddyId}
          callerName={activeCallOverlay.callerName || userName}
          targetName={activeCallOverlay.targetName}
          role={activeCallOverlay.role}
          isInitiator={activeCallOverlay.isInitiator}
          autoAccept={activeCallOverlay.autoAccept}
          initialCallLogId={activeCallOverlay.initialCallLogId}
          onClose={() => {
            setActiveCallOverlay(null);
            fetchMessages();
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
