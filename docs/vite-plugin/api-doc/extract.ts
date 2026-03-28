import { existsSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

import { toKebabCase } from '../core/strings'

import type {
  ComponentDoc,
  ComponentIndexEntry,
  GenerationResult,
  InheritedGroupDoc,
  ItemsDoc,
  PropDoc,
} from './types'

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

const TYPE_FORMAT_FLAGS =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

function inferModuleFromFileName(fileName: string): string {
  const normalized = fileName.replaceAll('\\', '/')
  const idx = normalized.lastIndexOf('/node_modules/')
  if (idx === -1) {
    return 'Moraine'
  }

  const rest = normalized.slice(idx + '/node_modules/'.length)
  const parts = rest.split('/').filter(Boolean)
  const pkg =
    parts[0]?.startsWith('@') && parts[1] ? `${parts[0]}/${parts[1]}` : (parts[0] ?? 'unknown')

  if (pkg === '@kobalte/core') {
    const known = [
      'accordion',
      'button',
      'checkbox',
      'collapsible',
      'combobox',
      'dialog',
      'dropdown-menu',
      'file-field',
      'number-field',
      'popover',
      'polymorphic',
      'progress',
      'radio-group',
      'separator',
      'slider',
      'switch',
      'tabs',
      'tooltip',
    ]
    const hit = known.find((item) => parts.includes(item))
    return hit ? `${pkg}/${hit}` : pkg
  }

  return pkg
}

function resolveSourcePath(regionPath: string | undefined): string | undefined {
  if (!regionPath || !regionPath.startsWith('src/') || !regionPath.endsWith('.d.ts')) {
    return regionPath
  }

  const base = regionPath.slice(0, -'.d.ts'.length)
  const tsxPath = `${base}.tsx`
  if (existsSync(tsxPath)) {
    return tsxPath
  }

  const tsPath = `${base}.ts`
  if (existsSync(tsPath)) {
    return tsPath
  }

  return regionPath
}

function buildRegionByLine(text: string): Array<string | undefined> {
  const lines = text.split(/\r?\n/g)
  const regions: Array<string | undefined> = new Array(lines.length)
  let current: string | undefined

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (line.startsWith('//#region ')) {
      current = line.slice('//#region '.length).trim()
    } else if (line.startsWith('//#endregion')) {
      current = undefined
    }
    regions[index] = current
  }

  return regions
}

function isJsxElementReturn(typeNode: ts.TypeNode | undefined, sourceFile: ts.SourceFile): boolean {
  if (!typeNode) {
    return false
  }

  const text = typeNode.getText(sourceFile).replaceAll(' ', '')
  return text === 'JSX.Element' || text.endsWith('.JSX.Element')
}

