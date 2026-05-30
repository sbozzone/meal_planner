import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-soft";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-gradient text-white shadow-accent-glow hover:brightness-[1.04] active:brightness-95",
  secondary:
    "bg-card text-text border border-border hover:bg-card-header hover:border-border",
  ghost: "text-text-secondary hover:bg-card-header hover:text-text",
  danger: "bg-red text-white hover:brightness-105",
  "danger-soft":
    "text-red border border-red/25 hover:bg-red/5 hover:border-red/40",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-sm gap-1.5 rounded-lg",
  md: "min-h-touch px-4 py-2.5 text-sm gap-2 rounded-card",
  lg: "min-h-touch px-5 py-3 text-base gap-2 rounded-card",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 ease-spring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
