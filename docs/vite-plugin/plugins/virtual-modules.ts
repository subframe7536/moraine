import { loadApiDocIndex } from '../api-doc/load'
import {
  buildExamplePageEntries,
  buildExamplePagesModuleCode,
  readComponentNameMap,
  scanExamplePages,
} from '../examples/pages'

export const VIRTUAL_API_DOC = 'virtual:api-doc'
export const RESOLVED_VIRTUAL_API_DOC = '\0moraine-api-doc'
export const VIRTUAL_EXAMPLE_PAGES = 'virtual:example-pages'
export const RESOLVED_VIRTUAL_EXAMPLE_PAGES = '\0moraine-example-pages'

export function resolveDocsVirtualId(id: string): string | null {
  if (id === VIRTUAL_API_DOC) {
    return RESOLVED_VIRTUAL_API_DOC
  }

  if (id === VIRTUAL_EXAMPLE_PAGES) {
    return RESOLVED_VIRTUAL_EXAMPLE_PAGES
  }

  return null
}

export async function loadDocsVirtualModule(
  id: string,
  projectRoot: string,
): Promise<string | null> {
  if (id === RESOLVED_VIRTUAL_API_DOC) {
    const indexDoc = loadApiDocIndex(projectRoot)
    if (indexDoc) {
      return `export default ${JSON.stringify(indexDoc)}`
    }

    console.warn('[api-doc] index.json not found, serving empty data')
    return 'export default { components: [] }'
  }

  if (id === RESOLVED_VIRTUAL_EXAMPLE_PAGES) {
    try {
      const scannedPages = await scanExamplePages(projectRoot)
      const pages = buildExamplePageEntries(scannedPages, readComponentNameMap(projectRoot))
      return buildExamplePagesModuleCode(pages)
    } catch {
      console.warn('[example-pages] failed to scan docs/pages, serving empty data')
      return 'export const exampleMap = {}\nexport const pages = []\n'
    }
  }

  return null
}
