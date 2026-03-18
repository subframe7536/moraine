import { readFileSync } from 'node:fs'
import path from 'node:path'

import { parseSync } from 'oxc-parser'
import { walk } from 'oxc-walker'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'
import type { Plugin } from 'vite'

interface Injection {
  propInsertPos: number
  childStart: number
  childEnd: number
}

interface ApiDocInjection {
  propInsertPos: number
  componentKey: string
}

function dedentSource(source: string): string {
  const [first, ...lines] = source.split('\n')
  const minIndent = lines
    .filter((l) => l.trim().length > 0)
    .reduce((min, l) => {
      const indent = l.match(/^(\s*)/)?.[1].length ?? 0
      return Math.min(min, indent)
    }, Number.POSITIVE_INFINITY)

  return minIndent === Number.POSITIVE_INFINITY
    ? source
    : [first, ...lines.map((l) => l.slice(minIndent))].join('\n')
}

function loadApiDoc(projectRoot: string, key: string): unknown | null {
  try {
    const jsonPath = path.join(projectRoot, 'docs/api-doc/components', `${key}.json`)
    const content = readFileSync(jsonPath, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function transformDemoSource(
  code: string,
  id: string,
  toHTML: (src: string) => string,
  projectRoot: string,
): Promise<string | null> {
  const { program } = parseSync(id, code, { lang: 'tsx', sourceType: 'module' })

  const codeInjections: Injection[] = []
  const apiDocInjections: ApiDocInjection[] = []

  walk(program, {
    enter(node) {
      if (node.type !== 'JSXOpeningElement') {
        return
      }

      if (node.name.type !== 'JSXIdentifier') {
        return
      }

      // Handle DemoSection code injection
      if (node.name.name === 'DemoSection') {
        const hasCode = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'code',
        )
        if (hasCode) {
          return
        }

        if (node.selfClosing) {
          return
        }

        codeInjections.push({
          propInsertPos: node.end - 1,
          childStart: node.end,
          childEnd: -1,
        })
      }

      // Handle DemoPage apiDoc injection
      if (node.name.name === 'DemoPage') {
        const hasApiDoc = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'apiDoc',
        )
        if (hasApiDoc) {
          return
        }

        const keyAttr = node.attributes.find(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'componentKey',
        )
        if (
          keyAttr &&
          keyAttr.type === 'JSXAttribute' &&
          keyAttr.value &&
          keyAttr.value.type === 'Literal' &&
          typeof keyAttr.value.value === 'string'
        ) {
          apiDocInjections.push({
            propInsertPos: node.selfClosing ? node.end - 2 : node.end - 1,
            componentKey: keyAttr.value.value,
          })
        }
      }
    },
  })

  // Resolve DemoSection child boundaries for code injection
  if (codeInjections.length > 0) {
    walk(program, {
      enter(node) {
        if (node.type !== 'JSXElement') {
          return
        }
        if (
          node.openingElement.name.type !== 'JSXIdentifier' ||
          node.openingElement.name.name !== 'DemoSection'
        ) {
          return
        }
        if (node.openingElement.selfClosing) {
          return
        }

        const injection = codeInjections.find((inj) => inj.childStart === node.openingElement.end)
        if (injection && node.closingElement) {
          injection.childEnd = node.closingElement.start
        }
      },
    })
  }

  const validCodeInjections = codeInjections
    .filter((inj) => inj.childEnd > 0)
    .sort((a, b) => b.propInsertPos - a.propInsertPos)

  if (validCodeInjections.length === 0 && apiDocInjections.length === 0) {
    return null
  }

  // Combine all injections, sorted by position descending (so we inject from end to start)
  const allInjections: Array<{ pos: number; text: string }> = []

  for (const inj of validCodeInjections) {
    const childrenSource = dedentSource(
      code
        .slice(inj.childStart, inj.childEnd)
        .trim()
        .replace(/^\n+|\n+$/g, ''),
    )
    const html = toHTML(childrenSource)
    const escaped = JSON.stringify(html)
    allInjections.push({ pos: inj.propInsertPos, text: ` code={${escaped}}` })
  }

  for (const inj of apiDocInjections) {
    const doc = loadApiDoc(projectRoot, inj.componentKey)
    if (doc) {
      const serialized = JSON.stringify(doc)
      allInjections.push({ pos: inj.propInsertPos, text: ` apiDoc={${serialized}}` })
    }
  }

  // Sort descending by position
  allInjections.sort((a, b) => b.pos - a.pos)

  let result = code
  for (const inj of allInjections) {
    result = result.slice(0, inj.pos) + inj.text + result.slice(inj.pos)
  }

  return result
}

export async function demoSourcePlugin(projectRoot?: string): Promise<Plugin> {
  const highlighter = await createHighlighterCore({
    themes: [import('shiki/themes/one-light.mjs')],
    langs: [import('shiki/langs/tsx.mjs')],
    engine: createJavaScriptRegexEngine(),
  })

  let resolvedRoot: string

  return {
    name: 'rock-ui-demo-source',
    enforce: 'pre',

    configResolved(config) {
      resolvedRoot = projectRoot ?? path.resolve(config.root, '..')
    },

    transform: {
      order: 'pre',
      filter: {
        id: [/^(?!.*node_modules).*-demos\.tsx$/],
      },
      async handler(code, id) {
        return transformDemoSource(
          code,
          id,
          (s) => highlighter.codeToHtml(s, { lang: 'tsx', theme: 'one-light' }),
          resolvedRoot,
        )
      },
    },
  }
}
