import { defineMdastPlugin } from 'satteri'

import { asObjectRecord, getStaticStringAttribute } from './mdx'

interface ScannedMdxPage {
  codeTabsPackages: string[]
}

interface MdxPageScanPlugin {
  plugin: ReturnType<typeof defineMdastPlugin>
  result: () => ScannedMdxPage
}

export function createMdxCodeTabsPlugin(id: string): MdxPageScanPlugin {
  const codeTabsPackages = new Set<string>()

  const visitJsxNode = (node: unknown) => {
    const record = asObjectRecord(node)
    if (!record || record.name !== 'CodeTabs') {
      return
    }

    const packageName = getStaticStringAttribute(record, 'CodeTabs', 'package', id)?.trim()
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
