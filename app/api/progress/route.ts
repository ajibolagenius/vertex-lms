import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { readProgress } from "@/lib/progress-server";
import { getWriteClient } from "@/sanity/lib/write-client";

/**
 * The only write path in the app (AGENTS §5/§7). The browser never holds a token and
 * never writes to Sanity — it posts here, and the learner is taken from Clerk's
 * server-side `auth()`, never from the request, so nobody can read or write another
 * learner's record.
 *
 * One document per (learner, lesson), `_id: progress.<userId>.<lessonId>`, so a write is
 * create-if-missing plus a set of only the fields sent: no read-modify-write, and two
 * concurrent writes to different lessons cannot clobber each other.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sanity's document id charset. Both ids land in `_id`, so this is what stops a lesson id
 * from smuggling a path segment into the document being written.
 */
const SANITY_ID = /^[A-Za-z0-9._-]{1,128}$/;

const ProgressWriteSchema = z
  .object({
    lessonId: z.string().regex(SANITY_ID),
    completed: z.boolean().optional(),
    positionSeconds: z.number().int().min(0).max(86_400).optional(),
  })
  .refine((body) => body.completed !== undefined || body.positionSeconds !== undefined, {
    message: "Send completed, positionSeconds, or both.",
  });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required." }, { status: 401 });

  const records = await readProgress(userId);
  return Response.json({
    lessons: records.map((record) => ({
      lessonId: record.lessonId,
      completed: Boolean(record.completed),
      positionSeconds: record.positionSeconds ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required." }, { status: 401 });

  if (!SANITY_ID.test(userId)) {
    return Response.json({ error: "Unsupported user id." }, { status: 400 });
  }

  const parsed = ProgressWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid progress payload." }, { status: 400 });
  }
  const { lessonId, completed, positionSeconds } = parsed.data;

  const _id = `progress.${userId}.${lessonId}`;

  try {
    await getWriteClient()
      .transaction()
      // A strong reference to a lesson that does not exist is rejected by the API, so this
      // doubles as the check that `lessonId` is a real lesson.
      .createIfNotExists({
        _id,
        _type: "progress",
        userId,
        lesson: { _type: "reference", _ref: lessonId },
        completed: false,
      })
      .patch(_id, {
        set: {
          updatedAt: new Date().toISOString(),
          ...(completed === undefined ? {} : { completed }),
          ...(positionSeconds === undefined ? {} : { positionSeconds }),
        },
      })
      .commit({ visibility: "async" });
  } catch (error) {
    console.error("progress: write failed", error);
    return Response.json({ error: "Could not save progress." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
