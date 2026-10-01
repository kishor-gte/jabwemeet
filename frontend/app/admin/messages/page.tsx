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
      <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden border border-rose-100 bg-white shadow-xs">
        <div className={`w-80 border-r border-rose-100 bg-[#FAF3F6]/50 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-rose-100">
            <button onClick={handleBackToChannels} className="flex items-center gap-1.5 text-slate-500 hover:text-[#7E2248] transition mb-3 text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Channels
            </button>
            <h2 className="font-serif font-bold text-lg text-slate-900">RM Channel</h2>
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search RMs..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none text-slate-800 placeholder:text-slate-400 focus:border-[#7E2248] transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rms.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">No approved Relationship Managers found.</p>
            ) : (
              rms.map(rm => (
                <div 
                  key={rm.id} 
                  onClick={() => setSelectedContact(rm)}
                  className={`p-4 border-l-4 cursor-pointer flex gap-3 transition-colors ${selectedContact?.id === rm.id ? 'bg-rose-100/70 border-[#7E2248]' : 'bg-transparent border-transparent hover:bg-rose-50/50'}`}
                >
                  {rm.profileImage ? (
                    <img src={rm.profileImage} alt={rm.name} className="w-11 h-11 rounded-full object-cover shrink-0 border border-rose-200" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-rose-100 text-[#7E2248] font-bold flex items-center justify-center shrink-0 border border-rose-200 text-base font-serif">
                      {rm.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-serif font-bold text-slate-900 truncate text-sm">{rm.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{rm.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedContact ? (
          <div className="flex-1 flex flex-col relative bg-[#FDFBF9]">
            <div className="h-16 border-b border-rose-100 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {selectedContact.profileImage ? (
                  <img src={selectedContact.profileImage} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover border border-rose-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-[#7E2248] font-bold flex items-center justify-center border border-rose-200 font-serif">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-serif font-bold text-slate-900 leading-tight">{selectedContact.name}</h2>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10">
                  No messages yet. Start a conversation with {selectedContact.name}.
                </div>
              )}
              {activeChat.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${msg.sender === 'me' ? 'bg-[#7E2248] text-white rounded-tr-xs' : 'bg-white border border-rose-100 text-slate-800 rounded-tl-xs'}`}>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-rose-200' : 'text-slate-400'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-rose-100">
              <div className="flex items-end gap-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-2xl p-2 focus-within:border-[#7E2248] focus-within:bg-white transition-all">
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedContact.name}...`} 
                  className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none resize-none py-2 px-2 text-xs outline-none text-slate-800 placeholder:text-slate-400"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2 bg-[#7E2248] text-white hover:bg-[#681938] disabled:opacity-40 rounded-xl transition shrink-0 shadow-2xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#FDFBF9] flex-col text-slate-400">
            <HeartHandshake className="w-16 h-16 mb-4 text-rose-200" />
            <p className="font-serif text-sm text-slate-600">Select a Relationship Manager to start chatting.</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedChannel === "BB") {
    const activeChat = selectedContact ? (chats[selectedContact.id] || []) : [];
    
    return (
      <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden border border-rose-100 bg-white shadow-xs">
        <div className={`w-80 border-r border-rose-100 bg-[#FAF3F6]/50 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-rose-100">
            <button onClick={handleBackToChannels} className="flex items-center gap-1.5 text-slate-500 hover:text-[#7E2248] transition mb-3 text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Channels
            </button>
            <h2 className="font-serif font-bold text-lg text-slate-900">BB Channel</h2>
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Buddies..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-rose-200 rounded-xl text-xs outline-none text-slate-800 placeholder:text-slate-400 focus:border-[#7E2248] transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {bbs.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">No approved Breakup Buddies found.</p>
            ) : (
              bbs.map(bb => (
                <div 
                  key={bb.id} 
                  onClick={() => setSelectedContact(bb)}
                  className={`p-4 border-l-4 cursor-pointer flex gap-3 transition-colors ${selectedContact?.id === bb.id ? 'bg-purple-50 border-purple-600' : 'bg-transparent border-transparent hover:bg-rose-50/50'}`}
                >
                  {bb.profilePhoto ? (
                    <img src={bb.profilePhoto} alt={bb.displayName || bb.name} className="w-11 h-11 rounded-full object-cover shrink-0 border border-purple-200" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 border border-purple-200 text-base font-serif">
                      {(bb.displayName || bb.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-serif font-bold text-slate-900 truncate text-sm">{bb.displayName || bb.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{bb.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {selectedContact ? (
          <div className="flex-1 flex flex-col relative bg-[#FDFBF9]">
            <div className="h-16 border-b border-rose-100 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {selectedContact.profilePhoto ? (
                  <img src={selectedContact.profilePhoto} alt={selectedContact.displayName || selectedContact.name} className="w-10 h-10 rounded-full object-cover border border-purple-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center border border-purple-200 font-serif">
                    {(selectedContact.displayName || selectedContact.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-serif font-bold text-slate-900 leading-tight">{selectedContact.displayName || selectedContact.name}</h2>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-10">
                  No messages yet. Start a conversation with {selectedContact.displayName || selectedContact.name}.
                </div>
              )}
              {activeChat.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${msg.sender === 'me' ? 'bg-[#7E2248] text-white rounded-tr-xs' : 'bg-white border border-rose-100 text-slate-800 rounded-tl-xs'}`}>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-rose-200' : 'text-slate-400'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-rose-100">
              <div className="flex items-end gap-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-2xl p-2 focus-within:border-[#7E2248] focus-within:bg-white transition-all">
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedContact.displayName || selectedContact.name}...`} 
                  className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none resize-none py-2 px-2 text-xs outline-none text-slate-800 placeholder:text-slate-400"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2 bg-[#7E2248] text-white hover:bg-[#681938] disabled:opacity-40 rounded-xl transition shrink-0 shadow-2xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#FDFBF9] flex-col text-slate-400">
            <Heart className="w-16 h-16 mb-4 text-purple-200" />
            <p className="font-serif text-sm text-slate-600">Select a Breakup Buddy to start chatting.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          Internal Comms
        </div>
        <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Admin Communications Center</h1>
        <p className="text-slate-500 mt-1 text-sm">Select a department to communicate with.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setSelectedChannel("RM")}
          className="bg-white border border-rose-100 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-rose-200 transition text-left group"
        >
          <div className="w-14 h-14 bg-rose-50 text-[#7E2248] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition border border-rose-100">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Relationship Managers</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Message the matchmakers. Broadcast updates, coordinate dates, or assist with client issues.
          </p>
        </button>

        <button 
          onClick={() => setSelectedChannel("BB")}
          className="bg-white border border-rose-100 rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-purple-200 transition text-left group"
        >
          <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition border border-purple-100">
            <Heart className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Breakup Buddies</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Message the support buddies. Assist with urgent session issues or general support.
          </p>
        </button>
      </div>
    </div>
  );
}

