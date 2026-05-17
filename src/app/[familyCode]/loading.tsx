export default function Loading() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="h-8 w-48 rounded-lg bg-card animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-card bg-card animate-pulse border border-border-light"
          />
        ))}
      </div>
    </div>
  );
}
