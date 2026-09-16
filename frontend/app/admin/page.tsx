"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.role !== "ADMIN") {
            alert("Access denied: Admin permissions required.");
            router.replace("/dashboard");
            return;
          }
          setUser(data.user);
          fetchPendingUsers();
        } else {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  async function fetchPendingUsers() {
    try {
      const res = await fetch("/api/admin/pending", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPendingUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pending users", error);
    } finally {
      setPendingLoading(false);
    }
  }

  async function approveUser(id: string) {
    if (!confirm("Are you sure you want to approve this application?")) return;
    
    try {
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
        alert("Application approved successfully.");
      } else {
        alert(data.message || "Failed to approve application.");
      }
    } catch (e) {
      alert("Error occurred while approving.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] text-white flex items-center justify-center">
        <p className="text-slate-400">Verifying Admin authorization...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans">
      <nav className="bg-[#131d2e] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-extrabold text-white">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            JabWeMeet <span className="text-red-400">Admin Console</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">Admin: <strong>{user.name}</strong></span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-full text-xs font-semibold border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="bg-[#182337] border border-white/10 rounded-2xl p-8 shadow">
          <h1 className="text-2xl font-bold text-white mb-2">Platform Administration</h1>
          <p className="text-slate-400 text-sm">Manage verified users, event schedules, matchmaking requests, and breakup support circles.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#131d2e] border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-xs font-semibold uppercase">Total Members</h3>
            <p className="text-3xl font-extrabold text-white mt-2">10,420</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 12% this week</p>
          </div>
          <div className="bg-[#131d2e] border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-xs font-semibold uppercase">Active Events</h3>
            <p className="text-3xl font-extrabold text-white mt-2">24</p>
            <p className="text-xs text-slate-400 mt-1">Across 6 metro cities</p>
          </div>
          <div className="bg-[#131d2e] border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-xs font-semibold uppercase">Matchmaking Queue</h3>
            <p className="text-3xl font-extrabold text-white mt-2">148</p>
            <p className="text-xs text-amber-400 mt-1">Pending review</p>
          </div>
          <div className="bg-[#131d2e] border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-xs font-semibold uppercase">Trust & Safety Reports</h3>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">0</p>
            <p className="text-xs text-slate-400 mt-1">All clear</p>
          </div>
        </div>

        <div className="bg-[#182337] border border-white/10 rounded-2xl p-8 shadow">
          <h2 className="text-xl font-bold text-white mb-6">Pending Approvals</h2>
          
          {pendingLoading ? (
            <p className="text-slate-400 text-sm">Loading pending applications...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No pending applications at the moment.</p>
          ) : (
            <div className="space-y-6">
              {pendingUsers.map((p) => (
                <div key={p.id} className="bg-[#131d2e] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-sm text-slate-400 mb-1">{p.email} • {p.phone}</p>
                    <p className="text-xs text-amber-400">
                      Role: {p.role === 'BREAKUP_BUDDY' ? 'Breakup Buddy' : 'Relationship Manager'}
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      {p.govIdProof && (
                        <a href={`/uploads/${p.govIdProof}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          📄 Gov ID
                        </a>
                      )}
                      {p.addressProof && (
                        <a href={`/uploads/${p.addressProof}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          📄 Address Proof
                        </a>
                      )}
                      {p.eduCertificate && (
                        <a href={`/uploads/${p.eduCertificate}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          📄 Education Cert
                        </a>
                      )}
                      {p.workExperience && (
                        <a href={`/uploads/${p.workExperience}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          📄 Work Experience
                        </a>
                      )}
                      {p.idDocument && (
                        <a href={`/uploads/${p.idDocument}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          📄 ID Document ({p.idType || 'Document'})
                        </a>
                      )}
                      {p.profilePhoto && (
                        <a href={`/uploads/${p.profilePhoto}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                          🖼️ Profile Photo
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => approveUser(p.id)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition shadow-lg"
                    >
                      Approve Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pt-4">
          <a href="/dashboard" className="text-sm text-[#e06d53] hover:underline">
            ← Switch to Member View
          </a>
        </div>
      </main>
    </div>
  );
}
