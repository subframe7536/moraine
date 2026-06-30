import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { parseSync } from 'vite'

import { collectFiles } from '../core/paths'
import { toKebabCase } from '../core/strings'

import type {
  ComponentDoc,
  ComponentIndexEntry,
  GenerationResult,
  ItemDoc,
  PropDoc,
  SlotDoc,
} from './types'

type AstNode = Record<string, any>

interface SourceModule {
  filePath: string
  relativePath: string
  code: string
  comments: AstNode[]
  program: AstNode
}

interface TypeContext {
  interfaces: Map<string, AstNode>
  aliases: Map<string, AstNode>
  namespaces: Map<string, AstNode>
}

function categoryFromSourcePath(sourcePath: string | undefined): string {
  return sourcePath?.replace(/\\/g, '/').split('/')[1] || 'General'
}

export function normalizePathForComparison(filePath: string): string {
  const resolved = path.resolve(filePath).replaceAll('\\', '/')
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

export function shouldIncludeInheritedGroup(from: string): boolean {
  return from !== 'solid-js'
}

function cleanDoc(value: string | undefined): string | undefined {
  const text = value
    ?.replace(/^\*/gm, '')
    .replace(/^\s*\* ?/gm, '')
    .replace(/@default\s+[^\n]+/g, '')
    .trim()
  return text || undefined
}

function findLeadingComment(comments: AstNode[], node: AstNode): AstNode | undefined {
  return comments.filter((comment) => comment.end <= node.start && comment.type === 'Block').at(-1)
}

function getDoc(comments: AstNode[], node: AstNode): string | undefined {
  return cleanDoc(findLeadingComment(comments, node)?.value)
}

function getDefaultTag(comments: AstNode[], node: AstNode): string | undefined {
  const value = findLeadingComment(comments, node)?.value as string | undefined
  return value
    ?.match(/@default\s+([^\n]+)/)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '')
}

function getName(node: AstNode | undefined): string | undefined {
  if (!node) return undefined
  if (node.type === 'Identifier' || node.type === 'Literal' || node.type === 'StringLiteral') {
    return String(node.name ?? node.value)
  }
  if (node.type === 'TSQualifiedName') {
    const left = getName(node.left)
    const right = getName(node.right)
    return left && right ? `${left}.${right}` : (right ?? left)
  }
  return undefined
}

function typeToString(code: string, node: AstNode | undefined): string {
  if (!node) return 'unknown'
  return code.slice(node.start, node.end).trim()
}

function propName(member: AstNode): string | undefined {
  return getName(member.key ?? member.id)
}

function isOptional(member: AstNode, typeText: string): boolean {
  return Boolean(member.optional) || /(?:^|\W)undefined(?:\W|$)/.test(typeText)
}

function createProp(module: SourceModule, member: AstNode): PropDoc | undefined {
  const name = propName(member)
  if (!name) return undefined
  const typeNode = member.typeAnnotation?.typeAnnotation ?? member.typeAnnotation
  const type = typeToString(module.code, typeNode)
  return {
    name,
    required: !isOptional(member, type),
    type: member.optional && !/(?:^|\W)undefined(?:\W|$)/.test(type) ? `${type} | undefined` : type,
    ...(getDoc(module.comments, member) ? { description: getDoc(module.comments, member) } : {}),
    ...(getDefaultTag(module.comments, member)
      ? { defaultValue: getDefaultTag(module.comments, member) }
      : {}),
  }
}

function interfaceMembers(node: AstNode | undefined): AstNode[] {
  return node?.body?.body ?? []
}

function referenceName(node: AstNode | undefined): string | undefined {
  return getName(node?.typeName ?? node?.expression ?? node)
}

