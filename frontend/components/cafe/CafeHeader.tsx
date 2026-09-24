import { Bell, Search, User } from "lucide-react";
import Link from "next/link";

export default function CafeHeader({ user }: { user: any }) {
  return (
    <header className="h-20 border-b border-white/10 bg-[#0b111e]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="flex-1 max-w-md relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search orders, reservations, or menu items..."
          className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      <div className="flex items-center gap-6">
        <Link href="/cafe/notifications" className="relative text-slate-400 hover:text-white transition">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black border-2 border-[#0b111e]">
            3
          </span>
        </Link>
        
        <Link href="/cafe/profile" className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.name || "Cafe User"}</p>
            <p className="text-xs text-amber-400">Cafe Partner</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 overflow-hidden">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
