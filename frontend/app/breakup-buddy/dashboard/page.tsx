"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BreakupBuddyDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  // Profile Settings State
  const [profilePhoto, setProfilePhoto] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [areasOfExpertise, setAreasOfExpertise] = useState<string[]>([]);
  const [sessionTypes, setSessionTypes] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimeStart, setAvailableTimeStart] = useState("");
  const [availableTimeEnd, setAvailableTimeEnd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) router.replace("/");
        else {
          setUser(d.user);
          setProfilePhoto(d.user.profilePhoto || "");
          setDisplayName(d.user.displayName || d.user.name || "");
          setShortBio(d.user.shortBio || "");
          setLanguages(d.user.languages || []);
          setAreasOfExpertise(d.user.areasOfExpertise || []);
          setSessionTypes(d.user.sessionTypes || []);
          setAvailableDays(d.user.availableDays || []);
          setAvailableTimeStart(d.user.availableTimeStart || "");
          setAvailableTimeEnd(d.user.availableTimeEnd || "");
        }
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profilePhoto,
          displayName,
          shortBio,
          languages,
          areasOfExpertise,
          sessionTypes,
          availableDays,
          availableTimeStart,
          availableTimeEnd
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Profile saved successfully!");
      } else {
        alert("Error saving profile: " + data.message);
      }
    } catch (e) {
      alert("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (item: string, array: string[], setArray: (val: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/");
    } catch (e) {
      console.error(e);
      router.replace("/");
    }
  };

  const renderDashboardHome = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Good Morning, {displayName.split(' ')[0] || 'Buddy'} 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Here's your session overview</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">New Requests</p>
          <p className="text-3xl font-bold text-teal-600">5</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Upcoming</p>
          <p className="text-3xl font-bold text-sky-500">3</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed</p>
          <p className="text-3xl font-bold text-slate-800">28</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Rating</p>
          <p className="text-3xl font-bold text-amber-500">⭐ 4.8</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold font-serif mb-4 border-b border-slate-200 pb-2 text-slate-800">Today's Sessions</h3>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm mb-4 hover:shadow-md transition">
          <div>
            <p className="font-semibold text-slate-800">Priya Sharma</p>
            <p className="text-xs text-slate-500">Chat • 30 Minutes • 6:00 PM</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition">View</button>
            <button className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition shadow-sm">Start Session</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">New Requests</h2>
      <p className="text-slate-500 text-sm mb-6 border-b border-slate-200 pb-4">Manage incoming booking requests from users.</p>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Priya Sharma</h3>
            <p className="text-sm text-slate-500">Chat Session • 30 Minutes</p>
            <p className="text-sm text-teal-600 font-semibold mt-1">Today • 6:00 PM</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">PENDING</span>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">View Details</button>
          <button className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition shadow-sm">Accept</button>
          <button className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-sm font-semibold transition">Reject</button>
        </div>
      </div>
    </div>
  );

  const [sessionTab, setSessionTab] = useState("Active");
  const renderSessions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Sessions</h2>
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {['Active', 'Upcoming', 'Completed'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setSessionTab(tab)}
            className={`pb-2 px-1 text-sm font-semibold transition-colors ${sessionTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {sessionTab === "Active" && (
        <div className="bg-white border border-teal-200 rounded-xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-teal-500 animate-pulse"></div>
          <h3 className="font-bold text-lg text-slate-800 mb-1">Priya Sharma</h3>
          <p className="text-sm text-slate-600">Chat Session</p>
          <p className="text-xs text-teal-600 mt-2 font-mono bg-teal-50 inline-block px-2 py-1 rounded">Started: 06:02 PM (Duration: 30 min)</p>
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white shadow-sm text-sm font-semibold transition">Open Chat</button>
            <button className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-sm text-sm font-semibold transition">End Session</button>
          </div>
        </div>
      )}

      {sessionTab === "Upcoming" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-1">Anjali</h3>
          <p className="text-sm text-slate-600">Audio Call • 30 Minutes</p>
          <p className="text-sm text-teal-600 font-semibold mt-2">Tomorrow • 10:00 AM</p>
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">View Details</button>
            <button className="flex-1 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white shadow-sm text-sm font-semibold transition">Join Call</button>
          </div>
        </div>
      )}

      {sessionTab === "Completed" && (
        <p className="text-sm text-slate-500">See the History tab for completed sessions.</p>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="h-full flex flex-col space-y-4">
      <h2 className="text-2xl font-bold font-serif text-slate-800">Active Session</h2>
      <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden min-h-[400px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">P</div>
            <div>
              <p className="font-bold text-slate-800">Priya Sharma</p>
              <p className="text-xs text-teal-600 flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">30:00</span>
            <button className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs font-bold transition">End Session</button>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
              <p className="text-sm text-slate-700">Hi, I wanted to talk about my recent breakup...</p>
              <p className="text-[10px] text-slate-400 mt-1">06:02 PM</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-teal-500 shadow-sm rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-white">
              <p className="text-sm">Hi Priya, I'm here for you. Take your time and share whenever you're ready.</p>
              <p className="text-[10px] text-teal-100 mt-1 text-right">06:03 PM</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
              <p className="text-sm text-slate-700">Thank you. It's just been really hard.</p>
              <p className="text-[10px] text-slate-400 mt-1">06:04 PM</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors" />
            <button className="px-6 py-2 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold shadow-sm transition">Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Availability</h2>
      <p className="text-slate-500 text-sm mb-6 border-b border-slate-200 pb-4">Manage your online status and weekly schedule.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800">Your Status</h3>
          <p className="text-xs text-teal-600 font-medium flex items-center gap-1 mt-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Available for Requests</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Accept new requests</label>
          <div className="w-12 h-6 bg-teal-500 rounded-full relative cursor-pointer shadow-inner">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Weekly Schedule</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-100 pb-4">
            <div className="font-semibold text-slate-700">Monday</div>
            <div className="col-span-2 flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                <span>10:00 AM — 01:00 PM</span><button className="text-slate-400 hover:text-red-500 ml-2">✕</button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                <span>06:00 PM — 10:00 PM</span><button className="text-slate-400 hover:text-red-500 ml-2">✕</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-100 pb-4">
            <div className="font-semibold text-slate-700">Tuesday</div>
            <div className="col-span-2 flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                <span>10:00 AM — 01:00 PM</span><button className="text-slate-400 hover:text-red-500 ml-2">✕</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-100 pb-4">
            <div className="font-semibold text-slate-700">Wednesday</div>
            <div className="col-span-2 flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                <span>06:00 PM — 10:00 PM</span><button className="text-slate-400 hover:text-red-500 ml-2">✕</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-100 pb-4">
            <div className="font-semibold text-slate-400">Thursday</div>
            <div className="col-span-2"><button className="text-xs font-semibold text-teal-600 hover:underline">+ Add Time Slot</button></div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center border-b border-slate-100 pb-4">
            <div className="font-semibold text-slate-400">Friday</div>
            <div className="col-span-2"><button className="text-xs font-semibold text-teal-600 hover:underline">+ Add Time Slot</button></div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="font-semibold text-slate-400">Sunday</div>
            <div className="col-span-2 text-sm text-slate-400 italic">Unavailable</div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button className="px-6 py-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold shadow-sm transition">Save Schedule</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2">Block Date</h3>
        <p className="text-xs text-slate-500 mb-4">Prevent users from booking when you are unavailable.</p>
        <div className="flex gap-2">
          <input type="date" className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500" />
          <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition border border-slate-200">Block</button>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Reviews</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 text-center">
        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Overall Rating</p>
        <p className="text-4xl font-bold text-amber-500 mb-1">⭐ 4.8</p>
        <p className="text-sm text-slate-500 font-medium">28 Reviews</p>
      </div>
      
      <div className="flex gap-2 mb-4">
        {['All', '5★', '4★', '3★', '2★', '1★'].map(f => (
          <button key={f} className={`px-4 py-1 rounded-full text-xs font-bold transition-colors border ${f === 'All' ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-amber-500 text-sm mb-2">⭐⭐⭐⭐⭐</p>
          <p className="font-bold text-slate-800 text-sm mb-2">Priya Sharma</p>
          <p className="text-sm text-slate-600 italic mb-4">"Very friendly and patient listener. Really helped me clear my mind."</p>
          <p className="text-xs text-slate-400 font-medium">Chat Session • 15 Sep 2026</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-amber-500 text-sm mb-2">⭐⭐⭐⭐</p>
          <p className="font-bold text-slate-800 text-sm mb-2">Rahul T.</p>
          <p className="text-sm text-slate-600 italic mb-4">"Good conversation, empathetic."</p>
          <p className="text-xs text-slate-400 font-medium">Video Call • 12 Sep 2026</p>
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Earnings</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 shadow-sm">
          <p className="text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-teal-600">₹28,500</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">This Month</p>
          <p className="text-3xl font-bold text-slate-800">₹6,500</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-500">₹1,200</p>
        </div>
      </div>

      <h3 className="text-lg font-bold font-serif text-slate-800 mb-4">Recent Transactions</h3>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Session</th>
              <th className="px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td className="px-6 py-4 font-medium">Chat</td>
              <td className="px-6 py-4 font-mono">₹299</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Paid</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">Audio Call</td>
              <td className="px-6 py-4 font-mono">₹399</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Paid</span></td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">Video Call</td>
              <td className="px-6 py-4 font-mono">₹499</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif text-slate-800 mb-1">Session History</h2>
      
      <div className="flex justify-between items-center mb-4">
        <input type="text" placeholder="Search..." className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:border-teal-500 w-64 shadow-sm" />
        <div className="flex gap-2">
          {['All', 'Chat', 'Audio', 'Video'].map(f => (
            <button key={f} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${f === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">User</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr className="hover:bg-slate-50 cursor-pointer transition">
              <td className="px-6 py-4 font-semibold text-slate-800">Priya</td>
              <td className="px-6 py-4">Chat</td>
              <td className="px-6 py-4">Sep 15</td>
              <td className="px-6 py-4 font-medium text-teal-600">Completed</td>
            </tr>
            <tr className="hover:bg-slate-50 cursor-pointer transition">
              <td className="px-6 py-4 font-semibold text-slate-800">Anjali</td>
              <td className="px-6 py-4">Audio</td>
              <td className="px-6 py-4">Sep 14</td>
              <td className="px-6 py-4 font-medium text-teal-600">Completed</td>
            </tr>
            <tr className="hover:bg-slate-50 cursor-pointer transition">
              <td className="px-6 py-4 font-semibold text-slate-800">Rahul</td>
              <td className="px-6 py-4">Video</td>
              <td className="px-6 py-4">Sep 12</td>
              <td className="px-6 py-4 font-medium text-teal-600">Completed</td>
            </tr>
            <tr className="hover:bg-slate-50 cursor-pointer transition">
              <td className="px-6 py-4 font-semibold text-slate-800">Neha</td>
              <td className="px-6 py-4">Chat</td>
              <td className="px-6 py-4">Sep 10</td>
              <td className="px-6 py-4 font-medium text-teal-600">Completed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Profile Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Set up your profile to start listening and helping others.</p>
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-sm transition disabled:opacity-60">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setProfilePhoto(e.target.files[0].name);
                }
              }}
              className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-colors"
            />
            {profilePhoto && <p className="text-xs text-teal-600 font-medium mt-2">✓ Current: {profilePhoto}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you appear to others"
              className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
          <textarea
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            placeholder="A little bit about you..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Languages</label>
          <div className="flex gap-2 flex-wrap">
            {['English', 'Hindi', 'Spanish', 'French', 'Kannada'].map(lang => (
              <label key={lang} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm cursor-pointer hover:bg-slate-100 text-slate-700 transition">
                <input type="checkbox" checked={languages.includes(lang)} onChange={() => toggleArrayItem(lang, languages, setLanguages)} className="accent-teal-500 w-3.5 h-3.5" />
                {lang}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Areas I Can Listen To:</label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['Breakup', 'Relationship Problems', 'Loneliness', 'Moving On', 'Dating Experiences', 'General Conversation'].map(area => (
              <label key={area} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition">
                <input type="checkbox" checked={areasOfExpertise.includes(area)} onChange={() => toggleArrayItem(area, areasOfExpertise, setAreasOfExpertise)} className="accent-teal-500 w-4 h-4 rounded" />
                {area}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold font-serif text-slate-800 mb-4">Services</h3>
          <div className="mb-6">
            <div className="flex gap-6">
              {['Chat', 'Audio Call', 'Video Call'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 font-medium text-sm transition">
                  <input type="checkbox" checked={sessionTypes.includes(type)} onChange={() => toggleArrayItem(type, sessionTypes, setSessionTypes)} className="accent-teal-500 w-4 h-4 rounded" />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold font-serif text-slate-800 tracking-tight">
            JabWe<span className="text-teal-500">Meet</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Buddy Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {[
              { id: 'Dashboard', icon: '🏠' },
              { id: 'Requests', icon: '📩' },
              { id: 'Sessions', icon: '📅' },
              { id: 'Messages', icon: '💬' },
              { id: 'Availability', icon: '🕐' },
              { id: 'Reviews', icon: '⭐' },
              { id: 'Earnings', icon: '💰' },
              { id: 'History', icon: '📜' },
              { id: 'Settings', icon: '⚙️' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <span className="text-base grayscale opacity-80">{item.icon}</span>
                {item.id}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <a href="/dashboard" className="block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition mb-2">
            ← Exit to Main App
          </a>
          <button onClick={handleLogout} className="block w-full text-center py-2 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="md:hidden font-bold font-serif text-slate-800">JabWeMeet</div>
          <div className="hidden md:block text-sm text-slate-500 font-bold uppercase tracking-wider">{activeTab}</div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition relative">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full hover:bg-slate-100 transition border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                {displayName ? displayName[0].toUpperCase() : 'B'}
              </div>
              <span className="text-sm font-bold text-slate-700">{displayName || 'Buddy'} ▾</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'Dashboard' && renderDashboardHome()}
            {activeTab === 'Requests' && renderRequests()}
            {activeTab === 'Sessions' && renderSessions()}
            {activeTab === 'Messages' && renderMessages()}
            {activeTab === 'Availability' && renderAvailability()}
            {activeTab === 'Reviews' && renderReviews()}
            {activeTab === 'Earnings' && renderEarnings()}
            {activeTab === 'History' && renderHistory()}
            {activeTab === 'Settings' && renderSettings()}
          </div>
        </main>
      </div>
    </div>
  );
}
