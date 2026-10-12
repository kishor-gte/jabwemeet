"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CafeSidebar from "@/components/cafe/CafeSidebar";
import CafeHeader from "@/components/cafe/CafeHeader";

export default function CafeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || (data.user.role !== "CAFE" && data.user.role !== "ADMIN")) {
          router.push("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center text-slate-900 space-y-4 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-[#7E2248] animate-spin" />
        <p className="text-slate-500 font-medium font-serif">Loading Cafe Operations Hub...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDFBF9] text-slate-900 font-sans selection:bg-[#7E2248] selection:text-white">
      <CafeSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <CafeHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

