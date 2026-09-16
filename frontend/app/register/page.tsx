"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [intent, setIntent] = useState("Relationship");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/dashboard");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms || !privacy) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          confirmPassword,
          dateOfBirth: dob,
          city,
          gender,
          relationshipIntent: intent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRedirectTarget(data.redirectUrl || "/dashboard");
        setSuccess(true);
      } else {
        setError(data.message || "Registration failed. Please check your inputs.");
      }
    } catch (err) {
      setError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-[#131d2e] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white">
              J
            </div>
            <span className="font-extrabold text-lg">Jab<span className="text-[#e06d53]">We</span>Meet</span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-serif">Join JabWeMeet</h1>
          <p className="text-sm text-slate-400 mt-1">Real People. Real Places. Real Connections.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
              🎉
            </div>
            <h2 className="text-xl font-bold mb-2">Welcome to JabWeMeet! 🎉</h2>
            <p className="text-sm text-slate-300 mb-6">Your account has been created successfully.</p>
            <button
              onClick={() => router.push(redirectTarget)}
              className="w-full py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition"
            >
              CONTINUE TO DASHBOARD
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#e06d53]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#131d2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Looking For</label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#131d2e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#e06d53]"
                >
                  <option value="Relationship">Relationship</option>
                  <option value="Marriage">Marriage</option>
                  <option value="Friendship">Friendship</option>
                  <option value="Social Connections">Social Connections</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="accent-[#e06d53]"
                  required
                />
                <span>I agree to the Terms & Conditions.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  className="accent-[#e06d53]"
                  required
                />
                <span>I agree to the Privacy Policy.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !terms || !privacy}
              className="w-full mt-3 py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition shadow-lg disabled:opacity-60"
            >
              {loading ? "Creating account..." : "CREATE MY ACCOUNT"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#e06d53] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
