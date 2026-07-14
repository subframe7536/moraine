import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { mdxToJs } from 'satteri'
import type { Data } from 'satteri'

import { renderDocsCodeHtml } from '../core/expressive-code'
import { resolveDocsPageContext, toImportPath } from '../core/paths'
import { toSingleQuoted } from '../core/strings'

import { createMdxCodeTabsPlugin } from './code-tabs'
import { createMdxExamplesPlugin } from './examples'
import { parseFrontmatterData } from './frontmatter'
import { createDocsCodePlugin, createDocsHastPlugin, DOCS_MDX_FEATURES } from './plugins'
import type { OnThisPageEntryLiteral } from './plugins'

interface CodeTabItemLiteral {
  label: string
  value: string
  html: string
}

async function createCodeTabsItems(packageName: string): Promise<CodeTabItemLiteral[]> {
  return Promise.all(
    [
      { label: 'bun', value: 'bun', source: `bun add ${packageName}` },
      { label: 'pnpm', value: 'pnpm', source: `pnpm add ${packageName}` },
      { label: 'npm', value: 'npm', source: `npm i ${packageName}` },
    ].map(async (command) => ({
      label: command.label,
      value: command.value,
      html: await renderDocsCodeHtml({
        code: command.source,
        language: 'bash',
        props: { frame: 'none', showLineNumbers: false },
      }),
    })),
  )
}

function stripMdxDefaultExport(code: string): string {
  return code.replace(/\n?export default MDXContent;\s*/, '\n')
}

function hasColocatedApiJson(id: string): boolean {
  return existsSync(path.join(path.dirname(id), 'api.json'))
}

export async function compileMarkdownPage(markdownSource: string, id: string): Promise<string> {
  const idWithoutQuery = id.split('?')[0] ?? id
  const page = resolveDocsPageContext(idWithoutQuery)
  const codeTabsPlugin = createMdxCodeTabsPlugin(idWithoutQuery)
  const examplesPlugin = createMdxExamplesPlugin(idWithoutQuery)
  const onThisPageEntries: OnThisPageEntryLiteral[] = []
  const runtimePath = toImportPath(idWithoutQuery, path.join(page.docsRoot, 'components/markdown'))
  const imports = [`import { Markdown } from ${toSingleQuoted(runtimePath)}`]
  const apiJsonAvailable = hasColocatedApiJson(idWithoutQuery)

  if (apiJsonAvailable) {
    imports.push("import __docsRawApiDoc from './api.json'")
  }

  const mdxResult = await mdxToJs(markdownSource, {
    jsx: true,
    elementAttributeNameCase: 'html',
    stylePropertyNameCase: 'css',
    features: DOCS_MDX_FEATURES,
    fileURL: pathToFileURL(idWithoutQuery),
    data: {} satisfies Data,
    mdastPlugins: [
      examplesPlugin.plugin,
      codeTabsPlugin.plugin,
      createDocsCodePlugin(idWithoutQuery),
    ],
    hastPlugins: [createDocsHastPlugin(onThisPageEntries)],
  })
  const parsedFrontmatter = parseFrontmatterData(mdxResult.frontmatter?.value, idWithoutQuery)
  const examples = examplesPlugin.result()

  for (const [index, example] of examples.entries()) {
    imports.push(`import __DocsExample${index} from ${toSingleQuoted(example.importPath)}`)
  }

  const codeTabsCode = JSON.stringify(
    Object.fromEntries(
      await Promise.all(
        codeTabsPlugin
          .result()
          .codeTabsPackages.map(async (packageName) => [
            packageName,
            await createCodeTabsItems(packageName),
          ]),
      ),
    ),
  )
  const examplesCode = `{
${examples.map((example, index) => `  ${JSON.stringify(example.path)}: __DocsExample${index},`).join('\n')}
}`
  const frontmatterCode = JSON.stringify(parsedFrontmatter)
  const apiDocCode = apiJsonAvailable ? '__docsRawApiDoc' : 'undefined'

  return [
    ...imports,
    '',
    stripMdxDefaultExport(mdxResult.code),
    `const examples = ${examplesCode}`,
    `const codeTabs = ${codeTabsCode}`,
    `const frontmatter = ${frontmatterCode}`,
    `const apiDoc = ${apiDocCode}`,
    '',
    'export default function MarkdownPage() {',
    `  return Markdown({ pageKey: ${JSON.stringify(page.pageKey)}, frontmatter, apiDoc, onThisPageEntries: ` +
      `${JSON.stringify(onThisPageEntries)}, Content: MDXContent, examples, codeTabs })`,
    '}',
    '',
  ].join('\n')
}
