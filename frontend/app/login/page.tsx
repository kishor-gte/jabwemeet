"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

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
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* Back button */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 hover:border-[#7E2248] text-slate-700 hover:text-[#7E2248] rounded-full transition text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-md bg-white border border-rose-100 rounded-3xl p-8 sm:p-10 shadow-xl shadow-rose-950/5 relative my-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">Ready to meet someone in the real world?</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {pendingApproval && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <span>⏳</span> Account Pending Approval
            </div>
            <p className="leading-relaxed">
              Your account is under review by the admin team. You will be able to log in once approved.
            </p>
            <p className="text-slate-500">
              Admin can approve your account at{" "}
              <Link href="/admin" className="text-[#7E2248] underline font-semibold">
                /admin → Staff &amp; Host Approvals
              </Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
              Email or Mobile Number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@example.com or 9876543210"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-[#7E2248] font-bold hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition pr-10 text-sm"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "LOGIN"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#7E2248] font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
