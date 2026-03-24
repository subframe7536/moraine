import { readFileSync } from 'node:fs'
import path from 'node:path'

import { parseSync } from 'oxc-parser'
import { walk } from 'oxc-walker'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs'
import type { Plugin } from 'vite'

const VIRTUAL_DEMO_SOURCE = 'virtual:demo-source'
const RESOLVED_VIRTUAL_DEMO_SOURCE = '\0rock-ui-demo-source'
const DEMO_DOC_FILE_RE = /[\\/]docs[\\/].*\.tsx$/

const SUPPORTED_LANGUAGES = new Set(['tsx', 'bash'])

interface DemoCodeInjection {
  demoName: string
  propInsertPos: number
}

interface SourceCodeInjection {
  propInsertPos: number
  childStart: number
  childEnd: number
  lang: string
  sourceText?: string
}

interface ApiDocInjection {
  propInsertPos: number
  componentKey: string
}

interface ExtraApiDocsInjection {
  propInsertPos: number
  componentKeys: string[]
}

interface InjectionResult {
  pos: number
  text: string
}

interface DemoComponentDeclaration {
  name: string
  sourceText: string
}

type ProgramNode = ReturnType<typeof parseSync>['program']

function dedentSource(source: string): string {
  const [first, ...lines] = source.split('\n')
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce((min, line) => {
      const indent = line.match(/^(\s*)/)?.[1].length ?? 0
      return Math.min(min, indent)
    }, Number.POSITIVE_INFINITY)

  return minIndent === Number.POSITIVE_INFINITY
    ? source
    : [first, ...lines.map((line) => line.slice(minIndent))].join('\n')
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

function getPropInsertPos(node: { end: number; selfClosing: boolean }): number {
  return node.selfClosing ? node.end - 2 : node.end - 1
}

function hasJsxAttribute(node: { attributes: unknown[] }, attrName: string): boolean {
  return node.attributes.some(
    (attr) =>
      typeof attr === 'object' &&
      attr !== null &&
      'type' in attr &&
      attr.type === 'JSXAttribute' &&
      'name' in attr &&
      typeof attr.name === 'object' &&
      attr.name !== null &&
      'type' in attr.name &&
      attr.name.type === 'JSXIdentifier' &&
      'name' in attr.name &&
      attr.name.name === attrName,
  )
}

function getJsxAttribute(
  node: { attributes: unknown[] },
  attrName: string,
): Record<string, unknown> | null {
  const attr = node.attributes.find(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      item.type === 'JSXAttribute' &&
      'name' in item &&
      typeof item.name === 'object' &&
      item.name !== null &&
      'type' in item.name &&
      item.name.type === 'JSXIdentifier' &&
      'name' in item.name &&
      item.name.name === attrName,
  )

  return attr && typeof attr === 'object' ? (attr as Record<string, unknown>) : null
}

function getLiteralStringAttribute(
  node: { attributes: unknown[] },
  attrName: string,
): string | undefined {
  const attr = getJsxAttribute(node, attrName)

  if (!attr || !('value' in attr)) {
    return undefined
  }

  const value = attr.value
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return undefined
  }

  if (value.type === 'Literal' && 'value' in value && typeof value.value === 'string') {
    return value.value
  }

  if (
    value.type === 'JSXExpressionContainer' &&
    'expression' in value &&
    typeof value.expression === 'object' &&
    value.expression !== null &&
    'type' in value.expression &&
    value.expression.type === 'Literal' &&
    'value' in value.expression &&
    typeof value.expression.value === 'string'
  ) {
    return value.expression.value
  }

  return undefined
}

function getLiteralStringArrayAttribute(
  node: { attributes: unknown[] },
  attrName: string,
): string[] | undefined {
  const attr = getJsxAttribute(node, attrName)

  if (!attr || !('value' in attr)) {
    return undefined
  }

  const value = attr.value
  if (
    !value ||
    typeof value !== 'object' ||
    !('type' in value) ||
    value.type !== 'JSXExpressionContainer' ||
    !('expression' in value)
  ) {
    return undefined
  }

  const expression = value.expression
  if (
    !expression ||
    typeof expression !== 'object' ||
    !('type' in expression) ||
    expression.type !== 'ArrayExpression' ||
    !('elements' in expression) ||
    !Array.isArray(expression.elements)
  ) {
    return undefined
  }

  const keys: string[] = []
  for (const element of expression.elements) {
    if (
      !element ||
      typeof element !== 'object' ||
      !('type' in element) ||
      element.type !== 'Literal' ||
      !('value' in element) ||
      typeof element.value !== 'string'
    ) {
      return undefined
    }
    keys.push(element.value)
  }

  return keys
}

