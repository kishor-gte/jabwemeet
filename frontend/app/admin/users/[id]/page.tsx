"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  CreditCard,
  HeartHandshake,
  Shield,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileCheck,
  FileText,
  Clock,
  MapPin,
  Mail,
  Phone,
  Ticket,
  ShieldAlert,
  UserCheck,
  UserX,
  ExternalLink,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminUserProfilePage() {
  const { alert, confirm, toast } = useAdminDialog();
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchUserDetail() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setStatusUpdate(json.user.status || "ACTIVE");
        setInternalNotes(json.user.internalNotes || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) fetchUserDetail();
  }, [userId]);

  async function handleSaveStatus() {
    if (!internalNotes || internalNotes.trim().length < 10) {
      alert({
        title: "Validation Error",
        message: "Staff internal notes are required and must be at least 10 characters.",
        type: "danger"
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: statusUpdate,
          internalNotes,
          reason: "Admin modified status or notes in 360 profile",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("User record updated successfully", "success");
        fetchUserDetail();
      } else {
        alert({
          title: "Update Failed",
          message: json.message || "Failed to save profile updates.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "An error occurred while updating the user record.",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 animate-pulse">
        Loading 360° Profile details...
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-500">User not found or deleted.</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-rose-50 text-slate-700 border border-rose-200 text-xs font-bold hover:bg-rose-100">
          ← Go Back
        </button>
      </div>
    );
  }

  const { user, registrations, payments, reports, supportTickets, buddySessions, timeline } = data;

  const age = user.dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : "N/A";

  return (
    <div className="space-y-6 pb-12">
      {/* TOP BREADCRUMB & BACK */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <span>{user.name}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              user.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : user.status === "SUSPENDED"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}>
              {user.status || "ACTIVE"}
            </span>
          </h2>
          <span className="text-xs text-slate-500">ID: {"USR-" + user.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* 360 HEADER PROFILE CARD */}
      <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center font-serif font-black text-2xl text-[#7E2248] overflow-hidden shrink-0 shadow-xs">
            {user.profilePhoto || user.profileImage ? (
              <img src={user.profilePhoto || user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-slate-900">{user.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone || "N/A"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {user.city || "Unspecified"}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#7E2248] font-bold text-[10px] border border-rose-200/60">
                {user.role}
              </span>
              <span className="text-slate-600">Age: <strong>{age}</strong></span>
              <span className="text-slate-600">• Gender: <strong>{user.gender || "Not specified"}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Control */}
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-rose-100">
          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#7E2248] focus:bg-white"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
          <button
            onClick={handleSaveStatus}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Status"}
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-rose-100 overflow-x-auto text-xs font-semibold">
        {[
          { id: "overview", label: "Account Overview" },
          { id: "timeline", label: `Activity Timeline (${timeline?.length || 0})` },
          { id: "events", label: `Event Passes (${registrations?.length || 0})` },
          { id: "payments", label: `Payments (${payments?.length || 0})` },
          { id: "safety", label: `Safety & Support (${(reports?.length || 0) + (supportTickets?.length || 0)})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#7E2248] text-[#7E2248] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Identity & Verification */}
          <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
              Identity & Verification
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Profile Status</span>
                <span className="font-bold text-emerald-700">{user.isVerified ? "Verified Member" : "Pending Verification"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Date of Birth</span>
                <span className="text-slate-800 font-medium">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Relationship Intent</span>
                <span className="text-slate-800 font-medium">{user.relationshipIntent || "Social Connections"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-rose-50">
                <span className="text-slate-500">Assigned Relationship Manager</span>
                <span className="text-[#7E2248] font-bold">
                  {user.assignedManager ? user.assignedManager.name : "None assigned"}
                </span>
              </div>

              {/* Uploaded Documents */}
              {(user.govIdProof || user.addressProof || user.eduCertificate || user.workExperience || user.idDocument) && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-2 font-bold">Uploaded Verification Documents:</span>
                  <div className="flex flex-wrap gap-2">
                    {user.govIdProof && (
                      <a href={`/uploads/${user.govIdProof}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200">
                        📄 Gov ID Proof
                      </a>
                    )}
                    {user.addressProof && (
                      <a href={`/uploads/${user.addressProof}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200">
                        📄 Address Proof
                      </a>
                    )}
                    {user.idDocument && (
                      <a href={`/uploads/${user.idDocument}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200">
                        📄 ID Document ({user.idType || "Doc"})
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
              Staff Internal Notes & Case Log
            </h4>
            <textarea
              rows={6}
              placeholder="Add private staff notes regarding this member's offline conduct, verification checks, or concierge preferences..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-slate-700 border border-rose-200 font-bold text-xs transition"
              >
                Save Internal Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-6">
          <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
            Real Chronological Member Activity
          </h4>

          {timeline.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No activity logged yet.</p>
          ) : (
            <div className="relative pl-6 border-l border-rose-200 space-y-6">
              {timeline.map((item: any, idx: number) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#7E2248] border-2 border-white shadow-xs" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.date).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: EVENTS */}
      {activeTab === "events" && (
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
          <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
            Registered Real-World Events & Ticket Passes
          </h4>

          {registrations.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No event registrations found for this user.</p>
          ) : (
            <div className="space-y-3">
              {registrations.map((r: any) => (
                <div key={r.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900">{r.eventTitle}</h5>
                    <p className="text-[11px] text-slate-500">
                      {new Date(r.eventDate).toLocaleDateString()} • {r.eventCity} • Pass: {r.ticketCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.checkedIn ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700"
                    }`}>
                      {r.checkedIn ? "Checked In at Venue" : "Not Checked In"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {r.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
          <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
            Transaction History
          </h4>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No billing transactions recorded.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any) => (
                <div key={p.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-700">₹{p.amount} ({p.type})</span>
                    <p className="text-[11px] text-slate-500">{p.gateway} • {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SAFETY */}
      {activeTab === "safety" && (
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-6 text-xs">
          <div>
            <h4 className="font-serif font-bold text-slate-700 uppercase tracking-wider text-xs mb-3">
              Safety Incidents & Reports ({reports.length})
            </h4>
            {reports.length === 0 ? (
              <p className="text-slate-400 italic py-2">No safety reports associated with this member.</p>
            ) : (
              <div className="space-y-2">
                {reports.map((rep: any) => (
                  <div key={rep.id} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Reason: {rep.reason}</span>
                      <span className="text-rose-700">{rep.status}</span>
                    </div>
                    <p className="text-slate-600">{rep.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-serif font-bold text-slate-700 uppercase tracking-wider text-xs mb-3">
              Support Inquiries ({supportTickets.length})
            </h4>
            {supportTickets.length === 0 ? (
              <p className="text-slate-400 italic py-2">No support inquiries opened.</p>
            ) : (
              <div className="space-y-2">
                {supportTickets.map((st: any) => (
                  <div key={st.id} className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{st.subject}</div>
                      <span className="text-[11px] text-slate-500">{st.category} • #{st.ticketNumber}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
