"use client";

import { FormEvent, useEffect, useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import type { DinnerActivity } from "@/types/database";
import type { DinnerActivityInput } from "@/hooks/useDinnerActivities";

const emptyDraft = {
  title: "",
  start_time: "",
  end_time: "",
  notes: "",
};

export function ActivitySheet({
  open,
  date,
  activity,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  date: string | null;
  activity: DinnerActivity | null;
  onClose: () => void;
  onSave: (input: DinnerActivityInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(
      activity
        ? {
            title: activity.title,
            start_time: activity.start_time?.slice(0, 5) || "",
            end_time: activity.end_time?.slice(0, 5) || "",
            notes: activity.notes || "",
          }
        : emptyDraft
    );
  }, [activity, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !draft.title.trim() || saving) return;

    setSaving(true);
    try {
      await onSave({
        activity_date: date,
        title: draft.title,
        start_time: draft.start_time,
        end_time: draft.end_time,
        notes: draft.notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={activity ? "Edit dinner impact" : "Dinner impact"}
    >
      <form className="space-y-4 p-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Activity
          </span>
          <input
            className="w-full min-h-touch rounded-lg border border-border-light bg-white px-3"
            placeholder="Meeting during dinner"
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text-secondary">
              Starts
            </span>
            <input
              className="w-full min-h-touch rounded-lg border border-border-light bg-white px-3"
              type="time"
              value={draft.start_time}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  start_time: event.target.value,
                }))
              }
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text-secondary">
              Ends
            </span>
            <input
              className="w-full min-h-touch rounded-lg border border-border-light bg-white px-3"
              type="time"
              value={draft.end_time}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  end_time: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-text-secondary">
            Notes
          </span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border-light bg-white p-3"
            placeholder="Leave early, choose leftovers, eat after practice..."
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>

        <div className="flex gap-3">
          {activity && (
            <button
              className="min-h-touch rounded-lg border border-border px-4 font-semibold text-text-secondary"
              type="button"
              onClick={async () => {
                await onDelete(activity.id);
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button
            className="min-h-touch flex-1 rounded-lg bg-accent px-4 font-semibold text-white"
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