function resolveInterfaceProps(
  module: SourceModule,
  context: TypeContext,
  node: AstNode | undefined,
  visited = new Set<string>(),
): PropDoc[] {
  if (!node) return []
  const key = `${node.start}:${node.end}`
  if (visited.has(key)) return []
  visited.add(key)

  const props: PropDoc[] = []
  for (const ext of node.extends ?? []) {
    const name = referenceName(ext)
    const args: AstNode[] = ext.typeArguments?.params ?? []
    if (name === 'BaseProps' && args[0]) {
      props.push(...resolveTypeProps(module, context, args[0], visited))
      continue
    }
    props.push(...resolveTypeProps(module, context, ext, visited))
  }

  for (const member of interfaceMembers(node)) {
    if (member.type === 'TSPropertySignature' || member.type === 'PropertyDefinition') {
      const prop = createProp(module, member)
      if (prop) props.push(prop)
    }
  }
  return uniqueProps(props)
}

function resolveTypeProps(
  module: SourceModule,
  context: TypeContext,
  typeNode: AstNode | undefined,
  visited: Set<string>,
): PropDoc[] {
  const name = referenceName(typeNode)
  if (!name) return []
  if (name.includes('.')) {
    const [namespaceName, memberName] = name.split('.')
    const namespaceBody = context.namespaces.get(namespaceName ?? '')?.body?.body ?? []
    const node = namespaceBody.find((item: AstNode) => getName(item.id) === memberName)
    if (node?.type === 'TSInterfaceDeclaration')
      return resolveInterfaceProps(module, context, node, visited)
    if (node?.type === 'TSTypeAliasDeclaration')
      return resolveTypeProps(module, context, node.typeAnnotation, visited)
  }
  const alias = context.aliases.get(name)
  if (alias) return resolveTypeProps(module, context, alias.typeAnnotation, visited)
  if (name === 'BaseProps') {
    const args: AstNode[] = typeNode?.typeArguments?.params ?? []
    return resolveTypeProps(module, context, args[0], visited)
  }
  return resolveInterfaceProps(module, context, context.interfaces.get(name), visited)
}

function uniqueProps(props: PropDoc[]): PropDoc[] {
  const byName = new Map<string, PropDoc>()
  for (const prop of props) byName.set(prop.name, prop)
  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name))
}

function extractSlots(module: SourceModule, node: AstNode | undefined): SlotDoc[] {
  if (!node) return []
  if (node.type === 'TSInterfaceDeclaration') {
    return interfaceMembers(node)
      .map((member) => {
        const name = propName(member)
        if (!name) return undefined
        const description = getDoc(module.comments, member)
        return { name, ...(description ? { description } : {}) }
      })
      .filter(Boolean) as SlotDoc[]
  }
  if (node.type === 'TSTypeAliasDeclaration') {
    return literalNames(node.typeAnnotation).map((name) => ({ name }))
  }
  return []
}

function literalNames(node: AstNode | undefined): string[] {
  if (!node) return []
  if (node.type === 'TSUnionType') return node.types.flatMap(literalNames)
  if (node.type === 'TSLiteralType') return node.literal?.value ? [String(node.literal.value)] : []
  return []
}

function extractItem(
  module: SourceModule,
  context: TypeContext,
  node: AstNode | undefined,
): ItemDoc | undefined {
  if (!node) return undefined
  const description = getDoc(module.comments, node)
  const props =
    node.type === 'TSInterfaceDeclaration'
      ? resolveInterfaceProps(module, context, node)
      : resolveTypeProps(module, context, node.typeAnnotation, new Set())
  return description || props.length
    ? { props, ...(description ? { description } : {}) }
    : undefined
}

function collectModule(filePath: string, projectRoot: string): SourceModule | null {
  const code = readFileSync(filePath, 'utf8')
  try {
    const parsed = parseSync(filePath, code, {
      lang: filePath.endsWith('x') ? 'tsx' : 'ts',
      sourceType: 'module',
    })
    return {
      filePath,
      relativePath: path.relative(projectRoot, filePath).replaceAll('\\', '/'),
      code,
      comments: parsed.comments,
      program: parsed.program as AstNode,
    }
  } catch (error) {
    console.warn(`[api-doc] Failed to parse ${filePath}: ${error}`)
    return null
  }
}

