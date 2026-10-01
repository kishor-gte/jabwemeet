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
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminVerificationPage() {
  const { alert, confirm, toast } = useAdminDialog();
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
    const actionName = approved ? "approve and verify" : "reject";
    const confirmed = await confirm({
      title: `${approved ? "Approve" : "Reject"} Verification`,
      message: `Are you sure you want to ${actionName} this member application?`,
      type: approved ? "confirm" : "warning",
      confirmText: approved ? "Approve & Verify" : "Reject Application",
      isDestructive: !approved,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/verification/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approved }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Application ${approved ? "approved and verified" : "rejected"} successfully`, "success");
        fetchVerifications();
      } else {
        alert({
          title: "Action Failed",
          message: data.message || "Failed to process verification application.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Error updating verification due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <FileCheck className="w-3.5 h-3.5" />
          Trust & Identity Safeguard
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Member & Staff Verification Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review government photo IDs, address proofs, and professional certifications before approving platform privileges.
        </p>
      </div>

      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 space-y-4">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
            Pending Applications Queue ({pendingUsers.length})
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500 py-8 text-center animate-pulse">Loading queue...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-xs text-emerald-600 font-medium italic py-8 text-center">
              ✓ No pending applications requiring administrative review.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-[#FAF3F6]/50 border border-rose-100 flex flex-col md:flex-row justify-between gap-4 text-xs hover:border-rose-200 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-[#7E2248] font-bold text-[10px]">
                        {p.role}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {p.email} • {p.phone || "N/A"} • {p.city || "Unspecified"}
                    </div>

                    {/* Verification Assets */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {p.govIdProof && (
                        <a
                          href={`/uploads/${p.govIdProof}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 transition font-medium shadow-2xs"
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
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 transition font-medium shadow-2xs"
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
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 transition font-medium shadow-2xs"
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
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 transition font-medium shadow-2xs"
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
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 text-[#7E2248] border border-rose-200 transition font-medium shadow-2xs"
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
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-700 font-bold border border-rose-200 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerify(p.id, true)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm shadow-emerald-600/20"
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
