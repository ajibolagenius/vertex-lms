# Sanity Context document

`vertex-search.ndjson` is the `sanity.agentContext` document that configures the search agent's
MCP endpoint (AGENTS §10): a content-scope `groqFilter` and the `instructions` deltas.

It is imported rather than authored in the Studio because `@sanity/context` (the plugin that adds
the Context document type and Conversation Insights to the Studio UI) requires `sanity@^6`, and this
Studio is on `^5`. AGENTS §12 says not to install it in that case, so the document is managed here.

The MCP will not serve this dataset at all unless the Studio application is deployed:

```bash
npm run deploy          # first, and after any schema change
npm run context:import  # imports / replaces the document
```

Edits take effect on the **next** search request. The inline system prompt in
`lib/search/system-prompt.ts` and the cached initial context need a dev-server restart.
