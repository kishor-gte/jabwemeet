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
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || data.user.role !== "CAFE") {
          router.push("/");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b111e] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b111e]">
      <CafeSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <CafeHeader user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
