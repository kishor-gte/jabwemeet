"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  ShieldAlert,
  Globe,
  Users,
  Calendar,
  HeartHandshake,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminSettingsPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "general" | "verification" | "events" | "services" | "notifications"
  >("general");

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Local state for editable settings
  const [formData, setFormData] = useState({
    platform_name: "JabWeMeet",
    support_email: "support@jabweemeet.com",
    contact_phone: "+91 98765 43210",
    default_gst_rate: 18,
    min_registration_age: 21,
    require_phone_verification: true,
    require_gov_id_for_events: true,
    event_cancellation_hours: 48,
    max_tickets_per_user: 2,
    auto_refund_on_event_cancel: true,
    breakup_buddy_disclaimer:
      "Breakup Buddy provides empathetic emotional peer companionship and situational perspective. Breakup Buddies are not licensed psychotherapists or psychiatrists. If you are experiencing acute psychiatric crisis or severe depression, please contact certified mental health professionals or immediate emergency hotlines.",
    require_rm_consultation_approval: true,
    email_notifications_enabled: true,
    sms_notifications_enabled: true,
    staff_incident_alerts: true,
  });

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setFormData((prev) => ({
          ...prev,
          ...data.settings,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function saveIndividualSetting(key: string, category: string, value: any) {
    setSavingKey(key);
    setErrorMsg("");
    setSaveSuccess(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          key,
          category,
          value,
          reason: `Admin updated ${key} via Platform Settings`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(key);
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setErrorMsg(data.message || "Failed to save setting");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error");
    } finally {
      setSavingKey(null);
    }
  }

  const tabs = [
    { id: "general", label: "General & Branding", icon: Globe },
    { id: "verification", label: "Trust & Verification", icon: ShieldAlert },
    { id: "events", label: "Events & Ticketing", icon: Calendar },
    { id: "services", label: "Care & Services", icon: HeartHandshake },
    { id: "notifications", label: "Alerts & Gateways", icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121c2e] via-[#0f1728] to-[#121c2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Core Platform Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-red-500" />
            System Configuration & Platform Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Centrally manage platform operational parameters, verification thresholds, and governance policies.
          </p>
        </div>
        <div className="relative z-10 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-bold w-fit">
          <Lock className="w-3.5 h-3.5" />
          Protected against secret leakage
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents Card */}
      <div className="rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl p-6 sm:p-8">
        {/* Tab 1: General Platform */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Platform Identity & Contact</h2>
              <p className="text-slate-400 text-xs mt-0.5">Public-facing brand information and customer contact points</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Platform Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.platform_name}
                    onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("platform_name", "general", formData.platform_name)}
                    disabled={savingKey === "platform_name"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "platform_name" ? "Saving..." : saveSuccess === "platform_name" ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Official Support Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("support_email", "general", formData.support_email)}
                    disabled={savingKey === "support_email"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "support_email" ? "Saving..." : saveSuccess === "support_email" ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Official Contact Helpline
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("contact_phone", "general", formData.contact_phone)}
                    disabled={savingKey === "contact_phone"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "contact_phone" ? "Saving..." : saveSuccess === "contact_phone" ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Standard GST / Tax Rate (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.default_gst_rate}
                    onChange={(e) => setFormData({ ...formData, default_gst_rate: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("default_gst_rate", "finance", formData.default_gst_rate)}
                    disabled={savingKey === "default_gst_rate"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "default_gst_rate" ? "Saving..." : saveSuccess === "default_gst_rate" ? "Saved!" : "Save"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Default rate applied on invoices generated for Indian services.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Trust & Verification */}
        {activeTab === "verification" && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Member Onboarding & Identity Compliance</h2>
              <p className="text-slate-400 text-xs mt-0.5">Security criteria enforcing genuine identity and background integrity</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Minimum Registration Age (Years)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={formData.min_registration_age}
                    onChange={(e) => setFormData({ ...formData, min_registration_age: parseInt(e.target.value, 10) || 18 })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("min_registration_age", "verification", formData.min_registration_age)}
                    disabled={savingKey === "min_registration_age"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "min_registration_age" ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Mandatory Mobile OTP Verification</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Require 6-digit SMS verification code prior to profile activation</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.require_phone_verification}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, require_phone_verification: val });
                    saveIndividualSetting("require_phone_verification", "verification", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Gov ID Verification for High-Touch Events</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Restrict private event bookings to verified Aadhaar / Passport badge holders</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.require_gov_id_for_events}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, require_gov_id_for_events: val });
                    saveIndividualSetting("require_gov_id_for_events", "verification", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Events & Ticketing */}
        {activeTab === "events" && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Event Cancellation & Booking Rules</h2>
              <p className="text-slate-400 text-xs mt-0.5">Configure attendance policies and cutoff windows</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Cancellation Window (Hours before Event)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.event_cancellation_hours}
                    onChange={(e) => setFormData({ ...formData, event_cancellation_hours: parseInt(e.target.value, 10) || 0 })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("event_cancellation_hours", "events", formData.event_cancellation_hours)}
                    disabled={savingKey === "event_cancellation_hours"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "event_cancellation_hours" ? "Saving..." : "Save"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Members cannot cancel or request auto-refund within this threshold.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Maximum Tickets Per Member Order
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.max_tickets_per_user}
                    onChange={(e) => setFormData({ ...formData, max_tickets_per_user: parseInt(e.target.value, 10) || 1 })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => saveIndividualSetting("max_tickets_per_user", "events", formData.max_tickets_per_user)}
                    disabled={savingKey === "max_tickets_per_user"}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "max_tickets_per_user" ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Auto-Refund on Event Cancellation</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Automatically trigger PG refund batches when an admin cancels an event</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_refund_on_event_cancel}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, auto_refund_on_event_cancel: val });
                    saveIndividualSetting("auto_refund_on_event_cancel", "events", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Care & Services */}
        {activeTab === "services" && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Care Governance & Legal Boundaries</h2>
              <p className="text-slate-400 text-xs mt-0.5">Non-therapy boundaries and relationship manager protocol</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Breakup Buddy Non-Therapy Disclaimer (Mandatory Display)
                </label>
                <textarea
                  rows={4}
                  value={formData.breakup_buddy_disclaimer}
                  onChange={(e) => setFormData({ ...formData, breakup_buddy_disclaimer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 leading-relaxed placeholder:text-slate-500"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => saveIndividualSetting("breakup_buddy_disclaimer", "services", formData.breakup_buddy_disclaimer)}
                    disabled={savingKey === "breakup_buddy_disclaimer"}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-md shadow-red-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === "breakup_buddy_disclaimer" ? "Saving..." : "Save Disclaimer"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Require Mutual Consent for Match Introductions</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">RMs cannot share contact info without both parties approving the intro</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.require_rm_consultation_approval}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, require_rm_consultation_approval: val });
                    saveIndividualSetting("require_rm_consultation_approval", "services", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Alerts & Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white">Communication & Notification Gateways</h2>
              <p className="text-slate-400 text-xs mt-0.5">Configure transactional and emergency push delivery</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Transactional Email Receipts</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Send automatic payment invoices and event pass QR codes</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.email_notifications_enabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, email_notifications_enabled: val });
                    saveIndividualSetting("email_notifications_enabled", "notifications", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">SMS Gateway Dispatch</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Send time-critical event venue changes and OTPs via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.sms_notifications_enabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, sms_notifications_enabled: val });
                    saveIndividualSetting("sms_notifications_enabled", "notifications", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#162136] border border-white/10 rounded-2xl">
                <div>
                  <h3 className="font-bold text-white text-xs">Instant Staff Safety Escalations</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Dispatch urgent alerts to Super Admins on critical report filing</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.staff_incident_alerts}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, staff_incident_alerts: val });
                    saveIndividualSetting("staff_incident_alerts", "notifications", val);
                  }}
                  className="w-5 h-5 rounded accent-red-600 cursor-pointer"
                />
              </div>

              {/* SMTP LIVE DIAGNOSTIC & TEST DISPATCH */}
              <div className="p-5 bg-gradient-to-br from-[#131d31] to-[#1e1b4b] border border-purple-500/30 rounded-3xl space-y-3 mt-6 shadow-xl">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Live SMTP Mailer Diagnostic & Test Dispatch</span>
                </div>
                <p className="text-slate-300 text-xs">
                  Send a live test email directly to your inbox to verify SMTP connection, emojis, and brand styling.
                </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="email"
                      placeholder="Enter recipient email (e.g. nehakore467@gmail.com)"
                      id="testEmailInput"
                      defaultValue="nehakore467@gmail.com"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#0f172a] border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = (document.getElementById("testEmailInput") as HTMLInputElement)?.value;
                        if (!input) {
                          alert({
                            title: "Missing Email Address",
                            message: "Please enter a recipient email address to send the test email.",
                            type: "warning",
                          });
                          return;
                        }
                        try {
                          const res = await fetch("/api/admin/test-email", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ toEmail: input }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast(data.message || "Test email dispatched successfully! Please check your inbox.", "success");
                          } else {
                            alert({
                              title: "Test Email Failed",
                              message: data.message || "Failed to send test email.",
                              type: "danger",
                            });
                          }
                        } catch (err: any) {
                          alert({
                            title: "Error Sending Test Email",
                            message: err.message || "An unexpected error occurred while communicating with the mail server.",
                            type: "danger",
                          });
                        }
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Send Test Email</span>
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