function getDemoComponentNameAttribute(node: {
  attributes: unknown[]
}): { status: 'ok'; demoName: string } | { status: 'missing' | 'invalid' } {
  const attr = getJsxAttribute(node, 'demo')
  if (!attr) {
    return { status: 'missing' }
  }
  if (!('value' in attr)) {
    return { status: 'invalid' }
  }

  const value = attr.value
  if (
    !value ||
    typeof value !== 'object' ||
    !('type' in value) ||
    value.type !== 'JSXExpressionContainer' ||
    !('expression' in value)
  ) {
    return { status: 'invalid' }
  }

  const expression = value.expression
  if (
    expression &&
    typeof expression === 'object' &&
    'type' in expression &&
    expression.type === 'Identifier' &&
    'name' in expression &&
    typeof expression.name === 'string'
  ) {
    return { status: 'ok', demoName: expression.name }
  }

  return { status: 'invalid' }
}

function normalizeHighlightLang(lang: string | undefined): 'tsx' | 'bash' {
  if (!lang) {
    return 'tsx'
  }
  return SUPPORTED_LANGUAGES.has(lang) ? (lang as 'tsx' | 'bash') : 'tsx'
}

function isJsxIdentifierName(name: unknown, expected: string): boolean {
  return (
    typeof name === 'object' &&
    name !== null &&
    'type' in name &&
    name.type === 'JSXIdentifier' &&
    'name' in name &&
    name.name === expected
  )
}

function extractSourceCodeText(node: unknown, code: string): string | undefined {
  if (!node || typeof node !== 'object' || !('children' in node) || !Array.isArray(node.children)) {
    return undefined
  }

  if (node.children.length !== 1) {
    return undefined
  }

  const onlyChild = node.children[0]
  if (!onlyChild || typeof onlyChild !== 'object' || !('type' in onlyChild)) {
    return undefined
  }

  if (onlyChild.type === 'JSXText' && 'value' in onlyChild && typeof onlyChild.value === 'string') {
    return onlyChild.value
  }

  if (
    onlyChild.type !== 'JSXExpressionContainer' ||
    !('expression' in onlyChild) ||
    !onlyChild.expression ||
    typeof onlyChild.expression !== 'object' ||
    !('type' in onlyChild.expression)
  ) {
    return undefined
  }

  const expr = onlyChild.expression
  if (expr.type === 'Literal' && 'value' in expr && typeof expr.value === 'string') {
    return expr.value
  }

  if (
    expr.type === 'TemplateLiteral' &&
    'expressions' in expr &&
    Array.isArray(expr.expressions) &&
    expr.expressions.length === 0 &&
    'quasis' in expr &&
    Array.isArray(expr.quasis)
  ) {
    const quasi = expr.quasis[0]
    if (
      quasi &&
      typeof quasi === 'object' &&
      'value' in quasi &&
      quasi.value &&
      typeof quasi.value === 'object'
    ) {
      if ('cooked' in quasi.value && typeof quasi.value.cooked === 'string') {
        return quasi.value.cooked
      }
      if ('raw' in quasi.value && typeof quasi.value.raw === 'string') {
        return quasi.value.raw
      }
    }
  }

  if (
    'start' in onlyChild &&
    'end' in onlyChild &&
    typeof onlyChild.start === 'number' &&
    typeof onlyChild.end === 'number'
  ) {
    return code.slice(onlyChild.start, onlyChild.end)
  }

  return undefined
}

function resolveSourceCodeBoundaries(
  program: ProgramNode,
  injections: SourceCodeInjection[],
  code: string,
): void {
  if (injections.length === 0) {
    return
  }

  walk(program, {
    enter(node) {
      if (node.type !== 'JSXElement') {
        return
      }
      if (
        !isJsxIdentifierName(node.openingElement.name, 'SourceCode') ||
        node.openingElement.selfClosing
      ) {
        return
      }

      const injection = injections.find((item) => item.childStart === node.openingElement.end)
      if (!injection || !node.closingElement) {
        return
      }

      injection.childEnd = node.closingElement.start
      injection.sourceText = extractSourceCodeText(node, code)
    },
  })
}

