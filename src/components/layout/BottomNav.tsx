"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Package, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Plan", icon: CalendarDays },
  { href: "/dishes", label: "Dishes", icon: UtensilsCrossed },
  { href: "/shopping", label: "Shop", icon: ShoppingCart },
  { href: "/pantry", label: "Pantry", icon: Package },
];

export function BottomNav({ familyCode }: { familyCode: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.6rem)]">
      <div className="flex w-full max-w-sm items-center justify-around gap-1 rounded-2xl border border-border-light/80 bg-paper/90 p-1.5 shadow-nav backdrop-blur-md">
        {tabs.map((tab) => {
          const fullPath = `/${familyCode}${tab.href}`;
          const isActive =
            tab.href === ""
              ? pathname === `/${familyCode}`
              : pathname === fullPath;

          return (
            <Link
              key={tab.label}
              href={fullPath}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors duration-200",
                isActive ? "bg-accent-gradient shadow-accent-glow" : "hover:bg-card-header"
              )}
            >
              <tab.icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors",
                  isActive ? "text-white" : "text-text-secondary group-hover:text-text"
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-tight transition-colors",
                  isActive ? "text-white" : "text-text-secondary group-hover:text-text"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
