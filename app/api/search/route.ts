import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import type { MCPClient } from "@ai-sdk/mcp";
import { generateText, Output, stepCountIs } from "ai";

import { groundHits } from "@/lib/search/ground";
import { createSearchMcpClient, fetchInitialContext } from "@/lib/search/mcp";
import { buildSystemPrompt } from "@/lib/search/system-prompt";
import { ModelAnswerSchema, SearchRequestSchema, type SearchResponse } from "@/lib/search/types";
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

  if (!process.env.OPENAI_API_KEY || !process.env.SANITY_CONTEXT_MCP_URL) {
    console.error("search: OPENAI_API_KEY or SANITY_CONTEXT_MCP_URL is not set");
    return Response.json({ error: "Search is not configured." }, { status: 500 });
  }

  let mcpClient: MCPClient | null = null;

  try {
    const [client, initialContext] = await Promise.all([
      createSearchMcpClient(),
      fetchInitialContext(),
    ]);
    mcpClient = client;

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
    });

    const answer = ModelAnswerSchema.parse(generated.output);
    const { count, courseCount, results } = await groundHits(answer.hits, sort);

    getPostHogClient()?.capture({
      distinctId: (await auth()).userId ?? "anonymous",
      event: "search_performed",
      properties: { query, sort, result_count: count, course_count: courseCount },
    });

    const body: SearchResponse = {
      query,
      sort,
      count,
      courseCount,
      reply: answer.reply,
      results,
    };
    return Response.json(body);
  } catch (error) {
    // Logged in full server-side; the client gets one generic line and no internals.
    console.error("search failed:", error);
    return Response.json({ error: "Search is unavailable right now." }, { status: 502 });
  } finally {
    await mcpClient?.close();
  }
}
