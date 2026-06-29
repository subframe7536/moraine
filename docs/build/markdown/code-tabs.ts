import { defineMdastPlugin } from 'satteri'

interface ScannedMdxPage {
  codeTabsPackages: string[]
}

interface MdxPageScanPlugin {
  plugin: ReturnType<typeof defineMdastPlugin>
  result: () => ScannedMdxPage
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

  if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.name !== 'string') {
    throw new Error(`[docs-mdx] unsupported JSX attribute in ${id}`)
  }

  if (typeof attribute.value === 'string') {
    return attribute.value
  }

  throw new Error(`[docs-mdx] <CodeTabs /> requires a static "${name}" string in ${id}`)
}

export function createMdxCodeTabsPlugin(id: string): MdxPageScanPlugin {
  const codeTabsPackages = new Set<string>()

  const visitJsxNode = (node: unknown) => {
    const record = asObjectRecord(node)
    if (!record || record.name !== 'CodeTabs') {
      return
    }

    const packageName = getStringAttribute(record, 'package', id)?.trim()
    if (!packageName) {
      throw new Error(`[docs-mdx] <CodeTabs /> requires a static "package" string in ${id}`)
    }
    codeTabsPackages.add(packageName)
  }

  return {
    plugin: defineMdastPlugin({
      name: 'moraine-code-tabs',
      mdxJsxFlowElement: visitJsxNode,
      mdxJsxTextElement: visitJsxNode,
    }),
    result: () => ({
      codeTabsPackages: [...codeTabsPackages],
    }),
  }
}
