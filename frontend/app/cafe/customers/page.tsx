"use client";
import { useState, useEffect } from "react";
import { Users } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cafe/customers", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setCustomers(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Customers</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Users className="w-6 h-6"/></div>
          <div><p className="text-slate-400 text-sm">Total Customers</p><p className="text-2xl font-bold text-white">{customers.length}</p></div>
        </div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Users className="w-6 h-6"/></div>
          <div><p className="text-slate-400 text-sm">Total Lifetime Spend</p><p className="text-2xl font-bold text-white">₹{totalSpent.toLocaleString()}</p></div>
        </div>
      </div>
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-white">Loading customers...</div> : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Visits</th><th className="px-4 py-3">Total Spent</th><th className="px-4 py-3">Last Visit</th></tr>
            </thead>
            <tbody>
              {customers.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No customers found.</td></tr> : customers.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-4">{c.contact || 'N/A'}</td>
                  <td className="px-4 py-4">{c.visits}</td>
                  <td className="px-4 py-4 text-emerald-400 font-medium">₹{c.totalSpent}</td>
                  <td className="px-4 py-4">{new Date(c.lastVisit).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
