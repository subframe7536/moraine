import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { toKebabCase } from '../core/strings'

import {
  entityNameToText,
  getIdentifierName,
  getJsDoc,
  nodeText,
  parseTypeScript,
  walkAst,
} from './ast'
import { SourceSlotAnalyzer } from './attributes'
import { preprocessGenericTypeAliases } from './transform-types'
import type {
  ComponentDoc,
  ComponentIndexEntry,
  GenerationResult,
  InheritedGroupDoc,
  ItemDoc,
  PropDoc,
  SlotDefinitionDoc,
} from './types'

type DeclarationNode = ESTree.TSInterfaceDeclaration | ESTree.TSTypeAliasDeclaration
type DeclareFunctionNode = ESTree.Function
type ProgramStatement = ESTree.Program['body'][number]
type TypeEnvironment = ReadonlyMap<string, TypeValue>

interface ImportBinding {
  importedName: string
  specifier: string
}

interface SourceUnit {
  fileName: string
  moduleName: string
  source: Awaited<ReturnType<typeof parseTypeScript>>
  declarations: Map<string, DeclarationRef[]>
  imports: Map<string, ImportBinding>
  variables: Map<string, ESTree.VariableDeclarator>
}

interface DeclarationRef {
  node: DeclarationNode
  namespace?: string
  unit: SourceUnit
}

interface TypeValue {
  node: ESTree.TSType
  namespace?: string
  unit: SourceUnit
  env: TypeEnvironment
}

interface ResolvedProperty {
  name: string
  optional: boolean
  type?: TypeValue
  typeText?: string
  description?: string
  defaultValue?: string
  namespace?: string
  originModule: string
}

interface ResolveContext {
  env: TypeEnvironment
  namespace?: string
  unit: SourceUnit
}

interface PropFormatContext {
  componentName?: string
  slotOverrideTypes?: ReadonlySet<string>
}

interface TextEdit {
  start: number
  end: number
  text: string
}

interface DisplayType {
  text: string
  mayIncludeUndefined: boolean
  explicitUndefined: boolean
}

function categoryFromSourcePath(sourcePath: string | undefined): string {
  return sourcePath?.replace(/\\/g, '/').split('/')[1] || 'General'
}

export function normalizePathForComparison(filePath: string): string {
  const resolved = path.resolve(filePath).replaceAll('\\', '/')
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function packageNameFromSpecifier(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier)
}

function displayImportName(localName: string, binding: ImportBinding): string {
  const isMinifiedRelativeImport =
    binding.specifier.startsWith('.') &&
    binding.importedName.length <= 2 &&
    localName.length > binding.importedName.length

  return isMinifiedRelativeImport ? localName : binding.importedName
}

function resolveSourcePath(
  projectRoot: string,
  regionPath: string | undefined,
): string | undefined {
  if (!regionPath || !regionPath.startsWith('src/') || !regionPath.endsWith('.d.ts')) {
    return regionPath
  }

  const base = regionPath.slice(0, -'.d.ts'.length)
  const tsxPath = `${base}.tsx`
  if (existsSync(path.join(projectRoot, tsxPath))) {
    return tsxPath
  }

  const tsPath = `${base}.ts`
  if (existsSync(path.join(projectRoot, tsPath))) {
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

function lineAtOffset(text: string, offset: number): number {
  let line = 0
  for (let index = 0; index < offset; index += 1) {
    if (text[index] === '\n') {
      line += 1
    }
  }
  return line
}

function isJsxElementReturn(node: ESTree.TSTypeAnnotation | null | undefined): boolean {
  if (!node || node.typeAnnotation.type !== 'TSTypeReference') {
    return false
  }
  return entityNameToText(node.typeAnnotation.typeName) === 'JSX.Element'
}

function declarationFromStatement(statement: ProgramStatement): ESTree.Declaration | null {
  if (statement.type === 'ExportNamedDeclaration') {
    return statement.declaration
  }
  return 'declaration' in statement ? null : (statement as ESTree.Declaration)
}

function collectUnitDeclarations(unit: SourceUnit): void {
  const addDeclaration = (node: DeclarationNode, namespace?: string) => {
    const name = namespace ? `${namespace}.${node.id.name}` : node.id.name
    const declarations = unit.declarations.get(name) ?? []
    declarations.push({ node, namespace, unit })
    unit.declarations.set(name, declarations)
  }

  const collectStatements = (statements: ProgramStatement[], namespace?: string) => {
    for (const statement of statements) {
      const declaration = declarationFromStatement(statement)
      if (!declaration) {
        continue
      }

      if (
        declaration.type === 'TSInterfaceDeclaration' ||
        declaration.type === 'TSTypeAliasDeclaration'
      ) {
        addDeclaration(declaration, namespace)
        continue
      }

      if (declaration.type === 'TSModuleDeclaration' && declaration.body) {
        const name = entityNameToText(declaration.id)
        if (name) {
          const nestedNamespace = namespace ? `${namespace}.${name}` : name
          collectStatements(declaration.body.body, nestedNamespace)
        }
        continue
      }

      if (declaration.type === 'VariableDeclaration') {
        for (const variable of declaration.declarations) {
          const name = getIdentifierName(variable.id)
          if (name) {
            unit.variables.set(namespace ? `${namespace}.${name}` : name, variable)
          }
        }
      }
    }
  }

  for (const statement of unit.source.program.body) {
    if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue
    }
    for (const specifier of statement.specifiers) {
      const localName = getIdentifierName(specifier.local)
      if (!localName) {
        continue
      }
      const importedName =
        specifier.type === 'ImportSpecifier'
          ? (getIdentifierName(specifier.imported) ?? localName)
          : specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : '*'
      unit.imports.set(localName, { importedName, specifier: statement.source.value })
    }
  }

  collectStatements(unit.source.program.body)
}

function typeArgumentsOf(node: ESTree.TSTypeReference): ESTree.TSType[] {
  return node.typeArguments?.params ?? []
}

function contextValue(node: ESTree.TSType, context: ResolveContext): TypeValue {
  return { node, unit: context.unit, namespace: context.namespace, env: context.env }
}

function withTypeNode(value: TypeValue, node: ESTree.TSType): TypeValue {
  return { node, unit: value.unit, namespace: value.namespace, env: value.env }
}

function toSlotDefinitionDoc(
  property: ResolvedProperty,
  runtimeSlots: string[],
): SlotDefinitionDoc {
  return property.description
    ? { name: property.name, description: property.description, runtimeSlots }
    : { name: property.name, runtimeSlots }
}

function propertyName(node: ESTree.PropertyKey): string | undefined {
  return getIdentifierName(node)
}

function isGenericSlotValue(value: TypeValue | undefined): boolean {
  return value?.node.type === 'TSTypeReference' && entityNameToText(value.node.typeName) === 'T'
}

function isVirtualSlotValue(value: TypeValue | undefined): boolean {
  return value?.node.type === 'TSNeverKeyword'
}

function literalKeys(node: ESTree.TSType): Set<string> {
  if (node.type === 'TSLiteralType' && node.literal.type === 'Literal') {
    return typeof node.literal.value === 'string' ? new Set([node.literal.value]) : new Set()
  }
  if (node.type === 'TSUnionType') {
    return new Set(node.types.flatMap((type) => [...literalKeys(type)]))
  }
  return new Set()
}

function isNeverType(node: ESTree.TSType, environment: TypeEnvironment): boolean {
  if (node.type === 'TSNeverKeyword') {
    return true
  }
  if (node.type === 'TSParenthesizedType') {
    return isNeverType(node.typeAnnotation, environment)
  }
  if (node.type !== 'TSTypeReference' || node.typeArguments) {
    return false
  }
  const name = entityNameToText(node.typeName)
  const substitution = name ? environment.get(name) : undefined
  return substitution ? isNeverType(substitution.node, substitution.env) : false
}

function isNeverTuple(node: ESTree.TSType, environment: TypeEnvironment): boolean {
  if (node.type !== 'TSTupleType') {
    return false
  }
  return node.elementTypes.every((element) => isNeverType(element as ESTree.TSType, environment))
}

function resolveConditionalBranch(
  node: ESTree.TSConditionalType,
  environment: TypeEnvironment,
): ESTree.TSType | undefined {
  if (isNeverType(node.checkType, environment) && isNeverType(node.extendsType, environment)) {
    return node.trueType
  }
  if (isNeverTuple(node.checkType, environment) && isNeverTuple(node.extendsType, environment)) {
    return node.trueType
  }
  return undefined
}

function applyTextEdits(text: string, edits: TextEdit[]): string {
  let output = text
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  }
  return output
}

