"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck, Check, Loader2, Plus } from "lucide-react";
import posthog from "posthog-js";

import { cn } from "@/lib/utils";

export type CollectionSummary = {
  _id: string;
  title: string;
  slug?: string;
  lessonIds?: string[];
  lessonCount?: number;
};

/** Shared across SaveButton instances so opening two does not make two queries. */
let collectionsCache: CollectionSummary[] | null = null;
let inFlight: Promise<CollectionSummary[]> | null = null;

export function invalidateCollectionsCache() {
  collectionsCache = null;
  inFlight = null;
}

async function fetchUserCollections(): Promise<CollectionSummary[]> {
  if (collectionsCache) return collectionsCache;
  inFlight ??= fetch("/api/collections")
    .then((res) => {
      if (!res.ok) throw new Error(`collections: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      collectionsCache = (data.collections ?? []) as CollectionSummary[];
      return collectionsCache;
    })
    .catch(() => {
      inFlight = null;
      return [];
    });
  return inFlight;
}

interface SaveButtonProps {
  lessonId: string;
  lessonTitle?: string;
  size?: "sm" | "md";
  className?: string;
}

export function SaveButton({
  lessonId,
  lessonTitle,
  size = "md",
  className,
}: SaveButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initial silent load of collections if user is signed in to mark "Saved" state
  useEffect(() => {
    if (!isSignedIn) {
      invalidateCollectionsCache();
      return;
    }
    let cancelled = false;
    fetchUserCollections().then((data) => {
      if (!cancelled) setCollections(data);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const activeCollections = isSignedIn ? collections : [];
  // Check if this lesson is saved in at least one collection
  const isSaved = activeCollections.some((c) => c.lessonIds?.includes(lessonId));

  // Click outside and escape key handling
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleToggleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (!open) {
      setOpen(true);
      setLoading(true);
      const data = await fetchUserCollections();
      setCollections(data);
      setLoading(false);
    } else {
      setOpen(false);
    }
  }

  async function handleToggleCollection(e: React.MouseEvent, collectionId: string) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    setCollections((prev) => {
      const next = prev.map((c) => {
        if (c._id !== collectionId) return c;
        const ids = c.lessonIds ?? [];
        const exists = ids.includes(lessonId);
        const nextIds = exists ? ids.filter((id) => id !== lessonId) : [...ids, lessonId];
        return { ...c, lessonIds: nextIds };
      });
      collectionsCache = next;
      return next;
    });

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-lesson",
          collectionId,
          lessonId,
        }),
      });
      if (!res.ok) throw new Error("Toggle failed");

      posthog.capture("collection_saved", {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        collection_id: collectionId,
        is_new: false,
      });
    } catch (err) {
      console.error("Save failed", err);
      // Revert from server
      invalidateCollectionsCache();
      const fresh = await fetchUserCollections();
      setCollections(fresh);
    }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();

    const title = newTitle.trim();
    if (!title || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          lessonId,
        }),
      });

      if (!res.ok) throw new Error("Create failed");
      const data = await res.json();
      const created = data.collection;

      setCollections((prev) => {
        const next = [
          {
            _id: created._id,
            title: created.title,
            slug: created.slug?.current,
            lessonIds: [lessonId],
            lessonCount: 1,
          },
          ...prev,
        ];
        collectionsCache = next;
        return next;
      });

      setNewTitle("");
      posthog.capture("collection_saved", {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        collection_id: created._id,
        is_new: true,
      });
    } catch (err) {
      console.error("Create collection failed", err);
    } finally {
      setCreating(false);
    }
  }

  const isSmall = size === "sm";

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-label={isSaved ? "Saved to collections" : "Save to collection"}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border transition-colors cursor-pointer",
          isSmall ? "h-7 px-2 text-data" : "h-11 px-4 text-body",
          isSaved
            ? "border-accent/40 bg-accent-soft text-accent hover:border-accent"
            : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
        )}
      >
        {isSaved ? (
          <BookmarkCheck size={isSmall ? 13 : 15} aria-hidden="true" className="shrink-0 text-accent" />
        ) : (
          <Bookmark size={isSmall ? 13 : 15} aria-hidden="true" className="shrink-0" />
        )}
        <span>{isSaved ? "Saved" : "Save"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Save to collection menu"
          className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-sm border border-line bg-surface p-3 shadow-sm"
          onClick={(e) => {
            // Stop bubble so cards/links behind do not navigate
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <p className="text-meta text-ink-muted font-medium">Save to collection</p>
            {loading && <Loader2 size={13} className="animate-spin text-ink-muted" />}
          </div>

          <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
            {activeCollections.length === 0 && !loading && (
              <p className="py-2 text-center text-data text-ink-disabled">
                No collections yet. Create one below.
              </p>
            )}

            {activeCollections.map((col) => {
              const inCollection = col.lessonIds?.includes(lessonId);
              return (
                <button
                  key={col._id}
                  type="button"
                  onClick={(e) => handleToggleCollection(e, col._id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xs px-2 py-1.5 text-left text-body text-ink hover:bg-raised transition-colors cursor-pointer"
                >
                  <span className="truncate text-body text-ink">{col.title}</span>
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-2xs border",
                      inCollection
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line bg-surface",
                    )}
                  >
                    {inCollection && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreateCollection} className="mt-2.5 pt-2 border-t border-line">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New collection name…"
                maxLength={100}
                className="flex-1 rounded-xs border border-line bg-canvas px-2.5 py-1 text-data text-ink placeholder:text-ink-disabled focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                aria-label="Create collection"
                className="inline-flex h-7 items-center justify-center rounded-xs bg-accent px-2 text-data text-on-accent hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
              >
                {creating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
