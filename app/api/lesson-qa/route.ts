import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";

import { buildLessonQaPrompt } from "@/lib/lesson-qa/prompt";
import { selectExcerpts } from "@/lib/lesson-qa/select";
import {
  LessonQaRequestSchema,
  MAX_EXCERPTS,
  ModelReplySchema,
  type Citation,
  type LessonQaResponse,
} from "@/lib/lesson-qa/types";
import { getPostHogClient } from "@/lib/posthog-server";
import { sanityFetch } from "@/sanity/lib/fetch";
import { LESSON_QA_CONTEXT_QUERY } from "@/sanity/lib/queries";

/**
 * Ask this lesson (AGENTS §5): a server route that reads one lesson's own material,
 * asks the model about it, and returns a grounded answer. The browser holds no token and
 * never talks to the model.
 *
 * Deliberately not the MCP path. The scope is a single lesson, so the route selects the
 * material itself and sends at most MAX_EXCERPTS transcript pieces — §12's
 * never-send-a-whole-transcript rule enforced by construction rather than by prompt.
 *
 * Sign-in required. Every request costs tokens, and the Clerk user is both the identity
 * and the rate-limit key.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEFAULT_MODEL = "gpt-5";

/**
 * A crude per-learner throttle.
 *
 * ponytail: in-memory, so it is per instance and resets on deploy — enough to stop one
 * signed-in learner holding the button down. Move it to a shared store if this ever runs
 * on more than a couple of instances.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function overLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(userId, recent);
  // The map only ever holds active users; a window's worth of stale keys is not a leak
  // worth a sweeper.
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to ask about a lesson." }, { status: 401 });
  }
  if (overLimit(userId)) {
    return Response.json({ error: "Too many questions — try again shortly." }, { status: 429 });
  }

  const parsed = LessonQaRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Ask a question of 3 to 500 characters." }, { status: 400 });
  }
  const { lessonId, question } = parsed.data;

  if (!process.env.OPENAI_API_KEY) {
    console.error("lesson-qa: OPENAI_API_KEY is not set");
    return Response.json({ error: "Asking is unavailable right now." }, { status: 503 });
  }

  const lesson = await sanityFetch({
    query: LESSON_QA_CONTEXT_QUERY,
    params: { lessonId },
    tags: ["lesson", "video"],
  });
  if (!lesson) return Response.json({ error: "Lesson not found." }, { status: 404 });

  const excerpts = selectExcerpts(question, lesson.chunks ?? [], MAX_EXCERPTS);

  try {
    const generated = await generateText({
      model: openai(process.env.OPENAI_LESSON_MODEL || DEFAULT_MODEL),
      system: buildLessonQaPrompt({
        lessonTitle: lesson.title ?? "This lesson",
        courseTitle: lesson.courseTitle ?? null,
        notesText: lesson.notesText ?? null,
        keyPoints: (lesson.keyPoints ?? []).filter(Boolean) as string[],
        excerpts,
      }),
      prompt: question,
      output: Output.object({ schema: ModelReplySchema }),
      providerOptions: { openai: { reasoningEffort: "low" } },
      maxRetries: 1,
    });

    const reply = ModelReplySchema.parse(generated.output);

    /**
     * Grounding (AGENTS §7). The model cites excerpt NUMBERS, and the seconds come from
     * the excerpt list this route built — so an index it invents is out of range and is
     * dropped here, and a timestamp it invents is not something it can express.
     */
    const citations: Citation[] = [];
    const seen = new Set<number>();
    for (const index of reply.excerpts) {
      const excerpt = Number.isInteger(index) ? excerpts[index] : undefined;
      if (!excerpt || seen.has(index)) continue;
      seen.add(index);
      citations.push({ seconds: excerpt.seconds, text: excerpt.text });
      if (citations.length === 3) break;
    }

    const answered = reply.answered && reply.answer.trim().length > 0;

    getPostHogClient()?.capture({
      distinctId: userId,
      event: "lesson_question_asked",
      properties: {
        lesson_id: lessonId,
        question_length: question.length,
        answered,
        citation_count: citations.length,
        excerpt_count: excerpts.length,
      },
    });

    const body: LessonQaResponse = {
      answer: answered ? reply.answer.trim() : "",
      answered,
      citations: answered ? citations : [],
    };
    return Response.json(body);
  } catch (error) {
    // Logged in full server-side; the client gets one generic line and no internals.
    console.error("lesson-qa failed:", error);
    return Response.json({ error: "Could not answer that right now." }, { status: 502 });
  }
}
