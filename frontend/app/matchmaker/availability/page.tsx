"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function MatchmakerAvailabilityPage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        if (data.success && data.user.role === "MATCHMAKER") {
          setManager(data.user);
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

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-12 bg-white rounded-xl"></div>
      <div className="h-64 bg-white rounded-xl"></div>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
          actionMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}>
          {actionMessage.type === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{actionMessage.text}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">Manage Availability</h2>
            <p className="text-slate-500 text-sm mt-0.5">Set your weekly routine, active timeslots, and blocked days.</p>
          </div>
        </div>

        {/* 1. Your Status Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Your Status</h3>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailableForRequests ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className={isAvailableForRequests ? "text-emerald-700" : "text-slate-500"}>
                {isAvailableForRequests ? "Available for Requests" : "Unavailable for Requests"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Accept new requests</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !isAvailableForRequests;
                setIsAvailableForRequests(nextVal);
                handleSaveAvailability({ isAvailableForRequests: nextVal });
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                isAvailableForRequests ? "bg-teal-500" : "bg-slate-300"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Weekly Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize time slots for each day of the week.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {daysOrder.map((dayName) => {
              const dayObj = weeklySchedule.find((s: any) => s.day === dayName);
              const slots: string[] = dayObj?.slots || [];

              return (
                <div key={dayName} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                  <div className="font-bold text-slate-700 text-sm md:pt-1.5">{dayName}</div>
                  
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {slots.length === 0 ? (
                        <span className="text-xs italic text-slate-400">Unavailable</span>
                      ) : (
                        slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition"
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
                              className="text-slate-400 hover:text-rose-500 font-bold transition text-sm leading-none ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}

                      <button
                        type="button"
                        onClick={() => setAddingSlotDay(dayName)}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer ml-1"
                      >
                        + Add Time Slot
                      </button>
                    </div>

                    {addingSlotDay === dayName && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-teal-200 p-2.5 rounded-xl animate-in fade-in max-w-md mt-2">
                        <select
                          value={slotStartTime}
                          onChange={(e) => setSlotStartTime(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          {["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-slate-400">—</span>
                        <select
                          value={slotEndTime}
                          onChange={(e) => setSlotEndTime(e.target.value)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-800"
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
                          className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer ml-auto"
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

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSaveAvailability()}
              disabled={savingAvailability}
              className="px-6 py-2.5 rounded-xl bg-[#131d2e] hover:bg-slate-800 text-white font-bold text-sm shadow transition disabled:opacity-60 cursor-pointer"
            >
              {savingAvailability ? "Saving Schedule..." : "Save Schedule"}
            </button>
          </div>
        </div>

        {/* 3. Block Date Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Block Date</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prevent users from booking when you are unavailable.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-teal-500"
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
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200 cursor-pointer"
            >
              Block
            </button>
          </div>

          {blockedDates.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Currently Blocked Dates:</p>
              <div className="flex flex-wrap gap-2">
                {blockedDates.map((dStr) => (
                  <div key={dStr} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    <span>📅 {dStr}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = blockedDates.filter((x) => x !== dStr);
                        setBlockedDates(updated);
                        handleSaveAvailability({ blockedDates: updated });
                      }}
                      className="text-rose-400 hover:text-rose-600 font-bold text-sm ml-1 cursor-pointer"
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
