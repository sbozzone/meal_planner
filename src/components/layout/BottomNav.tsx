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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
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
              className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-touch px-2 py-1"
            >
              <span
                className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-colors",
                  isActive ? "bg-accent/15" : ""
                )}
              >
                <tab.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-accent" : "text-text-secondary"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-accent" : "text-text-secondary"
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
