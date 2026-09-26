import type { ComponentApi } from './types.ts'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  componentKey: string
  partId?: string
  message: string
}

export class ValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    super(
      `API Documentation validation failed:\n${issues
        .map(
          (issue) =>
            `[${issue.severity.toUpperCase()}] Component "${issue.componentKey}"${issue.partId ? ` (part "${issue.partId}")` : ''}: ${issue.message}`,
        )
        .join('\n')}`,
    )
    this.issues = issues
  }
}

export function validateComponentApi(component: ComponentApi): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const addError = (message: string, partId?: string) =>
    issues.push({
      severity: 'error',
      componentKey: component.key,
      ...(partId ? { partId } : {}),
      message,
    })

  if (component.kind !== 'single' && component.kind !== 'composite') {
    addError(`Invalid kind "${String(component.kind)}".`)
  }
  if (!component.parts.length) {
    addError('Component must have at least one documented public part.')
    return issues
  }

  const partIds = new Set<string>()
  for (const part of component.parts) {
    if (partIds.has(part.id)) {
      addError(`Duplicate part ID "${part.id}".`, part.id)
    }
    partIds.add(part.id)
    const propNames = new Set<string>()
    for (const prop of part.props) {
      if (propNames.has(prop.name)) {
        addError(`Duplicate prop name "${prop.name}".`, part.id)
      }
      if (!prop.type.trim()) {
        addError(`Prop "${prop.name}" has an empty type.`, part.id)
      }
      propNames.add(prop.name)
    }
    if (component.key === 'form') {
      if (part.access.kind !== 'factory-member' || part.access.factory !== 'createForm') {
        addError('Form parts must be createForm factory members.', part.id)
      }
    }
  }

  for (const prop of component.item?.props ?? []) {
    if (!prop.type.trim()) {
      addError(`Item prop "${prop.name}" has an empty type.`)
    }
  }

  const slots = new Set<string>()
  for (const slot of component.slots) {
    if (slots.has(slot)) {
      addError(`Duplicate slot "${slot}".`)
    }
    slots.add(slot)
  }
  const publicTargets = new Set(slots)
  for (const part of component.parts) {
    if (part.access.kind === 'attached') {
      publicTargets.add(
        `${part.access.member[0]?.toLowerCase() ?? ''}${part.access.member.slice(1)}`,
      )
    }
  }

  const validateTargets = (targets: Array<{ target: string; values: string[] }>, label: string) => {
    const names = new Set<string>()
    for (const target of targets) {
      if (names.has(target.target)) {
        addError(`Duplicate ${label} target "${target.target}".`)
      }
      names.add(target.target)
      if (!publicTargets.has(target.target)) {
        addError(`${label} target "${target.target}" is not a public styling target.`)
      }
      if (new Set(target.values).size !== target.values.length) {
        addError(`${label} target "${target.target}" contains duplicate names.`)
      }
    }
  }

  validateTargets(
    component.dataAttributes.map((target) => ({
      target: target.target,
      values: target.attributes,
    })),
    'data attribute',
  )
  return issues
}

export function validateAllComponentApis(components: ComponentApi[]): void {
  const issues = components.flatMap(validateComponentApi)
  if (issues.some((issue) => issue.severity === 'error')) {
    throw new ValidationError(issues)
  }
}
