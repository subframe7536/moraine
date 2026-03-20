import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import ts from 'typescript'
import type { Plugin } from 'vite'

// ── Types ────────────────────────────────────────────────────────────

interface ComponentIndexEntry {
  key: string
  name: string
  category: string
  description?: string
  sourcePath?: string
  polymorphic: boolean
}

interface IndexDoc {
  components: ComponentIndexEntry[]
}

interface PropDoc {
  name: string
  required: boolean
  type: string
  defaultValue?: string
  description?: string
}

interface InheritedGroupDoc {
  from: string
  props: PropDoc[]
}

interface ItemsDoc {
  props: PropDoc[]
  description?: string
}

interface ComponentDoc {
  component: ComponentIndexEntry
  slots: string[]
  props: {
    own: PropDoc[]
    inherited: InheritedGroupDoc[]
  }
  items?: ItemsDoc
}

// ── Helpers ──────────────────────────────────────────────────────────

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function categoryFromSourcePath(sourcePath: string | undefined): string {
  return sourcePath?.replace(/\\/g, '/').split('/')[1] || 'General'
}

function displayText(parts: readonly ts.SymbolDisplayPart[] | string | undefined): string {
  if (!parts) {
    return ''
  }
  if (typeof parts === 'string') {
    return parts
  }
  return ts.displayPartsToString([...parts])
}

function normalizeDefaultTag(tagText: ts.JSDocTagInfo['text']): string | undefined {
  const text = displayText(tagText).trim()
  return text ? text.replace(/^['"]|['"]$/g, '') : undefined
}

function typeIncludesUndefined(type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.Undefined) !== 0) {
    return true
  }
  if (type.isUnion()) {
    return type.types.some(typeIncludesUndefined)
  }
  return false
}

function inferModuleFromFileName(fileName: string): string {
  const normalized = fileName.replaceAll('\\', '/')
  const idx = normalized.lastIndexOf('/node_modules/')
  if (idx === -1) {
    return 'Rock UI'
  }

  const rest = normalized.slice(idx + '/node_modules/'.length)
  const parts = rest.split('/').filter(Boolean)
  const pkg =
    parts[0]?.startsWith('@') && parts[1] ? `${parts[0]}/${parts[1]}` : (parts[0] ?? 'unknown')

  if (pkg === '@kobalte/core') {
    const known = [
      'accordion',
      'button',
      'collapsible',
      'progress',
      'separator',
      'checkbox',
      'file-field',
      'number-field',
      'radio-group',
      'combobox',
      'slider',
      'switch',
      'tabs',
      'dropdown-menu',
      'dialog',
      'popover',
      'tooltip',
      'polymorphic',
    ]
    const hit = known.find((k) => parts.includes(k))
    return hit ? `${pkg}/${hit}` : pkg
  }
  return pkg
}

async function resolveSourcePath(regionPath: string | undefined): Promise<string | undefined> {
  if (!regionPath || !regionPath.startsWith('src/') || !regionPath.endsWith('.d.ts')) {
    return regionPath
  }
  const base = regionPath.slice(0, -'.d.ts'.length)
  const tsx = `${base}.tsx`
  if (existsSync(tsx)) {
    return tsx
  }

  const tsFile = `${base}.ts`
  if (existsSync(tsFile)) {
    return tsFile
  }

  return regionPath
}

function buildRegionByLine(text: string): Array<string | undefined> {
  const lines = text.split(/\r?\n/g)
  const regionByLine: Array<string | undefined> = new Array(lines.length)
  let current: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.startsWith('//#region ')) {
      current = line.slice('//#region '.length).trim()
    } else if (line.startsWith('//#endregion')) {
      current = undefined
    }
    regionByLine[i] = current
  }
  return regionByLine
}

function isJsxElementReturn(typeNode: ts.TypeNode | undefined, sourceFile: ts.SourceFile): boolean {
  if (!typeNode) {
    return false
  }
  const text = typeNode.getText(sourceFile).replaceAll(' ', '')
  return text === 'JSX.Element' || text.endsWith('.JSX.Element')
}

// ── Extraction Logic ────────────────────────────────────────────────

