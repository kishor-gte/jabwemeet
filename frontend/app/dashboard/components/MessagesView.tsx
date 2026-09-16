"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Send,
  ShieldCheck,
  Search,
  CheckCheck,
  User,
} from "lucide-react";

interface MessagesViewProps {
  userName: string;
}

export default function MessagesView({ userName }: MessagesViewProps) {
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

  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [newMessage, setNewMessage] = useState("");

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const updated = conversations.map((c) => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMessage,
          time: "Just now",
          messages: [
            ...c.messages,
            { sender: "me", text: newMessage, time: "Just now" },
          ],
        };
      }
      return c;
    });

    setConversations(updated);
    setNewMessage("");

    // Auto-reply simulation from Matchmaker
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return {
              ...c,
              lastMessage: "Thanks for your message! Our coordinator will get back to you shortly.",
              time: "Just now",
              messages: [
                ...c.messages,
                {
                  sender: "them",
                  text: "Thanks for your message! Our coordinator will review your inquiry shortly.",
                  time: "Just now",
                },
              ],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  return (
    <div className="space-y-6">
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
        {/* Conversations Sidebar */}
        <div className="border-r border-white/10 flex flex-col bg-[#0f172a]">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-[#131d2e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 ${
                  activeConvId === conv.id
                    ? "bg-[#e06d53]/15 border border-[#e06d53]/30"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {conv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{conv.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Chat Thread */}
        <div className="md:col-span-2 flex flex-col h-full bg-[#131d2e]">
          {/* Thread Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#162238]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-sm">
                {activeConv.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white">{activeConv.name}</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">{activeConv.role}</p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {activeConv.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === "me" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === "me"
                      ? "bg-[#e06d53] text-white rounded-br-none shadow-md"
                      : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-[#0f172a] flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#131d2e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#e06d53]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
