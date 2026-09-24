"use client";
export default function AnalyticsPage() {
  const topItems = [
    { name: "Cappuccino", orders: 124 },
    { name: "Chicken Burger", orders: 98 },
    { name: "Cold Coffee", orders: 86 },
    { name: "Brownie", orders: 71 }
  ];
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Daily Revenue</p><h3 className="text-2xl font-bold text-white">INR 18,500</h3></div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Weekly Revenue</p><h3 className="text-2xl font-bold text-white">INR 1,12,000</h3></div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Total Orders</p><h3 className="text-2xl font-bold text-white">845</h3></div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-5"><p className="text-slate-400 text-sm mb-1">Average Order Value</p><h3 className="text-2xl font-bold text-white">INR 480</h3></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Popular Items</h2>
          <div className="space-y-4">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-white/10 text-white rounded font-bold text-xs">{i+1}</span><span className="font-medium text-white">{item.name}</span></div>
                <span className="text-amber-400 font-bold text-sm">{item.orders} orders</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Customer Analytics</h2>
          <div className="space-y-6">
            <div><div className="flex justify-between text-sm mb-2"><span className="text-slate-300">New Customers</span><span className="text-white font-bold">142</span></div><div className="w-full h-2 bg-white/5 rounded-full"><div className="h-full bg-emerald-400 rounded-full" style={{width: '35%'}}></div></div></div>
            <div><div className="flex justify-between text-sm mb-2"><span className="text-slate-300">Returning Customers</span><span className="text-white font-bold">344</span></div><div className="w-full h-2 bg-white/5 rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{width: '65%'}}></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
