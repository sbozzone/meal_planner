"use client";

import { useState } from "react";
import { useFamily } from "@/lib/family-context";
import { Header } from "@/components/layout/Header";
import { Copy, Check, Share2, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useConfirmAction } from "@/hooks/useConfirmAction";

export default function SettingsPage() {
  const { family } = useFamily();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<string[]>(family.members ?? []);
  const [newMember, setNewMember] = useState("");
  const [savingMembers, setSavingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${family.share_code}`
      : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${family.name} on DinnerTime`,
          text: `Plan dinners with ${family.name}!`,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  }

  const leave = useConfirmAction(() => {
    localStorage.removeItem("familyCode");
    document.cookie = "familyCode=; path=/; max-age=0";
    router.push("/");
  });

  async function saveMembers(updated: string[]) {
    setSavingMembers(true);
    setMembersError(null);
    try {
      const res = await fetch("/api/families/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-family-id": family.id,
        },
        body: JSON.stringify({ members: updated }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMembersError(data.error || "Failed to save — make sure migration 004 is applied in Supabase.");
        return;
      }
      setMembers(updated);
      router.refresh(); // re-hydrate server-rendered family context with updated members
    } catch {
      setMembersError("Network error — please try again.");
    } finally {
      setSavingMembers(false);
    }
  }

  function addMember() {
    const name = newMember.trim();
    if (!name || members.includes(name)) return;
    const updated = [...members, name];
    setNewMember("");
    saveMembers(updated);
  }

  function removeMember(name: string) {
    saveMembers(members.filter((m) => m !== name));
  }

  return (
    <>
      <Header title="Settings" familyCode={family.share_code} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Share family */}
        <div className="card-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-text mb-1">
            {family.name}
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Share this link so family members can join your meal plan.
          </p>

          <div className="flex items-center gap-2 bg-bg rounded-lg p-3 border border-border">
            <code className="flex-1 text-sm font-mono text-accent truncate">
              {shareUrl}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-card-header transition-colors shrink-0"
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green" />
              ) : (
                <Copy className="w-4 h-4 text-text-secondary" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="bg-bg rounded-lg px-4 py-2 border border-border text-center flex-1">
              <p className="text-xs text-text-muted mb-0.5">Family Code</p>
              <p className="font-mono font-bold text-lg tracking-wider text-text">
                {family.share_code}
              </p>
            </div>
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={handleShare} className="mt-4">
            <Share2 className="w-4 h-4" />
            Share with Family
          </Button>
        </div>

        {/* Family chefs */}
        <div className="card-surface p-5">
          <h2 className="font-serif text-lg font-semibold text-text mb-1">
            👨‍🍳 Family Chefs
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Add names to quickly assign who&apos;s cooking each night.
          </p>

          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {members.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-card-header border border-border rounded-full text-sm font-medium text-text"
                >
                  <span>{name}</span>
                  <button
                    onClick={() => removeMember(name)}
                    disabled={savingMembers}
                    className="text-text-muted hover:text-red transition-colors"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
              placeholder="Add a name (e.g. Mom, Dad, Tyler)"
              className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-sm placeholder:text-text-muted"
              disabled={savingMembers}
            />
            <button
              onClick={addMember}
              disabled={!newMember.trim() || savingMembers}
              className="px-3 py-2.5 rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition-colors"
              aria-label="Add member"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {membersError && (
            <p className="text-xs text-red mt-2">{membersError}</p>
          )}
        </div>

        <button
          onClick={leave.trigger}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-card transition-all min-h-touch active:scale-[0.98]",
            leave.armed
              ? "text-white bg-red shadow-warm-sm"
              : "text-red border border-red/20 hover:bg-red/5"
          )}
        >
          <LogOut className="w-4 h-4" />
          {leave.armed ? "Tap again to confirm" : "Leave Family"}
        </button>
      </div>
    </>
  );
}
