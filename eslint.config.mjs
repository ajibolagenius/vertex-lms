import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Listing globalIgnores drops eslint's own default `node_modules` ignore, which
    // sent `eslint` into studio/node_modules (~28k files) and out of heap.
    "**/node_modules/**",
    // Not the web workspace: the Studio is its own workspace with its own tooling,
    // and these are vendored skills and reference material, not source. Mirrors the
    // `exclude` list in tsconfig.json.
    "studio/**",
    ".agents/**",
    "agent/**",
    "LMS_Vertex/**",
  ]),
]);

export default eslintConfig;
