import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Menu,
  CalendarDays,
  CalendarCheck2,
  UtensilsCrossed,
  Users,
  UserSquare2,
  Ticket,
  Wallet,
  LineChart,
  Star,
  Bell,
  Settings,
  LogOut,
  Coffee
} from "lucide-react";

export default function CafeSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/cafe/dashboard", icon: LayoutDashboard },
    { name: "Cafe Profile", href: "/cafe/profile", icon: Store },
    { name: "Menu Management", href: "/cafe/menu", icon: Menu },
    
    { name: "Reservations", href: "/cafe/reservations", icon: CalendarCheck2 },
    { name: "Orders", href: "/cafe/orders", icon: UtensilsCrossed },
    { name: "Customers", href: "/cafe/customers", icon: Users },
    { name: "Staff Management", href: "/cafe/staff", icon: UserSquare2 },
    { name: "Offers & Coupons", href: "/cafe/offers", icon: Ticket },
    { name: "Payments", href: "/cafe/payments", icon: Wallet },
    { name: "Analytics", href: "/cafe/analytics", icon: LineChart },
    { name: "Reviews", href: "/cafe/reviews", icon: Star },
    { name: "Notifications", href: "/cafe/notifications", icon: Bell },
    { name: "Settings", href: "/cafe/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      } catch (e) {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="flex flex-col w-64 bg-[#0b111e] border-r border-white/10 h-screen sticky top-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="p-6">
        <Link href="/cafe/dashboard" className="flex items-center gap-2">
          <Coffee className="text-amber-400 w-8 h-8" />
          <span className="font-serif text-xl font-bold text-white tracking-wide">Cafe Partner</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 pb-8 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-400/10 text-amber-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-400/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
