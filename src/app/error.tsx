"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
      <h1 className="font-serif text-2xl font-bold text-text mb-2">
        Something went wrong
      </h1>
      <p className="text-text-secondary mb-6">
        An unexpected error occurred. Try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-accent text-white rounded-card font-semibold hover:bg-accent-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
