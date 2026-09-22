import type { ComponentApi, DefaultValue, PropApi, RuntimeAttributeValueApi } from './types'

export interface PresentationPropItem {
  name: string
  optional: boolean
  type: string
  group?: string
  anchorId?: string
  isCommonProp?: boolean
  defaultValue?: string
  description?: string
  traits?: string[]
  stateRole?: string
}

export interface PresentationSlotItem {
  name: string
  description?: string
}

export interface PresentationRuntimeAttributeItem {
  name: string
  kind: 'data' | 'aria' | 'role'
  targets: string[]
  value: string
  description?: string
}

export interface PresentationRuntimeTargetItem {
  name: string
  slot?: string
  selector?: string
  element?: string
  description?: string
  condition?: string
}

export interface PresentationCssVariableItem {
  name: string
  target: string
  description?: string
  condition?: string
}

export interface PresentationPropGroupSection {
  group: string
  heading: string
  id: string
  props: PresentationPropItem[]
}

export interface PresentationPartSection {
  id: string
  heading: string
  partName: string
  description?: string
  accessText?: string
  rendersDom: boolean
  defaultElement?: string
  polymorphic?: boolean | string
  genericsSignature?: string
  allProps: PresentationPropItem[]
  propGroups: PresentationPropGroupSection[]
  slots?: PresentationSlotItem[]
  anatomy?: PresentationRuntimeTargetItem[]
  dataAttributes?: PresentationRuntimeAttributeItem[]
  accessibility?: PresentationRuntimeAttributeItem[]
  cssVariables?: PresentationCssVariableItem[]
}

export interface PresentationItemSection {
  id: string
  heading: string
  description?: string
  props: PresentationPropItem[]
}

export interface ApiReferencePresentationModel {
  componentKey: string
  componentName: string
  kind: 'single' | 'composite'
  description?: string
  parts: PresentationPartSection[]
  item?: PresentationItemSection
}

export interface TocEntry {
  id: string
  label: string
  level: number
}

export function formatDefaultValue(def?: DefaultValue): string | undefined {
  if (!def) {
    return undefined
  }
  if (def.kind === 'literal') {
    if (def.value === '') {
      return '""'
    }
    if (typeof def.value === 'string') {
      return `'${def.value}'`
    }
    return String(def.value)
  }
  return def.text
}

const COMMON_BASE_PROPS = new Set(['class', 'style', 'classes', 'styles', 'as', 'children'])

function formatGenerics(
  generics?: Array<{ name: string; constraint?: string; default?: string }>,
): string | undefined {
  if (!generics || generics.length === 0) {
    return undefined
  }
  const params = generics.map((g) => {
    let s = g.name
    if (g.constraint) {
      s += ` extends ${g.constraint}`
    }
    if (g.default) {
      s += ` = ${g.default}`
    }
    return s
  })
  return `<${params.join(', ')}>`
}

function formatPropItem(prop: PropApi, partId?: string): PresentationPropItem {
  return {
    name: prop.name,
    optional: prop.optional,
    type: prop.type.text,
    group: prop.group,
    ...(partId ? { anchorId: `api-${partId}-${prop.name}` } : {}),
    isCommonProp: COMMON_BASE_PROPS.has(prop.name),
    ...(prop.default ? { defaultValue: formatDefaultValue(prop.default) } : {}),
    ...(prop.description ? { description: prop.description } : {}),
    ...(prop.traits?.length ? { traits: prop.traits } : {}),
    ...(prop.state ? { stateRole: prop.state.role } : {}),
  }
}

const GROUP_ORDER: Array<{ group: string; label: string }> = [
  { group: 'state', label: 'State' },
  { group: 'data', label: 'Data' },
  { group: 'behavior', label: 'Behavior' },
  { group: 'form', label: 'Form' },
  { group: 'rendering', label: 'Rendering' },
  { group: 'styling', label: 'Styling' },
]

