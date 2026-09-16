"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchmakerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) router.replace("/login");
        else setUser(d.user);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b111e] text-white p-8">
      <div className="max-w-4xl mx-auto bg-[#131d2e] border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Relationship Manager / Matchmaker Portal</h1>
        <p className="text-slate-400 mb-6">Curating authentic pairings and private blind date introductions.</p>
        <p className="text-sm">Logged in as: {user?.name || "Loading..."}</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm text-[#e06d53] underline">Go to Main Dashboard</a>
      </div>
    </div>
  );
}
