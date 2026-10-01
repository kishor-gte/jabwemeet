"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Paperclip, MoreVertical, Search, Phone, Video, Sparkles } from "lucide-react";

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

      fetchChat();
      const interval = setInterval(fetchChat, 3000);

      return () => clearInterval(interval);
    }
  }, [myId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage("");

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
    <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden border border-rose-100 bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-rose-100 bg-[#FAF3F6]/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-rose-100 bg-white">
          <h2 className="font-serif font-bold text-lg text-slate-900">Direct Support</h2>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-[#FDFBF9] border border-rose-200 rounded-xl text-xs text-slate-900 outline-none focus:border-[#7E2248] focus:bg-white transition"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200/80 cursor-pointer flex gap-3 shadow-xs">
            <div className="w-11 h-11 rounded-full bg-rose-100 text-[#7E2248] font-bold flex items-center justify-center shrink-0 border border-rose-200 text-base shadow-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-bold text-xs text-slate-900 truncate">System Administrator</h3>
                <span className="text-[10px] text-slate-400 shrink-0">Live</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">Operations & consultation channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#FDFBF9] relative">
        {/* Header */}
        <div className="h-16 border-b border-rose-100 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-[#7E2248] font-bold flex items-center justify-center border border-rose-200 text-sm shadow-xs">
              A
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm text-slate-900 leading-tight">System Admin Support</h2>
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available for Matchmakers
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-xs ${msg.sender === 'me' ? 'bg-[#7E2248] text-white rounded-tr-xs' : 'bg-white border border-rose-100 text-slate-800 rounded-tl-xs'}`}>
                <p className="text-xs leading-relaxed font-normal">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 text-right font-medium ${msg.sender === 'me' ? 'text-rose-200' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-rose-100">
          <div className="flex items-end gap-2 bg-[#FDFBF9] border border-rose-200 rounded-2xl p-2 focus-within:border-[#7E2248] focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition-all">
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your message to Admin..." 
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none resize-none py-2 px-3 text-xs outline-none text-slate-900 placeholder:text-slate-400 font-medium"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!message.trim()}
              className="p-2.5 bg-[#7E2248] text-white hover:bg-[#681938] disabled:opacity-40 rounded-xl transition shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