export function formatRuntimeValue(value: RuntimeAttributeValueApi): string {
  if (value.kind === 'presence') {
    return 'Presence'
  }
  if (value.kind === 'literal') {
    return value.value
  }
  if (value.kind === 'enum') {
    return value.values.join(' | ')
  }
  if (value.kind === 'boolean') {
    return 'boolean'
  }
  return 'Dynamic'
}

function groupRuntimeAttributes(
  part: ComponentApi['parts'][number],
  kind: 'data' | 'accessibility',
): PresentationRuntimeAttributeItem[] {
  const grouped = new Map<string, PresentationRuntimeAttributeItem>()
  for (const target of part.runtime) {
    for (const attribute of target.attributes) {
      const matches =
        kind === 'data'
          ? attribute.kind === 'data'
          : attribute.kind === 'aria' || attribute.kind === 'role'
      if (!matches) {
        continue
      }
      const value = formatRuntimeValue(attribute.value)
      const key = `${attribute.kind}:${attribute.name}:${value}:${attribute.description ?? ''}`
      const existing = grouped.get(key)
      if (existing) {
        existing.targets.push(target.name)
      } else {
        grouped.set(key, {
          name: attribute.name,
          kind: attribute.kind,
          targets: [target.name],
          value,
          ...(attribute.description ? { description: attribute.description } : {}),
        })
      }
    }
  }
  return [...grouped.values()].sort((left, right) => {
    const nameOrder = left.name.localeCompare(right.name)
    return nameOrder === 0
      ? left.targets.join(',').localeCompare(right.targets.join(','))
      : nameOrder
  })
}

