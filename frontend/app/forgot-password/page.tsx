"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "Reset instructions have been prepared.");
    } catch (err) {
      setError("Unable to process request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAF3F6] via-[#FDFBF9] to-white text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#7E2248] selection:text-white">
      {/* Back button */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-10">
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 hover:border-[#7E2248] text-slate-700 hover:text-[#7E2248] rounded-full transition text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-rose-100 rounded-3xl p-8 sm:p-10 shadow-xl shadow-rose-950/5 relative my-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <span className="font-extrabold text-2xl tracking-wider text-[#7E2248] uppercase">
              JABWEMEET
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">Forgot Password</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your registered email to reset your password.</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            ✓ {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-xs mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-[#7E2248]/20 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          <Link href="/login" className="text-[#7E2248] font-bold hover:underline">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
