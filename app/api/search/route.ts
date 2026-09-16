import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import type { MCPClient } from "@ai-sdk/mcp";
import { generateText, Output, stepCountIs } from "ai";

import { groundHits, keywordSearch, type Grounded } from "@/lib/search/ground";
import { createSearchMcpClient, fetchInitialContext } from "@/lib/search/mcp";
import { buildSystemPrompt } from "@/lib/search/system-prompt";
import {
  ModelAnswerSchema,
  SearchRequestSchema,
  type SearchResponse,
  type Sort,
} from "@/lib/search/types";
import { pluralize } from "@/lib/format";
import { getPostHogClient } from "@/lib/posthog-server";

/**
 * The search API (AGENTS §5): connects to the Sanity Context MCP, injects the schema and
 * the system prompt, runs the tool loop, then grounds every hit against Sanity before it
 * returns. The browser holds no token and never talks to the MCP or the LLM.
 *
 * Public, like the rest of browsing (§7) — `proxy.ts` gates only `/my-learning`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_MODEL = "gpt-5";
/** Tuned down from 12: the loop was overrunning `maxDuration` on a cold cache. */
const MAX_STEPS = 6;

export async function POST(request: Request) {
  const parsed = SearchRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Provide a query of 1 to 200 characters and a valid sort." },
      { status: 400 },
    );
  }
  const { query, sort } = parsed.data;
  const distinctId = await resolveDistinctId(request);

  if (!process.env.OPENAI_API_KEY || !process.env.SANITY_CONTEXT_MCP_URL) {
    console.error(
      "search: OPENAI_API_KEY or SANITY_CONTEXT_MCP_URL is not set — using keyword search",
    );
    return keywordResponse(query, sort, distinctId);
  }

  let mcpClient: MCPClient | null = null;

  try {
    mcpClient = await createSearchMcpClient();
    const initialContext = await fetchInitialContext();

    const tools = await mcpClient.tools();
    // The initial context is already in the system prompt, so keep the tool that would
    // fetch it again out of the loop.
    const activeTools = Object.keys(tools).filter((name) => name !== "initial_context");

    const generated = await generateText({
      model: openai(process.env.OPENAI_SEARCH_MODEL || DEFAULT_MODEL),
      system: buildSystemPrompt(initialContext),
      prompt: query,
      tools,
      activeTools,
      stopWhen: stepCountIs(MAX_STEPS),
      output: Output.object({ schema: ModelAnswerSchema }),
      providerOptions: { openai: { reasoningEffort: "low" } },
      // One retry, not the SDK's default two: a hard failure (an exhausted quota, say)
      // should reach the keyword fallback quickly rather than after three attempts.
      maxRetries: 1,
    });

    const answer = ModelAnswerSchema.parse(generated.output);
    const grounded = await groundHits(answer.hits, sort);

    return respond(query, sort, "agent", answer.reply, grounded, distinctId);
  } catch (error) {
    // Logged in full server-side; the client gets one generic line and no internals.
    console.error("search failed, falling back to keyword search:", error);
    // A dead model must not mean a dead results page: Sanity can answer this itself.
    return keywordResponse(query, sort, distinctId);
  } finally {
    await mcpClient?.close();
  }
}

/**
 * Who this search belongs to. A signed-in learner is their Clerk id, matching every other
 * per-user write. A signed-out visitor is the distinct id their browser already uses for
 * PostHog, sent in a header — not the literal "anonymous", which merged every anonymous
 * searcher into one person and broke identify-merge once they signed in. Bounded because a
 * header is untrusted and PostHog caps a distinct id at 200 characters anyway.
 */
async function resolveDistinctId(request: Request): Promise<string> {
  const { userId } = await auth();
  if (userId) return userId;
  const fromClient = request.headers.get("x-posthog-distinct-id")?.trim();
  return fromClient && fromClient.length <= 200 ? fromClient : "anonymous";
}

/** The GROQ path (§11). Only if this also fails does the client see an error. */
async function keywordResponse(query: string, sort: Sort, distinctId: string) {
  try {
    const grounded = await keywordSearch(query, sort);
    const reply = grounded.count
      ? `Matched ${pluralize(grounded.count, "lesson")} on your keywords.`
      : "Nothing in the catalog matches those keywords yet.";
    return respond(query, sort, "keyword", reply, grounded, distinctId);
  } catch (error) {
    console.error("keyword search failed:", error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 502 });
  }
}

/** One place that shapes the response and records the event, whichever path produced it. */
function respond(
  query: string,
  sort: Sort,
  source: SearchResponse["source"],
  reply: string,
  { count, courseCount, results }: Grounded,
  distinctId: string,
) {
  getPostHogClient()?.capture({
    distinctId,
    event: "search_performed",
    properties: {
      query,
      sort,
      source,
      result_count: count,
      course_count: courseCount,
      has_results: count > 0,
    },
  });

  const body: SearchResponse = { query, sort, source, count, courseCount, reply, results };
  return Response.json(body);
}
