import { cn } from "@/lib/utils";

type Variant = "default" | "active" | "danger";

const VARIANTS: Record<Variant, string> = {
  default: "text-text-secondary hover:bg-card-header hover:text-text",
  active: "text-accent bg-accent/12 hover:bg-accent/18",
  danger: "text-text-muted hover:text-red hover:bg-red/8",
};

/**
 * Square, touch-sized icon button used for header actions, toolbars and
 * row controls. Consolidates the icon-button styling that was copy-pasted
 * across the Header, WeekNavigation and BottomSheet.
 */
export function IconButton({
  variant = "default",
  className,
  children,
  ...props
}: {
  variant?: Variant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "flex min-h-touch min-w-[44px] items-center justify-center rounded-xl transition-colors duration-150 active:scale-95",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
