"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Coffee, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function CafeHeader({ user }: { user: any }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/cafe/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const unread = data.data.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 shrink-0">
      <div className="flex-1 max-w-md relative">
        <div className="flex items-center bg-[#FDFBF9] rounded-2xl px-4 py-2 border border-rose-200 focus-within:border-[#7E2248] focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search orders, reservations, or menu items..."
            className="bg-transparent border-none outline-none w-full ml-3 text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-5">
        {/* Portal Status Tag */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-[#7E2248]">
          <Coffee className="w-3.5 h-3.5 text-[#7E2248]" />
          <span>Cafe Partner Portal</span>
        </div>

        {/* Notifications Bell */}
        <Link
          href="/cafe/notifications"
          className="relative p-2.5 rounded-xl border border-rose-100 bg-[#FAF3F6] hover:bg-rose-100/60 text-slate-700 hover:text-[#7E2248] transition shadow-xs"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#7E2248] text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1 border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Cafe Profile Tag */}
        <Link href="/cafe/profile" className="flex items-center gap-3 group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 group-hover:text-[#7E2248] transition truncate max-w-[140px]">
              {user?.name || "Cafe Partner"}
            </p>
            <p className="text-[11px] font-semibold text-[#7E2248]">Cafe Operations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-[#7E2248] font-bold text-sm shadow-xs overflow-hidden group-hover:scale-105 transition">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : "CP"}</span>
            )}
          </div>
        </Link>

        {/* Back Button (shown on subpages) */}
        {pathname !== "/cafe/dashboard" && (
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/cafe/dashboard");
              }
            }}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100/80 text-[#7E2248] border border-rose-200 px-3.5 py-2 rounded-xl transition text-xs font-bold cursor-pointer shadow-xs ml-2"
            title="Go Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
      </div>
    </header>
  );
}

