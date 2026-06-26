import { mdxToMdast } from 'satteri'

import { DOCS_MDX_FEATURES } from './plugins'

interface ScannedMdxPage {
  codeTabsPackages: string[]
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function getStringAttribute(
  node: Record<string, unknown>,
  name: string,
  id: string,
): string | null {
  const attributes = Array.isArray(node.attributes) ? node.attributes : []
  const attribute = attributes.map(asObjectRecord).find((item) => item?.name === name)
  if (!attribute) {
    return null
  }

  const record = asObjectRecord(attribute)
  if (!record || record.type !== 'mdxJsxAttribute' || typeof record.name !== 'string') {
    throw new Error(`[docs-mdx] unsupported JSX attribute in ${id}`)
  }

  if (typeof record.value === 'string') {
    return record.value
  }

  throw new Error(`[docs-mdx] <CodeTabs /> requires a static "${name}" string in ${id}`)
}

function walkMdast(node: unknown, visit: (node: Record<string, unknown>) => void) {
  const record = asObjectRecord(node)
  if (!record) {
    return
  }

  visit(record)

  if (Array.isArray(record.children)) {
    for (const child of record.children) {
      walkMdast(child, visit)
    }
  }
}

export function scanMdxPage(source: string, id: string): ScannedMdxPage {
  const tree = mdxToMdast(source, { features: DOCS_MDX_FEATURES })
  const codeTabsPackages: string[] = []

  walkMdast(tree, (node) => {
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') {
      return
    }

    if (typeof node.name !== 'string') {
      return
    }

    if (node.name === 'CodeTabs') {
      const packageName = getStringAttribute(node, 'package', id)?.trim()
      if (!packageName) {
        throw new Error(`[docs-mdx] <CodeTabs /> requires a static "package" string in ${id}`)
      }
      codeTabsPackages.push(packageName)
    }
  })

  return {
    codeTabsPackages: [...new Set(codeTabsPackages)],
  }
}
