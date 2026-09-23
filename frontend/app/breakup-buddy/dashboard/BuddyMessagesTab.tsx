"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Clock, ArrowLeft, User } from "lucide-react";

export default function BuddyMessagesTab({
  acceptedUsers,
  initialActiveReqId,
}: {
  acceptedUsers: any[];
  initialActiveReqId?: string;
}) {
  const [activeReqId, setActiveReqId] = useState<string | null>(initialActiveReqId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
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
    sendPresence(); // Call immediately on mount

    const msgInterval = setInterval(fetchMessages, 3000);
    const presenceInterval = setInterval(sendPresence, 5000);

    // Visibility change to instantly pause when changing tabs
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
      // Also send away on unmount
      navigator.sendBeacon(`/api/buddy/away/${activeReqId}`);
    };
  }, [activeReqId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bothActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bothActive, timerSeconds]);

  const fetchMessages = async () => {
    if (!activeReqId) return;
    try {
      const res = await fetch(`/api/buddy/chat/${activeReqId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        if (data.timeUsedSeconds !== undefined) {
          setTimerSeconds(Math.max(0, 900 - data.timeUsedSeconds));
        }
        scrollToBottom();
      }
    } catch (e) {}
  };

  const sendPresence = async () => {
    if (!activeReqId) return;
    try {
      const res = await fetch(`/api/buddy/presence/${activeReqId}`, { 
        method: 'POST', credentials: 'include' 
      });
      const data = await res.json();
      if (data.success) {
        setBothActive(data.data.bothActive);
        if (data.data.timeUsedSeconds !== undefined) {
          setTimerSeconds(Math.max(0, 900 - data.data.timeUsedSeconds));
        }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text })
      });
      fetchMessages();
    } catch (e) {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeReq = acceptedUsers.find(r => r.id === activeReqId);

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 h-[calc(100vh-140px)] min-h-[500px] md:h-[650px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-800">Messages</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time confidential chat with your accepted clients</p>
        </div>
      </div>
      
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row shadow-sm overflow-hidden min-h-0">
        {/* Sidebar / Active Chats List */}
        <div
          className={`w-full md:w-80 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0 ${
            showChatMobile ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Active Chats</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              {acceptedUsers.length} Clients
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {acceptedUsers.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg mx-auto">
                  💬
                </div>
                <p className="text-xs font-semibold text-slate-600">No active chats yet</p>
                <p className="text-[11px] text-slate-400">Accept booking requests to start chatting.</p>
              </div>
            ) : (
              acceptedUsers.map((req) => {
                const isSelected = activeReqId === req.id;
                const u = req.user || {};
                const name = u.name || "Client";
                const initial = name.charAt(0).toUpperCase();

                return (
                  <button
                    key={req.id}
                    onClick={() => {
                      setActiveReqId(req.id);
                      setShowChatMobile(true);
                    }}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 border border-teal-200 shadow-2xs"
                        : "hover:bg-white border border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {u.profileImage ? (
                        <img
                          src={u.profileImage}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
                          {initial}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{name}</span>
                        {req.sessionType && (
                          <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 shrink-0">
                            {req.sessionType.includes("call") ? "🎧 Call" : "💬 Chat"}
                          </span>
                        )}
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
              <div className="px-3 sm:px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 bg-white shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobile Back to List Button */}
                  <button
                    type="button"
                    onClick={() => setShowChatMobile(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Back to Chats list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
                      {activeReq.user?.name ? activeReq.user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{activeReq.user?.name || "Client"}</p>
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                    </p>
                  </div>
                </div>

                {/* Status and Timer */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${timerSeconds < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[11px] sm:text-xs font-mono font-bold">{formatTime(timerSeconds)}</span>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${bothActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${bothActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span>{bothActive ? 'Live' : 'Away'}</span>
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 bg-slate-50/50">
                {messages.length === 0 && (
                  <div className="text-center my-10 text-xs sm:text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto shadow-2xs">
                    <p className="text-xl mb-1">👋</p>
                    <p className="font-bold text-slate-700">Start the conversation</p>
                    <p className="text-slate-400 text-xs mt-0.5">Say hello and introduce yourself warmly to {activeReq.user?.name || "your client"}!</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isBuddy = msg.senderRole === "BUDDY";
                  return (
                    <div key={i} className={`flex ${isBuddy ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`${
                          isBuddy
                            ? "bg-teal-600 text-white rounded-tr-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                        } shadow-2xs rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 max-w-[85%] sm:max-w-[75%] break-words`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 font-medium ${isBuddy ? "text-teal-100 text-right" : "text-slate-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-2.5 sm:p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={timerSeconds === 0 ? "Time's up! User must subscribe." : "Type your message..."}
                  disabled={timerSeconds === 0}
                  className="flex-1 px-3.5 py-2 sm:py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={timerSeconds === 0 || !newMessage.trim()}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No conversation selected</p>
              <p className="text-xs text-slate-400 mt-0.5">Select a client from the left list to begin messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
