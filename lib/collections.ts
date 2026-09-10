/**
 * Collection management helpers (AGENTS §8).
 * Pure functions: slugifying, ownership checking, and reference list transformations.
 */

const SANITY_ID_REGEX = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Validates a Sanity document or reference identifier.
 */
export function isValidSanityId(id: string): boolean {
  return SANITY_ID_REGEX.test(id);
}

/**
 * Creates a clean, URL-safe slug from a collection title.
 */
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "collection";
}

/**
 * Returns true if the collection is owned by the specified user.
 * Curated learning paths (owner is null/undefined) are not owned by any user.
 */
export function isCollectionOwner(
  owner: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!owner || !userId) return false;
  return owner === userId;
}

/**
 * Toggles a lesson reference in a collection's lessons list.
 * Returns the new list and whether the lesson is now saved.
 */
export function toggleLessonRef<T extends { _ref: string; _key?: string }>(
  lessons: T[],
  lessonId: string,
  keyFactory: () => string = () => Math.random().toString(36).slice(2, 10),
): { nextLessons: T[]; isSaved: boolean } {
  const exists = lessons.some((item) => item._ref === lessonId);
  if (exists) {
    return {
      nextLessons: lessons.filter((item) => item._ref !== lessonId),
      isSaved: false,
    };
  }
  const newItem = {
    _type: "reference",
    _ref: lessonId,
    _key: keyFactory(),
  } as unknown as T;
  return {
    nextLessons: [...lessons, newItem],
    isSaved: true,
  };
}
