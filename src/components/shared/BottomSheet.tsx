"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);
  // Space taken up by the on-screen keyboard, so we can lift the sheet above it.
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keep the sheet anchored above the on-screen keyboard. Without this, the
  // sheet stays pinned to the bottom of the *layout* viewport (behind the
  // keyboard) when an input is focused, pushing its top fields off-screen.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardInset(inset > 0 ? inset : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKeyboardInset(0);
    };
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff < 0) return;
    currentTranslateY.current = diff;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentTranslateY.current > 100) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85dvh] flex flex-col animate-slide-up transition-transform",
          className
        )}
        style={
          keyboardInset > 0
            ? {
                bottom: keyboardInset,
                maxHeight: `calc(85dvh - ${keyboardInset}px)`,
              }
            : undefined
        }
      >
        <div
          className="flex flex-col items-center pt-2 pb-0 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-border mb-2" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 border-b border-border-light shrink-0">
          <h3 className="font-serif text-lg font-semibold text-text">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-card-header transition-colors min-h-touch min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
