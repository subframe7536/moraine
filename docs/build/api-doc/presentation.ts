import type { ComponentApi, DefaultValue, PropApi } from './types'

export interface PresentationPropItem {
  name: string
  optional: boolean
  type: string
  defaultValue?: string
  description?: string
  traits?: string[]
}

export interface PresentationSlotItem {
  name: string
  description?: string
}

export interface PresentationRuntimeAttributeItem {
  name: string
  kind: 'data' | 'aria' | 'role' | 'css'
  values?: string[]
  description?: string
}

export interface PresentationRuntimeTargetItem {
  target: string
  attributes: PresentationRuntimeAttributeItem[]
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
  propGroups: PresentationPropGroupSection[]
  slots?: PresentationSlotItem[]
  runtime?: PresentationRuntimeTargetItem[]
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

function formatPropItem(prop: PropApi): PresentationPropItem {
  return {
    name: prop.name,
    optional: prop.optional,
    type: prop.type.text,
    ...(prop.default ? { defaultValue: formatDefaultValue(prop.default) } : {}),
    ...(prop.description ? { description: prop.description } : {}),
    ...(prop.traits?.length ? { traits: prop.traits } : {}),
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

export function createApiReferenceModel(
  component: ComponentApi | undefined,
): ApiReferencePresentationModel | null {
  if (!component) {
    return null
  }

  const parts: PresentationPartSection[] = []

  for (const part of component.parts) {
    // Group props
    const propsByGroup = new Map<string, PresentationPropItem[]>()
    for (const group of GROUP_ORDER) {
      propsByGroup.set(group.group, [])
    }

    for (const prop of part.props) {
      const groupProps = propsByGroup.get(prop.group) ?? []
      groupProps.push(formatPropItem(prop))
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

    const runtime: PresentationRuntimeTargetItem[] = (part.runtime ?? []).map((r) => ({
      target: r.target,
      attributes: r.attributes.map((a) => {
        const attr: PresentationRuntimeAttributeItem = { name: a.name, kind: a.kind }
        if (a.values) {
          attr.values = a.values
        }
        if (a.description) {
          attr.description = a.description
        }
        return attr
      }),
    }))

    let accessText: string | undefined
    if (part.access.kind === 'export') {
      accessText = `import { ${part.access.name} } from 'moraine'`
    } else if (part.access.kind === 'attached') {
      accessText = `${part.access.root}.${part.access.member}`
    } else if (part.access.kind === 'factory-member') {
      accessText = `const form = ${part.access.factory}(...); form.${part.access.member}`
    }

    parts.push({
      id: `api-${part.id}`,
      heading: part.name,
      partName: part.name,
      ...(part.description ? { description: part.description } : {}),
      ...(accessText ? { accessText } : {}),
      propGroups,
      ...(slots.length > 0 ? { slots } : {}),
      ...(runtime.length > 0 ? { runtime } : {}),
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
    // Single component: root part
    const rootPart = model.parts[0]
    if (rootPart) {
      if (
        (rootPart.slots && rootPart.slots.length > 0) ||
        (rootPart.runtime && rootPart.runtime.length > 0)
      ) {
        entries.push({
          id: 'attributes',
          label: 'Attributes',
          level: 2,
        })
      }
      if (rootPart.propGroups.length > 0) {
        entries.push({
          id: 'api-props',
          label: 'Props',
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
