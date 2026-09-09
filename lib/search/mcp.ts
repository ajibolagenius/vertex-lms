import "server-only";

import { createMCPClient } from "@ai-sdk/mcp";

/**
 * The Sanity Context MCP connection. Server-only: it carries the read token, and the
 * browser must never see the endpoint or call it (AGENTS §5/§12).
 *
 * The MCP only serves a dataset with a *deployed* Studio application — a schema-only
 * deploy is not enough (§12). See `studio/scripts/context/README.md`.
 */

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedInitialContext: string | null = null;
let cachedAt = 0;

function requireEnv(name: "SANITY_CONTEXT_MCP_URL" | "SANITY_API_READ_TOKEN"): string {
  const value = process.env[name];
  if (!value) {
    // Never echo the value — this message reaches the server log, and a 500 to the client.
    throw new Error(`Missing environment variable: ${name}. It is server-only.`);
  }
  return value;
}

/** `<mcpUrl>/initial-context`, preserving any query params on the configured URL. */
function initialContextUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/initial-context`;
  return url.toString();
}

export async function createSearchMcpClient() {
  return createMCPClient({
    transport: {
      type: "http",
      url: requireEnv("SANITY_CONTEXT_MCP_URL"),
      headers: { Authorization: `Bearer ${requireEnv("SANITY_API_READ_TOKEN")}` },
    },
  });
}

/**
 * The compressed schema plus the Context document's instructions, injected into the
 * system prompt so the model does not spend a tool call on it. Cached at module scope:
 * that is also why instruction edits need a server restart to be picked up (§12).
 */
export async function fetchInitialContext(): Promise<string | null> {
  if (cachedInitialContext && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedInitialContext;
  }

  const response = await fetch(initialContextUrl(requireEnv("SANITY_CONTEXT_MCP_URL")), {
    headers: { Authorization: `Bearer ${requireEnv("SANITY_API_READ_TOKEN")}` },
  });

  if (!response.ok) {
    console.error(`Sanity Context initial-context failed: ${response.status}`);
    // A stale cache still beats making the model rediscover the schema.
    return cachedInitialContext;
  }

  cachedInitialContext = await response.text();
  cachedAt = Date.now();
  return cachedInitialContext;
}
