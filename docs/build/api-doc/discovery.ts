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
          isRoot: true,
        },
        {
          id: 'form-field',
          name: 'form.Field',
          access: { kind: 'factory-member', factory: 'createForm', member: 'Field' },
          sourcePath,
          typesPath,
          namespaceName: 'FormT',
          propsTypeName: 'FieldProps',
          isRoot: false,
        },
      ],
    }
  },
}

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

async function findAttachedMembers(
  projectRoot: string,
  sourcePath: string,
  componentName: string,
): Promise<string[]> {
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
  const members: string[] = []

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
      members.push(statement.expression.left.property.name)
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
          isRoot: true,
        }

        // Discover attached members
        const attachedMembers = await findAttachedMembers(projectRoot, relSourcePath, componentName)
        const parts: DiscoveredPart[] = [rootPart]

        for (const member of attachedMembers) {
          const memberPartName = `${componentName}.${member}`
          const memberId = `${key}-${toKebabCase(member)}`
          const memberPropsTypeName = `${member}Props`

          parts.push({
            id: memberId,
            name: memberPartName,
            access: { kind: 'attached', root: componentName, member },
            sourcePath: relSourcePath,
            typesPath: relTypesPath,
            namespaceName,
            propsTypeName: memberPropsTypeName,
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
