"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pendingApproval, setPendingApproval] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPendingApproval(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(data.redirectUrl || "/dashboard");
      } else if (res.status === 403 && data.pendingApproval) {
        setPendingApproval(true);
      } else {
        setError(data.message || "Email/mobile or password is incorrect.");
      }
    } catch (err) {
      setError("We couldn't connect to JabWeMeet right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b111e] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-[#131d2e] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-bold text-white">
              J
            </div>
            <span className="font-extrabold text-lg">Jab<span className="text-[#e06d53]">We</span>Meet</span>
          </Link>
          <h1 className="text-2xl font-bold text-white font-serif">Welcome back.</h1>
          <p className="text-sm text-slate-400 mt-1">Ready to meet someone in the real world?</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {pendingApproval && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <span>⏳</span> Account Pending Approval
            </div>
            <p className="leading-relaxed">
              Your account is under review by the admin team. You will be able to log in once approved.
            </p>
            <p className="text-slate-400">
              Admin can approve your account at{" "}
              <Link href="/admin" className="text-amber-300 underline font-semibold">
                /admin → Staff &amp; Host Approvals
              </Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@example.com or +91..."
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#e06d53] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#e06d53]"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-full bg-[#e06d53] hover:bg-[#c95940] text-white font-semibold text-sm transition shadow-lg disabled:opacity-60"
          >
            {loading ? "Signing in..." : "LOGIN"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#e06d53] font-semibold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