function getVariableDeclaratorDemoComponentDeclaration(
  declaration: Record<string, unknown>,
  statement: Record<string, unknown>,
  code: string,
): DemoComponentDeclaration | null {
  if (!('id' in declaration) || !('init' in declaration)) {
    return null
  }

  const identifier = declaration.id
  const init = declaration.init
  if (
    !identifier ||
    typeof identifier !== 'object' ||
    !('type' in identifier) ||
    identifier.type !== 'Identifier' ||
    !('name' in identifier) ||
    typeof identifier.name !== 'string'
  ) {
    return null
  }

  if (
    !init ||
    typeof init !== 'object' ||
    !('type' in init) ||
    (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression')
  ) {
    return null
  }

  if (!('start' in statement) || !('end' in statement)) {
    return null
  }

  return {
    name: identifier.name,
    sourceText: code.slice(statement.start as number, statement.end as number).trim(),
  }
}

function getTopLevelDemoComponentDeclaration(
  statement: unknown,
  code: string,
): DemoComponentDeclaration | null {
  if (!statement || typeof statement !== 'object' || !('type' in statement)) {
    return null
  }

  if (statement.type === 'FunctionDeclaration') {
    if (
      !('id' in statement) ||
      !statement.id ||
      typeof statement.id !== 'object' ||
      !('type' in statement.id) ||
      statement.id.type !== 'Identifier' ||
      !('name' in statement.id) ||
      typeof statement.id.name !== 'string' ||
      !('start' in statement) ||
      !('end' in statement)
    ) {
      return null
    }

    return {
      name: statement.id.name,
      sourceText: code.slice(statement.start as number, statement.end as number).trim(),
    }
  }

  if (statement.type === 'VariableDeclaration') {
    if (!('declarations' in statement) || !Array.isArray(statement.declarations)) {
      return null
    }
    if (statement.declarations.length !== 1) {
      return null
    }
    return getVariableDeclaratorDemoComponentDeclaration(
      statement.declarations[0] as Record<string, unknown>,
      statement as Record<string, unknown>,
      code,
    )
  }

  if (
    statement.type === 'ExportNamedDeclaration' &&
    'declaration' in statement &&
    statement.declaration &&
    typeof statement.declaration === 'object'
  ) {
    const declaration = statement.declaration as Record<string, unknown>
    if (declaration.type === 'FunctionDeclaration') {
      if (
        !('id' in declaration) ||
        !declaration.id ||
        typeof declaration.id !== 'object' ||
        !('type' in declaration.id) ||
        declaration.id.type !== 'Identifier' ||
        !('name' in declaration.id) ||
        typeof declaration.id.name !== 'string' ||
        !('start' in statement) ||
        !('end' in statement)
      ) {
        return null
      }

      return {
        name: declaration.id.name,
        sourceText: code.slice(statement.start as number, statement.end as number).trim(),
      }
    }

    if (declaration.type === 'VariableDeclaration') {
      if (!('declarations' in declaration) || !Array.isArray(declaration.declarations)) {
        return null
      }
      if (declaration.declarations.length !== 1) {
        return null
      }
      return getVariableDeclaratorDemoComponentDeclaration(
        declaration.declarations[0] as Record<string, unknown>,
        statement as Record<string, unknown>,
        code,
      )
    }
  }

  return null
}

function collectTopLevelDemoComponents(program: ProgramNode, code: string): Map<string, string> {
  const components = new Map<string, string>()

  for (const statement of program.body) {
    const declaration = getTopLevelDemoComponentDeclaration(statement, code)
    if (!declaration) {
      continue
    }
    components.set(declaration.name, declaration.sourceText)
  }

  return components
}

function warnInvalidDemoUsage(id: string, reason: string): void {
  console.warn(`[demo-source] ${reason} in ${id}`)
}

export async function transformDemoSource(
  code: string,
  id: string,
  toHTML: (src: string, lang: 'tsx' | 'bash') => string,
  projectRoot: string,
): Promise<string | null> {
  const { program } = parseSync(id, code, { lang: 'tsx', sourceType: 'module' })
  const topLevelDemoComponents = collectTopLevelDemoComponents(program, code)

  const demoCodeInjections: DemoCodeInjection[] = []
  const sourceCodeInjections: SourceCodeInjection[] = []
  const apiDocInjections: ApiDocInjection[] = []
  const extraApiDocsInjections: ExtraApiDocsInjection[] = []

  walk(program, {
    enter(node) {
      if (node.type !== 'JSXOpeningElement' || node.name.type !== 'JSXIdentifier') {
        return
      }

      if (node.name.name === 'DemoSection') {
        if (hasJsxAttribute(node, 'code')) {
          return
        }

        const demoAttr = getDemoComponentNameAttribute(node)
        if (demoAttr.status === 'ok') {
          demoCodeInjections.push({
            demoName: demoAttr.demoName,
            propInsertPos: getPropInsertPos(node),
          })
          return
        }

        if (demoAttr.status === 'missing') {
          warnInvalidDemoUsage(id, 'DemoSection demo attribute is required')
          return
        }

        warnInvalidDemoUsage(id, 'DemoSection demo must be a direct identifier')
        return
      }

      if (node.name.name === 'SourceCode') {
        if (hasJsxAttribute(node, 'html') || node.selfClosing) {
          return
        }

        sourceCodeInjections.push({
          propInsertPos: getPropInsertPos(node),
          childStart: node.end,
          childEnd: -1,
          lang: getLiteralStringAttribute(node, 'lang') ?? 'tsx',
        })
        return
      }

      if (node.name.name === 'DemoPage') {
        const propInsertPos = getPropInsertPos(node)
        const componentKey = getLiteralStringAttribute(node, 'componentKey')
        if (!hasJsxAttribute(node, 'apiDoc') && componentKey) {
          apiDocInjections.push({
            propInsertPos,
            componentKey,
          })
        }

        const extraApiKeys = getLiteralStringArrayAttribute(node, 'extraApiKeys')
        if (!hasJsxAttribute(node, 'extraApiDocs') && extraApiKeys && extraApiKeys.length > 0) {
          extraApiDocsInjections.push({
            propInsertPos,
            componentKeys: extraApiKeys,
          })
        }
      }
    },
  })

  resolveSourceCodeBoundaries(program, sourceCodeInjections, code)

  const validSourceCodeInjections = sourceCodeInjections.filter((item) => item.childEnd > 0)
  const allInjections: InjectionResult[] = []

  for (const injection of demoCodeInjections) {
    const sourceText = topLevelDemoComponents.get(injection.demoName)
    if (!sourceText) {
      warnInvalidDemoUsage(
        id,
        `Demo component "${injection.demoName}" was not found at module top level`,
      )
      continue
    }

    const html = toHTML(sourceText, 'tsx')
    const escaped = JSON.stringify(html)
    allInjections.push({ pos: injection.propInsertPos, text: ` code={${escaped}}` })
  }

  for (const injection of validSourceCodeInjections) {
    const rawSource =
      injection.sourceText ??
      code
        .slice(injection.childStart, injection.childEnd)
        .trim()
        .replace(/^\n+|\n+$/g, '')

    const childrenSource = dedentSource(rawSource)
    const html = toHTML(childrenSource, normalizeHighlightLang(injection.lang))
    const escaped = JSON.stringify(html)
    allInjections.push({ pos: injection.propInsertPos, text: ` html={${escaped}}` })
  }

  for (const injection of apiDocInjections) {
    const doc = loadApiDoc(projectRoot, injection.componentKey)
    if (doc) {
      allInjections.push({
        pos: injection.propInsertPos,
        text: ` apiDoc={${JSON.stringify(doc)}}`,
      })
    }
  }

  for (const injection of extraApiDocsInjections) {
    const docs = [...new Set(injection.componentKeys)]
      .map((key) => loadApiDoc(projectRoot, key))
      .filter((doc): doc is unknown => Boolean(doc))

    if (docs.length > 0) {
      allInjections.push({
        pos: injection.propInsertPos,
        text: ` extraApiDocs={${JSON.stringify(docs)}}`,
      })
    }
  }

  if (allInjections.length === 0) {
    return null
  }

  allInjections.sort((a, b) => b.pos - a.pos)

  let result = code
  for (const injection of allInjections) {
    result = result.slice(0, injection.pos) + injection.text + result.slice(injection.pos)
  }

  return result
}

export async function demoSourcePlugin(projectRoot?: string): Promise<Plugin> {
  const highlighter = await createHighlighterCore({
    themes: [import('shiki/themes/one-light.mjs'), import('shiki/themes/one-dark-pro.mjs')],
    langs: [import('shiki/langs/tsx.mjs'), import('shiki/langs/bash.mjs')],
    engine: createJavaScriptRegexEngine(),
  })

  let resolvedRoot = ''

  return {
    name: 'rock-ui-demo-source',
    enforce: 'pre',

    configResolved(config) {
      resolvedRoot = projectRoot ?? path.resolve(config.root, '..')
    },

    resolveId(id) {
      if (id === VIRTUAL_DEMO_SOURCE) {
        return RESOLVED_VIRTUAL_DEMO_SOURCE
      }
      return null
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_DEMO_SOURCE) {
        return null
      }
      const sourcePath = path.resolve(resolvedRoot, 'docs/components/source-code.tsx')
      return `export { SourceCode } from ${JSON.stringify(sourcePath)}`
    },

    transform: {
      order: 'pre',
      filter: {
        id: [DEMO_DOC_FILE_RE],
      },
      async handler(code, id) {
        return transformDemoSource(
          code,
          id,
          (source, lang) =>
            highlighter.codeToHtml(source, {
              lang,
              themes: { light: 'one-light', dark: 'one-dark-pro' },
            }),
          resolvedRoot,
        )
      },
    },
  }
}
