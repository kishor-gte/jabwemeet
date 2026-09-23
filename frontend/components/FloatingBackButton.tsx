"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function FloatingBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on the main landing page
  if (pathname === "/") return null;

  return (
    <button
      onClick={() => {
        // Fallback: if they somehow get stuck, this at least triggers a back navigation
        // or they can just click it to go back in history.
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="fixed bottom-6 left-6 z-[99999] flex items-center gap-2 bg-black/60 border border-white/20 text-slate-200 hover:text-white hover:bg-[#e06d53] px-4 py-2.5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm font-semibold backdrop-blur-md"
      title="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
