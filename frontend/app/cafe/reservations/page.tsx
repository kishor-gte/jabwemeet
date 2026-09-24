"use client";
import { useState, useEffect } from "react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [filter, setFilter] = useState("Upcoming");
  const [loading, setLoading] = useState(true);

  const fetchReservations = async (selectedFilter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cafe/reservations?filter=${selectedFilter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setReservations(data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations(filter);
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/cafe/reservations/${id}/status`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) fetchReservations(filter);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Reservations</h1>
      
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        {["Today", "Upcoming", "Pending"].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`font-semibold pb-2 px-2 ${filter === f ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
          >
            {f === "Today" ? "Today's" : f}
          </button>
        ))}
      </div>

      <div className="bg-[#131d2e] border border-white/5 rounded-2xl p-6">
        {loading ? (
          <div className="text-white">Loading reservations...</div>
        ) : (
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
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-4 text-center">No reservations found</td></tr>
                ) : (
                  reservations.map(res => (
                    <tr key={res.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-mono text-xs">...{res.id.slice(-6)}</td>
                      <td className="px-4 py-4 text-white font-medium">{res.customerName}</td>
                      <td className="px-4 py-4">{res.guests}</td>
                      <td className="px-4 py-4">{res.date} at {res.time}</td>
                      <td className="px-4 py-4">{res.table || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${res.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400' : res.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 flex justify-end gap-2">
                        {res.status === 'Pending' && (
                          <>
                            <button onClick={() => updateStatus(res.id, 'Confirmed')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded font-semibold text-xs transition">Confirm</button>
                            <button onClick={() => updateStatus(res.id, 'Cancelled')} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded font-semibold text-xs transition">Cancel</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
