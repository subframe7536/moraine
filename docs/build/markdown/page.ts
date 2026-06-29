import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { mdxToJs } from 'satteri'
import type { Data } from 'satteri'

import { resolveDocsPageContext, toImportPath } from '../core/paths'
import { createPlainCodeBlockHtml, toSingleQuoted } from '../core/strings'

import { parseFrontmatterData } from './frontmatter'
import { createDocsCodePlugin, createDocsHastPlugin, DOCS_MDX_FEATURES } from './plugins'
import type { OnThisPageEntryLiteral } from './plugins'
import { createMdxPageScanPlugin } from './scan'
import type { CompileMarkdownOptions, MarkdownHighlightLang } from './types'

interface CodeTabItemLiteral {
  label: string
  value: string
  html: string
}

function createCodeTabsItems(
  packageName: string,
  highlightCode?: (source: string, lang: MarkdownHighlightLang) => string | null,
): CodeTabItemLiteral[] {
  return [
    { label: 'bun', value: 'bun', source: `bun add ${packageName}` },
    { label: 'pnpm', value: 'pnpm', source: `pnpm add ${packageName}` },
    { label: 'npm', value: 'npm', source: `npm i ${packageName}` },
  ].map((command) => ({
    label: command.label,
    value: command.value,
    html: highlightCode?.(command.source, 'bash') ?? createPlainCodeBlockHtml(command.source),
  }))
}

function assertSyncResult<T>(result: T | Promise<T>): T {
  if (result instanceof Promise) {
    throw new TypeError('[docs-mdx] async Satteri plugins are not supported in docs compile')
  }
  return result
}

function stripMdxDefaultExport(code: string): string {
  return code.replace(/\n?export default MDXContent;\s*/, '\n')
}

function hasColocatedApiJson(id: string): boolean {
  return existsSync(path.join(path.dirname(id), 'api.json'))
}

export function compileMarkdownPage(
  markdownSource: string,
  id: string,
  options: CompileMarkdownOptions = {},
): string {
  const idWithoutQuery = id.split('?')[0] ?? id
  const page = resolveDocsPageContext(idWithoutQuery)
  const scanPlugin = createMdxPageScanPlugin(idWithoutQuery)
  const onThisPageEntries: OnThisPageEntryLiteral[] = []
  const runtimePath = toImportPath(idWithoutQuery, path.join(page.docsRoot, 'components/markdown'))
  const imports = [`import { Markdown } from ${toSingleQuoted(runtimePath)}`]
  const apiJsonAvailable = hasColocatedApiJson(idWithoutQuery)

  if (apiJsonAvailable) {
    imports.push("import __docsRawApiDoc from './api.json'")
  }

  const mdxResult = assertSyncResult(
    mdxToJs(markdownSource, {
      jsx: true,
      elementAttributeNameCase: 'html',
      stylePropertyNameCase: 'css',
      features: DOCS_MDX_FEATURES,
      fileURL: pathToFileURL(idWithoutQuery),
      data: {} satisfies Data,
      mdastPlugins: [scanPlugin.plugin, createDocsCodePlugin(options.highlightCode)],
      hastPlugins: [createDocsHastPlugin(onThisPageEntries)],
    }),
  )
  const parsedFrontmatter = parseFrontmatterData(mdxResult.frontmatter?.value, idWithoutQuery)

  const codeTabsCode = JSON.stringify(
    Object.fromEntries(
      scanPlugin
        .result()
        .codeTabsPackages.map((packageName) => [
          packageName,
          createCodeTabsItems(packageName, options.highlightCode),
        ]),
    ),
  )
  const frontmatterCode = JSON.stringify(parsedFrontmatter)
  const apiDocCode = apiJsonAvailable ? '__docsRawApiDoc' : 'undefined'

  return [
    ...imports,
    '',
    stripMdxDefaultExport(mdxResult.code),
    `const codeTabs = ${codeTabsCode}`,
    `const frontmatter = ${frontmatterCode}`,
    `const apiDoc = ${apiDocCode}`,
    '',
    'export default function MarkdownPage() {',
    '  return Markdown({ frontmatter, apiDoc, onThisPageEntries: ' +
      `${JSON.stringify(onThisPageEntries)}, Content: MDXContent, codeTabs })`,
    '}',
    '',
  ].join('\n')
}
