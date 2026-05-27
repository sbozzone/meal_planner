"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Users } from "lucide-react";

const splashImages = [
  {
    src: "/splash/splash-2.png",
    alt: "Family DinnerTime retro kitchen splash screen",
  },
  {
    src: "/splash/splash-4.png",
    alt: "Family DinnerTime illustrated kitchen splash screen",
  },
  {
    src: "/splash/splash-5.png",
    alt: "Family DinnerTime watercolor splash screen",
  },
  {
    src: "/splash/splash-1.jpg",
    alt: "Family DinnerTime weekly meal plan splash screen",
  },
  {
    src: "/splash/splash-3.png",
    alt: "Family DinnerTime steampunk splash screen",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [splashIndex, setSplashIndex] = useState(0);
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = localStorage.getItem("familyCode");
    if (code) router.replace(`/${code}`);
  }, [router]);

  useEffect(() => {
    if (mode !== "home") return;
    const id = window.setInterval(() => {
      setSplashIndex((current) => (current + 1) % splashImages.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [mode]);

  async function handleCreate() {
    if (!familyName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create family");
      localStorage.setItem("familyCode", data.share_code);
      router.push(`/${data.share_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim();
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Family not found");
      localStorage.setItem("familyCode", data.share_code);
      router.push(`/${data.share_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (mode === "home") {
    return (
      <main className="min-h-dvh bg-[#1d1711] text-white">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-black">
          {splashImages.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                index === splashIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/85" />

          <div className="relative mt-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-12">
            <div className="mb-4 flex items-center justify-between">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
                type="button"
                onClick={() =>
                  setSplashIndex(
                    (current) =>
                      (current - 1 + splashImages.length) % splashImages.length
                  )
                }
                aria-label="Previous splash image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                {splashImages.map((image, index) => (
                  <button
                    key={image.src}
                    className={`h-2.5 rounded-full transition-all ${
                      index === splashIndex
                        ? "w-7 bg-white"
                        : "w-2.5 bg-white/45"
                    }`}
                    type="button"
                    onClick={() => setSplashIndex(index)}
                    aria-label={`Show splash image ${index + 1}`}
                  />
                ))}
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
                type="button"
                onClick={() =>
                  setSplashIndex((current) => (current + 1) % splashImages.length)
                }
                aria-label="Next splash image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <section className="rounded-card border border-white/15 bg-[#fff8ea]/95 p-4 text-text shadow-2xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Family DinnerTime
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold leading-tight">
                Dinner plans everyone can see.
              </h1>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Build a shared weekly dinner plan, keep your family favorites,
                and track the evenings that need a backup plan.
              </p>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setMode("create")}
                  className="flex min-h-touch w-full items-center justify-between rounded-card bg-accent px-5 py-3 text-base font-semibold text-white transition-all active:scale-[0.98]"
                >
                  <span>Create a Family</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setMode("join")}
                  className="flex min-h-touch w-full items-center justify-between rounded-card border border-border bg-white px-5 py-3 text-base font-semibold text-text transition-all active:scale-[0.98]"
                >
                  <span>Join a Family</span>
                  <Users className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode("home"); setError(""); }}
            className="mb-6 inline-flex min-h-touch items-center gap-2 rounded-lg pr-3 text-sm text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h2 className="font-serif text-2xl font-bold text-text mb-2">
            Name your family
          </h2>
          <p className="text-text-secondary mb-6">
            This is how your meal plan will be labeled.
          </p>

          {error && (
            <p className="text-red text-sm mb-4 bg-red/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          <input
            type="text"
            placeholder="e.g. The Bozzones"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="w-full px-4 py-3 bg-card border border-border rounded-card text-lg placeholder:text-text-muted mb-4"
            autoFocus
            maxLength={50}
          />

          <button
            onClick={handleCreate}
            disabled={!familyName.trim() || loading}
            className="w-full px-6 py-4 bg-accent text-white rounded-card font-semibold text-lg hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Family"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-sm">
        <button
          onClick={() => { setMode("home"); setError(""); }}
          className="mb-6 inline-flex min-h-touch items-center gap-2 rounded-lg pr-3 text-sm text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="font-serif text-2xl font-bold text-text mb-2">
          Join your family
        </h2>
        <p className="text-text-secondary mb-6">
          Enter the code shared by a family member.
        </p>

        {error && (
          <p className="text-red text-sm mb-4 bg-red/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Enter family code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          className="w-full px-4 py-3 bg-card border border-border rounded-card text-lg placeholder:text-text-muted mb-4 text-center tracking-widest uppercase"
          autoFocus
          maxLength={12}
        />

        <button
          onClick={handleJoin}
          disabled={!joinCode.trim() || loading}
          className="w-full px-6 py-4 bg-accent text-white rounded-card font-semibold text-lg hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Joining..." : "Join Family"}
        </button>
      </div>
    </div>
  );
}
