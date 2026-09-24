"use client";
import { useState, useEffect } from "react";

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cafe/payments", { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setTransactions(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const onlinePayments = transactions.filter(t => t.method !== 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const cashPayments = transactions.filter(t => t.method === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Payments</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5"><p className="text-amber-500/80 text-sm mb-1 font-semibold">Total Revenue</p><h3 className="text-2xl font-bold text-amber-400">₹{totalRevenue.toLocaleString()}</h3></div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Online Payments</p><h3 className="text-xl font-bold text-white">₹{onlinePayments.toLocaleString()}</h3></div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Cash Payments</p><h3 className="text-xl font-bold text-white">₹{cashPayments.toLocaleString()}</h3></div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5"><p className="text-rose-400/80 text-sm mb-1 font-semibold">Pending</p><h3 className="text-xl font-bold text-rose-400">₹{pending.toLocaleString()}</h3></div>
      </div>
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5"><h2 className="text-lg font-bold text-white">Transaction History</h2></div>
        {loading ? <div className="p-8 text-white">Loading payments...</div> : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr><th className="px-4 py-3">Txn ID</th><th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Date</th></tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No transactions found.</td></tr> : transactions.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4 font-mono text-xs text-slate-400">...{t.id.slice(-6)}</td>
                  <td className="px-4 py-4 text-white font-medium">{t.orderId || 'N/A'}</td>
                  <td className="px-4 py-4">{t.customerName || 'N/A'}</td>
                  <td className="px-4 py-4 font-bold text-emerald-400">₹{t.amount}</td>
                  <td className="px-4 py-4">{t.method}</td>
                  <td className="px-4 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.status}</span></td>
                  <td className="px-4 py-4 text-right text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
