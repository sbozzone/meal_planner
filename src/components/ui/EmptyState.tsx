import { cn } from "@/lib/utils";

/**
 * Consistent, warm empty-state block. Accepts either a Lucide icon node or
 * an emoji string, a title, an optional description and an optional action.
 */
export function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center",
        className
      )}
    >
      {emoji && (
        <span className="mb-3 text-4xl leading-none" aria-hidden>
          {emoji}
        </span>
      )}
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light text-accent">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