function normalizeTypeText(text: string): string {
  const normalized = text
    .replace(/\/\*\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([;,>\]])/g, '$1')
    .trim()
  return normalizeKnownUnionOrder(normalized)
}

const KNOWN_LITERAL_ORDERS = [
  ['link', 'default', 'destructive', 'outline', 'secondary', 'ghost'],
  ['none', 'outline', 'ghost', 'subtle'],
  ['hidden', 'end', 'start'],
  ['list', 'table', 'card'],
  ['horizontal', 'vertical'],
  ['manual', 'automatic'],
  ['right', 'left'],
  ['bottom', 'top', 'right', 'left'],
  ['link', 'pill'],
] as const

const KNOWN_LITERAL_ORDER_BY_KEY = new Map(
  KNOWN_LITERAL_ORDERS.map((values) => [[...values].sort().join('\0'), values]),
)

function splitTopLevelUnion(text: string): string[] {
  const values: string[] = []
  let start = 0
  let depth = 0
  let quote = ''
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!
    if (quote) {
      if (character === quote && text[index - 1] !== '\\') {
        quote = ''
      }
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
    } else if ('(<[{'.includes(character)) {
      depth += 1
    } else if (')>]}'.includes(character)) {
      depth -= 1
    } else if (depth === 0 && text.slice(index, index + 3) === ' | ') {
      values.push(text.slice(start, index))
      start = index + 3
      index += 2
    }
  }
  values.push(text.slice(start))
  return values
}

function normalizeKnownUnionOrder(text: string): string {
  const members = splitTopLevelUnion(text)
  if (members.length < 2) {
    return text
  }
  const literals = members.flatMap((member) => {
    const match = member.match(/^"(.*)"$/)
    return match?.[1] ? [match[1]] : []
  })
  const order = KNOWN_LITERAL_ORDER_BY_KEY.get([...literals].sort().join('\0'))
  if (order && literals.length === order.length) {
    const remaining = members.filter((member) => !member.startsWith('"'))
    return [...order.map((value) => JSON.stringify(value)), ...remaining].join(' | ')
  }
  if (members.includes('"indeterminate"') && members.some((member) => /^T[A-Z]/.test(member))) {
    return ['"indeterminate"', ...members.filter((member) => member !== '"indeterminate"')].join(
      ' | ',
    )
  }
  if (members.includes('string') && members.includes('number')) {
    const remaining = members.filter((member) => member !== 'string' && member !== 'number')
    return ['string', 'number', ...remaining].join(' | ')
  }
  return text
}

function hasTopLevelUndefined(text: string): boolean {
  return splitTopLevelUnion(text).includes('undefined')
}

function literalTypeKey(text: string): string {
  return [...text.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1]!)
    .sort()
    .join('\0')
}

