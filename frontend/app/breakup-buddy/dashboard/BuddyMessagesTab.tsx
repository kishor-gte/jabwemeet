"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Clock, ArrowLeft, Phone } from "lucide-react";

export default function BuddyMessagesTab({
  acceptedUsers,
  initialActiveReqId,
  onStartCall,
  isCallActive = false,
}: {
  acceptedUsers: any[];
  initialActiveReqId?: string;
  onStartCall?: (req: any) => void;
  isCallActive?: boolean;
}) {
  const [activeReqId, setActiveReqId] = useState<string | null>(initialActiveReqId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(30 * 60);
  const [totalLimitSeconds, setTotalLimitSeconds] = useState(1800);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [bothActive, setBothActive] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState<boolean>(!!initialActiveReqId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialActiveReqId) {
      setActiveReqId(initialActiveReqId);
      setShowChatMobile(true);
    } else if (!activeReqId && acceptedUsers.length > 0) {
      setActiveReqId(acceptedUsers[0].id);
    }
  }, [acceptedUsers, initialActiveReqId]);

  useEffect(() => {
    if (!activeReqId) return;
    fetchMessages();
    sendPresence();

    const msgInterval = setInterval(fetchMessages, 3000);
    const presenceInterval = setInterval(sendPresence, 4000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        navigator.sendBeacon(`/api/buddy/away/${activeReqId}`);
      } else {
        sendPresence();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(msgInterval);
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.sendBeacon(`/api/buddy/away/${activeReqId}`);
    };
  }, [activeReqId, isCallActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bothActive && !isCallActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bothActive, isCallActive]);

  const fetchMessages = async () => {
    if (!activeReqId) return;
    try {
      const res = await fetch(`/api/buddy/chat/${activeReqId}?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        const limit = data.totalLimitSeconds ?? data.chatLimitSeconds ?? 1800;
        const used = data.totalUsedSeconds ?? ((data.timeUsedSeconds || 0) + (data.voiceCallSeconds || 0));
        const rem = data.remainingSeconds ?? Math.max(0, limit - used);
        setTotalLimitSeconds(limit);
        setTimerSeconds(rem);
        setHasActivePackage(!!data.hasActivePackage);
        scrollToBottom();
      }
    } catch (e) {}
  };

  const sendPresence = async () => {
    if (!activeReqId) return;
    if (isCallActive) return; // Pause chat presence while in an active voice call
    try {
      const res = await fetch(`/api/buddy/presence/${activeReqId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setBothActive(data.data.bothActive);
        const limit = data.data.totalLimitSeconds ?? data.data.chatLimitSeconds ?? 1800;
        const used = data.data.totalUsedSeconds ?? ((data.data.timeUsedSeconds || 0) + (data.data.voiceCallSeconds || 0));
        const rem = data.data.remainingSeconds ?? Math.max(0, limit - used);
        setTotalLimitSeconds(limit);
        setTimerSeconds(rem);
        setHasActivePackage(!!data.data.hasActivePackage);
      }
    } catch (e) {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeReqId || timerSeconds === 0) return;
    try {
      const text = newMessage;
      setNewMessage("");
      await fetch(`/api/buddy/chat/${activeReqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      fetchMessages();
    } catch (e) {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const activeReq = acceptedUsers.find((r) => r.id === activeReqId);
  const usedSeconds = Math.max(0, totalLimitSeconds - timerSeconds);

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 h-[calc(100vh-140px)] min-h-[500px] md:h-[650px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">Messages &amp; Support</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time confidential chat &amp; voice call with your accepted clients
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-rose-100 rounded-3xl flex flex-col md:flex-row shadow-sm overflow-hidden min-h-0">
        {/* Sidebar / Active Chats List */}
        <div
          className={`w-full md:w-80 border-r border-rose-100 bg-[#FAF3F6]/50 flex flex-col shrink-0 ${
            showChatMobile ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-white">
            <h3 className="font-serif font-bold text-slate-900 text-xs sm:text-sm">Active Conversations</h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#7E2248] border border-rose-200">
              {acceptedUsers.length} Clients
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {acceptedUsers.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-[#7E2248] text-lg mx-auto border border-rose-100">
                  💬
                </div>
                <p className="text-xs font-semibold text-slate-700">No active chats yet</p>
                <p className="text-[11px] text-slate-400">Accept booking requests to start chatting.</p>
              </div>
            ) : (
              acceptedUsers.map((req) => {
                const isSelected = activeReqId === req.id;
                const u = req.user || {};
                const name = u.name || "Client";
                const initial = name.charAt(0).toUpperCase();
                const reqRem =
                  isSelected
                    ? timerSeconds
                    : req.remainingSeconds ?? Math.max(0, 1800 - ((req.timeUsedSeconds || 0) + (req.voiceCallSeconds || 0)));

                return (
                  <button
                    key={req.id}
                    onClick={() => {
                      setActiveReqId(req.id);
                      setShowChatMobile(true);
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-rose-50 text-[#7E2248] border border-rose-200 shadow-xs"
                        : "hover:bg-white border border-transparent text-slate-700"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {u.profileImage ? (
                        <img
                          src={u.profileImage}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover border border-rose-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-[#7E2248] flex items-center justify-center font-bold text-sm border border-rose-200 shadow-xs">
                          {initial}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold truncate">{name}</span>
                        <span className="text-[10px] font-mono font-bold text-[#7E2248] bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                          {formatTime(reqRem)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {req.topic || "Tap to chat with client"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !showChatMobile ? "hidden md:flex" : "flex"
          }`}
        >
          {activeReq ? (
            <>
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2.5 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back to List Button */}
                  <button
                    type="button"
                    onClick={() => setShowChatMobile(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Back to Chats list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-[#7E2248] flex items-center justify-center font-bold text-sm border border-rose-200 shadow-xs">
                      {activeReq.user?.name ? activeReq.user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {activeReq.user?.name || "Client"}
                    </p>
                    <p className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Session
                    </p>
                  </div>
                </div>

                {/* Call Button, Status, and Shared 30-Min Timer */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
                  {onStartCall && (
                    <button
                      type="button"
                      onClick={() => onStartCall(activeReq)}
                      disabled={timerSeconds <= 0}
                      className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Start Voice Call with Client"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  )}

                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-xs ${
                      timerSeconds === 0
                        ? "bg-red-100 border-red-300 text-red-800"
                        : timerSeconds < 300
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                    title="Shared 30-minute free quota across Call & Chat (counts only when both are active)"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">{formatTime(timerSeconds)} left</span>
                    <span className="text-[10px] font-mono opacity-75 hidden sm:inline">
                      (Used {formatTime(usedSeconds)}/{formatTime(totalLimitSeconds)})
                    </span>
                  </div>

                  {hasActivePackage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Pass Active
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${
                      bothActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                    title={
                      bothActive
                        ? "Both User and Breakup Buddy are active — timer is counting"
                        : "Waiting for both to be active — timer is paused"
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        bothActive ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <span>{bothActive ? "Live" : "Paused"}</span>
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#FDFBF9]">
                {messages.length === 0 && (
                  <div className="text-center my-10 text-xs sm:text-sm text-slate-500 bg-white border border-rose-100 rounded-3xl p-6 max-w-sm mx-auto shadow-xs">
                    <p className="text-2xl mb-1">👋</p>
                    <p className="font-bold text-slate-900 font-serif">Start the conversation</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Say hello and introduce yourself warmly to {activeReq.user?.name || "your client"}!
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isBuddy = msg.senderRole === "BUDDY";
                  return (
                    <div key={i} className={`flex ${isBuddy ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`${
                          isBuddy
                            ? "bg-[#7E2248] text-white rounded-tr-xs"
                            : "bg-white border border-rose-100 text-slate-900 rounded-tl-xs"
                        } shadow-xs rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[75%] break-words`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 font-medium ${
                            isBuddy ? "text-rose-200 text-right" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3.5 border-t border-rose-100 bg-white flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    timerSeconds === 0
                      ? "30-minute free session ended! User must subscribe to continue."
                      : "Type your message..."
                  }
                  disabled={timerSeconds === 0}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={timerSeconds === 0 || !newMessage.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#7E2248]/20 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-serif font-bold text-slate-800 text-sm">No conversation selected</p>
              <p className="text-xs text-slate-400 mt-0.5">Select a client from the left list to begin messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
