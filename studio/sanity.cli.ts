import {defineCliConfig} from 'sanity/cli'

import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {projectId, dataset},
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
