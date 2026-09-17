"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  ShieldCheck,
  Search,
  CheckCheck,
  User,
  Clock,
  Lock,
  CreditCard
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface MessagesViewProps {
  userName: string;
  userId?: string;
  connections?: any[];
}

<<<<<<< HEAD
export default function MessagesView({ userName, userId, connections = [] }: MessagesViewProps) {
  const [conversations, setConversations] = useState([
    {
      id: "conv-1",
      name: "JabWeMeet Support & Matchmaking Desk",
      role: "Relationship Specialist",
      unread: 1,
      lastMessage: "Welcome to JabWeMeet! Let us know if you need help with introductions.",
      time: "10:30 AM",
      messages: [
        {
          sender: "them",
          text: `Hello ${userName.split(" ")[0]}! Welcome to JabWeMeet. Your account is verified and ready for curated introductions.`,
          time: "10:28 AM",
        },
        {
          sender: "them",
          text: "Welcome to JabWeMeet! Let us know if you need help with introductions.",
          time: "10:30 AM",
        },
      ],
    },
  ]);
=======
export default function MessagesView({ userName }: MessagesViewProps) {
  const searchParams = useSearchParams();
  const initialRequestId = searchParams.get('requestId');
>>>>>>> 8c970fdf7b685ef2ef7ba4308b727a02afe31748

  const [requests, setRequests] = useState<any[]>([]);
  const [activeReqId, setActiveReqId] = useState<string | null>(initialRequestId);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(15 * 60); // 15 mins
  const [chatLimitSeconds, setChatLimitSeconds] = useState(900);
  const [bothActive, setBothActive] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);


  const handlePayment = async (durationSeconds: number) => {
    setPaymentStatus("processing");
    setTimeout(async () => {
      try {
        if (activeReqId) {
          await fetch(`/api/services/buddy-subscribe/${activeReqId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: 'chat', durationSeconds }),
            credentials: "include"
          });
          setChatLimitSeconds(durationSeconds);
          setTimerSeconds(durationSeconds); // update UI timer
        }
      } catch(e) {}
      
      setPaymentStatus("success");
      setTimeout(() => {
        setShowSubscription(false);
        setPaymentStatus("idle");
      }, 2000);
    }, 1500);
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/services/my-buddy-requests", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
        if (!activeReqId && data.data.length > 0) {
          setActiveReqId(data.data[0].id);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!activeReqId) return;
    fetchMessages();
    sendPresence(); // Call immediately on mount
    
    const msgInterval = setInterval(fetchMessages, 3000);
    const presenceInterval = setInterval(sendPresence, 5000);

    // Visibility change to instantly pause when changing tabs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        navigator.sendBeacon(`/api/services/buddy-away/${activeReqId}`);
      } else {
        sendPresence();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(msgInterval);
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.sendBeacon(`/api/services/buddy-away/${activeReqId}`);
    };
  }, [activeReqId]);

  const fetchMessages = async () => {
    if (!activeReqId) return;
    try {
      const res = await fetch(`/api/services/buddy-chat/${activeReqId}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        if (data.chatLimitSeconds) setChatLimitSeconds(data.chatLimitSeconds);
        if (data.timeUsedSeconds !== undefined) {
          const limit = data.chatLimitSeconds || 900;
          setTimerSeconds(Math.max(0, limit - data.timeUsedSeconds));
        }
        scrollToBottom();
      }
    } catch (e) {}
  };

  const sendPresence = async () => {
    if (!activeReqId) return;
    try {
      const res = await fetch(`/api/services/buddy-presence/${activeReqId}`, { 
        method: 'POST',
        credentials: "include" 
      });
      const data = await res.json();
      if (data.success) {
        setBothActive(data.data.bothActive);
        if (data.data.chatLimitSeconds) setChatLimitSeconds(data.data.chatLimitSeconds);
        if (data.data.timeUsedSeconds !== undefined) {
          const limit = data.data.chatLimitSeconds || 900;
          setTimerSeconds(Math.max(0, limit - data.data.timeUsedSeconds));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bothActive && timerSeconds > 0 && !showSubscription) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setShowSubscription(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bothActive, timerSeconds, showSubscription]);

  // Force show subscription if timer hits 0 on load or any other time
  useEffect(() => {
    if (timerSeconds === 0 && !showSubscription && paymentStatus === "idle") {
      setShowSubscription(true);
    }
  }, [timerSeconds, showSubscription, paymentStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeReqId || timerSeconds === 0) return;

    try {
      const text = newMessage;
      setNewMessage(""); // Optimistic clear
      await fetch(`/api/services/buddy-chat/${activeReqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text })
      });
      fetchMessages();
    } catch (e) {}
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeReq = requests.find(r => r.id === activeReqId);

  return (
    <div className="space-y-6 relative">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
          <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
          Direct Communication
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Member Messages
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Chat securely with Relationship Managers, Breakup Buddies, and verified connections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-3xl bg-[#131d2e] border border-white/10 overflow-hidden shadow-2xl min-h-[550px]">
        {/* Sidebar */}
        <div className="border-r border-white/10 flex flex-col bg-[#0f172a]">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white mb-2">Accepted Requests</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {requests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-4">No active chats</p>
            ) : (
              requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setActiveReqId(req.id)}
                  className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 ${
                    activeReqId === req.id
                      ? "bg-[#e06d53]/15 border border-[#e06d53]/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {req.buddy.displayName ? req.buddy.displayName[0] : req.buddy.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{req.buddy.displayName || req.buddy.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">Breakup Buddy</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active Chat Thread */}
        <div className="md:col-span-2 flex flex-col h-[550px] bg-[#131d2e] relative">
          {activeReq ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#162238]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-sm">
                    {activeReq.buddy.displayName ? activeReq.buddy.displayName[0] : activeReq.buddy.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{activeReq.buddy.displayName || activeReq.buddy.name}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">Breakup Buddy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {chatLimitSeconds > 900 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        <span className="text-xs font-bold">Premium Active</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${timerSeconds < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-bold">{formatTime(timerSeconds)}</span>
                      </div>
                    )}
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${bothActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${bothActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {bothActive ? 'Live' : 'Paused (Buddy Away)'}
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
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
                          ? "bg-[#e06d53] text-white rounded-br-none shadow-md"
                          : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-[#0f172a] flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={timerSeconds === 0 ? "Time's up! Subscription required." : "Type your message..."}
                  disabled={timerSeconds === 0}
                  className="flex-1 bg-[#131d2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={timerSeconds === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a chat to view messages
            </div>
          )}
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      {showSubscription && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative transition-all duration-300">
            {paymentStatus === "success" ? (
              <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
                <p className="text-slate-400">Your limits have been reset. Resuming your session...</p>
              </div>
            ) : paymentStatus === "processing" ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <h2 className="text-xl font-bold text-white animate-pulse">Processing Payment securely...</h2>
              </div>
            ) : (
              <>
                <div className="text-center space-y-3 mb-8">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Time Limit Reached</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Your current chat time with {activeReq?.buddy.displayName || 'your buddy'} has ended. Subscribe to a plan to continue your session securely.
                </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Quick Check-in", duration: "2 Hours", price: "₹199", popular: false, seconds: 2 * 3600 },
                    { name: "Full Day Support", duration: "24 Hours", price: "₹399", popular: true, seconds: 24 * 3600 },
                    { name: "Weekly Guidance", duration: "1 Week", price: "₹999", popular: false, seconds: 7 * 24 * 3600 },
                    { name: "Healing Journey", duration: "1 Month", price: "₹2,499", popular: false, seconds: 30 * 24 * 3600 },
                  ].map((plan, i) => (
                    <button
                      key={i}
                      onClick={() => handlePayment(plan.seconds)}
                      className={`relative p-5 rounded-2xl border text-left transition hover:scale-[1.02] active:scale-95 flex flex-col justify-between ${
                        plan.popular
                          ? "bg-gradient-to-br from-[#e06d53]/10 to-amber-500/10 border-[#e06d53]/50 hover:border-[#e06d53]"
                          : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e06d53] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white">{plan.duration}</h3>
                        <p className="text-[11px] text-slate-400 mb-4">{plan.name}</p>
                      </div>
                      <div className="flex items-center justify-between w-full mt-2">
                        <div className="text-xl font-bold text-emerald-400">{plan.price}</div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition">
                          Pay Now
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex justify-center text-slate-400 text-xs items-center gap-2">
                  <Lock className="w-4 h-4" /> 100% Secure & Confidential Payment
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
