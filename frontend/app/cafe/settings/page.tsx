"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function SettingsPage() {
  const { showToast } = useToast();
  const tabs = [
    "Account Settings",
    "Password Change",
    "Notification Settings",
    "Payment Settings",
    "Business Settings",
    "Privacy",
    "Terms & Conditions"
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/cafe/profile", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setProfile(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    if (activeTab === "Password Change") {
      showToast("Password update requested! (Pending backend hookup)", "info");
      return;
    }
    
    try {
      const res = await fetch("/api/cafe/profile", {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        showToast(activeTab + " updated successfully!", "success");
      } else {
        showToast("Failed to update: " + (data.error || data.message || "Unknown error"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while updating settings.", "error");
    }
  };

  const renderContent = () => {
    if (loading) return <div className="text-white">Loading settings...</div>;

    switch (activeTab) {
      case "Account Settings":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><label className="block text-xs text-slate-400 mb-1">Email</label><input type="email" disabled value={profile?.email || ""} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white opacity-70 cursor-not-allowed" title="Email cannot be changed here" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Phone</label><input type="text" value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
            <button type="submit" className="mt-4 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Update Account</button>
          </form>
        );
      case "Password Change":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="relative">
              <label className="block text-xs text-slate-400 mb-1">Current Password</label>
              <input type={showCurrent ? "text" : "password"} required className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[26px] text-slate-400 hover:text-white">{showCurrent ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="relative">
              <label className="block text-xs text-slate-400 mb-1">New Password</label>
              <input type={showNew ? "text" : "password"} required className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[26px] text-slate-400 hover:text-white">{showNew ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="relative">
              <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
              <input type={showConfirm ? "text" : "password"} required className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[26px] text-slate-400 hover:text-white">{showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <button type="submit" className="mt-4 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Change Password</button>
          </form>
        );
      case "Notification Settings":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" /> Email Notifications</label>
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" /> SMS Alerts</label>
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" className="accent-amber-500 w-4 h-4" /> Push Notifications</label>
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" /> Daily Summary Reports</label>
            <button type="submit" className="mt-6 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Save Preferences</button>
          </form>
        );
      case "Payment Settings":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><label className="block text-xs text-slate-400 mb-1">Bank Account Name</label><input type="text" value={profile?.bankName || ""} onChange={e => setProfile({...profile, bankName: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" placeholder="E.g. Linto Cafe Pvt Ltd" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Account Number</label><input type="text" value={profile?.bankAccount || ""} onChange={e => setProfile({...profile, bankAccount: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" placeholder="Account Number" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">IFSC Code</label><input type="text" value={profile?.bankIfsc || ""} onChange={e => setProfile({...profile, bankIfsc: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" placeholder="E.g. HDFC0001234" /></div>
            <button type="submit" className="mt-4 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Update Bank Details</button>
          </form>
        );
      case "Business Settings":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><label className="block text-xs text-slate-400 mb-1">Tax ID / GSTIN</label><input type="text" value={profile?.gstNumber || ""} onChange={e => setProfile({...profile, gstNumber: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" placeholder="GSTIN" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Currency</label>
              <select value={profile?.currency || "INR"} onChange={e => setProfile({...profile, currency: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div><label className="block text-xs text-slate-400 mb-1">Timezone</label>
              <select value={profile?.timezone || "Asia/Kolkata"} onChange={e => setProfile({...profile, timezone: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>
            <button type="submit" className="mt-4 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Update Settings</button>
          </form>
        );
      case "Privacy":
        return (
          <form onSubmit={handleUpdate} className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" defaultChecked className="accent-amber-500 w-4 h-4" /> Profile Visible to Customers</label>
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer"><input type="checkbox" className="accent-amber-500 w-4 h-4" /> Share Anonymous Usage Data</label>
            <p className="text-xs text-slate-500 mt-4 border-t border-white/10 pt-4">You can request an export of all your business data stored on our platform.</p>
            <button type="button" onClick={() => showToast("Data export initiated. Check your email shortly.", "info")} className="px-6 py-2 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition">Request Data Export</button>
          </form>
        );
      case "Terms & Conditions":
        return (
          <div className="space-y-4 text-sm text-slate-300">
            <p>By using the JabWeMeet Cafe Partner dashboard, you agree to our standard operating guidelines.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>All menu items listed must be accurately priced and described.</li>
              <li>Reservations must be honored once confirmed through the portal.</li>
              <li>Platform fees (if applicable) are automatically deducted from digital payments.</li>
            </ul>
            <p className="pt-4 mt-4 border-t border-white/10 text-xs text-slate-500">Last updated: Sept 2026</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === tab ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 bg-[#131d2e] border border-white/5 rounded-2xl p-6 min-h-[400px]">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">{activeTab}</h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
