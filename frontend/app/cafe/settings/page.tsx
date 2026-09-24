"use client";
export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          {["Account Settings", "Password Change", "Notification Settings", "Payment Settings", "Business Settings", "Privacy", "Terms & Conditions"].map((tab, i) => (
            <button key={i} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${i === 0 ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-white/5'}`}>{tab}</button>
          ))}
        </div>
        <div className="flex-1 bg-[#131d2e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
          <div className="space-y-4">
            <div><label className="block text-xs text-slate-400 mb-1">Email</label><input type="email" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" defaultValue="owner@intocafe.com" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Phone</label><input type="text" className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" defaultValue="+91 9876543210" /></div>
            <button className="mt-4 px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition">Update Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
