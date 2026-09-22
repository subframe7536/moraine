import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { collectMarkdownFiles, resolveDocsPageContext } from '../core/paths'
import { toKebabCase, toPosixPath } from '../core/strings'
import { readFrontmatterData } from '../markdown/frontmatter'
import type { FrontmatterApiPart } from '../markdown/types'

import { getIdentifierName, parseTypeScript } from './ast'
import type { AccessApi } from './types'

export interface RegisteredPart {
  id: string
  name: string
  access: AccessApi
  typesPath: string
  namespaceName: string
  propsTypeName: string
  isRoot: boolean
}

export interface RegisteredComponent {
  key: string
  name: string
  category: 'elements' | 'forms' | 'navigation' | 'overlays'
  typesPath: string
  recipePath?: string
  namespaceName: string
  parts: RegisteredPart[]
}

interface TypesHeader {
  namespaceName: string
  componentName: string
  kind: 'single' | 'composite'
  declarations: Set<string>
  requiresRecipe: boolean
}

function namespaceDeclarations(node: ESTree.TSModuleDeclaration): Set<string> {
  const declarations = new Set<string>()
  if (node.body?.type !== 'TSModuleBlock') {
    return declarations
  }
  for (const statement of node.body.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (declaration && 'id' in declaration) {
      const name = getIdentifierName(declaration.id)
      if (name) {
        declarations.add(name)
      }
    }
  }
  return declarations
}

function namespaceKind(node: ESTree.TSModuleDeclaration): 'single' | 'composite' | undefined {
  if (node.body?.type !== 'TSModuleBlock') {
    return undefined
  }
  for (const statement of node.body.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (
      declaration?.type === 'TSTypeAliasDeclaration' &&
      declaration.id.name === 'Kind' &&
      declaration.typeAnnotation.type === 'TSLiteralType'
    ) {
      const value = (declaration.typeAnnotation.literal as { value?: unknown }).value
      if (value === 'single' || value === 'composite') {
        return value
      }
    }
  }
  return undefined
}

function namespaceRequiresRecipe(node: ESTree.TSModuleDeclaration): boolean {
  if (node.body?.type !== 'TSModuleBlock') {
    return false
  }
  for (const statement of node.body.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (declaration?.type === 'TSTypeAliasDeclaration' && declaration.id.name === 'Slot') {
      return declaration.typeAnnotation.type !== 'TSNeverKeyword'
    }
  }
  return false
}

async function readTypesHeader(absolutePath: string): Promise<TypesHeader> {
  const source = readFileSync(absolutePath, 'utf8')
  const parsed = await parseTypeScript(absolutePath, source, 'ts')
  const candidates: TypesHeader[] = []

  for (const statement of parsed.program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (
      declaration?.type !== 'TSModuleDeclaration' ||
      declaration.kind === 'global' ||
      declaration.id.type !== 'Identifier' ||
      !declaration.id.name.endsWith('T')
    ) {
      continue
    }
    const kind = namespaceKind(declaration)
    if (!kind) {
      continue
    }
    candidates.push({
      namespaceName: declaration.id.name,
      componentName: declaration.id.name.slice(0, -1),
      kind,
      declarations: namespaceDeclarations(declaration),
      requiresRecipe: namespaceRequiresRecipe(declaration),
    })
  }

  if (candidates.length !== 1) {
    throw new Error(
      `[api-doc] Expected exactly one exported <Component>T namespace with Kind in ${absolutePath}; found ${candidates.length}.`,
    )
  }
  return candidates[0]!
}