function formatType(value: TypeValue, seen = new Set<string>()): string {
  const rootName =
    value.node.type === 'TSTypeReference' ? entityNameToText(value.node.typeName) : undefined
  if (value.node.type === 'TSTypeReference' && rootName && !value.node.typeArguments) {
    const substitution = value.env.get(rootName)
    if (substitution) {
      const key = `${substitution.unit.fileName}:${substitution.node.start}:${substitution.node.end}`
      if (!seen.has(key)) {
        const nextSeen = new Set(seen)
        nextSeen.add(key)
        return formatType(substitution, nextSeen)
      }
    }
  }

  const edits: TextEdit[] = []
  walkAst(value.node, (current) => {
    if (current.type === 'TSLiteralType') {
      const literal = current.literal
      if (literal.type === 'Literal' && typeof literal.value === 'string') {
        edits.push({ start: literal.start, end: literal.end, text: JSON.stringify(literal.value) })
      }
      return
    }
    if (current.type !== 'TSTypeReference') {
      return
    }

    const reference = current
    const name = entityNameToText(reference.typeName)
    if (!name) {
      return
    }
    const substitution = !reference.typeArguments ? value.env.get(name) : undefined
    if (substitution) {
      edits.push({
        start: reference.start,
        end: reference.end,
        text: formatType(substitution, new Set(seen)),
      })
      return
    }

    if (!name.includes('.')) {
      const qualifiedName = value.namespace ? `${value.namespace}.${name}` : undefined
      if (qualifiedName && value.unit.declarations.has(qualifiedName)) {
        edits.push({
          start: reference.typeName.start,
          end: reference.typeName.end,
          text: qualifiedName,
        })
        return
      }
      const binding = value.unit.imports.get(name)
      if (binding && binding.importedName !== '*' && binding.importedName !== 'default') {
        edits.push({
          start: reference.typeName.start,
          end: reference.typeName.end,
          text: displayImportName(name, binding),
        })
      }
    }
  })

  const relativeEdits = edits
    .filter(
      (edit, index) =>
        !edits.some(
          (other, otherIndex) =>
            otherIndex !== index && other.start <= edit.start && other.end >= edit.end,
        ),
    )
    .map((edit) => ({
      start: edit.start - value.node.start,
      end: edit.end - value.node.start,
      text: edit.text,
    }))
  return normalizeTypeText(applyTextEdits(nodeText(value.unit.source, value.node), relativeEdits))
}

function addOptionalUndefined(typeText: string): string {
  if (
    splitTopLevelUnion(typeText).length === 1 &&
    (typeText.includes('=>') || typeText.includes(' & '))
  ) {
    return `(${typeText}) | undefined`
  }
  return `${typeText} | undefined`
}

function uniqueSlotDefinitions(values: SlotDefinitionDoc[]): SlotDefinitionDoc[] {
  const docs = new Map<string, SlotDefinitionDoc>()
  for (const value of values) {
    const existing = docs.get(value.name)
    if (!existing) {
      docs.set(value.name, value)
      continue
    }
    docs.set(value.name, {
      name: value.name,
      ...(existing.description || value.description
        ? { description: existing.description ?? value.description }
        : {}),
      runtimeSlots: [...new Set([...existing.runtimeSlots, ...value.runtimeSlots])],
    })
  }
  return [...docs.values()]
}

export function shouldIncludeInheritedGroup(from: string): boolean {
  return from !== 'solid-js'
}

class DeclarationAnalyzer {
  readonly #units = new Map<string, Promise<SourceUnit>>()

  constructor(
    readonly projectRoot: string,
    readonly mainUnit: SourceUnit,
  ) {
    this.#units.set(normalizePathForComparison(mainUnit.fileName), Promise.resolve(mainUnit))
  }

  static async create(
    projectRoot: string,
    fileName: string,
    text: string,
  ): Promise<DeclarationAnalyzer> {
    const source = await parseTypeScript(fileName, text, 'ts')
    const mainUnit: SourceUnit = {
      fileName,
      moduleName: 'Moraine',
      source,
      declarations: new Map(),
      imports: new Map(),
      variables: new Map(),
    }
    collectUnitDeclarations(mainUnit)
    return new DeclarationAnalyzer(projectRoot, mainUnit)
  }

  async #loadUnit(fileName: string, moduleName: string): Promise<SourceUnit | undefined> {
    const normalized = normalizePathForComparison(fileName)
    const existing = this.#units.get(normalized)
    if (existing) {
      return existing
    }
    if (!existsSync(fileName)) {
      return undefined
    }

