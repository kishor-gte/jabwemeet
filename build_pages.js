const fs = require('fs');
const path = require('path');

const writePage = (route, content) => {
    const dir = path.join('frontend/app/cafe', route);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'page.tsx'), content.trim() + '\n', 'utf8');
};

const dashboardCode = `
"use client";
import { cafeMockData } from "@/services/cafeMockData";
import { ShoppingBag, Users, Wallet, CalendarCheck2, TrendingUp, ArrowRight, MoreVertical, LineChart } from "lucide-react";
import Link from "next/link";
export default function CafeDashboardPage() {
  const { kpis, upcomingReservations, topSellingItems } = cafeMockData;
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1><p className="text-slate-400">Here's what's happening with your cafe today.</p></div>
        <div className="flex gap-3"><Link href="/cafe/orders" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition">View Orders</Link><Link href="/cafe/menu" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition shadow-lg shadow-amber-500/20">Add Menu Item</Link></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Today's Orders" value={kpis.todayOrders.value} change={kpis.todayOrders.change} icon={ShoppingBag} color="blue" />
        <KpiCard title="Reservations" value={kpis.reservations.value} change={kpis.reservations.change} icon={CalendarCheck2} color="emerald" />
        <KpiCard title="Monthly Revenue" value={kpis.monthlyRevenue.value} change={kpis.monthlyRevenue.change} icon={Wallet} color="amber" />
        <KpiCard title="Customers" value={kpis.customers.value} change={kpis.customers.change} icon={Users} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">Revenue Overview</h2></div>
            <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
              <div className="text-center"><LineChart className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" /><p className="text-slate-500 text-sm">Revenue Chart</p></div>
            </div>
          </div>
          <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">Upcoming Reservations</h2><Link href="/cafe/reservations" className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-white/5"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody>
                  {upcomingReservations.map((res, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-4 font-medium text-white">{res.customerName}</td>
                      <td className="px-4 py-4">{res.guests} Guests • {res.table}</td>
                      <td className="px-4 py-4">{res.time}</td>
                      <td className="px-4 py-4">
                        <span className={res.status === 'Confirmed' ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400" : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400"}>{res.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Top Selling Items</h2>
            <div className="space-y-4">
              {topSellingItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold">{i + 1}</div><div><h4 className="text-sm font-bold text-white">{item.name}</h4><p className="text-xs text-slate-400">{item.orders} orders</p></div></div>
                  <div className="text-right"><p className="text-sm font-bold text-emerald-400">INR {item.revenue.toLocaleString()}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function KpiCard({ title, value, change, icon: Icon, color }: any) {
  const colors = { blue: "text-blue-400 bg-blue-400/10 border-blue-400/20", emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", amber: "text-amber-400 bg-amber-400/10 border-amber-400/20", purple: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  return (
    <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition">
      <div className="flex items-start justify-between mb-4"><div><p className="text-slate-400 text-sm font-medium mb-1">{title}</p><h3 className="text-2xl font-bold text-white">{value}</h3></div><div className={`p-3 rounded-xl border ${colors[color as keyof typeof colors]}`}><Icon className="w-5 h-5" /></div></div>
      <div className="flex items-center gap-2 text-xs font-medium"><span className="flex items-center text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded"><TrendingUp className="w-3 h-3 mr-1" />{change}</span><span className="text-slate-500">vs last period</span></div>
    </div>
  );
}
`;
writePage('dashboard', dashboardCode);

