import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { toKebabCase, toPosixPath } from '../core/strings'

import { getIdentifierName, parseTypeScript } from './ast'
import type { AccessApi } from './types'

export interface DiscoveredPart {
  id: string
  name: string
  access: AccessApi
  sourcePath: string
  typesPath: string
  namespaceName: string
  propsTypeName: string
  implementationName: string
  runtimeSourcePath?: string
  runtimeImplementationName?: string
  runtimeSlotNames?: string[]
  runtimeAllowHostFallback?: boolean
  runtimeDelegateRootTargets?: Record<string, string>
  rendersDom?: false
  isRoot: boolean
}

export interface DiscoveredComponent {
  key: string
  name: string
  category: string
  sourcePath: string
  typesPath: string
  namespaceName: string
  propsTypeName: string
  parts: DiscoveredPart[]
}

const REGISTRY_SPECIAL_COMPONENTS: Record<
  string,
  (projectRoot: string) => DiscoveredComponent | null
> = {
  form: (projectRoot: string) => {
    const sourcePath = 'src/forms/form/form.tsx'
    const typesPath = 'src/forms/form/form.types.ts'
    if (!existsSync(path.join(projectRoot, typesPath))) {
      return null
    }

    return {
      key: 'form',
      name: 'Form',
      category: 'forms',
      sourcePath,
      typesPath,
      namespaceName: 'FormT',
      propsTypeName: 'Props',
      parts: [
        {
          id: 'form-form',
          name: 'form.Form',
          access: { kind: 'factory-member', factory: 'createForm', member: 'Form' },
          sourcePath,
          typesPath,
          namespaceName: 'FormT',
          propsTypeName: 'Props',
          implementationName: 'FormRoot',
          isRoot: true,
        },
        {
          id: 'form-field',
          name: 'form.Field',
          access: { kind: 'factory-member', factory: 'createForm', member: 'Field' },
          sourcePath: 'src/forms/field/field.tsx',
          typesPath,
          namespaceName: 'FormT',
          propsTypeName: 'FieldProps',
          implementationName: 'renderField',
          isRoot: false,
        },
      ],
    }
  },
}

const CONTEXT_ONLY_ROOTS = new Set([
  'BaseSelect',
  'ContextMenu',
  'Dialog',
  'DropdownMenu',
  'Modal',
  'Popover',
  'Sheet',
  'Tooltip',
])

const ROOT_IMPLEMENTATION_OVERRIDES = new Map([['Field', 'renderField']])

const ROOT_RUNTIME_OVERRIDES = new Map<string, Pick<DiscoveredPart, 'runtimeDelegateRootTargets'>>([
  ['CheckboxGroup', { runtimeDelegateRootTargets: { Checkbox: 'item' } }],
])

const ATTACHED_RUNTIME_OVERRIDES = new Map<
  string,
  Pick<
    DiscoveredPart,
    | 'runtimeSourcePath'
    | 'runtimeImplementationName'
    | 'runtimeSlotNames'
    | 'runtimeAllowHostFallback'
  >
>([
  [
    'Resizable.Panel',
    {
      runtimeImplementationName: 'Resizable',
      runtimeSlotNames: ['panel'],
      runtimeAllowHostFallback: false,
    },
  ],
  [
    'Resizable.Handle',
    {
      runtimeImplementationName: 'Resizable',
      runtimeSlotNames: ['divider', 'crossTarget', 'handle'],
      runtimeAllowHostFallback: false,
    },
  ],
])

