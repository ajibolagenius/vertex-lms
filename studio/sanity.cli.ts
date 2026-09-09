import {defineCliConfig} from 'sanity/cli'

import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {projectId, dataset},
  // Pinned so `sanity deploy` never prompts for a hostname. A deployed Studio is
  // what makes the Context MCP serve this dataset (AGENTS §12).
  studioHost: 'vertex-app',
  deployment: {appId: 'qzl8nfwegsre07fm0c9xsnyw'},
  typegen: {
    enabled: true,
    // Every GROQ query in the web workspace lives in this one file, so TypeGen
    // only has to watch it.
    path: '../sanity/lib/**/*.ts',
    schema: 'schema.json',
    generates: '../sanity.types.ts',
    overloadClientMethods: true,
  },
})
