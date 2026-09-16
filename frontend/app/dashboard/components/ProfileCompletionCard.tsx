"use client";

import React, { useState } from "react";
import {
  UserCheck,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Shield,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Edit3,
  Save,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string | null;
  relationshipIntent: string | null;
  role: string;
  createdAt: string;
  dateOfBirth?: string;
}

interface ProfileCompletionCardProps {
  user: UserProfile;
  onUpdateUser: (updatedFields: Partial<UserProfile>) => void;
}

export default function ProfileCompletionCard({
  user,
  onUpdateUser,
}: ProfileCompletionCardProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable local form state
  const [editCity, setEditCity] = useState(user.city || "");
  const [editGender, setEditGender] = useState(user.gender || "");
  const [editIntent, setEditIntent] = useState(user.relationshipIntent || "");
  const [saveMessage, setSaveMessage] = useState("");

  // Field evaluation
  const fields = [
    { key: "name", label: "Full Name", value: user.name, complete: Boolean(user.name?.trim()) },
    { key: "email", label: "Verified Email", value: user.email, complete: Boolean(user.email?.trim()) },
    { key: "phone", label: "Mobile Number", value: user.phone, complete: Boolean(user.phone?.trim()) },
    { key: "city", label: "City / Location", value: user.city, complete: Boolean(user.city?.trim()) },
    { key: "dateOfBirth", label: "Date of Birth", value: user.dateOfBirth, complete: Boolean(user.dateOfBirth) },
    { key: "gender", label: "Gender", value: user.gender, complete: Boolean(user.gender?.trim()) },
    { key: "relationshipIntent", label: "Relationship Intent", value: user.relationshipIntent, complete: Boolean(user.relationshipIntent?.trim()) },
  ];

  const completedCount = fields.filter((f) => f.complete).length;
  const percentage = Math.round((completedCount / fields.length) * 100);
  const missingFields = fields.filter((f) => !f.complete);

  const handleSave = () => {
    onUpdateUser({
      city: editCity.trim() || user.city,
      gender: editGender.trim() || null,
      relationshipIntent: editIntent.trim() || null,
    });
    setSaveMessage("Profile updated successfully!");
    setIsEditing(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <>
      <div className="rounded-2xl bg-[#131d2e] border border-white/10 p-6 shadow-md hover:border-white/20 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Complete your profile
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  {completedCount} of {fields.length} details filled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {percentage === 100
                  ? "Your profile is 100% complete. Matchmakers and hosts have all necessary information."
                  : `Add ${missingFields.map((f) => f.label).join(", ")} for tailored recommendations.`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-white">{percentage}%</span>
            <span className="text-xs text-slate-400 ml-1">strength</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5 mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#e06d53] via-amber-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Dynamic Checklist / Missing fields */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {missingFields.length > 0 ? (
              <>
                <span className="text-slate-400 font-medium">Pending:</span>
                {missingFields.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium hover:bg-amber-500/20 transition"
                  >
                    <Circle className="w-2.5 h-2.5" />
                    <span>Add {f.label}</span>
                  </button>
                ))}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                All {fields.length} core profile attributes are fully verified and active
              </span>
            )}
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition shrink-0 self-start sm:self-auto"
          >
            <span>{percentage === 100 ? "Review Profile Details" : "Complete Profile"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Profile Details & Editor Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#131d2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-base shadow-md">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-slate-400">
                    {user.role} • {user.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditing(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* Profile Attributes List / Edit View */}
            <div className="space-y-3 text-xs">
              {/* Name (Read-only) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>Full Name</span>
                </div>
                <span className="font-semibold text-white">{user.name}</span>
              </div>

              {/* Email (Read-only) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email Address</span>
                </div>
                <span className="font-semibold text-white">{user.email}</span>
              </div>

              {/* Phone (Read-only) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>Phone Number</span>
                </div>
                <span className="font-semibold text-white">{user.phone}</span>
              </div>

              {/* City (Editable) */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>City</span>
                  </div>
                  {!isEditing && <span className="font-semibold text-white">{user.city}</span>}
                </div>
                {isEditing && (
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Enter your current city"
                    className="w-full mt-1.5 bg-[#0b111e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e06d53]"
                  />
                )}
              </div>

              {/* Relationship Intent (Editable) */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span>Relationship Intent</span>
                  </div>
                  {!isEditing && (
                    <span className="font-semibold text-white">
                      {user.relationshipIntent || "Not specified yet"}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <select
                    value={editIntent}
                    onChange={(e) => setEditIntent(e.target.value)}
                    className="w-full mt-1.5 bg-[#0b111e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select your intent</option>
                    <option value="Long-term Relationship">Long-term Relationship</option>
                    <option value="Marriage / Matrimonial">Marriage / Matrimonial</option>
                    <option value="Intentional Dating">Intentional Dating</option>
                    <option value="New Connections & Friends">New Connections & Friends</option>
                    <option value="Breakup Healing & Moving On">Breakup Healing & Moving On</option>
                  </select>
                )}
              </div>

              {/* Gender (Editable) */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Gender</span>
                  </div>
                  {!isEditing && (
                    <span className="font-semibold text-white">
                      {user.gender || "Not specified yet"}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full mt-1.5 bg-[#0b111e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e06d53]"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary / Other">Non-binary / Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                )}
              </div>

              {/* Date of Birth */}
              {user.dateOfBirth && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Date of Birth</span>
                  </div>
                  <span className="font-semibold text-white">
                    {new Date(user.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold transition shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Preferences</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