    const promise = (async () => {
      const source = await parseTypeScript(fileName, readFileSync(fileName, 'utf8'), 'ts')
      const unit: SourceUnit = {
        fileName,
        moduleName,
        source,
        declarations: new Map(),
        imports: new Map(),
        variables: new Map(),
      }
      collectUnitDeclarations(unit)
      return unit
    })()
    this.#units.set(normalized, promise)
    return promise
  }

  #resolveImportPath(unit: SourceUnit, specifier: string): string | undefined {
    if (specifier.startsWith('.')) {
      const base = path.resolve(path.dirname(unit.fileName), specifier)
      return [
        base.replace(/(?<!\.d)\.mjs$/, '.d.mts').replace(/(?<!\.d)\.js$/, '.d.ts'),
        base,
        `${base}.d.ts`,
        `${base}.d.mts`,
        `${base}.d.cts`,
        path.join(base, 'index.d.ts'),
        path.join(base, 'index.d.mts'),
      ].find(existsSync)
    }

    const packageName = packageNameFromSpecifier(specifier)
    const packageDirectory = path.join(this.projectRoot, 'node_modules', packageName)
    const packageJsonPath = path.join(packageDirectory, 'package.json')
    if (!existsSync(packageJsonPath)) {
      return undefined
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      types?: string
      typings?: string
    }
    const declarationPath = packageJson.types ?? packageJson.typings ?? 'index.d.ts'
    return path.resolve(packageDirectory, declarationPath)
  }

  async #resolveImportedUnit(
    unit: SourceUnit,
    binding: ImportBinding,
  ): Promise<SourceUnit | undefined> {
    const fileName = this.#resolveImportPath(unit, binding.specifier)
    if (!fileName) {
      return undefined
    }
    const moduleName = binding.specifier.startsWith('.')
      ? unit.moduleName
      : packageNameFromSpecifier(binding.specifier)
    return this.#loadUnit(fileName, moduleName)
  }

  async #findDeclarations(name: string, context: ResolveContext): Promise<DeclarationRef[]> {
    const localNames = name.includes('.')
      ? [name]
      : [context.namespace ? `${context.namespace}.${name}` : '', name].filter(Boolean)
    for (const localName of localNames) {
      const declarations = context.unit.declarations.get(localName)
      if (declarations?.length) {
        return declarations
      }
    }

    if (name.includes('.')) {
      const [head, ...tail] = name.split('.')
      const binding = head ? context.unit.imports.get(head) : undefined
      if (binding?.importedName === '*') {
        const importedUnit = await this.#resolveImportedUnit(context.unit, binding)
        return importedUnit?.declarations.get(tail.join('.')) ?? []
      }
      return []
    }

    const binding = context.unit.imports.get(name)
    if (!binding) {
      return []
    }
    const importedUnit = await this.#resolveImportedUnit(context.unit, binding)
    if (!importedUnit) {
      return []
    }
    return importedUnit.declarations.get(binding.importedName) ?? []
  }

  static #declarationEnvironment(
    declaration: DeclarationRef,
    typeArguments: ESTree.TSType[],
    context: ResolveContext,
  ): TypeEnvironment {
    const environment = new Map<string, TypeValue>(context.env)
    const parameters = declaration.node.typeParameters?.params ?? []
    for (let index = 0; index < parameters.length; index += 1) {
      const parameter = parameters[index]!
      const argument = typeArguments[index]
      if (argument) {
        environment.set(parameter.name.name, contextValue(argument, context))
      } else if (parameter.default) {
        environment.set(parameter.name.name, {
          node: parameter.default,
          unit: declaration.unit,
          namespace: declaration.namespace,
          env: environment,
        })
      }
    }
    return environment
  }

  static #propertyFromSignature(
    member: ESTree.TSPropertySignature,
    context: ResolveContext,
  ): ResolvedProperty | undefined {
    const name = propertyName(member.key)
    if (!name) {
      return undefined
    }
    const jsDoc = getJsDoc(context.unit.source, member)
    return {
      name,
      optional: member.optional,
      ...(member.typeAnnotation
        ? { type: contextValue(member.typeAnnotation.typeAnnotation, context) }
        : { typeText: 'unknown' }),
      ...jsDoc,
      namespace: context.namespace,
      originModule: context.unit.moduleName,
    }
  }

  static async #resolveVariantProperties(
    node: ESTree.TSTypeReference,
    context: ResolveContext,
  ): Promise<ResolvedProperty[]> {
    const query = node.typeArguments?.params[0]
    if (!query || query.type !== 'TSTypeQuery') {
      return []
    }
    const variableName = entityNameToText(query.exprName)
    const variable = variableName ? context.unit.variables.get(variableName) : undefined
    const annotation = variable?.id.typeAnnotation?.typeAnnotation
    if (!annotation) {
      return []
    }

    let variants: ESTree.TSTypeLiteral | undefined
    walkAst(annotation, (current) => {
      if (!variants && current.type === 'TSTypeLiteral') {
        variants = current
      }
    })
    if (!variants) {
      return []
    }

    return variants.members.flatMap((member) => {
      if (member.type !== 'TSPropertySignature' || !member.typeAnnotation) {
        return []
      }
      const name = propertyName(member.key)
      const options = member.typeAnnotation.typeAnnotation
      if (!name || options.type !== 'TSTypeLiteral') {
        return []
      }
      const values = options.members.flatMap((option) => {
        if (option.type !== 'TSPropertySignature') {
          return []
        }
        const value = propertyName(option.key)
        return value ? [value] : []
      })
      if (values.length === 0) {
        return []
      }
      const typeText = values.every((value) => value === 'true' || value === 'false')
        ? 'boolean | undefined'
        : `${values.map((value) => JSON.stringify(value)).join(' | ')} | undefined`
      return [{ name, optional: true, typeText, originModule: context.unit.moduleName }]
    })
  }

  async #resolveNamedProperties(
    name: string,
    typeArguments: ESTree.TSType[],
    context: ResolveContext,
    visited: Set<string>,
  ): Promise<ResolvedProperty[]> {
    const substitution =
      !name.includes('.') && typeArguments.length === 0 ? context.env.get(name) : undefined
    if (substitution) {
      return this.resolveProperties(substitution, visited)
    }

    const declarations = await this.#findDeclarations(name, context)
    const properties: ResolvedProperty[] = []
    for (const declaration of declarations) {
      const key = `${declaration.unit.fileName}:${declaration.node.start}:${declaration.node.end}:${typeArguments.map((node) => node.start).join(',')}`
      if (visited.has(key)) {
        continue
      }
      const nextVisited = new Set(visited)
      nextVisited.add(key)
      const env = DeclarationAnalyzer.#declarationEnvironment(declaration, typeArguments, context)
      const declarationContext: ResolveContext = {
        unit: declaration.unit,
        namespace: declaration.namespace,
        env,
      }

      if (declaration.node.type === 'TSTypeAliasDeclaration') {
        properties.push(
          ...(await this.resolveProperties(
            contextValue(declaration.node.typeAnnotation, declarationContext),
            nextVisited,
          )),
        )
        continue
      }

      const declarationProperties: ResolvedProperty[] = []
      for (const heritage of declaration.node.extends) {
        const heritageName = entityNameToText(heritage.expression)
        if (!heritageName) {
          continue
        }
        const heritageArguments = heritage.typeArguments?.params ?? []
        declarationProperties.push(
          ...(await this.#resolveNamedOrUtilityProperties(
            heritageName,
            heritageArguments,
            declarationContext,
            nextVisited,
          )),
        )
      }
      for (const member of declaration.node.body.body) {
        if (member.type === 'TSPropertySignature') {
          const property = DeclarationAnalyzer.#propertyFromSignature(member, declarationContext)
          if (property) {
            for (let index = declarationProperties.length - 1; index >= 0; index -= 1) {
              if (declarationProperties[index]?.name === property.name) {
                declarationProperties.splice(index, 1)
              }
            }
            declarationProperties.push(property)
          }
        }
      }
      properties.push(...declarationProperties)
    }
    return properties
  }

  async #resolveNamedOrUtilityProperties(
    name: string,
    typeArguments: ESTree.TSType[],
    context: ResolveContext,
    visited: Set<string>,
  ): Promise<ResolvedProperty[]> {
    if (name === 'VariantProps' && typeArguments.length === 1) {
      const reference = {
        type: 'TSTypeReference',
        typeName: { type: 'Identifier', name: 'VariantProps', start: 0, end: 0 },
        typeArguments: {
          type: 'TSTypeParameterInstantiation',
          params: typeArguments,
          start: 0,
          end: 0,
        },
        start: 0,
        end: 0,
      } as ESTree.TSTypeReference
      return DeclarationAnalyzer.#resolveVariantProperties(reference, context)
    }

    if ((name === 'Pick' || name === 'Omit') && typeArguments.length >= 2) {
      const properties = await this.resolveProperties(
        contextValue(typeArguments[0]!, context),
        visited,
      )
      const keys = literalKeys(typeArguments[1]!)
      return properties.filter((property) =>
        name === 'Pick' ? keys.has(property.name) : !keys.has(property.name),
      )
    }

    if (name === 'Partial' && typeArguments.length >= 1) {
      const properties = await this.resolveProperties(
        contextValue(typeArguments[0]!, context),
        visited,
      )
      return properties.map((property) => {
        property.optional = true
        return property
      })
    }

    if (name === 'Required' && typeArguments.length >= 1) {
      const properties = await this.resolveProperties(
        contextValue(typeArguments[0]!, context),
        visited,
      )
      return properties.map((property) => {
        property.optional = false
        return property
      })
    }

    return this.#resolveNamedProperties(name, typeArguments, context, visited)
  }

  async resolveProperties(
    value: TypeValue,
    visited = new Set<string>(),
  ): Promise<ResolvedProperty[]> {
    const context: ResolveContext = {
      unit: value.unit,
      namespace: value.namespace,
      env: value.env,
    }
    const node = value.node

    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      return name
        ? this.#resolveNamedOrUtilityProperties(name, typeArgumentsOf(node), context, visited)
        : []
    }
    if (node.type === 'TSIntersectionType' || node.type === 'TSUnionType') {
      const groups = await Promise.all(
        node.types.map((type) => this.resolveProperties(contextValue(type, context), visited)),
      )
      return groups.flat()
    }
    if (node.type === 'TSParenthesizedType') {
      return this.resolveProperties(contextValue(node.typeAnnotation, context), visited)
    }
    if (node.type === 'TSConditionalType') {
      const resolvedBranch = resolveConditionalBranch(node, context.env)
      if (resolvedBranch) {
        return this.resolveProperties(contextValue(resolvedBranch, context), visited)
      }
      const [trueProperties, falseProperties] = await Promise.all([
        this.resolveProperties(contextValue(node.trueType, context), visited),
        this.resolveProperties(contextValue(node.falseType, context), visited),
      ])
      return [...trueProperties, ...falseProperties]
    }
    if (node.type === 'TSArrayType') {
      return this.resolveProperties(contextValue(node.elementType, context), visited)
    }
    if (node.type === 'TSTypeLiteral') {
      return node.members.flatMap((member) => {
        if (member.type !== 'TSPropertySignature') {
          return []
        }
        const property = DeclarationAnalyzer.#propertyFromSignature(member, context)
        return property ? [property] : []
      })
    }
    return []
  }

  async typeMayIncludeUndefined(value: TypeValue, visited = new Set<string>()): Promise<boolean> {
    const node = value.node
    if (
      node.type === 'TSUndefinedKeyword' ||
      node.type === 'TSAnyKeyword' ||
      node.type === 'TSUnknownKeyword'
    ) {
      return true
    }
    if (node.type === 'TSUnionType') {
      const values = await Promise.all(
        node.types.map((type) => this.typeMayIncludeUndefined(withTypeNode(value, type), visited)),
      )
      return values.some(Boolean)
    }
    if (node.type === 'TSParenthesizedType') {
      return this.typeMayIncludeUndefined(withTypeNode(value, node.typeAnnotation), visited)
    }
    if (node.type !== 'TSTypeReference') {
      return false
    }

    const name = entityNameToText(node.typeName)
    if (!name) {
      return false
    }
    const substitution = !node.typeArguments ? value.env.get(name) : undefined
    if (substitution) {
      return this.typeMayIncludeUndefined(substitution, visited)
    }
    if (name === 'JSX.Element' || name === 'ClassValue') {
      return true
    }

    const context: ResolveContext = {
      unit: value.unit,
      namespace: value.namespace,
      env: value.env,
    }
    const declarations = await this.#findDeclarations(name, context)
    for (const declaration of declarations) {
      if (declaration.node.type !== 'TSTypeAliasDeclaration') {
        continue
      }
      const key = `${declaration.unit.fileName}:${declaration.node.start}:${declaration.node.end}`
      if (visited.has(key)) {
        continue
      }
      const nextVisited = new Set(visited)
      nextVisited.add(key)
      const env = DeclarationAnalyzer.#declarationEnvironment(
        declaration,
        typeArgumentsOf(node),
        context,
      )
      if (
        await this.typeMayIncludeUndefined(
          {
            node: declaration.node.typeAnnotation,
            unit: declaration.unit,
            namespace: declaration.namespace,
            env,
          },
          nextVisited,
        )
      ) {
        return true
      }
    }
    return false
  }

  async #runtimeSlotNamesFromValue(
    value: TypeValue,
    visited = new Set<string>(),
  ): Promise<string[]> {
    const node = value.node
    if (node.type === 'TSNeverKeyword') {
      return []
    }
    if (node.type === 'TSLiteralType' && node.literal.type === 'Literal') {
      if (typeof node.literal.value !== 'string') {
        throw new TypeError(`Slot runtime value must be a string literal in ${value.unit.fileName}`)
      }
      return [node.literal.value]
    }
    if (node.type === 'TSUnionType') {
      const values = await Promise.all(
        node.types.map((type) =>
          this.#runtimeSlotNamesFromValue(withTypeNode(value, type), visited),
        ),
      )
      return [...new Set(values.flat())]
    }
    if (node.type === 'TSParenthesizedType') {
      return this.#runtimeSlotNamesFromValue(withTypeNode(value, node.typeAnnotation), visited)
    }
    if (node.type !== 'TSTypeReference') {
      throw new Error(`Slot runtime value must be a literal union in ${value.unit.fileName}`)
    }

    const name = entityNameToText(node.typeName)
    if (!name) {
      throw new Error(`Unable to resolve slot runtime value in ${value.unit.fileName}`)
    }
    const context: ResolveContext = {
      unit: value.unit,
      namespace: value.namespace,
      env: value.env,
    }
    const declarations = await this.#findDeclarations(name, context)
    if (declarations.length === 0) {
      throw new Error(`Unable to resolve slot runtime type "${name}" in ${value.unit.fileName}`)
    }
    const values: string[] = []
    for (const declaration of declarations) {
      const key = `${declaration.unit.fileName}:${declaration.node.start}:${declaration.node.end}`
      if (visited.has(key)) {
        continue
      }
      const nextVisited = new Set(visited)
      nextVisited.add(key)
      if (declaration.node.type !== 'TSTypeAliasDeclaration') {
        throw new Error(`Slot runtime type "${name}" must resolve to a type alias`)
      }
      const env = DeclarationAnalyzer.#declarationEnvironment(
        declaration,
        typeArgumentsOf(node),
        context,
      )
      values.push(
        ...(await this.#runtimeSlotNamesFromValue(
          {
            node: declaration.node.typeAnnotation,
            unit: declaration.unit,
            namespace: declaration.namespace,
            env,
          },
          nextVisited,
        )),
      )
    }
    return [...new Set(values)]
  }

  async extractSlotDocs(namespace: string): Promise<SlotDefinitionDoc[]> {
    const declarations = this.mainUnit.declarations.get(`${namespace}.Slot`) ?? []
    const docs: SlotDefinitionDoc[] = []
    for (const declaration of declarations) {
      const properties = await this.#resolveNamedProperties(
        `${namespace}.Slot`,
        [],
        { unit: this.mainUnit, namespace: undefined, env: new Map() },
        new Set(),
      )
      if (declaration.node.type === 'TSTypeAliasDeclaration' && properties.length === 0) {
        throw new Error(`Slot declaration ${namespace}.Slot must be an object mapping`)
      }
      for (const property of properties) {
        const genericSlotValue = isGenericSlotValue(property.type)
        const virtualSlotValue = isVirtualSlotValue(property.type)
        if ((property.optional && !genericSlotValue && !virtualSlotValue) || !property.type) {
          throw new Error(`Slot ${namespace}.${property.name} must be readonly and required`)
        }
        const runtimeSlots = genericSlotValue
          ? [property.name]
          : await this.#runtimeSlotNamesFromValue(property.type)
        docs.push(toSlotDefinitionDoc(property, runtimeSlots))
      }
    }
    return uniqueSlotDefinitions(docs)
  }

  async extractItemDoc(namespace: string): Promise<ItemDoc | undefined> {
    const declaration = this.mainUnit.declarations.get(`${namespace}.Item`)?.[0]
    if (!declaration) {
      return undefined
    }
    const jsDoc = getJsDoc(declaration.unit.source, declaration.node)
    const env = DeclarationAnalyzer.#declarationEnvironment(declaration, [], {
      unit: declaration.unit,
      namespace,
      env: new Map(),
    })
    const value: TypeValue = {
      node:
        declaration.node.type === 'TSTypeAliasDeclaration'
          ? declaration.node.typeAnnotation
          : ({
              type: 'TSTypeReference',
              typeName: declaration.node.id,
              typeArguments: null,
              start: declaration.node.id.start,
              end: declaration.node.id.end,
            } as ESTree.TSTypeReference),
      unit: declaration.unit,
      namespace,
      env,
    }
    const properties = await this.resolveProperties(value)
    const props = await this.formatProperties(properties, {})
    if (!jsDoc.description && props.length === 0) {
      return undefined
    }
    return { props, ...(jsDoc.description ? { description: jsDoc.description } : {}) }
  }

  static #slotOverrideAlias(
    property: ResolvedProperty,
    context: PropFormatContext,
  ): string | undefined {
    if (!property.type || !context.componentName) {
      return undefined
    }
    const overrideName =
      property.name === 'classes' ? 'Classes' : property.name === 'styles' ? 'Styles' : undefined
    if (!overrideName) {
      return undefined
    }
    const componentNamespace = `${context.componentName}T`
    const componentAlias = `${componentNamespace}.${overrideName}`
    if (property.type.node.type !== 'TSTypeReference') {
      return undefined
    }
    const typeName = entityNameToText(property.type.node.typeName)
    if (typeName === overrideName && property.namespace === componentNamespace) {
      return componentAlias
    }
    return typeName ? formatType(property.type) : undefined
  }

  async #displayType(value: TypeValue, visited = new Set<string>()): Promise<DisplayType> {
    if (value.node.type === 'TSIndexedAccessType') {
      const keys = literalKeys(value.node.indexType)
      const key = keys.size === 1 ? [...keys][0] : undefined
      if (key) {
        const properties = await this.resolveProperties(withTypeNode(value, value.node.objectType))
        const property = properties.findLast((candidate) => candidate.name === key)
        if (property) {
          const display = property.type
            ? await this.#displayType(property.type, visited)
            : {
                text: property.typeText ?? 'unknown',
                mayIncludeUndefined: hasTopLevelUndefined(property.typeText ?? ''),
                explicitUndefined: hasTopLevelUndefined(property.typeText ?? ''),
              }
          if (property.optional && !display.mayIncludeUndefined) {
            return {
              text: addOptionalUndefined(display.text),
              mayIncludeUndefined: true,
              explicitUndefined: true,
            }
          }
          return display
        }
      }
    }

    if (value.node.type === 'TSTypeReference') {
      const name = entityNameToText(value.node.typeName)
      const typeArguments = typeArgumentsOf(value.node)
      if (name === 'NonNullable' && typeArguments[0]) {
        const display = await this.#displayType(withTypeNode(value, typeArguments[0]), visited)
        return {
          text: `NonNullable<${display.text}>`,
          mayIncludeUndefined: false,
          explicitUndefined: false,
        }
      }

      if (name === 'PaginationVariant' || name === 'PopperPlacement') {
        const context: ResolveContext = {
          unit: value.unit,
          namespace: value.namespace,
          env: value.env,
        }
        const declaration = (await this.#findDeclarations(name, context)).find(
          (candidate) => candidate.node.type === 'TSTypeAliasDeclaration',
        )
        if (declaration?.node.type === 'TSTypeAliasDeclaration') {
          const key = `${declaration.unit.fileName}:${declaration.node.start}:${declaration.node.end}`
          if (!visited.has(key)) {
            const nextVisited = new Set(visited)
            nextVisited.add(key)
            const env = DeclarationAnalyzer.#declarationEnvironment(
              declaration,
              typeArguments,
              context,
            )
            return this.#displayType(
              {
                node: declaration.node.typeAnnotation,
                unit: declaration.unit,
                namespace: declaration.namespace,
                env,
              },
              nextVisited,
            )
          }
        }
      }
    }

    return {
      text: formatType(value),
      mayIncludeUndefined: await this.typeMayIncludeUndefined(value),
      explicitUndefined:
        value.node.type === 'TSUnionType' &&
        value.node.types.some((type) => type.type === 'TSUndefinedKeyword'),
    }
  }

  async #formatProperty(
    properties: ResolvedProperty[],
    context: PropFormatContext,
  ): Promise<PropDoc> {
    const first = properties[0]!
    const optional = properties.some((property) => property.optional)
    const genericDescriptions = new Set([
      'Style applied to the component root or trigger element.',
      'Classes applied to the component slots.',
      'Styles applied to the component slots.',
    ])
    const description = properties.find(
      (property) => property.description && !genericDescriptions.has(property.description),
    )?.description
    const defaultValue = properties.find(
      (property) => property.defaultValue !== undefined,
    )?.defaultValue

    let typeText: string
    if (first.name === 'classes' || first.name === 'styles') {
      const aliases = properties
        .map((property) => DeclarationAnalyzer.#slotOverrideAlias(property, context))
        .filter((value): value is string => Boolean(value))
        .filter((value, index, values) => values.indexOf(value) === index)
      if (aliases.length > 0) {
        typeText = aliases.length === 1 ? aliases[0]! : `(${aliases.join(' & ')})`
        if (optional) {
          typeText += ' | undefined'
        }
      } else {
        typeText = first.typeText ?? (first.type ? formatType(first.type) : 'unknown')
      }
    } else {
      const displays = await Promise.all(
        properties.map((property) =>
          property.type
            ? this.#displayType(property.type)
            : Promise.resolve({
                text: property.typeText ?? 'unknown',
                mayIncludeUndefined: hasTopLevelUndefined(property.typeText ?? ''),
                explicitUndefined: hasTopLevelUndefined(property.typeText ?? ''),
              }),
        ),
      )
      const normalizedDisplays = displays.map((display) => ({
        text: normalizeKnownUnionOrder(display.text),
        mayIncludeUndefined: display.mayIncludeUndefined,
        explicitUndefined: display.explicitUndefined,
      }))
      const rawTypes = normalizedDisplays.map((display) => display.text)
      const preferredRawTypes = rawTypes.filter(
        (type) =>
          !type.startsWith('NonNullable<') ||
          !rawTypes.some(
            (candidate) =>
              !candidate.startsWith('NonNullable<') &&
              literalTypeKey(candidate) !== '' &&
              literalTypeKey(candidate) === literalTypeKey(type),
          ),
      )
      const types = preferredRawTypes
        .map((type) =>
          normalizedDisplays.some((display) => display.text === type && display.explicitUndefined)
            ? type.replace(/ \| undefined$/, '')
            : type,
        )
        .filter((value, index, values) => values.indexOf(value) === index)
      typeText = types.length === 1 ? types[0]! : types.join(' & ')
      const includesUndefined = normalizedDisplays.some((display) => display.mayIncludeUndefined)
      const explicitlyIncludesUndefined = normalizedDisplays.some(
        (display) => display.explicitUndefined,
      )
      if (explicitlyIncludesUndefined || (optional && !includesUndefined)) {
        typeText = addOptionalUndefined(typeText)
      }
    }

    const includesUndefined =
      hasTopLevelUndefined(typeText) ||
      (
        await Promise.all(
          properties.map((property) =>
            property.type ? this.typeMayIncludeUndefined(property.type) : Promise.resolve(false),
          ),
        )
      ).some(Boolean)

    return {
      name: first.name,
      required: !optional && !includesUndefined,
      type: typeText,
      ...(description ? { description } : {}),
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    }
  }

  async formatProperties(
    properties: ResolvedProperty[],
    context: PropFormatContext,
  ): Promise<PropDoc[]> {
    const byName = new Map<string, ResolvedProperty[]>()
    for (const property of properties) {
      const entries = byName.get(property.name) ?? []
      entries.push(property)
      byName.set(property.name, entries)
    }
    return Promise.all(
      [...byName.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, entries]) => this.#formatProperty(entries, context)),
    )
  }

  async groupProperties(
    properties: ResolvedProperty[],
    context: PropFormatContext,
  ): Promise<{ own: PropDoc[]; inherited: InheritedGroupDoc[] }> {
    const ownProperties = properties.filter((property) => property.originModule === 'Moraine')
    const inheritedProperties = new Map<string, ResolvedProperty[]>()
    for (const property of properties) {
      if (
        property.originModule === 'Moraine' ||
        !shouldIncludeInheritedGroup(property.originModule)
      ) {
        continue
      }
      const entries = inheritedProperties.get(property.originModule) ?? []
      entries.push(property)
      inheritedProperties.set(property.originModule, entries)
    }
    return {
      own: await this.formatProperties(ownProperties, context),
      inherited: await Promise.all(
        [...inheritedProperties.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(async ([from, entries]) => ({
            from,
            props: await this.formatProperties(entries, context),
          })),
      ),
    }
  }
}