export function createApiReferenceModel(
  component: ComponentApi | undefined,
): ApiReferencePresentationModel | null {
  if (!component) {
    return null
  }

  const parts: PresentationPartSection[] = []

  for (const part of component.parts) {
    // Collect all props with component-specific first, common props last
    const allProps = part.props
      .map((p) => formatPropItem(p, part.id))
      .sort((a, b) => {
        if (Boolean(a.isCommonProp) !== Boolean(b.isCommonProp)) {
          return a.isCommonProp ? 1 : -1
        }
        return a.name.localeCompare(b.name)
      })

    // Group props
    const propsByGroup = new Map<string, PresentationPropItem[]>()
    for (const group of GROUP_ORDER) {
      propsByGroup.set(group.group, [])
    }

    for (const prop of part.props) {
      const groupProps = propsByGroup.get(prop.group) ?? []
      groupProps.push(formatPropItem(prop, part.id))
      propsByGroup.set(prop.group, groupProps)
    }

    const propGroups: PresentationPropGroupSection[] = []
    for (const { group, label } of GROUP_ORDER) {
      const items = propsByGroup.get(group) ?? []
      if (items.length > 0) {
        // Sort props within group alphabetically
        items.sort((a, b) => a.name.localeCompare(b.name))
        propGroups.push({
          group,
          heading: label,
          id: `api-${part.id}-${group}`,
          props: items,
        })
      }
    }

    const slots: PresentationSlotItem[] = (part.slots ?? []).map((s) => {
      const item: PresentationSlotItem = { name: s.name }
      if (s.description) {
        item.description = s.description
      }
      return item
    })

    const anatomy: PresentationRuntimeTargetItem[] = part.runtime.map((target) => ({
      name: target.name,
      ...(target.slot ? { slot: target.slot } : {}),
      ...(target.selector ? { selector: target.selector } : {}),
      ...(target.element ? { element: target.element } : {}),
      ...(target.description ? { description: target.description } : {}),
      ...(target.condition ? { condition: target.condition } : {}),
    }))
    const dataAttributes = groupRuntimeAttributes(part, 'data')
    const accessibility = groupRuntimeAttributes(part, 'accessibility')
    const cssVariables: PresentationCssVariableItem[] = part.cssVariables.map((variable) => ({
      name: variable.name,
      target: variable.target,
      ...(variable.description ? { description: variable.description } : {}),
      ...(variable.condition ? { condition: variable.condition } : {}),
    }))

    let accessText: string | undefined
    if (part.access.kind === 'export') {
      accessText = `import { ${part.access.name} } from 'moraine'`
    } else if (part.access.kind === 'attached') {
      accessText = `${part.access.root}.${part.access.member}`
    } else if (part.access.kind === 'factory-member') {
      accessText = `const form = ${part.access.factory}(...); form.${part.access.member}`
    }

    const polymorphic =
      typeof part.rendering?.polymorphic === 'object'
        ? part.rendering.polymorphic.name
        : part.rendering?.polymorphic

    const genericsSignature = formatGenerics(part.generics)

    parts.push({
      id: `api-${part.id}`,
      heading: part.name,
      partName: part.name,
      ...(part.description ? { description: part.description } : {}),
      ...(accessText ? { accessText } : {}),
      rendersDom: part.rendering?.rendersDom !== false,
      ...(part.rendering?.defaultElement ? { defaultElement: part.rendering.defaultElement } : {}),
      ...(polymorphic ? { polymorphic } : {}),
      ...(genericsSignature ? { genericsSignature } : {}),
      allProps,
      propGroups,
      ...(slots.length > 0 ? { slots } : {}),
      ...(anatomy.length > 0 ? { anatomy } : {}),
      ...(dataAttributes.length > 0 ? { dataAttributes } : {}),
      ...(accessibility.length > 0 ? { accessibility } : {}),
      ...(cssVariables.length > 0 ? { cssVariables } : {}),
    })
  }

  let itemSection: PresentationItemSection | undefined
  if (component.item && component.item.props.length > 0) {
    const sortedItemProps = component.item.props
      .map((p) => ({
        name: p.name,
        optional: p.optional,
        type: p.type.text,
        ...(p.default ? { defaultValue: formatDefaultValue(p.default) } : {}),
        ...(p.description ? { description: p.description } : {}),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    itemSection = {
      id: 'api-items',
      heading: 'Items',
      ...(component.item.description ? { description: component.item.description } : {}),
      props: sortedItemProps,
    }
  }

  return {
    componentKey: component.key,
    componentName: component.name,
    kind: component.kind,
    ...(component.description ? { description: component.description } : {}),
    parts,
    ...(itemSection ? { item: itemSection } : {}),
  }
}

export function getApiReferenceTocEntries(component: ComponentApi | undefined): TocEntry[] {
  const model = createApiReferenceModel(component)
  if (!model) {
    return []
  }

  const entries: TocEntry[] = []

  if (model.kind === 'single') {
    // Single component: root part (Props first, then DOM & State)
    const rootPart = model.parts[0]
    if (rootPart) {
      if (rootPart.propGroups.length > 0 || rootPart.allProps?.length > 0) {
        entries.push({
          id: 'api-props',
          label: 'Props',
          level: 2,
        })
      }
      const hasDomState =
        (rootPart.dataAttributes && rootPart.dataAttributes.length > 0) ||
        (rootPart.accessibility && rootPart.accessibility.length > 0) ||
        (rootPart.cssVariables && rootPart.cssVariables.length > 0) ||
        rootPart.rendersDom === false
      if (hasDomState) {
        entries.push({
          id: 'dom-styling',
          label: 'DOM & State',
          level: 2,
        })
      }
    }
    if (model.item) {
      entries.push({
        id: model.item.id,
        label: model.item.heading,
        level: 2,
      })
    }
  } else {
    // Composite component: part headings
    for (const part of model.parts) {
      entries.push({
        id: part.id,
        label: part.heading,
        level: 2,
      })
    }
    if (model.item) {
      entries.push({
        id: model.item.id,
        label: model.item.heading,
        level: 2,
      })
    }
  }

  return entries.length > 0 ? [{ id: 'api-reference', label: 'API', level: 1 }, ...entries] : []
}
