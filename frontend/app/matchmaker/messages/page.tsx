"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Paperclip, MoreVertical, Search, Phone, Video } from "lucide-react";

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMyId(data.user.id);
        }
      });
  }, []);

  useEffect(() => {
    if (myId) {
      const fetchChat = () => {
        fetch("/api/auth/chat/admin", { credentials: "include" })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setChat(data.messages.map((m: any) => ({
                id: m.id,
                sender: m.senderId === myId ? 'me' : 'admin',
                text: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              })));
            }
          })
          .catch(console.error);
      };

      fetchChat(); // Initial fetch
      const interval = setInterval(fetchChat, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [myId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage(""); // optimistic clear

    try {
      const res = await fetch("/api/auth/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        const newMessage = { 
          id: data.message.id, 
          sender: "me", 
          text: data.message.content, 
          time: new Date(data.message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setChat(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-lg text-slate-800">Messages</h2>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-rose-50 border-l-4 border-rose-500 cursor-pointer flex gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 border border-rose-200 text-lg">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-900 truncate">System Admin</h3>
                <span className="text-[10px] text-slate-500 shrink-0 mt-1">Just now</span>
              </div>
              <p className="text-xs text-slate-600 truncate">Support channel active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center border border-rose-200">
              A
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">System Admin</h2>
              <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'me' ? 'bg-rose-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'me' ? 'text-rose-200' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
            <button className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl transition shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your message to Admin..." 
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-2 text-sm outline-none text-slate-700 custom-scrollbar placeholder:text-slate-400"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2.5 bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 rounded-xl transition shrink-0 shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
