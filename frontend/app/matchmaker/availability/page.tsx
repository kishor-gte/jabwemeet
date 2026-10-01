"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, User, Sparkles, ShieldCheck, Camera, CheckCircle2, Clock, CalendarDays } from "lucide-react";

export default function MatchmakerAvailabilityPage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile & Display Alias State
  const [displayName, setDisplayName] = useState<string>("");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [shortBio, setShortBio] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Availability & Schedule Dynamic States
  const [isAvailableForRequests, setIsAvailableForRequests] = useState<boolean>(true);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([
    { day: "Monday", slots: ["10:00 AM — 01:00 PM", "06:00 PM — 10:00 PM"] },
    { day: "Tuesday", slots: ["10:00 AM — 01:00 PM"] },
    { day: "Wednesday", slots: ["06:00 PM — 10:00 PM"] },
    { day: "Thursday", slots: [] },
    { day: "Friday", slots: [] },
    { day: "Saturday", slots: [] },
    { day: "Sunday", slots: [] },
  ]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockDate, setNewBlockDate] = useState<string>("");
  const [savingAvailability, setSavingAvailability] = useState<boolean>(false);
  const [addingSlotDay, setAddingSlotDay] = useState<string | null>(null);
  const [slotStartTime, setSlotStartTime] = useState<string>("10:00 AM");
  const [slotEndTime, setSlotEndTime] = useState<string>("01:00 PM");

  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data.success && (data.user.role === "MATCHMAKER" || data.user.role === "ADMIN")) {
          setManager(data.user);
          setDisplayName(data.user.displayName || data.user.name || "");
          setProfilePhoto(data.user.profilePhoto || data.user.profileImage || "");
          setShortBio(data.user.shortBio || "");
          setCity(data.user.city || "");
          fetchAvailability();
        } else {
          router.replace("/login");
        }
      } catch (err) {
        router.replace("/login");
      }
    }
    init();
  }, [router]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/matchmaker/availability", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) {
        if (typeof data.data.isAvailableForRequests === "boolean") {
          setIsAvailableForRequests(data.data.isAvailableForRequests);
        }
        if (Array.isArray(data.data.weeklySchedule) && data.data.weeklySchedule.length > 0) {
          setWeeklySchedule(data.data.weeklySchedule);
        }
        if (Array.isArray(data.data.blockedDates)) {
          setBlockedDates(data.data.blockedDates);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async (updatedFields?: any) => {
    setSavingAvailability(true);
    setActionMessage(null);
    try {
      const payload = {
        isAvailableForRequests: updatedFields?.isAvailableForRequests !== undefined ? updatedFields.isAvailableForRequests : isAvailableForRequests,
        weeklySchedule: updatedFields?.weeklySchedule !== undefined ? updatedFields.weeklySchedule : weeklySchedule,
        blockedDates: updatedFields?.blockedDates !== undefined ? updatedFields.blockedDates : blockedDates,
      };
      const res = await fetch("/api/matchmaker/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ text: "✓ Availability schedule updated successfully!", type: "success" });
        if (data.data) {
          if (typeof data.data.isAvailableForRequests === "boolean") setIsAvailableForRequests(data.data.isAvailableForRequests);
          if (Array.isArray(data.data.weeklySchedule)) setWeeklySchedule(data.data.weeklySchedule);
          if (Array.isArray(data.data.blockedDates)) setBlockedDates(data.data.blockedDates);
        }
      } else {
        setActionMessage({ text: data.message || "Failed to update availability", type: "error" });
      }
    } catch (e) {
      setActionMessage({ text: "Error saving availability", type: "error" });
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/matchmaker/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName,
          profilePhoto,
          shortBio,
          city,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage({ text: "✓ Profile & Display Alias saved successfully! Clients will now see this persona.", type: "success" });
      } else {
        setProfileMessage({ text: data.message || "Failed to update profile", type: "error" });
      }
    } catch (e) {
      setProfileMessage({ text: "Error saving profile", type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium text-xs font-serif">Loading profile & availability...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8">
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-xs ${
          actionMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {actionMessage.type === "error" && <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          {actionMessage.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
          <p className="text-xs sm:text-sm font-semibold">{actionMessage.text}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Consultant Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Profile & Availability
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Manage your client-facing alias, weekly routine, and active matchmaking timeslots.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile & Display Alias Card */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#7E2248] border border-rose-100 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-[#7E2248]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">Profile & Display Alias</h3>
                <p className="text-xs text-slate-500">Configure how clients see your name and persona across JabWeMeet.</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#7E2248] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Client Facing
            </span>
          </div>

          {profileMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              profileMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7E2248] to-rose-400 text-white flex items-center justify-center font-bold text-2xl border-2 border-rose-200 overflow-hidden shadow-sm">
                  {profilePhoto ? (
                    <img
                      src={
                        profilePhoto.startsWith("http") || profilePhoto.startsWith("/") || profilePhoto.startsWith("data:")
                          ? profilePhoto
                          : `/uploads/${profilePhoto}`
                      }
                      alt={displayName || "RM"}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  ) : (
                    <span>{(displayName || manager?.name || "R")[0].toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Alias / Persona Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Matchmaker Priya, Advisor Aryan..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This alias replaces your legal name on client dashboards and matchmaking consultation cards.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profile Photo (URL or filename)
                    </label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="e.g. photo.jpg or https://..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operating City / Location
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bangalore, Mumbai, Remote..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Bio / Expertise Introduction
              </label>
              <textarea
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                placeholder="A warm note to prospective clients describing your matchmaking experience and dating philosophy..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-[#7E2248] focus:bg-white transition resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-[#7E2248]/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {savingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Profile & Display Alias</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 1. Your Status Card */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 mb-1">Intake Availability Status</h3>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailableForRequests ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className={isAvailableForRequests ? "text-emerald-800" : "text-slate-500"}>
                {isAvailableForRequests ? "Available for New Member Requests" : "Unavailable (Intake Paused)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Accept incoming requests</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isAvailableForRequests;
                setIsAvailableForRequests(nextVal);
                handleSaveAvailability({ isAvailableForRequests: nextVal });
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                isAvailableForRequests ? "bg-[#7E2248]" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isAvailableForRequests ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 2. Weekly Schedule Card */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">Weekly Consultation Slots</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize meeting windows for each day of the week.</p>
            </div>
          </div>

          <div className="divide-y divide-rose-100">
            {daysOrder.map((dayName) => {
              const dayObj = weeklySchedule.find((s: any) => s.day === dayName);
              const slots: string[] = dayObj?.slots || [];

              return (
                <div key={dayName} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                  <div className="font-bold text-slate-900 text-sm md:pt-1.5">{dayName}</div>
                  
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {slots.length === 0 ? (
                        <span className="text-xs italic text-slate-400">Unavailable</span>
                      ) : (
                        slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-[#7E2248] shadow-xs"
                          >
                            <span>{slot}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSlots = slots.filter((_, i) => i !== idx);
                                const updatedSchedule = daysOrder.map(d => {
                                  if (d === dayName) return { day: d, slots: updatedSlots };
                                  const existing = weeklySchedule.find((s: any) => s.day === d);
                                  return existing || { day: d, slots: [] };
                                });
                                setWeeklySchedule(updatedSchedule);
                              }}
                              className="text-rose-400 hover:text-rose-700 font-bold transition text-sm leading-none ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}

                      <button
                        type="button"
                        onClick={() => setAddingSlotDay(dayName)}
                        className="text-xs font-bold text-[#7E2248] hover:text-[#681938] transition cursor-pointer ml-1"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    {addingSlotDay === dayName && (
                      <div className="flex items-center gap-2 bg-[#FAF3F6] border border-rose-200 p-2.5 rounded-2xl animate-in fade-in max-w-md mt-2">
                        <select
                          value={slotStartTime}
                          onChange={(e) => setSlotStartTime(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-slate-900"
                        >
                          {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-slate-400">—</span>
                        <select
                          value={slotEndTime}
                          onChange={(e) => setSlotEndTime(e.target.value)}
                          className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-slate-900"
                        >
                          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newSlotStr = `${slotStartTime} — ${slotEndTime}`;
                            const updatedSlots = [...slots, newSlotStr];
                            const updatedSchedule = daysOrder.map(d => {
                              if (d === dayName) return { day: d, slots: updatedSlots };
                              const existing = weeklySchedule.find((s: any) => s.day === d);
                              return existing || { day: d, slots: [] };
                            });
                            setWeeklySchedule(updatedSchedule);
                            setAddingSlotDay(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#7E2248] text-white text-xs font-bold hover:bg-[#681938] transition cursor-pointer ml-auto"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingSlotDay(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-rose-100">
            <button
              type="button"
              onClick={() => handleSaveAvailability()}
              disabled={savingAvailability}
              className="px-6 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs shadow-md shadow-[#7E2248]/20 transition disabled:opacity-60 cursor-pointer"
            >
              {savingAvailability ? "Saving Schedule..." : "Save Schedule"}
            </button>
          </div>
        </div>

        {/* 3. Block Date Card */}
        <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900">Block Specific Dates</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prevent users from scheduling meetings on holidays or personal days off.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#FDFBF9] border border-rose-200 text-slate-900 text-xs focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => {
                if (!newBlockDate) return;
                if (!blockedDates.includes(newBlockDate)) {
                  const updated = [...blockedDates, newBlockDate].sort();
                  setBlockedDates(updated);
                  handleSaveAvailability({ blockedDates: updated });
                }
                setNewBlockDate("");
              }}
              className="px-5 py-2.5 rounded-xl bg-[#FAF3F6] hover:bg-rose-100/60 text-[#7E2248] font-bold text-xs transition border border-rose-200 cursor-pointer"
            >
              Block Date
            </button>
          </div>

          {blockedDates.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Currently Blocked Dates:</p>
              <div className="flex flex-wrap gap-2">
                {blockedDates.map((dStr) => (
                  <div key={dStr} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-bold shadow-xs">
                    <span>📅 {dStr}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = blockedDates.filter((x) => x !== dStr);
                        setBlockedDates(updated);
                        handleSaveAvailability({ blockedDates: updated });
                      }}
                      className="text-rose-400 hover:text-rose-700 font-bold text-sm ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