function extractSlotNames(node: ts.ModuleDeclaration, sourceFile: ts.SourceFile): string[] {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return []
  }

  for (const statement of body.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== 'Slot') {
      continue
    }

    if (ts.isUnionTypeNode(statement.type)) {
      return statement.type.types
        .filter((typeNode): typeNode is ts.LiteralTypeNode => ts.isLiteralTypeNode(typeNode))
        .map((typeNode) => typeNode.literal.getText(sourceFile).replace(/^['"]|['"]$/g, ''))
    }

    if (ts.isLiteralTypeNode(statement.type)) {
      return [statement.type.literal.getText(sourceFile).replace(/^['"]|['"]$/g, '')]
    }
  }

  return []
}

function extractItemsAliasPropDocs(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeNode,
  visited = new Set<string>(),
): PropDoc[] {
  const visitKey = `${typeNode.pos}:${typeNode.end}:${typeNode.kind}`
  if (visited.has(visitKey)) {
    return []
  }
  visited.add(visitKey)

  if (
    ts.isTypeReferenceNode(typeNode) &&
    typeNode.typeArguments &&
    typeNode.typeArguments.length > 0
  ) {
    const props = extractItemsAliasPropDocs(checker, sourceFile, typeNode.typeArguments[0], visited)
    if (props.length > 0) {
      return props
    }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    const props = extractItemsAliasPropDocs(checker, sourceFile, typeNode.elementType, visited)
    if (props.length > 0) {
      return props
    }
  }

  if (ts.isUnionTypeNode(typeNode)) {
    for (const unionTypeNode of typeNode.types) {
      const props = extractItemsAliasPropDocs(checker, sourceFile, unionTypeNode, visited)
      if (props.length > 0) {
        return props
      }
    }
  }

  const resolvedType = checker.getTypeFromTypeNode(typeNode)
  return extractOwnPropDocsFromType(checker, sourceFile, resolvedType, typeNode)
}

function createPropDoc(checker: ts.TypeChecker, propSymbol: ts.Symbol, location: ts.Node): PropDoc {
  const propType = checker.getTypeOfSymbolAtLocation(propSymbol, location)
  const optionalFlag = (propSymbol.flags & ts.SymbolFlags.Optional) !== 0
  const required = !(optionalFlag || typeIncludesUndefined(propType))
  const description = displayText(propSymbol.getDocumentationComment(checker)).trim() || undefined
  const defaultTag = propSymbol.getJsDocTags().find((tag) => tag.name === 'default')

  return {
    name: propSymbol.getName(),
    required,
    type: checker.typeToString(propType, location, TYPE_FORMAT_FLAGS),
    ...(description ? { description } : {}),
    ...(defaultTag ? { defaultValue: normalizeDefaultTag(defaultTag.text) } : {}),
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
      const declaration = symbol.declarations?.[0]
      return (
        declaration?.getSourceFile().fileName === sourceFile.fileName &&
        (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration))
      )
    })
    .map((symbol) => createPropDoc(checker, symbol, location))
    .sort((left, right) => left.name.localeCompare(right.name))
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

  for (const statement of body.statements) {
    if (
      (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) ||
      statement.name.text !== 'Items'
    ) {
      continue
    }

    const itemsType = ts.isInterfaceDeclaration(statement)
      ? checker.getTypeAtLocation(statement)
      : checker.getTypeFromTypeNode(statement.type)
    const symbol = checker.getSymbolAtLocation(statement.name)
    const description = displayText(symbol?.getDocumentationComment(checker)).trim() || undefined
    const props = ts.isInterfaceDeclaration(statement)
      ? extractOwnPropDocsFromType(checker, sourceFile, itemsType, statement)
      : extractItemsAliasPropDocs(checker, sourceFile, statement.type)

    if (!description && props.length === 0) {
      return undefined
    }

    return { props, ...(description ? { description } : {}) }
  }

  return undefined
}

function groupProperties(
  propsType: ts.Type,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  location: ts.Node,
): { own: PropDoc[]; inherited: InheritedGroupDoc[] } {
  const own: PropDoc[] = []
  const inheritedGroups = new Map<string, PropDoc[]>()

  for (const propSymbol of checker.getPropertiesOfType(propsType)) {
    const doc = createPropDoc(checker, propSymbol, location)
    const declaration = propSymbol.declarations?.[0]
    const isOwn = declaration?.getSourceFile().fileName === sourceFile.fileName

    if (isOwn) {
      own.push(doc)
      continue
    }

    const from = declaration
      ? inferModuleFromFileName(declaration.getSourceFile().fileName)
      : 'External'
    const list = inheritedGroups.get(from) ?? []
    list.push(doc)
    inheritedGroups.set(from, list)
  }

  own.sort((left, right) => left.name.localeCompare(right.name))

  const inherited = [...inheritedGroups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([from, props]) => ({
      from,
      props: props.sort((left, right) => left.name.localeCompare(right.name)),
    }))

  return { own, inherited }
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

function processComponentNode(
  node: ts.FunctionDeclaration,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  regionByLine: Array<string | undefined>,
  metadata: ComponentMetadata,
): { key: string; doc: ComponentDoc } | null {
  if (!node.name || node.parameters.length === 0 || !isJsxElementReturn(node.type, sourceFile)) {
    return null
  }

  const propsParam = node.parameters[0]
  if (!propsParam.type) {
    return null
  }

  const componentName = node.name.text
  const componentKey = toKebabCase(componentName)
  const functionSymbol = checker.getSymbolAtLocation(node.name)
  const description =
    displayText(functionSymbol?.getDocumentationComment(checker)).trim() || undefined
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line
  const sourcePath = resolveSourcePath(regionByLine[line])
  const propsType = checker.getTypeFromTypeNode(propsParam.type)

  const component: ComponentIndexEntry = {
    key: componentKey,
    name: componentName,
    category: categoryFromSourcePath(sourcePath),
    polymorphic: Boolean(propsType.getProperty('as')),
    ...(description ? { description } : {}),
    ...(sourcePath ? { sourcePath } : {}),
  }

  const doc: ComponentDoc = {
    component,
    slots: metadata.slots.get(componentName) ?? [],
    props: groupProperties(propsType, checker, sourceFile, propsParam.name),
    ...(metadata.items.get(componentName) ? { items: metadata.items.get(componentName) } : {}),
  }

  return { key: componentKey, doc }
}

export function generateApiDoc(projectRoot: string): GenerationResult | null {
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
    console.warn('[api-doc] Failed to parse dist/index.d.mts')
    return null
  }

  const regionByLine = buildRegionByLine(sourceFile.getFullText())
  const metadata = collectNamespaceMetadata(sourceFile, checker)
  const componentDocs = new Map<string, ComponentDoc>()

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node)) {
      const component = processComponentNode(node, checker, sourceFile, regionByLine, metadata)
      if (component) {
        componentDocs.set(component.key, component.doc)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    indexDoc: {
      components: [...componentDocs.values()].map((doc) => doc.component),
    },
    componentDocs,
  }
}
