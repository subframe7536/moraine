import { FACTORY_COMPONENTS } from './registry.ts'
import type { ComponentApi } from './types.ts'

function validateComponentApi(component: ComponentApi): string[] {
  const issues: string[] = []
  const addError = (message: string, partId?: string) =>
    issues.push(
      `[ERROR] Component "${component.key}"${partId ? ` (part "${partId}")` : ''}: ${message}`,
    )

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
    const factoryComponent = FACTORY_COMPONENTS[component.key]
    if (factoryComponent) {
      if (
        part.access.kind !== 'factory-member' ||
        part.access.factory !== factoryComponent.factory
      ) {
        addError(
          `${component.name} parts must be ${factoryComponent.factory} factory members.`,
          part.id,
        )
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

  const targets = new Set<string>()
  for (const { target, attributes } of component.dataAttributes) {
    if (targets.has(target)) {
      addError(`Duplicate data attribute target "${target}".`)
    }
    targets.add(target)
    if (!publicTargets.has(target)) {
      addError(`data attribute target "${target}" is not a public styling target.`)
    }
    if (new Set(attributes).size !== attributes.length) {
      addError(`data attribute target "${target}" contains duplicate names.`)
    }
  }
  return issues
}

export function validateAllComponentApis(components: ComponentApi[]): void {
  const issues = components.flatMap(validateComponentApi)
  if (issues.length) {
    throw new Error(`API Documentation validation failed:\n${issues.join('\n')}`)
  }
}