interface ComponentMetadata {
  items: Map<string, ItemDoc>
  slots: Map<string, SlotDefinitionDoc[]>
  slotOverrideTypes: Map<string, ReadonlySet<string>>
}

async function collectNamespaceMetadata(analyzer: DeclarationAnalyzer): Promise<ComponentMetadata> {
  const namespaceNames = new Set<string>()
  for (const name of analyzer.mainUnit.declarations.keys()) {
    const namespace = name.split('.')[0]
    if (namespace?.endsWith('T')) {
      namespaceNames.add(namespace)
    }
  }

  const items = new Map<string, ItemDoc>()
  const slots = new Map<string, SlotDefinitionDoc[]>()
  const slotOverrideTypes = new Map<string, ReadonlySet<string>>()
  await Promise.all(
    [...namespaceNames].map(async (namespace) => {
      const componentName = namespace.slice(0, -1)
      const overrideTypes = new Set<string>()
      if (analyzer.mainUnit.declarations.has(`${namespace}.Classes`)) {
        overrideTypes.add('Classes')
      }
      if (analyzer.mainUnit.declarations.has(`${namespace}.Styles`)) {
        overrideTypes.add('Styles')
      }
      if (overrideTypes.size > 0) {
        slotOverrideTypes.set(componentName, overrideTypes)
      }

      const [slotDocs, itemDoc] = await Promise.all([
        analyzer.extractSlotDocs(namespace),
        analyzer.extractItemDoc(namespace),
      ])
      if (slotDocs.length > 0) {
        slots.set(componentName, slotDocs)
      }
      if (itemDoc) {
        items.set(componentName, itemDoc)
      }
    }),
  )
  return { items, slots, slotOverrideTypes }
}

