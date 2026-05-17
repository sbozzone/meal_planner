import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
      <h1 className="font-serif text-2xl font-bold text-text mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary mb-6">
        This family or page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent text-white rounded-card font-semibold hover:bg-accent-hover transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
