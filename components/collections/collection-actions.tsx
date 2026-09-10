"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import posthog from "posthog-js";

import { invalidateCollectionsCache } from "@/components/collections/save-button";

interface RemoveLessonButtonProps {
  collectionId: string;
  lessonId: string;
  lessonTitle: string;
}

export function RemoveLessonButton({
  collectionId,
  lessonId,
  lessonTitle,
}: RemoveLessonButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-lesson",
          collectionId,
          lessonId,
        }),
      });

      if (!res.ok) throw new Error("Remove failed");

      invalidateCollectionsCache();
      posthog.capture("collection_lesson_removed", {
        collection_id: collectionId,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
      });

      router.refresh();
    } catch (err) {
      console.error("Remove failed", err);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      aria-label={`Remove ${lessonTitle} from collection`}
      title="Remove from collection"
      className="inline-flex size-8 items-center justify-center rounded-xs text-ink-muted hover:bg-raised hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
    </button>
  );
}

interface DeleteCollectionButtonProps {
  collectionId: string;
  collectionTitle: string;
}

export function DeleteCollectionButton({
  collectionId,
  collectionTitle,
}: DeleteCollectionButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete "${collectionTitle}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          collectionId,
        }),
      });

      if (!res.ok) throw new Error("Delete failed");

      invalidateCollectionsCache();
      posthog.capture("collection_deleted", {
        collection_id: collectionId,
        title: collectionTitle,
      });

      router.push("/collections");
      router.refresh();
    } catch (err) {
      console.error("Delete failed", err);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-data text-ink-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Trash2 size={13} />
      )}
      <span>Delete collection</span>
    </button>
  );
}
