import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Clock } from "lucide-react";

export default function BuddyMessagesTab({ acceptedUsers }: { acceptedUsers: any[] }) {
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(15 * 60);
  const [bothActive, setBothActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeReqId && acceptedUsers.length > 0) {
      setActiveReqId(acceptedUsers[0].id);
    }
  }, [acceptedUsers, activeReqId]);

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
    <div className="h-[600px] flex flex-col space-y-4">
      <h2 className="text-2xl font-bold font-serif text-slate-800">Messages</h2>
      
      <div className="flex-1 bg-white border border-slate-200 rounded-xl flex shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">Active Chats</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {acceptedUsers.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-4">No active chats</p>
            ) : (
              acceptedUsers.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setActiveReqId(req.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                    activeReqId === req.id
                      ? "bg-teal-50 border border-teal-100"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {req.user.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 truncate">{req.user.name}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col bg-white">
          {activeReq ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">{activeReq.user.name[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{activeReq.user.name}</p>
                    <p className="text-xs text-teal-600 flex items-center gap-1 font-medium">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${timerSeconds < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">{formatTime(timerSeconds)}</span>
                  </div>
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${bothActive ? 'text-teal-600' : 'text-amber-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${bothActive ? 'bg-teal-500 animate-pulse' : 'bg-amber-400'}`} />
                    {bothActive ? 'Live' : 'Paused (User Away)'}
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.length === 0 && (
                  <div className="text-center mt-10 text-sm text-slate-500">Say hi to {activeReq.user.name}!</div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.senderRole === "BUDDY" ? "justify-end" : "justify-start"}`}>
                    <div className={`${msg.senderRole === "BUDDY" ? "bg-teal-500 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"} shadow-sm rounded-2xl px-4 py-2 max-w-[80%]`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.senderRole === "BUDDY" ? "text-teal-100 text-right" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={timerSeconds === 0 ? "Time's up! User must subscribe." : "Type your message..."}
                  disabled={timerSeconds === 0}
                  className="flex-1 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={timerSeconds === 0}
                  className="px-6 py-2 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a chat to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
