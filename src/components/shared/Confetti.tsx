"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = ["#C96840", "#E8A04C", "#3A8A5E", "#3A6F95", "#B08810", "#D4774E", "#9B4A7F"];
const PIECE_COUNT = 32;

/**
 * Lightweight CSS confetti shower. Increment `burst` to fire — each change
 * triggers one shower that cleans itself up after the animation ends.
 */
export function Confetti({ burst }: { burst: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (burst <= 0) return;
    setActive(true);
    const id = setTimeout(() => setActive(false), 2600);
    return () => clearTimeout(id);
  }, [burst]);

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        left: `${(i * 137.5 + burst * 53) % 100}%`,
        delay: `${((i * 97) % 60) / 100}s`,
        duration: `${1.4 + ((i * 61) % 80) / 100}s`,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
        size: 6 + ((i * 41) % 7),
      })),
    [burst]
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((piece, i) => (
        <span
          key={`${burst}-${i}`}
          className="absolute top-0 block animate-confetti"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.6,
            backgroundColor: piece.color,
            borderRadius: piece.round ? "9999px" : "2px",
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  );
}
