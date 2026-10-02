import {
  createMdxMdastHandle,
  defineMdastPlugin,
  dropHandle,
  resolveMdastSubscriptions,
  visitMdastHandle,
} from 'satteri'
import type { ESTree } from 'vite'

import type { AnatomyConfig } from '../shared/anatomy.ts'

import type { ComponentApi } from './api-doc/types.ts'
import { asObjectRecord, extractMdxNodeText } from './markdown/mdx.ts'
import type { MdxNode } from './markdown/mdx.ts'
import { DOCS_MDX_FEATURES } from './markdown/plugins.ts'
import { parsePreviewCode } from './previews/ast.ts'

function fail(sourcePath: string, reason: string): never {
  throw new Error(`[docs-anatomy] ${sourcePath}: ${reason}`)
}

/** Only literal containers and string/boolean values are admitted; no source is executed. */
function readStaticValue(node: ESTree.Node, sourcePath: string): unknown {
  if (
    node.type === 'Literal' &&
    (typeof node.value === 'string' || typeof node.value === 'boolean')
  ) {
    return node.value
  }
  if (node.type === 'ArrayExpression') {
    return node.elements.map((element) => {
      if (!element || element.type === 'SpreadElement') {
        return fail(
          sourcePath,
          'Anatomy value requires a static literal; array holes and spreads are not supported',
        )
      }
      return readStaticValue(element, sourcePath)
    })
  }
  if (node.type === 'ObjectExpression') {
    const result: Record<string, unknown> = {}
    for (const property of node.properties) {
      if (
        property.type !== 'Property' ||
        property.computed ||
        property.method ||
        property.shorthand ||
        property.kind !== 'init'
      ) {
        fail(
          sourcePath,
          'Anatomy value requires a static literal; spreads, methods, and computed properties are not supported',
        )
      }
      const key =
        property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'Literal' && typeof property.key.value === 'string'
            ? property.key.value
            : fail(sourcePath, 'Anatomy object keys must be static names')
      if (Object.hasOwn(result, key) || ['__proto__', 'constructor', 'prototype'].includes(key)) {
        fail(sourcePath, `duplicate or unsupported Anatomy key ${key}`)
      }
      const value = readStaticValue(property.value, sourcePath)
      Object.defineProperty(result, key, { value, enumerable: true })
    }
    return result
  }
  return fail(sourcePath, `Anatomy value requires a static literal; ${node.type} is not supported`)
}

export async function parseAnatomyNode(node: MdxNode, sourcePath: string): Promise<unknown> {
  const attributes = node.attributes?.map(asObjectRecord) ?? []
  if (
    attributes.length !== 1 ||
    attributes[0]?.type !== 'mdxJsxAttribute' ||
    attributes[0].name !== 'value' ||
    node.children?.length
  ) {
    fail(sourcePath, '<Anatomy /> requires exactly one static value attribute and no children')
  }
  const value = asObjectRecord(attributes[0].value)
  if (value?.type !== 'mdxJsxAttributeValueExpression' || typeof value.value !== 'string') {
    fail(sourcePath, '<Anatomy value={...} /> requires a static object literal')
  }
  try {
    const program = await parsePreviewCode(`const anatomy = ${value.value}`)
    const declaration = program.body[0]
    if (
      program.body.length !== 1 ||
      declaration?.type !== 'VariableDeclaration' ||
      declaration.declarations.length !== 1
    ) {
      fail(sourcePath, 'Anatomy value requires a single static object literal')
    }
    const expression = declaration.declarations[0]?.init
    if (!expression || expression.type !== 'ObjectExpression') {
      fail(sourcePath, 'Anatomy value requires a static object literal')
    }
    return readStaticValue(expression, sourcePath)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[docs-anatomy]')) {
      throw error
    }
    return fail(sourcePath, `cannot parse static Anatomy value: ${String(error)}`)
  }
}

