"use client";
// src/components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCircle, FileText, ShieldAlert, HeartPulse, Building2 } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Profile", href: "/profile", icon: UserCircle },
  { name: "Lab Reports", href: "/reports", icon: FileText },
  { name: "AI Predictions", href: "/predictions", icon: HeartPulse },
  { name: "Insurance Claims", href: "/insurance", icon: ShieldAlert },
  { name: "Hospital Finder", href: "/hospital-finder", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-white/10 bg-[#0f1729] min-h-[calc(100vh-4rem)] hidden md:block">
      <div className="p-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-6 mt-auto border-t border-white/10">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Health Tip</h4>
          </div>
          <p className="text-xs text-slate-400">
            Keep your emergency QR card updated. It can save lives during golden hours.
          </p>
        </div>
      </div>
    </div>
  );
}
