import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { isValidSanityId, slugify, toggleLessonRef } from "@/lib/collections";
import { sanityFetch } from "@/sanity/lib/fetch";
import { COLLECTIONS_BY_OWNER_QUERY } from "@/sanity/lib/queries";
import { getWriteClient } from "@/sanity/lib/write-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SANITY_ID = /^[A-Za-z0-9._-]{1,128}$/;

const CollectionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    title: z.string().trim().min(1, "Title is required").max(100),
    description: z.string().trim().max(500).optional(),
    lessonId: z.string().regex(SANITY_ID).optional(),
  }),
  z.object({
    action: z.literal("toggle-lesson"),
    collectionId: z.string().regex(SANITY_ID),
    lessonId: z.string().regex(SANITY_ID),
  }),
  z.object({
    action: z.literal("remove-lesson"),
    collectionId: z.string().regex(SANITY_ID),
    lessonId: z.string().regex(SANITY_ID),
  }),
  z.object({
    action: z.literal("delete"),
    collectionId: z.string().regex(SANITY_ID),
  }),
]);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required." }, { status: 401 });

  const collections = await sanityFetch({
    query: COLLECTIONS_BY_OWNER_QUERY,
    params: { userId },
    fresh: true,
    revalidate: 0,
  });

  return Response.json({ collections });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required." }, { status: 401 });

  if (!isValidSanityId(userId)) {
    return Response.json({ error: "Unsupported user id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CollectionActionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid collection payload.", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // 1. Create a new personal collection
  if (data.action === "create") {
    const baseSlug = slugify(data.title);
    const shortId = Math.random().toString(36).slice(2, 8);
    const documentId = `collection.${userId}.${shortId}`;
    const slugValue = `${baseSlug}-${shortId}`;

    const newDoc = {
      _id: documentId,
      _type: "collection",
      title: data.title,
      slug: { _type: "slug", current: slugValue },
      description: data.description || undefined,
      owner: userId,
      lessons: data.lessonId
        ? [
            {
              _type: "reference",
              _ref: data.lessonId,
              _key: Math.random().toString(36).slice(2, 10),
            },
          ]
        : [],
    };

    try {
      await getWriteClient().create(newDoc);
      return Response.json({ ok: true, collection: newDoc });
    } catch (err) {
      console.error("collections: create failed", err);
      return Response.json({ error: "Could not create collection." }, { status: 502 });
    }
  }

  // For existing collection actions, verify ownership first (AGENTS §8/Security):
  // "a write that targets a collection whose `owner` is not the caller is a 403; a document with no `owner` is never writable through the route."
  const targetDoc = await sanityFetch({
    query: `*[_type == "collection" && _id == $collectionId][0]{ _id, owner, lessons[] }`,
    params: { collectionId: data.collectionId },
    fresh: true,
    revalidate: 0,
  });

  if (!targetDoc) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }

  if (!targetDoc.owner || targetDoc.owner !== userId) {
    return Response.json(
      { error: "Forbidden: You do not own this collection." },
      { status: 403 },
    );
  }

  const client = getWriteClient();

  if (data.action === "delete") {
    try {
      await client.delete(data.collectionId);
      return Response.json({ ok: true });
    } catch (err) {
      console.error("collections: delete failed", err);
      return Response.json({ error: "Could not delete collection." }, { status: 502 });
    }
  }

  if (data.action === "toggle-lesson") {
    const lessons = (targetDoc.lessons ?? []) as Array<{ _ref: string; _key?: string }>;
    const { nextLessons, isSaved } = toggleLessonRef(lessons, data.lessonId);

    try {
      await client
        .patch(data.collectionId)
        .set({ lessons: nextLessons })
        .commit({ visibility: "async" });
      return Response.json({ ok: true, isSaved, lessonCount: nextLessons.length });
    } catch (err) {
      console.error("collections: toggle lesson failed", err);
      return Response.json({ error: "Could not update collection." }, { status: 502 });
    }
  }

  if (data.action === "remove-lesson") {
    const lessons = (targetDoc.lessons ?? []) as Array<{ _ref: string; _key?: string }>;
    const nextLessons = lessons.filter((item) => item._ref !== data.lessonId);

    try {
      await client
        .patch(data.collectionId)
        .set({ lessons: nextLessons })
        .commit({ visibility: "async" });
      return Response.json({ ok: true, lessonCount: nextLessons.length });
    } catch (err) {
      console.error("collections: remove lesson failed", err);
      return Response.json({ error: "Could not update collection." }, { status: 502 });
    }
  }

  return Response.json({ error: "Unhandled action." }, { status: 400 });
}