function extractSlotNames(node: ts.ModuleDeclaration, sourceFile: ts.SourceFile): string[] {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return []
  }

  for (const stmt of body.statements) {
    if (!ts.isTypeAliasDeclaration(stmt) || stmt.name.text !== 'Slot') {
      continue
    }

    if (ts.isUnionTypeNode(stmt.type)) {
      return stmt.type.types
        .filter((t): t is ts.LiteralTypeNode => ts.isLiteralTypeNode(t))
        .map((t) => t.literal.getText(sourceFile).replace(/^['"]|['"]$/g, ''))
    }
    if (ts.isLiteralTypeNode(stmt.type)) {
      return [stmt.type.literal.getText(sourceFile).replace(/^['"]|['"]$/g, '')]
    }
  }
  return []
}

function extractItemsDoc(
  node: ts.ModuleDeclaration,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ItemsDoc | undefined {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return undefined
  }

  for (const stmt of body.statements) {
    if (
      (!ts.isInterfaceDeclaration(stmt) && !ts.isTypeAliasDeclaration(stmt)) ||
      stmt.name.text !== 'Items'
    ) {
      continue
    }

    const itemsType = ts.isInterfaceDeclaration(stmt)
      ? checker.getTypeAtLocation(stmt)
      : checker.getTypeFromTypeNode(stmt.type)
    const symbol = checker.getSymbolAtLocation(stmt.name)
    const description = displayText(symbol?.getDocumentationComment(checker)).trim() || undefined
    const props = extractOwnPropDocsFromType(checker, sourceFile, itemsType, stmt)

    if (!description && props.length === 0) {
      return undefined
    }
    return { props, ...(description ? { description } : {}) }
  }
  return undefined
}

function createPropDoc(checker: ts.TypeChecker, propSymbol: ts.Symbol, location: ts.Node): PropDoc {
  const name = propSymbol.getName()
  const propType = checker.getTypeOfSymbolAtLocation(propSymbol, location)
  const type = checker.typeToString(propType, location, ts.TypeFormatFlags.NoTruncation)

  const optionalFlag = (propSymbol.flags & ts.SymbolFlags.Optional) !== 0
  const required = !(optionalFlag || typeIncludesUndefined(propType))

  const description = displayText(propSymbol.getDocumentationComment(checker)).trim() || undefined
  const jsDocTags = propSymbol.getJsDocTags()
  const defaultTag = jsDocTags.find((t) => t.name === 'default')
  const defaultValue = defaultTag ? normalizeDefaultTag(defaultTag.text) : undefined

  return {
    name,
    required,
    type,
    ...(description ? { description } : {}),
    ...(defaultValue ? { defaultValue } : {}),
  }
}

function extractOwnPropDocsFromType(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  sourceType: ts.Type,
  location: ts.Node,
): PropDoc[] {
  return checker
    .getPropertiesOfType(sourceType)
    .filter((symbol) => {
      const decl = symbol.declarations?.[0]
      return (
        decl?.getSourceFile().fileName === sourceFile.fileName &&
        (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl))
      )
    })
    .map((symbol) => createPropDoc(checker, symbol, location))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function groupProperties(
  propsType: ts.Type,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  location: ts.Node,
): { own: PropDoc[]; inherited: InheritedGroupDoc[] } {
  const ownProps: PropDoc[] = []
  const inheritedGroups = new Map<string, PropDoc[]>()

  for (const propSymbol of checker.getPropertiesOfType(propsType)) {
    const doc = createPropDoc(checker, propSymbol, location)
    const decl = propSymbol.declarations?.[0]
    const isOwn = decl?.getSourceFile().fileName === sourceFile.fileName

    if (isOwn) {
      ownProps.push(doc)
    } else {
      const from = decl ? inferModuleFromFileName(decl.getSourceFile().fileName) : 'External'
      const list = inheritedGroups.get(from) ?? []
      list.push(doc)
      inheritedGroups.set(from, list)
    }
  }

  ownProps.sort((a, b) => a.name.localeCompare(b.name))
  const inherited: InheritedGroupDoc[] = [...inheritedGroups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([from, props]) => ({
      from,
      props: props.sort((a, b) => a.name.localeCompare(b.name)),
    }))

  return { own: ownProps, inherited }
}

// ── Core Generation ──────────────────────────────────────────────────

interface GenerationResult {
  indexDoc: IndexDoc
  componentDocs: Map<string, ComponentDoc>
}

interface ComponentMetadata {
  slots: Map<string, string[]>
  items: Map<string, ItemsDoc>
}

function collectNamespaceMetadata(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ComponentMetadata {
  const slots = new Map<string, string[]>()
  const items = new Map<string, ItemsDoc>()

  const visit = (node: ts.Node) => {
    if (ts.isModuleDeclaration(node) && node.name.text.endsWith('T')) {
      const componentName = node.name.text.slice(0, -1)

      const slotNames = extractSlotNames(node, sourceFile)
      if (slotNames.length > 0) {
        slots.set(componentName, slotNames)
      }

      const itemsDoc = extractItemsDoc(node, sourceFile, checker)
      if (itemsDoc) {
        items.set(componentName, itemsDoc)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return { slots, items }
}

async function processComponentNode(
  node: ts.FunctionDeclaration,
  context: {
    checker: ts.TypeChecker
    sourceFile: ts.SourceFile
    regionByLine: Array<string | undefined>
    metadata: ComponentMetadata
  },
): Promise<{ key: string; doc: ComponentDoc } | null> {
  const { checker, sourceFile, regionByLine, metadata } = context

  // Guard clauses
  if (!node.name || node.parameters.length === 0) {
    return null
  }
  if (!isJsxElementReturn(node.type, sourceFile)) {
    return null
  }

  const param = node.parameters[0]
  if (!param.type) {
    return null
  }

  // Basic Info
  const componentName = node.name.text
  const componentKey = toKebabCase(componentName)
  const fnSymbol = checker.getSymbolAtLocation(node.name)
  const description = displayText(fnSymbol?.getDocumentationComment(checker)).trim() || undefined

  // Source Path
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line
  const regionPath = regionByLine[line]
  const sourcePath = await resolveSourcePath(regionPath)

  // Props
  const propsType = checker.getTypeFromTypeNode(param.type)
  const hasAsProp = Boolean(propsType.getProperty('as'))
  const props = groupProperties(propsType, checker, sourceFile, param.name)

  // Finalize Entry
  const category = categoryFromSourcePath(sourcePath)
  const entry: ComponentIndexEntry = {
    key: componentKey,
    name: componentName,
    category,
    polymorphic: hasAsProp,
    ...(description && { description }),
    ...(sourcePath && { sourcePath }),
  }

  const doc: ComponentDoc = {
    component: entry,
    slots: metadata.slots.get(componentName) ?? [],
    props,
    ...(metadata.items.get(componentName) && { items: metadata.items.get(componentName) }),
  }

  return { key: componentKey, doc }
}

async function generateApiDoc(projectRoot: string): Promise<GenerationResult | null> {
  const dtsPath = path.join(projectRoot, 'dist', 'index.d.mts')

  if (!existsSync(dtsPath)) {
    console.warn(`[api-doc] ${dtsPath} not found, skipping generation`)
    return null
  }

  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    noEmit: true,
    types: [],
  }

  const host = ts.createCompilerHost(options, true)
  const program = ts.createProgram([dtsPath], options, host)
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(dtsPath)

  if (!sourceFile) {
    console.warn(`[api-doc] Failed to parse dist/index.d.mts`)
    return null
  }

  const regionByLine = buildRegionByLine(sourceFile.getFullText())
  const metadata = collectNamespaceMetadata(sourceFile, checker)
  const context = { checker, sourceFile, regionByLine, metadata }

  const componentPromises: Promise<{ key: string; doc: ComponentDoc }[]>[] = []

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node)) {
      const task = processComponentNode(node, context).then((result) => (result ? [result] : []))
      componentPromises.push(task)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  const resolvedComponents = (await Promise.all(componentPromises)).flat()

  // De-dupe by key
  const componentDocs = new Map<string, ComponentDoc>()
  for (const { key, doc } of resolvedComponents) {
    componentDocs.set(key, doc)
  }

  const indexDoc: IndexDoc = {
    components: [...componentDocs.values()].map((doc) => doc.component),
  }

  return { indexDoc, componentDocs }
}

async function writeJsonFiles(outDir: string, result: GenerationResult): Promise<void> {
  const componentsDir = path.join(outDir, 'components')

  mkdirSync(outDir, { recursive: true })
  rmSync(componentsDir, { recursive: true, force: true })
  mkdirSync(componentsDir, { recursive: true })

  await writeFile(path.join(outDir, 'index.json'), JSON.stringify(result.indexDoc), 'utf8')

  const writes: Promise<void>[] = []
  for (const [key, doc] of result.componentDocs) {
    writes.push(writeFile(path.join(componentsDir, `${key}.json`), JSON.stringify(doc), 'utf8'))
  }
  await Promise.all(writes)

  console.log(`[api-doc] Generated ${result.componentDocs.size} component api docs to ${outDir}`)
}

// ── Vite Plugin ──────────────────────────────────────────────────────

const VIRTUAL_INDEX = 'virtual:api-doc'
const RESOLVED_VIRTUAL_INDEX = `\0${VIRTUAL_INDEX}`

export function componentApiPlugin(): Plugin {
  let projectRoot: string

  return {
    name: 'rock-ui-api-doc',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = path.resolve(config.root, '..')
    },

    async buildStart() {
      const result = await generateApiDoc(projectRoot)
      if (result) {
        await writeJsonFiles(path.join(projectRoot, 'docs/api-doc'), result)
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_INDEX) {
        return RESOLVED_VIRTUAL_INDEX
      }
    },

    async load(id) {
      if (id === RESOLVED_VIRTUAL_INDEX) {
        const jsonPath = path.join(projectRoot, 'docs/api-doc/index.json')
        try {
          const content = readFileSync(jsonPath, 'utf8')
          const data = JSON.parse(content)
          return `export default ${JSON.stringify(data)}`
        } catch {
          console.warn('[api-doc] index.json not found, serving empty data')
          return 'export default { components: [] }'
        }
      }
    },
  }
}

// Re-export for use by demo-source plugin
export { generateApiDoc, writeJsonFiles }
export type { ComponentDoc, IndexDoc, ComponentIndexEntry, PropDoc, InheritedGroupDoc, ItemsDoc }
