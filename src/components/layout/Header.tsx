"use client";

import { useFamily } from "@/lib/family-context";
import { LayoutList, Printer, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";

export function Header({
  title,
  subtitle,
  showPrint,
  familyCode,
  onTemplatesClick,
  onWizardClick,
}: {
  title?: string;
  subtitle?: string;
  showPrint?: boolean;
  familyCode: string;
  onTemplatesClick?: () => void;
  onWizardClick?: () => void;
}) {
  const { family } = useFamily();

  return (
    <header className="sticky top-0 z-40 border-b border-border-light/70 bg-bg/80 pt-safe backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
        <Link href="/?splash=1" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-lg shadow-accent-glow transition-transform group-active:scale-95">
            🧑‍🍳
          </span>
          <span className="min-w-0">
            <h1 className="truncate font-serif text-lg font-bold leading-tight text-text">
              {title || family.name}
            </h1>
            {subtitle && (
              <p className="truncate text-xs font-medium text-text-secondary">
                {subtitle}
              </p>
            )}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {showPrint && (
            <IconButton onClick={() => window.print()} aria-label="Print">
              <Printer className="h-5 w-5" />
            </IconButton>
          )}
          {onWizardClick && (
            <IconButton onClick={onWizardClick} aria-label="Planning wizard">
              <Sparkles className="h-5 w-5" />
            </IconButton>
          )}
          {onTemplatesClick && (
            <IconButton onClick={onTemplatesClick} aria-label="Meal templates">
              <LayoutList className="h-5 w-5" />
            </IconButton>
          )}
          <Link
            href={`/${familyCode}/settings`}
            aria-label="Settings"
            className="flex min-h-touch min-w-[44px] items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-card-header hover:text-text active:scale-95"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
