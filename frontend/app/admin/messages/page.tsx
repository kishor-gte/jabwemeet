"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, HeartHandshake, Heart, Send, Paperclip, MoreVertical, Search, Phone, Video, ArrowLeft } from "lucide-react";

export default function AdminMessagesPage() {
  const [selectedChannel, setSelectedChannel] = useState<"RM" | "BB" | null>(null);
  
  const [rms, setRms] = useState<any[]>([]);
  const [bbs, setBbs] = useState<any[]>([]);
  
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<Record<string, any[]>>({}); // Record<ContactId, Message[]>

  useEffect(() => {
    // Fetch RMs
    fetch("/api/admin/relationship-managers", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.managers) {
          setRms(data.managers.filter((m: any) => m.isApproved));
        }
      })
      .catch(console.error);

    // Fetch BBs
    fetch("/api/admin/breakup-buddies", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.buddies) {
          setBbs(data.buddies.filter((b: any) => b.isApproved));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      const fetchChat = () => {
        fetch(`/api/auth/chat/${selectedContact.id}`, { credentials: "include" })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setChats(prev => ({
                ...prev,
                [selectedContact.id]: data.messages.map((m: any) => ({
                  id: m.id,
                  sender: m.senderId === selectedContact.id ? 'them' : 'me',
                  text: m.content,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }))
              }));
            }
          })
          .catch(console.error);
      };

      fetchChat();
      const interval = setInterval(fetchChat, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  const handleSend = async () => {
    if (!message.trim() || !selectedContact) return;
    
    const contactId = selectedContact.id;
    const text = message;
    setMessage(""); // optimistic clear

    try {
      const res = await fetch(`/api/auth/chat/${contactId}`, {
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
        setChats(prev => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), newMessage]
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
    setSelectedContact(null);
  };

  if (selectedChannel === "RM") {
    const activeChat = selectedContact ? (chats[selectedContact.id] || []) : [];
    
    return (
      <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-slate-700 bg-[#0f172a] shadow-xl">
        <div className={`w-80 border-r border-slate-700 bg-[#1e293b] flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-700">
            <button onClick={handleBackToChannels} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Channels
            </button>
            <h2 className="font-bold text-lg text-white">RM Channel</h2>
            <div className="mt-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input type="text" placeholder="Search RMs..." className="w-full pl-9 pr-4 py-2 bg-slate-800 border-none rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-rose-500/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rms.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">No approved Relationship Managers found.</p>
            ) : (
              rms.map(rm => (
                <div 
                  key={rm.id} 
                  onClick={() => setSelectedContact(rm)}
                  className={`p-4 border-l-4 cursor-pointer flex gap-3 transition-colors ${selectedContact?.id === rm.id ? 'bg-rose-500/10 border-rose-500' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  {rm.profileImage ? (
                    <img src={rm.profileImage} alt={rm.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-600" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 border border-rose-500/30 text-lg">
                      {rm.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-white truncate">{rm.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{rm.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedContact ? (
          <div className="flex-1 flex flex-col relative bg-[#0b1120]">
            <div className="h-16 border-b border-slate-700 bg-[#1e293b] flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {selectedContact.profileImage ? (
                  <img src={selectedContact.profileImage} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center border border-rose-500/30">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-white leading-tight">{selectedContact.name}</h2>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeChat.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-10">
                  No messages yet. Start a conversation with {selectedContact.name}.
                </div>
              )}
              {activeChat.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'me' ? 'bg-rose-600 text-white rounded-tr-sm' : 'bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'me' ? 'text-rose-200' : 'text-slate-400'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#1e293b] border-t border-slate-700">
              <div className="flex items-end gap-2 bg-[#0b1120] border border-slate-700 rounded-2xl p-2 focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedContact.name}...`} 
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-2 text-sm outline-none text-slate-200 custom-scrollbar placeholder:text-slate-500"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2.5 bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 rounded-xl transition shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#0b1120] flex-col text-slate-500">
            <HeartHandshake className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a Relationship Manager to start chatting.</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedChannel === "BB") {
    const activeChat = selectedContact ? (chats[selectedContact.id] || []) : [];
    
    return (
      <div className="h-[calc(100vh-8rem)] flex rounded-2xl overflow-hidden border border-slate-700 bg-[#0f172a] shadow-xl">
        <div className={`w-80 border-r border-slate-700 bg-[#1e293b] flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-700">
            <button onClick={handleBackToChannels} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Channels
            </button>
            <h2 className="font-bold text-lg text-white">BB Channel</h2>
            <div className="mt-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input type="text" placeholder="Search Buddies..." className="w-full pl-9 pr-4 py-2 bg-slate-800 border-none rounded-xl text-sm outline-none text-white focus:ring-2 focus:ring-purple-500/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {bbs.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">No approved Breakup Buddies found.</p>
            ) : (
              bbs.map(bb => (
                <div 
                  key={bb.id} 
                  onClick={() => setSelectedContact(bb)}
                  className={`p-4 border-l-4 cursor-pointer flex gap-3 transition-colors ${selectedContact?.id === bb.id ? 'bg-purple-500/10 border-purple-500' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  {bb.profilePhoto ? (
                    <img src={bb.profilePhoto} alt={bb.displayName || bb.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-600" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30 text-lg">
                      {(bb.displayName || bb.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-white truncate">{bb.displayName || bb.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{bb.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedContact ? (
          <div className="flex-1 flex flex-col relative bg-[#0b1120]">
            <div className="h-16 border-b border-slate-700 bg-[#1e293b] flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {selectedContact.profilePhoto ? (
                  <img src={selectedContact.profilePhoto} alt={selectedContact.displayName || selectedContact.name} className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center border border-purple-500/30">
                    {(selectedContact.displayName || selectedContact.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-white leading-tight">{selectedContact.displayName || selectedContact.name}</h2>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeChat.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-10">
                  No messages yet. Start a conversation with {selectedContact.displayName || selectedContact.name}.
                </div>
              )}
              {activeChat.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'me' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-[#1e293b] border border-slate-700 text-slate-200 rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'me' ? 'text-purple-200' : 'text-slate-400'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#1e293b] border-t border-slate-700">
              <div className="flex items-end gap-2 bg-[#0b1120] border border-slate-700 rounded-2xl p-2 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedContact.displayName || selectedContact.name}...`} 
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 px-2 text-sm outline-none text-slate-200 custom-scrollbar placeholder:text-slate-500"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2.5 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 rounded-xl transition shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#0b1120] flex-col text-slate-500">
            <Heart className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a Breakup Buddy to start chatting.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Communications Center</h1>
        <p className="text-slate-500 mt-1">Select a department to communicate with.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setSelectedChannel("RM")}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition text-left group"
        >
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Relationship Managers</h2>
          <p className="text-slate-500 text-sm">
            Message the matchmakers. Broadcast updates, coordinate dates, or assist with client issues.
          </p>
        </button>

        <button 
          onClick={() => setSelectedChannel("BB")}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition text-left group"
        >
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Breakup Buddies</h2>
          <p className="text-slate-500 text-sm">
            Message the support buddies. Assist with urgent session issues or general support.
          </p>
        </button>
      </div>
    </div>
  );
}