/** Validate content against the current public part and slot registry. */
export function validateAnatomyConfig(
  value: unknown,
  sourcePath: string,
  api?: ComponentApi,
): AnatomyConfig {
  const parts = new Set(api?.parts.map((part) => part.name) ?? [])
  const slots = new Set(api?.slots ?? [])
  const object = (value: unknown, location: string): Record<string, unknown> =>
    asObjectRecord(value) ?? fail(sourcePath, `${location} must be an object`)
  const keys = (node: Record<string, unknown>, allowed: string[], location: string) => {
    for (const key of Object.keys(node)) {
      if (!allowed.includes(key)) {
        fail(sourcePath, `${location}: unknown field ${key}`)
      }
    }
  }
  const name = (value: unknown, location: string): string => {
    if (typeof value !== 'string' || !/^[a-zA-Z][\w.-]*$/.test(value)) {
      fail(sourcePath, `${location} must be a non-empty name`)
    }
    return value
  }
  const element = (node: Record<string, unknown>, location: string) => {
    if (
      Object.hasOwn(node, 'element') &&
      (typeof node.element !== 'string' ||
        !/^[a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*(?:=(?:"[^"<>\n]*"|'[^'<>\n]*'))?)*$/.test(
          node.element,
        ))
    ) {
      fail(sourcePath, `${location}: invalid HTML-like element annotation`)
    }
  }
  const slot = (value: unknown, location: string) => {
    const result = name(value, location)
    if (!slots.has(result)) {
      fail(sourcePath, `${location}: unknown slot ${result}`)
    }
  }
  const children = (node: Record<string, unknown>, location: string) => {
    if (!Object.hasOwn(node, 'children')) {
      return
    }
    if (!Array.isArray(node.children)) {
      fail(sourcePath, `${location}.children must be an array`)
    }
    node.children.forEach((child, index) => visit(child, `${location}.children[${index}]`))
  }
  function visit(value: unknown, location: string) {
    const node = object(value, location)
    keys(node, ['part', 'slot', 'internal', 'element', 'children'], location)
    // A part may carry its own slot annotation, but internal nodes cannot mix kinds.
    if (Object.hasOwn(node, 'internal')) {
      if (Object.hasOwn(node, 'part') || Object.hasOwn(node, 'slot')) {
        fail(sourcePath, `${location}: mixed discriminators; use part, slot, or internal`)
      }
      name(node.internal, `${location}.internal`)
    } else if (Object.hasOwn(node, 'part')) {
      const part = name(node.part, `${location}.part`)
      if (!parts.has(part)) {
        fail(sourcePath, `${location}: unknown part ${part}`)
      }
      if (Object.hasOwn(node, 'slot')) {
        slot(node.slot, `${location}.slot`)
      }
    } else if (Object.hasOwn(node, 'slot')) {
      slot(node.slot, `${location}.slot`)
    } else {
      fail(sourcePath, `${location}: requires a part, slot, or internal discriminator`)
    }
    element(node, location)
    children(node, location)
  }

  const config = object(value, 'Anatomy')
  keys(config, ['root', 'children'], 'Anatomy')
  const root = object(config.root, 'Anatomy.root')
  keys(root, ['slot', 'noDom', 'element'], 'Anatomy.root')
  if (root.noDom === true && !Object.hasOwn(root, 'slot') && !Object.hasOwn(root, 'element')) {
    // State-only roots have no element or slot annotation.
  } else if (root.slot === 'root' && !Object.hasOwn(root, 'noDom')) {
    // List and external components can have a DOM root without theme slots.
    element(root, 'Anatomy.root')
  } else {
    fail(sourcePath, 'Anatomy.root requires exactly slot: "root" or noDom: true')
  }
  children(config, 'Anatomy')
  return value as AnatomyConfig
}

/** Parse real MDX nodes, so examples inside code fences do not count as Anatomy instances. */
export async function extractAnatomyConfig(source: string, sourcePath: string): Promise<unknown> {
  const nodes: MdxNode[] = []
  let headings = 0
  const plugin = defineMdastPlugin({
    name: 'moraine-anatomy',
    heading(node: unknown) {
      const record = asObjectRecord(node)
      if (record?.depth === 2 && extractMdxNodeText(record as MdxNode) === 'Anatomy') {
        headings++
      }
    },
    mdxJsxFlowElement(node: unknown) {
      const record = asObjectRecord(node)
      if (record?.name === 'Anatomy') {
        nodes.push(record as MdxNode)
      }
    },
    mdxJsxTextElement(node: unknown) {
      const record = asObjectRecord(node)
      if (record?.name === 'Anatomy') {
        nodes.push(record as MdxNode)
      }
    },
  })
  const handle = createMdxMdastHandle(source, DOCS_MDX_FEATURES, true)
  try {
    await visitMdastHandle(
      handle,
      plugin,
      resolveMdastSubscriptions(plugin),
      source,
      undefined,
      {},
      'mdx',
    )
  } catch (error) {
    return fail(sourcePath, `cannot parse Anatomy MDX: ${String(error)}`)
  } finally {
    dropHandle(handle)
  }
  if (headings === 0 && nodes.length === 0) {
    return undefined
  }
  if (headings !== 1 || nodes.length !== 1) {
    fail(
      sourcePath,
      `when present, Anatomy requires exactly one ## Anatomy and one <Anatomy /> (found ${headings} headings and ${nodes.length} components)`,
    )
  }
  return parseAnatomyNode(nodes[0]!, sourcePath)
}

export async function validateAnatomy(
  source: string,
  sourcePath: string,
  api?: ComponentApi,
): Promise<AnatomyConfig | undefined> {
  const config = await extractAnatomyConfig(source, sourcePath)
  return config === undefined ? undefined : validateAnatomyConfig(config, sourcePath, api)
}
