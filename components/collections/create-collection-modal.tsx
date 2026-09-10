"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import posthog from "posthog-js";

export function CreateCollectionModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create collection");
      }

      const data = await res.json();
      posthog.capture("collection_saved", {
        collection_id: data.collection._id,
        title: title.trim(),
        is_new: true,
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      router.push(`/collections/${data.collection.slug.current}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create collection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-sm bg-accent px-4 text-body font-medium text-on-accent transition-colors hover:bg-accent-hover cursor-pointer"
      >
        <Plus size={16} aria-hidden="true" />
        <span>New collection</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-md border border-line bg-surface p-6 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="modal-title" className="text-heading-3 text-ink">
                Create new collection
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="rounded-xs p-1 text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <p className="rounded-xs bg-red-500/10 px-3 py-2 text-data text-red-500">
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="col-title" className="block text-meta text-ink-muted">
                  Title
                </label>
                <input
                  id="col-title"
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js Performance Essentials"
                  className="mt-1.5 w-full rounded-xs border border-line bg-canvas px-3 py-2 text-body text-ink placeholder:text-ink-disabled focus:border-accent focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="col-desc" className="block text-meta text-ink-muted">
                  Description (optional)
                </label>
                <textarea
                  id="col-desc"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this collection about?"
                  className="mt-1.5 w-full rounded-xs border border-line bg-canvas px-3 py-2 text-body text-ink placeholder:text-ink-disabled focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm border border-line px-4 py-2 text-body text-ink-muted hover:border-line-strong hover:text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-body font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
