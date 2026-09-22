import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ComponentApi, IndexDoc } from './types.ts'

export function loadApiDocIndex(projectRoot: string): IndexDoc | null {
  const jsonPath = path.join(projectRoot, 'docs/pages/_api-index.json')
  if (!existsSync(jsonPath)) {
    return null
  }

  try {
    const raw = readFileSync(jsonPath, 'utf8')
    return JSON.parse(raw) as IndexDoc
  } catch (error) {
    throw new Error(
      `[api-doc] Malformed index document at ${jsonPath}:\n${(error as Error).message}`,
    )
  }
}

export function loadComponentApiDoc(pagePath: string): ComponentApi | null {
  const jsonPath = path.join(path.dirname(pagePath), 'api.json')
  if (!existsSync(jsonPath)) {
    return null
  }

  try {
    const raw = readFileSync(jsonPath, 'utf8')
    return JSON.parse(raw) as ComponentApi
  } catch (error) {
    throw new Error(
      `[api-doc] Malformed component API doc at ${jsonPath}:\n${(error as Error).message}`,
    )
  }
}
