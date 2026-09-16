"use client";

import MatchmakerSidebar from "@/components/MatchmakerSidebar";
import MatchmakerNavbar from "@/components/MatchmakerNavbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchmakerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (data.success && data.user.role === "MATCHMAKER") {
          setLoading(false);
        } else {
          router.replace("/login");
        }
      } catch (err) {
        router.replace("/login");
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#fff5f7] text-rose-500">Loading...</div>;
  }

  return (
    <div className="h-screen w-screen flex bg-[#fff9fa] text-slate-800 overflow-hidden font-sans">
      <MatchmakerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MatchmakerNavbar />
        <main className="flex-1 overflow-y-auto bg-[#fff9fa] p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
