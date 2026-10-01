"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Settings,
  ShieldCheck,
  Bell,
  Lock,
  Eye,
  LogOut,
  Save,
  CheckCircle2,
} from "lucide-react";

interface SettingsViewProps {
  userEmail: string;
  onLogout: () => void;
}

export default function SettingsView({ userEmail, onLogout }: SettingsViewProps) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [cityVisibility, setCityVisibility] = useState(true);
  const [savedNote, setSavedNote] = useState("");

  const handleSave = () => {
    setSavedNote("Preferences updated successfully!");
    setTimeout(() => setSavedNote(""), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#7E2248] text-xs font-semibold mb-2 border border-rose-200">
          <Settings className="w-3.5 h-3.5 text-[#7E2248]" />
          System Preferences
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your communication channels, security safeguards, and session access.
        </p>
      </div>

      {savedNote && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{savedNote}</span>
        </div>
      )}

      {/* Notifications Preferences */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-5 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2 border-b border-rose-100 pb-3">
          <Bell className="w-4 h-4 text-amber-600" />
          <span>Notification & Alert Channels</span>
        </h3>

        <div className="space-y-3.5 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/30 border border-rose-100 hover:bg-rose-50/60 transition cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 block">Email Event Confirmations</span>
              <span className="text-slate-500 text-[11px]">
                Receive digital tickets and receipts to {userEmail}
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#7E2248] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/30 border border-rose-100 hover:bg-rose-50/60 transition cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 block">SMS Venue Updates</span>
              <span className="text-slate-500 text-[11px]">
                Receive venue door codes and host announcements via SMS
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#7E2248] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/30 border border-rose-100 hover:bg-rose-50/60 transition cursor-pointer">
            <div>
              <span className="font-semibold text-slate-900 block">City-Level Peer Discovery</span>
              <span className="text-slate-500 text-[11px]">
                Allow verified members attending the same event to see your first name
              </span>
            </div>
            <input
              type="checkbox"
              checked={cityVisibility}
              onChange={(e) => setCityVisibility(e.target.checked)}
              className="w-4 h-4 accent-[#7E2248] cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold transition shadow-md shadow-[#7E2248]/20 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Security & Session */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 space-y-5 shadow-sm hover:shadow-md transition-all duration-300">
        <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2 border-b border-rose-100 pb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Security & Sessions</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-900 block">Password & Authentication</span>
            <span className="text-slate-500 text-[11px]">
              Protected with salted bcrypt hashing and secure HTTP-only cookies
            </span>
          </div>
          <Link
            href="/forgot-password"
            className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200 transition self-start sm:self-auto font-medium"
          >
            Reset Password
          </Link>
        </div>

        <div className="pt-4 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-rose-900 block text-xs">Log Out of All Devices</span>
            <span className="text-slate-500 text-[11px]">
              Clears authenticated session token and cookies
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-bold border border-rose-200 transition self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
