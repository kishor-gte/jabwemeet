"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function FloatingBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Remove back button on the root home page as requested
  if (pathname === "/") return null;

  // Also remove from cafe dashboard root to prevent it just being everywhere
  if (pathname === "/cafe/dashboard") return null;

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="fixed top-[22px] right-8 z-[50] flex items-center gap-2 bg-[#0b111e]/80 border border-white/20 text-slate-200 hover:text-white hover:bg-[#e06d53] px-4 py-2 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm font-semibold backdrop-blur-md"
      title="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
