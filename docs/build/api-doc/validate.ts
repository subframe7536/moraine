import path from 'node:path'

import type { ComponentApi } from './types'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  componentKey: string
  partId?: string
  message: string
}

export class ValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    const errorCount = issues.filter((i) => i.severity === 'error').length
    const warningCount = issues.filter((i) => i.severity === 'warning').length
    const details = issues
      .map(
        (i) =>
          `[${i.severity.toUpperCase()}] Component "${i.componentKey}"${i.partId ? ` (part "${i.partId}")` : ''}: ${i.message}`,
      )
      .join('\n')

    super(
      `API Documentation validation failed with ${errorCount} error(s) and ${warningCount} warning(s):\n${details}`,
    )
    this.issues = issues
  }
}

export function validateComponentApi(component: ComponentApi): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const key = component.key

  // 1. Kind check
  if (component.kind !== 'single' && component.kind !== 'composite') {
    issues.push({
      severity: 'error',
      componentKey: key,
      message: `Invalid kind "${String(component.kind)}". Must be 'single' or 'composite'.`,
    })
  }

  // 2. Parts check
  if (!component.parts || component.parts.length === 0) {
    issues.push({
      severity: 'error',
      componentKey: key,
      message: 'Component must have at least one documented public part.',
    })
    return issues
  }

  // 3. Source paths must be relative POSIX paths, no absolute paths
  if (pathIsAbsoluteOrNonPosix(component.sourcePath)) {
    issues.push({
      severity: 'error',
      componentKey: key,
      message: `Source path "${component.sourcePath}" must be a repo-relative POSIX path.`,
    })
  }

  const seenPartIds = new Set<string>()

  for (const part of component.parts) {
    // Unique stable part ID
    if (seenPartIds.has(part.id)) {
      issues.push({
        severity: 'error',
        componentKey: key,
        partId: part.id,
        message: `Duplicate part ID "${part.id}".`,
      })
    }
    seenPartIds.add(part.id)

    // Access path validation
    if (!part.access || !part.access.kind) {
      issues.push({
        severity: 'error',
        componentKey: key,
        partId: part.id,
        message: 'Part access metadata must be defined with a valid discriminated kind.',
      })
    }

    if (key === 'form') {
      if (part.access.kind !== 'factory-member' || part.access.factory !== 'createForm') {
        issues.push({
          severity: 'error',
          componentKey: key,
          partId: part.id,
          message: 'Form part must have access kind "factory-member" with factory "createForm".',
        })
      }
    }

    // Source path for part
    if (pathIsAbsoluteOrNonPosix(part.sourcePath)) {
      issues.push({
        severity: 'error',
        componentKey: key,
        partId: part.id,
        message: `Part source path "${part.sourcePath}" must be a repo-relative POSIX path.`,
      })
    }

    // Validate generics and prop generic references
    const declaredGenericNames = new Set(part.generics?.map((g) => g.name) ?? [])

    const seenPropNames = new Set<string>()
    for (const prop of part.props) {
      // Unique prop name
      if (seenPropNames.has(prop.name)) {
        issues.push({
          severity: 'error',
          componentKey: key,
          partId: part.id,
          message: `Duplicate prop name "${prop.name}".`,
        })
      }
      seenPropNames.add(prop.name)

      // Defaults validation
      if (prop.default) {
        if (prop.default.kind !== 'literal' && prop.default.kind !== 'expression') {
          issues.push({
            severity: 'error',
            componentKey: key,
            partId: part.id,
            message: `Prop "${prop.name}" has invalid default kind: ${JSON.stringify(prop.default)}`,
          })
        }
      }

      // State relation validation
      if (prop.state) {
        if (!prop.state.key || !['value', 'default', 'change'].includes(prop.state.role)) {
          issues.push({
            severity: 'error',
            componentKey: key,
            partId: part.id,
            message: `Prop "${prop.name}" has invalid state relation: ${JSON.stringify(prop.state)}`,
          })
        }
      }

      // Free generic reference check (for simple single identifier types like T or TItem or TSchema)
      const typeText = prop.type.text.trim()
      if (/^[A-Z][a-zA-Z0-9]*$/.test(typeText)) {
        // Check if it's a known global/common type like JSX, ValidComponent, string, etc.
        const COMMON_TYPES = new Set([
          'ValidComponent',
          'JSX',
          'SlotClassValue',
          'SlotStyleValue',
          'IconT',
          'Element',
          'Node',
          'HTMLElement',
          'HTMLInputElement',
          'HTMLDivElement',
          'HTMLButtonElement',
          'HTMLSpanElement',
          'HTMLFormElement',
          'Record',
          'Partial',
          'Required',
          'Readonly',
          'Promise',
          'Function',
          'Boolean',
          'String',
          'Number',
          'Object',
          'Array',
          'Set',
          'Map',
          'TextControlVariant',
          'Orientation',
          'ComponentSize',
        ])
        const isGenericParam =
          (typeText === 'T' ||
            typeText === 'M' ||
            typeText === 'K' ||
            typeText === 'V' ||
            typeText === 'U' ||
            /^T[A-Z][a-zA-Z0-9]*$/.test(typeText)) &&
          !COMMON_TYPES.has(typeText)

        if (isGenericParam && !declaredGenericNames.has(typeText)) {
          issues.push({
            severity: 'error',
            componentKey: key,
            partId: part.id,
            message: `Prop "${prop.name}" references undeclared free generic "${typeText}".`,
          })
        }
      }
    }

    // Validate slots uniqueness
    const seenSlotNames = new Set<string>()
    for (const slot of part.slots) {
      if (seenSlotNames.has(slot.name)) {
        issues.push({
          severity: 'error',
          componentKey: key,
          partId: part.id,
          message: `Duplicate slot name "${slot.name}".`,
        })
      }
      seenSlotNames.add(slot.name)
    }

    // Validate runtime targets do not expose internal DOM
    const FORBIDDEN_TARGETS = new Set(['wrapper', 'contentWrapper', 'positioner', 'portal'])
    for (const rt of part.runtime) {
      if (FORBIDDEN_TARGETS.has(rt.target)) {
        issues.push({
          severity: 'error',
          componentKey: key,
          partId: part.id,
          message: `Runtime target exposes forbidden internal DOM target "${rt.target}".`,
        })
      }
    }
  }

  return issues
}

function pathIsAbsoluteOrNonPosix(p: string): boolean {
  if (path.isAbsolute(p)) {
    return true
  }
  if (p.includes('\\')) {
    return true
  }
  return false
}

export function validateAllComponentApis(components: ComponentApi[]): void {
  const allIssues: ValidationIssue[] = []
  for (const component of components) {
    const issues = validateComponentApi(component)
    allIssues.push(...issues)
  }

  const errors = allIssues.filter((i) => i.severity === 'error')
  if (errors.length > 0) {
    throw new ValidationError(allIssues)
  }

  const warnings = allIssues.filter((i) => i.severity === 'warning')
  if (warnings.length > 0) {
    console.warn(`[api-doc] ${warnings.length} warning(s) during validation:`)
    for (const w of warnings) {
      console.warn(`  [WARN] ${w.componentKey}${w.partId ? ` (${w.partId})` : ''}: ${w.message}`)
    }
  }
}