const reservationsCode = `
"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([
    { id: "1024", customer: "Rahul", guests: 4, date: "25 Sep", time: "7:30 PM", table: "T12", status: "Pending" },
    { id: "1025", customer: "Priya", guests: 2, date: "25 Sep", time: "8:00 PM", table: "T04", status: "Confirmed" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Reservations</h1>
      
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        <button className="text-amber-400 font-semibold border-b-2 border-amber-400 pb-2 px-2">Today's</button>
        <button className="text-slate-400 hover:text-white font-semibold pb-2 px-2">Upcoming</button>
        <button className="text-slate-400 hover:text-white font-semibold pb-2 px-2">Pending</button>
      </div>

      <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr>
                <th className="px-4 py-3">Res #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-4">#{res.id}</td>
                  <td className="px-4 py-4 text-white font-medium">{res.customer}</td>
                  <td className="px-4 py-4">{res.guests}</td>
                  <td className="px-4 py-4">{res.date} at {res.time}</td>
                  <td className="px-4 py-4">{res.table}</td>
                  <td className="px-4 py-4">
                    <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${res.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}\`}>{res.status}</span>
                  </td>
                  <td className="px-4 py-4 flex justify-end gap-2">
                    <button className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded font-semibold text-xs transition">Confirm</button>
                    <button className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded font-semibold text-xs transition">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;
writePage('reservations', reservationsCode);

const menuCode = `
"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function MenuPage() {
  const categories = ["Coffee", "Tea", "Pizza", "Burgers", "Desserts", "Snacks", "Beverages"];
  const [items, setItems] = useState([
    { id: 1, name: "Cappuccino", cat: "Coffee", desc: "Rich espresso with steamed milk", price: 180, discount: 0, veg: true, prep: "5 mins", available: true },
    { id: 2, name: "Chicken Burger", cat: "Burgers", desc: "Crispy chicken patty", price: 250, discount: 10, veg: false, prep: "15 mins", available: true }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Menu Management</h1>
        <button className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-black font-semibold rounded-xl"><Plus className="w-5 h-5"/> Add Item</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {categories.map(c => <button key={c} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 whitespace-nowrap">{c}</button>)}
      </div>

      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-white/5">
            <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Type/Prep</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-4"><p className="font-bold text-white">{item.name}</p><p className="text-xs text-slate-500">{item.desc}</p></td>
                <td className="px-4 py-4">{item.cat}</td>
                <td className="px-4 py-4">INR {item.price} {item.discount > 0 && <span className="text-xs text-amber-400">(-{item.discount}%)</span>}</td>
                <td className="px-4 py-4"><span className={\`text-xs font-bold \${item.veg ? 'text-emerald-400' : 'text-rose-400'}\`}>{item.veg ? 'VEG' : 'NON-VEG'}</span> <br/><span className="text-xs text-slate-500">{item.prep}</span></td>
                <td className="px-4 py-4"><span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${item.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}\`}>{item.available ? 'Available' : 'Unavailable'}</span></td>
                <td className="px-4 py-4 flex justify-end gap-2">
                  <button className="text-blue-400 hover:underline text-xs font-medium">Edit</button>
                  <button className="text-amber-400 hover:underline text-xs font-medium">Mark Unavail.</button>
                  <button className="text-rose-400 hover:underline text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
writePage('menu', menuCode);

const ordersCode = `
"use client";
export default function OrdersPage() {
  const tabs = ["New Orders", "Preparing", "Ready", "Completed", "Cancelled"];
  const mockOrder = { id: "1052", items: [{name: "Cappuccino", qty: 2}, {name: "Veg Sandwich", qty: 1}, {name: "Brownie", qty: 1}], total: 480 };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Orders</h1>
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map((t, i) => <button key={t} className={\`font-semibold pb-2 px-2 whitespace-nowrap \${i === 0 ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}\`}>{t}</button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white">Order #{mockOrder.id}</h3>
            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded uppercase">New</span>
          </div>
          <ul className="space-y-3 mb-4">
            {mockOrder.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm"><span className="text-slate-300">{item.qty} × {item.name}</span></li>
            ))}
          </ul>
          <div className="flex justify-between items-center pt-3 border-t border-white/10 mb-5">
            <span className="text-slate-400 text-sm">Total:</span><span className="text-lg font-bold text-emerald-400">INR {mockOrder.total}</span>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-lg transition">Accept</button>
            <button className="flex-1 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold rounded-lg transition">Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
writePage('orders', ordersCode);

const customersCode = `
"use client";
import { Users } from "lucide-react";
export default function CustomersPage() {
  const kpis = [
    { label: "Total Customers", val: 486 },
    { label: "New Customers", val: 42 },
    { label: "Returning Customers", val: 444 }
  ];
  const customers = [
    { name: "Rahul Sharma", contact: "rahul@example.com", visits: 12, spent: 4850, lastVisit: "2026-09-22" },
    { name: "Priya Singh", contact: "9876543210", visits: 3, spent: 1200, lastVisit: "2026-09-24" }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Customers</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#131d2e] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Users className="w-6 h-6"/></div>
            <div><p className="text-slate-400 text-sm">{kpi.label}</p><p className="text-2xl font-bold text-white">{kpi.val}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-[#131d2e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-white/5">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Visits</th><th className="px-4 py-3">Total Spent</th><th className="px-4 py-3">Last Visit</th></tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-4 text-white font-medium">{c.name}</td>
                <td className="px-4 py-4">{c.contact}</td>
                <td className="px-4 py-4">{c.visits}</td>
                <td className="px-4 py-4 text-emerald-400 font-medium">INR {c.spent}</td>
                <td className="px-4 py-4">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
writePage('customers', customersCode);
