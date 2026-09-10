"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { groupByCourse, type CourseProgress, type ProgressRecord } from "@/lib/progress";

/**
 * One learner's progress, read once and shared by everything that renders a mark.
 *
 * It is a client read on purpose: calling `auth()` in the lesson, course and catalog
 * pages would make all ~130 of them dynamic. They stay prerendered, and the ticks,
 * percentages and resume links light up after hydration.
 *
 * ponytail: no cross-component invalidation — marking a lesson complete updates that
 * button, and the sidebar catches up on the next navigation. Add a store if that gap
 * ever shows.
 */

export type Progress = {
  /** Lesson ids the learner has marked complete. */
  completed: Set<string>;
  /** Resume position in seconds, by lesson id. */
  positions: Map<string, number>;
  /** The same records grouped per course, for the catalog and My Learning. */
  byCourse: CourseProgress[];
};

/** Shared across mounts so two components on a page make one request, not two. */
let inFlight: Promise<ProgressRecord[]> | null = null;

function load(): Promise<ProgressRecord[]> {
  inFlight ??= fetch("/api/progress")
    .then((response) => (response.ok ? response.json() : { records: [] }))
    .then((data) => (data.records ?? []) as ProgressRecord[])
    .catch(() => []);
  return inFlight;
}

/** Called after a write, so the next mount re-reads instead of serving the stale list. */
export function invalidateProgress() {
  inFlight = null;
}

function shape(records: ProgressRecord[]): Progress {
  return {
    completed: new Set(
      records.filter((r) => r.completed && r.lessonId).map((r) => r.lessonId as string),
    ),
    positions: new Map(
      records
        .filter((r) => r.lessonId && r.positionSeconds)
        .map((r) => [r.lessonId as string, r.positionSeconds as number]),
    ),
    byCourse: groupByCourse(records),
  };
}

/** `null` while loading, and for a signed-out learner — there is nothing to mark. */
export function useProgress(): Progress | null {
  const { isSignedIn } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    load().then((records) => {
      if (!cancelled) setProgress(shape(records));
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return progress;
}
