"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChefPickerSheet({
  open,
  currentChef,
  members,
  onClose,
  onSave,
  onClear,
}: {
  open: boolean;
  currentChef: string | null;
  members: string[];
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setCustom("");
  }, [open]);

  async function handlePick(name: string) {
    setSaving(true);
    try {
      await onSave(name);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomSave() {
    const name = custom.trim();
    if (!name) return;
    await handlePick(name);
  }

  async function handleClear() {
    setSaving(true);
    try {
      await onClear();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Chef du Jour">
      <div className="px-5 py-4 space-y-5">
        {members.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Who&apos;s cooking tonight?
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((name) => (
                <button
                  key={name}
                  onClick={() => handlePick(name)}
                  disabled={saving}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-semibold transition-all border min-h-[44px]",
                    currentChef === name
                      ? "bg-accent text-white border-accent"
                      : "bg-card-header border-border text-text hover:border-accent/50 hover:bg-accent-light/30"
                  )}
                >
                  👨‍🍳 {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {members.length > 0 && (
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Or type a name
            </p>
          )}
          {members.length === 0 && (
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Who&apos;s cooking?
            </p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSave()}
              placeholder="Enter a name…"
              className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-sm placeholder:text-text-muted"
            />
            <button
              onClick={handleCustomSave}
              disabled={!custom.trim() || saving}
              className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-40 hover:bg-accent-hover transition-colors"
            >
              Set
            </button>
          </div>
        </div>

        {currentChef && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-text-muted hover:text-red hover:border-red/30 hover:bg-red/5 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Remove chef for this night
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
