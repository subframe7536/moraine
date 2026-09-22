import { DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import type { ComponentApi, DefaultValue, PropApi } from './types'

export interface PresentationPropItem {
  name: string
  optional: boolean
  type: string
  anchorId?: string
  isCommonProp?: boolean
  defaultValue?: string
  description?: string
}

export interface PresentationPartSection {
  id: string
  heading: string
  partName: string
  description?: string
  accessText?: string
  rendersDom: boolean
  defaultElement?: string
  polymorphic?: boolean
  genericsSignature?: string
  props: PresentationPropItem[]
}

export interface PresentationItemSection {
  id: string
  heading: string
  description?: string
  genericsSignature?: string
  props: PresentationPropItem[]
}

export interface PresentationDataAttributeTarget {
  target: string
  attributes: Array<{ name: string; description?: string }>
}

export interface PresentationStyleContract {
  slots: string[]
  dataAttributes: PresentationDataAttributeTarget[]
}

export interface ApiReferencePresentationModel {
  componentKey: string
  componentName: string
  kind: 'single' | 'composite'
  description?: string
  parts: PresentationPartSection[]
  item?: PresentationItemSection
  styling: PresentationStyleContract
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

const COMMON_BASE_PROPS = new Set(['as', 'children', 'class', 'style', 'classes', 'styles'])

function formatGenerics(
  generics?: Array<{ name: string; constraint?: string; default?: string }>,
): string | undefined {
  if (!generics?.length) {
    return undefined
  }
  return `<${generics
    .map((generic) => {
      let text = generic.name
      if (generic.constraint) {
        text += ` extends ${generic.constraint}`
      }
      if (generic.default) {
        text += ` = ${generic.default}`
      }
      return text
    })
    .join(', ')}>`
}

function formatPropItem(prop: PropApi, partId?: string): PresentationPropItem {
  return {
    name: prop.name,
    optional: prop.optional,
    type: prop.type,
    ...(partId ? { anchorId: `api-${partId}-${prop.name}` } : {}),
    isCommonProp: COMMON_BASE_PROPS.has(prop.name),
    ...(prop.default ? { defaultValue: formatDefaultValue(prop.default) } : {}),
    ...(prop.description ? { description: prop.description } : {}),
  }
}

function sortProps(props: PropApi[], partId?: string): PresentationPropItem[] {
  return props
    .map((prop) => formatPropItem(prop, partId))
    .sort((left, right) => {
      if (Boolean(left.isCommonProp) !== Boolean(right.isCommonProp)) {
        return left.isCommonProp ? 1 : -1
      }
      return left.name.localeCompare(right.name)
    })
}

export function createApiReferenceModel(
  component: ComponentApi | undefined,
): ApiReferencePresentationModel | null {
  if (!component) {
    return null
  }

  const parts = component.parts.map((part): PresentationPartSection => {
    let accessText: string | undefined
    if (part.access.kind === 'export') {
      accessText = `import { ${part.access.name} } from 'moraine'`
    } else if (part.access.kind === 'attached') {
      accessText = `${part.access.root}.${part.access.member}`
    } else {
      accessText = `const form = ${part.access.factory}(...); form.${part.access.member}`
    }
    const polymorphic = part.props.some((prop) => prop.name === 'as')
    const genericsSignature = formatGenerics(part.generics)

    return {
      id: `api-${part.id}`,
      heading: part.name,
      partName: part.name,
      ...(part.description ? { description: part.description } : {}),
      ...(accessText ? { accessText } : {}),
      rendersDom: part.defaultElement !== undefined,
      ...(part.defaultElement ? { defaultElement: part.defaultElement } : {}),
      ...(polymorphic ? { polymorphic } : {}),
      ...(genericsSignature ? { genericsSignature } : {}),
      props: sortProps(part.props, part.id),
    }
  })

  const itemGenericsSignature = formatGenerics(component.item?.generics)
  const item = component.item?.props.length
    ? {
        id: 'api-items',
        heading: 'Items',
        ...(component.item.description ? { description: component.item.description } : {}),
        ...(itemGenericsSignature ? { genericsSignature: itemGenericsSignature } : {}),
        props: component.item.props
          .map((prop) => ({
            name: prop.name,
            optional: prop.optional,
            type: prop.type,
            ...(prop.default ? { defaultValue: formatDefaultValue(prop.default) } : {}),
            ...(prop.description ? { description: prop.description } : {}),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }
    : undefined

  return {
    componentKey: component.key,
    componentName: component.name,
    kind: component.kind,
    ...(component.description ? { description: component.description } : {}),
    parts,
    ...(item ? { item } : {}),
    styling: {
      slots: component.slots,
      dataAttributes: component.dataAttributes.map((target) => ({
        target: target.target,
        attributes: target.attributes.map((name) => ({
          name,
          ...(DATA_ATTRIBUTE_DESCRIPTIONS[name]
            ? { description: DATA_ATTRIBUTE_DESCRIPTIONS[name] }
            : {}),
        })),
      })),
    },
  }
}

export function getApiReferenceTocEntries(component: ComponentApi | undefined): TocEntry[] {
  const model = createApiReferenceModel(component)
  if (!model) {
    return []
  }

  const entries: TocEntry[] = [{ id: 'api-reference', label: 'API', level: 1 }]
  if (model.kind === 'single') {
    if (model.parts[0]?.props.length) {
      entries.push({ id: 'api-props', label: 'Props', level: 2 })
    }
  } else {
    for (const part of model.parts) {
      entries.push({ id: part.id, label: part.heading, level: 2 })
    }
  }
  if (model.item) {
    entries.push({ id: model.item.id, label: model.item.heading, level: 2 })
  }
  if (model.styling.slots.length || model.styling.dataAttributes.length) {
    entries.push({ id: 'dom-styling', label: 'DOM & State', level: 2 })
  }
  return entries
}
