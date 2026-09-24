"use client";
import { useState, useEffect } from "react";

export default function OrdersPage() {
  const tabs = ["New", "Preparing", "Ready", "Completed", "Cancelled"];
  const [activeTab, setActiveTab] = useState("New");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cafe/orders?status=${status}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/cafe/orders/${id}/status`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) fetchOrders(activeTab);
    } catch (e) {
      console.error(e);
    }
  };

  const getActionButtons = (order: any) => {
    if (order.status === "New") {
      return (
        <div className="flex gap-3">
          <button onClick={() => updateStatus(order.id, 'Preparing')} className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-lg transition text-sm">Accept & Prepare</button>
          <button onClick={() => updateStatus(order.id, 'Cancelled')} className="flex-1 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold rounded-lg transition text-sm">Reject</button>
        </div>
      );
    } else if (order.status === "Preparing") {
      return <button onClick={() => updateStatus(order.id, 'Ready')} className="w-full py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-bold rounded-lg transition text-sm">Mark Ready</button>;
    } else if (order.status === "Ready") {
      return <button onClick={() => updateStatus(order.id, 'Completed')} className="w-full py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-lg transition text-sm">Mark Completed</button>;
    }
    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Orders</h1>
      
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map((t) => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)}
            className={`font-semibold pb-2 px-2 whitespace-nowrap ${activeTab === t ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-slate-500 py-12 text-center bg-[#131d2e] rounded-2xl border border-white/5">
          No {activeTab.toLowerCase()} orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-[#131d2e] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Order ...{order.id.slice(-6)}</h3>
                  {order.customerName && <p className="text-xs text-slate-400">{order.customerName}</p>}
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {order.status}
                </span>
              </div>
              
              <ul className="space-y-3 mb-4 flex-1">
                {order.items?.map((item: any) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.quantity} × {item.itemName}</span>
                    <span className="text-slate-500">₹{item.price}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex justify-between items-center pt-3 border-t border-white/10 mb-5">
                <span className="text-slate-400 text-sm">Total:</span>
                <span className="text-lg font-bold text-emerald-400">₹{order.totalAmount}</span>
              </div>
              
              {getActionButtons(order)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
