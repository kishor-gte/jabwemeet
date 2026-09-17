"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Shield,
  Clock,
  UserCheck,
} from "lucide-react";

export default function AdminVerificationPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchVerifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verification", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPendingUsers(data.pendingUsers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVerifications();
  }, []);

  async function handleVerify(id: string, approved: boolean) {
    if (!confirm(`Are you sure you want to ${approved ? "approve and verify" : "reject"} this application?`)) return;
    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (data.success) {
        fetchVerifications();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (e) {
      alert("Error updating verification");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <FileCheck className="w-3.5 h-3.5" />
          Trust & Identity Safeguard
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Member & Staff Verification Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review government photo IDs, address proofs, and professional certifications before approving platform privileges.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pending Applications Queue ({pendingUsers.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500 py-8 text-center animate-pulse">Loading queue...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-xs text-emerald-400 italic py-8 text-center">
              ✓ No pending applications requiring administrative review.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between gap-4 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                        {p.role}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      {p.email} • {p.phone || "N/A"} • {p.city || "Unspecified"}
                    </div>

                    {/* Verification Assets */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {p.govIdProof && (
                        <a
                          href={`/uploads/${p.govIdProof}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <span>📄 Gov ID Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {p.addressProof && (
                        <a
                          href={`/uploads/${p.addressProof}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <span>📄 Address Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {p.eduCertificate && (
                        <a
                          href={`/uploads/${p.eduCertificate}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <span>📄 Education Cert</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {p.workExperience && (
                        <a
                          href={`/uploads/${p.workExperience}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <span>📄 Work Experience</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {p.idDocument && (
                        <a
                          href={`/uploads/${p.idDocument}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition"
                        >
                          <span>📄 {p.idType || "ID Document"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleVerify(p.id, false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerify(p.id, true)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20"
                    >
                      Approve & Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
