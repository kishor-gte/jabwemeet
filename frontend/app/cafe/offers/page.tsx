"use client";
import { useToast } from "@/components/ToastProvider";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

export default function OffersPage() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'Percentage', value: '', minOrder: 0 });

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cafe/offers", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) setOffers(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {...formData, minOrder: Number(formData.minOrder) || 0};
      console.log("Sending payload:", payload);
      const res = await fetch("/api/cafe/offers", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) { 
        setIsModalOpen(false); 
        fetchOffers(); 
        showToast("Offer saved successfully!", "success");
        setFormData({ name: '', code: '', type: 'Percentage', value: '', minOrder: 0 });
      } else {
        showToast("Failed to save offer: " + (data.error || data.message || "Unknown error"), "error");
      }
    } catch (e: any) { 
      console.error(e); 
      showToast("Error saving offer: " + e.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      const res = await fetch(`/api/cafe/offers/${id}`, { method: "DELETE", headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.success) fetchOffers();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Offers & Coupons</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-black font-semibold rounded-xl"><Plus className="w-5 h-5"/> Create Offer</button>
      </div>
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-white">Loading offers...</div> : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr><th className="px-4 py-3">Offer</th><th className="px-4 py-3">Code / Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {offers.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No offers created yet.</td></tr> : offers.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4"><p className="font-bold text-white">{o.name}</p><p className="text-xs text-amber-400 font-mono">{o.code}</p></td>
                  <td className="px-4 py-4">{o.type} ({o.value})<br/><span className="text-xs text-slate-500">Min: ₹{o.minOrder}</span></td>
                  <td className="px-4 py-4"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">{o.status}</span></td>
                  <td className="px-4 py-4 text-right"><button onClick={() => handleDelete(o.id)} className="text-rose-400 hover:underline text-xs font-medium">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131d2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create Offer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1">Offer Name</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Coupon Code</label><input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs text-slate-400 mb-1">Type</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white"><option>Percentage</option><option>Fixed Amount</option></select></div>
                <div className="flex-1"><label className="block text-xs text-slate-400 mb-1">Value (e.g. 20% or ₹150)</label><input required type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1">Min Order Amount (₹)</label><input required type="number" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: parseInt(e.target.value) || 0})} className="w-full bg-[#0b111e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white" /></div>
              <button type="submit" className="w-full py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition mt-4">Save Offer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