function categoryFromPath(sourcePath: string): RegisteredComponent['category'] {
  const match = sourcePath.match(/^src\/(elements|forms|navigation|overlays)\//)
  if (!match) {
    throw new Error(`[api-doc] Unsupported component source path "${sourcePath}".`)
  }
  return match[1] as RegisteredComponent['category']
}

function partRegistration(part: string | FrontmatterApiPart): FrontmatterApiPart {
  return typeof part === 'string' ? { name: part } : part
}

export async function loadApiRegistry(projectRoot: string): Promise<RegisteredComponent[]> {
  const pagesRoot = path.join(projectRoot, 'docs/pages')
  const registered: RegisteredComponent[] = []
  const seenKeys = new Set<string>()
  const seenComponents = new Set<string>()

  for (const pageFile of collectMarkdownFiles(pagesRoot)) {
    const frontmatter = readFrontmatterData(readFileSync(pageFile, 'utf8'), pageFile)
    if (!frontmatter.api) {
      continue
    }

    const { pageKey: key } = resolveDocsPageContext(pageFile)
    if (seenKeys.has(key)) {
      throw new Error(`[api-doc] Duplicate API page key "${key}".`)
    }
    seenKeys.add(key)

    const basePath = frontmatter.api.path
    const typesPath = `${basePath}.types.ts`
    const absoluteTypesPath = path.join(projectRoot, typesPath)
    if (!existsSync(absoluteTypesPath)) {
      throw new Error(`[api-doc] Missing types file for "${key}": ${typesPath}`)
    }

    const header = await readTypesHeader(absoluteTypesPath)
    const componentIdentity = `${typesPath}#${header.namespaceName}`
    if (seenComponents.has(componentIdentity)) {
      throw new Error(
        `[api-doc] Component ${header.namespaceName} is registered by more than one docs page.`,
      )
    }
    seenComponents.add(componentIdentity)

    if (!header.declarations.has('Props')) {
      throw new Error(`[api-doc] ${header.namespaceName} does not declare Props in ${typesPath}.`)
    }

    const recipeCandidate = `${basePath}.recipe.ts`
    const recipeExists = existsSync(path.join(projectRoot, recipeCandidate))
    if (header.requiresRecipe && !recipeExists) {
      throw new Error(`[api-doc] Missing recipe file for "${key}": ${recipeCandidate}`)
    }
    const recipePath = recipeExists ? recipeCandidate : undefined

    if (header.kind === 'composite' && key !== 'form' && !frontmatter.api.parts) {
      throw new Error(`[api-doc] Composite component "${key}" must declare frontmatter.api.parts.`)
    }

    const rootAccess: AccessApi =
      key === 'form'
        ? { kind: 'factory-member', factory: 'createForm', member: 'Form' }
        : { kind: 'export', name: header.componentName, package: 'moraine' }
    const parts: RegisteredPart[] = [
      {
        id: key === 'form' ? 'form-form' : key,
        name: key === 'form' ? 'form.Form' : header.componentName,
        access: rootAccess,
        typesPath,
        namespaceName: header.namespaceName,
        propsTypeName: 'Props',
        isRoot: true,
      },
    ]

    const declaredParts =
      key === 'form' ? [{ name: 'Field' }] : (frontmatter.api.parts ?? []).map(partRegistration)
    for (const part of declaredParts) {
      const partBasePath = part.path ?? basePath
      const partTypesPath = `${partBasePath}.types.ts`
      const absolutePartTypesPath = path.join(projectRoot, partTypesPath)
      if (!existsSync(absolutePartTypesPath)) {
        throw new Error(
          `[api-doc] Missing types file for part "${header.componentName}.${part.name}": ${partTypesPath}`,
        )
      }
      const partHeader =
        partTypesPath === typesPath ? header : await readTypesHeader(absolutePartTypesPath)
      const propsTypeName = `${part.name}Props`
      if (!partHeader.declarations.has(propsTypeName)) {
        throw new Error(
          `[api-doc] Unknown part "${part.name}" for ${header.namespaceName}; ${propsTypeName} is not declared in ${partTypesPath}.`,
        )
      }
      parts.push({
        id: `${key}-${toKebabCase(part.name)}`,
        name: key === 'form' ? `form.${part.name}` : `${header.componentName}.${part.name}`,
        access:
          key === 'form'
            ? { kind: 'factory-member', factory: 'createForm', member: part.name }
            : { kind: 'attached', root: header.componentName, member: part.name },
        typesPath: toPosixPath(partTypesPath),
        namespaceName: partHeader.namespaceName,
        propsTypeName,
        isRoot: false,
      })
    }

    registered.push({
      key,
      name: header.componentName,
      category: categoryFromPath(basePath),
      typesPath: toPosixPath(typesPath),
      ...(recipePath ? { recipePath: toPosixPath(recipePath) } : {}),
      namespaceName: header.namespaceName,
      parts,
    })
  }

  return registered.sort((left, right) => left.key.localeCompare(right.key))
}
