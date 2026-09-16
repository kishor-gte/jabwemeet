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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold mb-2 border border-white/10">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          System Preferences
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your communication channels, security safeguards, and session access.
        </p>
      </div>

      {savedNote && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNote}</span>
        </div>
      )}

      {/* Notifications Preferences */}
      <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-5 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Notification & Alert Channels</span>
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">Email Event Confirmations</span>
              <span className="text-slate-400 text-[11px]">
                Receive digital tickets and receipts to {userEmail}
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#e06d53]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">SMS Venue Updates</span>
              <span className="text-slate-400 text-[11px]">
                Receive venue door codes and host announcements via SMS
              </span>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#e06d53]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer">
            <div>
              <span className="font-semibold text-white block">City-Level Peer Discovery</span>
              <span className="text-slate-400 text-[11px]">
                Allow verified members attending the same event to see your first name
              </span>
            </div>
            <input
              type="checkbox"
              checked={cityVisibility}
              onChange={(e) => setCityVisibility(e.target.checked)}
              className="w-4 h-4 accent-[#e06d53]"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Security & Session */}
      <div className="rounded-3xl bg-[#131d2e] border border-white/10 p-6 sm:p-8 space-y-5 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Sessions</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-white block">Password & Authentication</span>
            <span className="text-slate-400 text-[11px]">
              Protected with salted bcrypt hashing and secure HTTP-only cookies
            </span>
          </div>
          <Link
            href="/forgot-password"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition self-start sm:self-auto font-medium"
          >
            Reset Password
          </Link>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-rose-300 block text-xs">Log Out of All Devices</span>
            <span className="text-slate-400 text-[11px]">
              Clears authenticated session token and cookies
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
