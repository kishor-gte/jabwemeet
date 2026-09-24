"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/cafe/profile", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setProfile(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cafe/profile", {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) alert("Profile saved successfully!");
    } catch (e) {
      alert("Error saving profile");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Cafe Profile</h1>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1">Cafe Name</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.cafeName || ""} onChange={e => setProfile({...profile, cafeName: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">Phone</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
          <div className="md:col-span-2"><label className="block text-xs text-slate-400 mb-1">Description</label><textarea className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" rows={3} value={profile?.description || ""} onChange={e => setProfile({...profile, description: e.target.value})} /></div>
        </div>

        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2 pt-4">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-xs text-slate-400 mb-1">Address</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.address || ""} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">City</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.city || ""} onChange={e => setProfile({...profile, city: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">Pincode</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.pincode || ""} onChange={e => setProfile({...profile, pincode: e.target.value})} /></div>
        </div>

        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2 pt-4">Operations & Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs text-slate-400 mb-1">Opening Time</label><input type="time" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.openingTime || ""} onChange={e => setProfile({...profile, openingTime: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">Closing Time</label><input type="time" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.closingTime || ""} onChange={e => setProfile({...profile, closingTime: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">FSSAI Number</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.fssaiNumber || ""} onChange={e => setProfile({...profile, fssaiNumber: e.target.value})} /></div>
          <div><label className="block text-xs text-slate-400 mb-1">GST Number</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={profile?.gstNumber || ""} onChange={e => setProfile({...profile, gstNumber: e.target.value})} /></div>
        </div>
      </div>
    </div>
  );
}
