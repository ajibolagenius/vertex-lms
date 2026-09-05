import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {apiVersion, dataset, projectId} from './env'
import {schema} from './schemaTypes'

export default defineConfig({
  name: 'vertex',
  title: 'Vertex',
  projectId,
  dataset,
  schema,
  plugins: [
    // No custom structure: the default document type list is exactly what we want.
    structureTool(),
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