function buildContext(modules: SourceModule[]): TypeContext {
  const context: TypeContext = { interfaces: new Map(), aliases: new Map(), namespaces: new Map() }
  for (const module of modules) {
    for (const statement of module.program.body ?? []) {
      const declaration = statement.declaration ?? statement
      if (declaration.type === 'TSInterfaceDeclaration')
        context.interfaces.set(getName(declaration.id)!, declaration)
      if (declaration.type === 'TSTypeAliasDeclaration')
        context.aliases.set(getName(declaration.id)!, declaration)
      if (declaration.type === 'TSModuleDeclaration')
        context.namespaces.set(getName(declaration.id)!, declaration)
    }
  }
  return context
}

function namespaceMember(namespaceNode: AstNode | undefined, name: string): AstNode | undefined {
  return (namespaceNode?.body?.body ?? [])
    .map((item: AstNode) => item.declaration ?? item)
    .find((item: AstNode) => getName(item.id) === name)
}

function isComponentFunction(node: AstNode): boolean {
  if (node.type !== 'FunctionDeclaration' || !getName(node.id) || !node.params?.[0]) return false
  return referenceName(node.returnType?.typeAnnotation ?? node.returnType) === 'JSX.Element'
}

function processComponent(
  module: SourceModule,
  context: TypeContext,
  node: AstNode,
): { key: string; doc: ComponentDoc } | null {
  const componentName = getName(node.id)
  const paramType = node.params?.[0]?.typeAnnotation?.typeAnnotation
  const propsName = referenceName(paramType)
  if (!componentName || !propsName) return null

  const namespaceNode = context.namespaces.get(`${componentName}T`)
  const slots = extractSlots(module, namespaceMember(namespaceNode, 'Slot'))
  const item = extractItem(module, context, namespaceMember(namespaceNode, 'Item'))
  const baseProps = resolveInterfaceProps(
    module,
    context,
    namespaceMember(namespaceNode, 'Base'),
    new Set(),
  )
  const own =
    baseProps.length > 0 ? baseProps : resolveTypeProps(module, context, paramType, new Set())
  const componentKey = toKebabCase(componentName)
  const description = getDoc(module.comments, node)
  const sourcePath = module.relativePath
  const component: ComponentIndexEntry = {
    key: componentKey,
    name: componentName,
    category: categoryFromSourcePath(sourcePath),
    polymorphic:
      own.some((prop) => prop.name === 'as') ||
      (module.code.includes('splitProps(props as') && module.code.includes("'as'")),
    ...(description ? { description } : {}),
    sourcePath,
  }
  return {
    key: componentKey,
    doc: {
      component,
      slots,
      props: { own, inherited: [] },
      ...(item ? { item } : {}),
    },
  }
}

export function generateApiDoc(projectRoot: string): GenerationResult | null {
  const srcRoot = path.join(projectRoot, 'src')
  if (!existsSync(srcRoot)) {
    console.warn(`[api-doc] ${srcRoot} not found, skipping generation`)
    return null
  }

  const modules = collectFiles(
    srcRoot,
    (file) =>
      /\.(tsx?|jsx?)$/.test(file) && !file.endsWith('.test.tsx') && !file.endsWith('.test.ts'),
  )
    .map((file) => collectModule(file, projectRoot))
    .filter(Boolean) as SourceModule[]
  const context = buildContext(modules)
  const componentDocs = new Map<string, ComponentDoc>()

  for (const module of modules) {
    for (const statement of module.program.body ?? []) {
      const declaration = statement.declaration ?? statement
      if (isComponentFunction(declaration)) {
        const component = processComponent(module, context, declaration)
        if (component) componentDocs.set(component.key, component.doc)
      }
    }
  }

  return {
    indexDoc: { components: [...componentDocs.values()].map((doc) => doc.component) },
    componentDocs,
  }
}