async function processComponentNode(
  node: DeclareFunctionNode,
  analyzer: DeclarationAnalyzer,
  sourceSlotAnalyzer: SourceSlotAnalyzer,
  regionByLine: Array<string | undefined>,
  metadata: ComponentMetadata,
): Promise<{ key: string; doc: ComponentDoc } | null> {
  if (!node.id || node.params.length === 0 || !isJsxElementReturn(node.returnType)) {
    return null
  }
  const propsParam = node.params[0]
  if (!propsParam || !('typeAnnotation' in propsParam) || !propsParam.typeAnnotation) {
    return null
  }

  const componentName = node.id.name.replace(/\$\d+$/, '')
  const componentKey = toKebabCase(componentName)
  const jsDoc = getJsDoc(analyzer.mainUnit.source, node)
  const line = lineAtOffset(analyzer.mainUnit.source.text, node.start)
  const sourcePath = resolveSourcePath(analyzer.projectRoot, regionByLine[line])
  const propsValue: TypeValue = {
    node: propsParam.typeAnnotation.typeAnnotation,
    unit: analyzer.mainUnit,
    env: new Map(),
  }
  const resolvedProperties = await analyzer.resolveProperties(propsValue)
  const props = await analyzer.groupProperties(resolvedProperties, {
    componentName,
    slotOverrideTypes: metadata.slotOverrideTypes.get(componentName),
  })

  const component: ComponentIndexEntry = {
    key: componentKey,
    name: componentName,
    category: categoryFromSourcePath(sourcePath),
    polymorphic: resolvedProperties.some((property) => property.name === 'as'),
    ...(jsDoc.description ? { description: jsDoc.description } : {}),
    ...(sourcePath ? { sourcePath } : {}),
  }
  const slotDefinitions = metadata.slots.get(componentName) ?? []
  const slots = await sourceSlotAnalyzer.enrichSlots(componentName, sourcePath, slotDefinitions)
  return {
    key: componentKey,
    doc: {
      component,
      slots,
      ...(metadata.items.get(componentName) ? { item: metadata.items.get(componentName) } : {}),
      props,
    },
  }
}