function resolveFilePath(baseDir: string, relativePath: string): string | null {
  const fullPath = path.resolve(baseDir, relativePath)
  const candidates = [
    fullPath,
    `${fullPath}.tsx`,
    `${fullPath}.ts`,
    path.join(fullPath, 'index.tsx'),
    path.join(fullPath, 'index.ts'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

interface AttachedMember {
  member: string
  implementationName: string
  sourcePath: string
}

async function findAttachedMembers(
  projectRoot: string,
  sourcePath: string,
  componentName: string,
): Promise<AttachedMember[]> {
  const absolutePath = path.join(projectRoot, sourcePath)
  if (!existsSync(absolutePath)) {
    return []
  }

  const content = readFileSync(absolutePath, 'utf8')
  const parsed = await parseTypeScript(
    absolutePath,
    content,
    absolutePath.endsWith('.tsx') ? 'tsx' : 'ts',
  )
  const members: AttachedMember[] = []
  const importedSources = new Map<string, string>()

  for (const statement of parsed.program.body) {
    if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue
    }
    const resolved = resolveFilePath(path.dirname(absolutePath), statement.source.value)
    if (!resolved) {
      continue
    }
    const resolvedSourcePath = toPosixPath(path.relative(projectRoot, resolved))
    for (const specifier of statement.specifiers) {
      if (specifier.local.type === 'Identifier') {
        importedSources.set(specifier.local.name, resolvedSourcePath)
      }
    }
  }

  for (const statement of parsed.program.body) {
    if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AssignmentExpression' &&
      statement.expression.operator === '=' &&
      statement.expression.left.type === 'MemberExpression' &&
      !statement.expression.left.computed &&
      statement.expression.left.object.type === 'Identifier' &&
      statement.expression.left.object.name === componentName &&
      statement.expression.left.property.type === 'Identifier'
    ) {
      const right = statement.expression.right
      if (right.type !== 'Identifier') {
        continue
      }
      members.push({
        member: statement.expression.left.property.name,
        implementationName: right.name,
        sourcePath: importedSources.get(right.name) ?? sourcePath,
      })
    }
  }

  return members
}

export async function discoverPublicComponents(
  projectRoot: string,
): Promise<DiscoveredComponent[]> {
  const discovered: DiscoveredComponent[] = []
  const indexPath = path.join(projectRoot, 'src/index.ts')
  if (!existsSync(indexPath)) {
    return discovered
  }

  const domainDirs = ['elements', 'forms', 'navigation', 'overlays']

  for (const domain of domainDirs) {
    const domainIndexPath = path.join(projectRoot, `src/${domain}/index.ts`)
    if (!existsSync(domainIndexPath)) {
      continue
    }

    const domainContent = readFileSync(domainIndexPath, 'utf8')
    const domainParsed = await parseTypeScript(domainIndexPath, domainContent, 'ts')

    // Find export * from './component'
    for (const stmt of domainParsed.program.body) {
      if (stmt.type !== 'ExportAllDeclaration' || typeof stmt.source.value !== 'string') {
        continue
      }

      const componentSubpath = stmt.source.value.replace(/\/index(?:\.tsx?)?$/, '')
      const componentDir = path.resolve(path.dirname(domainIndexPath), componentSubpath)
      const componentIndexPath = path.join(componentDir, 'index.ts')
      if (!existsSync(componentIndexPath)) {
        continue
      }

      const componentIndexContent = readFileSync(componentIndexPath, 'utf8')
      const componentIndexParsed = await parseTypeScript(
        componentIndexPath,
        componentIndexContent,
        'ts',
      )

      // Track exports in this component index
      const componentExports: Array<{
        componentName: string
        sourceRel: string
      }> = []
      const typeExports: Array<{
        name: string
        sourceRel: string
      }> = []

      for (const compStmt of componentIndexParsed.program.body) {
        if (compStmt.type === 'ExportNamedDeclaration' && compStmt.source?.value) {
          const specifierSource = compStmt.source.value
          const isTypeOnly = (compStmt as { exportKind?: string }).exportKind === 'type'

          for (const spec of compStmt.specifiers) {
            const exportedName = getIdentifierName(spec.exported)
            const localName = getIdentifierName(spec.local)
            const name = exportedName ?? localName
            if (!name) {
              continue
            }

            const specType = isTypeOnly || (spec as { exportKind?: string }).exportKind === 'type'

            if (specType) {
              typeExports.push({ name, sourceRel: specifierSource })
            } else {
              // Component function export (capitalized)
              if (/^[A-Z]/.test(name)) {
                componentExports.push({ componentName: name, sourceRel: specifierSource })
              }
            }
          }
        }
      }

      // Check if domain/component has a registry override (e.g. form)
      const dirBaseName = path.basename(componentDir)
      if (REGISTRY_SPECIAL_COMPONENTS[dirBaseName]) {
        const special = REGISTRY_SPECIAL_COMPONENTS[dirBaseName](projectRoot)
        if (special) {
          discovered.push(special)
          continue
        }
      }

      for (const compExport of componentExports) {
        const componentName = compExport.componentName
        const key = toKebabCase(componentName)

        // Locate source .tsx
        const resolvedSource = resolveFilePath(componentDir, compExport.sourceRel)
        if (!resolvedSource) {
          continue
        }
        const relSourcePath = toPosixPath(path.relative(projectRoot, resolvedSource))

        // Match namespace XxxT and Props type XxxProps
        const namespaceName = `${componentName}T`
        const propsTypeName = `${componentName}Props`
        const matchedTypeExport = typeExports.find((t) => t.name === namespaceName)

        let relTypesPath = relSourcePath
        if (matchedTypeExport) {
          const resolvedTypes = resolveFilePath(componentDir, matchedTypeExport.sourceRel)
          if (resolvedTypes) {
            relTypesPath = toPosixPath(path.relative(projectRoot, resolvedTypes))
          }
        } else {
          const defaultTypesCandidate = resolvedSource.replace(/\.tsx$/, '.types.ts')
          if (existsSync(defaultTypesCandidate)) {
            relTypesPath = toPosixPath(path.relative(projectRoot, defaultTypesCandidate))
          }
        }

        const rootPart: DiscoveredPart = {
          id: key,
          name: componentName,
          access: { kind: 'export', name: componentName, package: 'moraine' },
          sourcePath: relSourcePath,
          typesPath: relTypesPath,
          namespaceName,
          propsTypeName: 'Props',
          implementationName: ROOT_IMPLEMENTATION_OVERRIDES.get(componentName) ?? componentName,
          ...ROOT_RUNTIME_OVERRIDES.get(componentName),
          ...(CONTEXT_ONLY_ROOTS.has(componentName) ? { rendersDom: false as const } : {}),
          isRoot: true,
        }

        // Discover attached members
        const attachedMembers = await findAttachedMembers(projectRoot, relSourcePath, componentName)
        const parts: DiscoveredPart[] = [rootPart]

        for (const attached of attachedMembers) {
          const memberPartName = `${componentName}.${attached.member}`
          const memberId = `${key}-${toKebabCase(attached.member)}`
          const memberPropsTypeName = `${attached.member}Props`
          const runtimeOverride = ATTACHED_RUNTIME_OVERRIDES.get(memberPartName)

          parts.push({
            id: memberId,
            name: memberPartName,
            access: { kind: 'attached', root: componentName, member: attached.member },
            sourcePath: attached.sourcePath,
            typesPath: relTypesPath,
            namespaceName,
            propsTypeName: memberPropsTypeName,
            implementationName: attached.implementationName,
            ...runtimeOverride,
            isRoot: false,
          })
        }

        discovered.push({
          key,
          name: componentName,
          category: domain,
          sourcePath: relSourcePath,
          typesPath: relTypesPath,
          namespaceName,
          propsTypeName,
          parts,
        })
      }
    }
  }

  // Sort discovered components deterministically by key
  discovered.sort((left, right) => left.key.localeCompare(right.key))
  return discovered
}