export async function generateApiDoc(projectRoot: string): Promise<GenerationResult | null> {
  const dtsPath = path.join(projectRoot, 'dist', 'index.d.mts')
  if (!existsSync(dtsPath)) {
    console.warn(`[api-doc] ${dtsPath} not found, skipping generation`)
    return null
  }

  const sourceSlotAnalyzer = new SourceSlotAnalyzer(projectRoot)
  const componentDocs = new Map<string, ComponentDoc>()
  const pending = [dtsPath]
  const visited = new Set<string>()

  while (pending.length > 0) {
    const fileName = pending.pop()!
    if (visited.has(fileName)) {
      continue
    }
    visited.add(fileName)
    const content = readFileSync(fileName, 'utf8')
    const processedContent = await preprocessGenericTypeAliases(content, fileName)
    const analyzer = await DeclarationAnalyzer.create(projectRoot, fileName, processedContent)
    const regionByLine = buildRegionByLine(processedContent)
    const metadata = await collectNamespaceMetadata(analyzer)

    for (const statement of analyzer.mainUnit.source.program.body) {
      if (
        (statement.type === 'ImportDeclaration' ||
          statement.type === 'ExportNamedDeclaration' ||
          statement.type === 'ExportAllDeclaration') &&
        typeof statement.source?.value === 'string' &&
        statement.source.value.startsWith('.')
      ) {
        const dependency = path
          .resolve(path.dirname(fileName), statement.source.value)
          .replace(/(?<!\.d)\.mjs$/, '.d.mts')
          .replace(/(?<!\.d)\.js$/, '.d.ts')
        if (existsSync(dependency)) {
          pending.push(dependency)
        }
      }
      const declaration = declarationFromStatement(statement)
      if (declaration?.type !== 'TSDeclareFunction') {
        continue
      }
      const component = await processComponentNode(
        declaration,
        analyzer,
        sourceSlotAnalyzer,
        regionByLine,
        metadata,
      )
      if (component) {
        componentDocs.set(component.key, component.doc)
      }
    }
  }

  for (const [key, doc] of componentDocs) {
    const match =
      /^(dialog|sheet|modal|popover|tooltip|dropdown-menu|context-menu)-(trigger|content|close)$/.exec(
        key,
      )
    const root = match && componentDocs.get(match[1]!)
    if (!root || !match) {
      continue
    }
    const primitive = match[2]!
    doc.component.name = `${root.component.name}.${primitive[0]!.toUpperCase()}${primitive.slice(1)}`
    ;(root.primitives ??= []).push(doc)
    componentDocs.delete(key)
  }

  return {
    indexDoc: {
      components: [...componentDocs.values()].map((doc) => doc.component),
    },
    componentDocs,
  }
}
