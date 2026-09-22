import { DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions.ts'

import type { ComponentApi, DefaultValue, PartApi, PropApi } from './types.ts'

export interface PresentationPropItem {
  name: string
  optional: boolean
  type: string
  anchorId: string
  isCommonProp?: boolean
  defaultValue?: string
  description?: string
}

export interface PresentationPartSection {
  id: string
  heading: string
  shortHeading: string
  description?: string
  defaultElement?: string
  props: PresentationPropItem[]
}

export interface PresentationItemSection {
  id: string
  heading: string
  description?: string
  genericsSignature?: string
  props: PresentationPropItem[]
}

export interface PresentationAttributeItem {
  name: string
  slots: string[]
  description?: string
}

export interface PresentationAttributesSection {
  id: string
  heading: string
  slots: string[]
  items: PresentationAttributeItem[]
}

export interface ApiReferencePresentationModel {
  componentKey: string
  componentName: string
  kind: 'single' | 'composite'
  description?: string
  parts: PresentationPartSection[]
  item?: PresentationItemSection
  attributes?: PresentationAttributesSection
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

export function normalizeApiType(type: string): string {
  return type.replaceAll('cls_variant0.', '').replaceAll('_$', '')
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

function formatPropItem(prop: PropApi, anchorPrefix: string): PresentationPropItem {
  return {
    name: prop.name,
    optional: prop.optional,
    type: normalizeApiType(prop.type),
    anchorId: `${anchorPrefix}-${prop.name}`,
    isCommonProp: COMMON_BASE_PROPS.has(prop.name),
    ...(prop.default ? { defaultValue: formatDefaultValue(prop.default) } : {}),
    ...(prop.description ? { description: prop.description } : {}),
  }
}

function sortProps(props: PropApi[], anchorPrefix: string): PresentationPropItem[] {
  return props
    .map((prop) => formatPropItem(prop, anchorPrefix))
    .sort((left, right) => {
      if (Boolean(left.isCommonProp) !== Boolean(right.isCommonProp)) {
        return left.isCommonProp ? 1 : -1
      }
      return left.name.localeCompare(right.name)
    })
}

function getPartShortHeading(component: ComponentApi, part: PartApi): string {
  if (part.name === component.name) {
    return component.name
  }
  if (part.access.kind === 'attached' || part.access.kind === 'factory-member') {
    return part.access.member
  }
  return part.name.startsWith(`${component.name}.`)
    ? part.name.slice(component.name.length + 1)
    : part.name
}

function createAttributesSection(
  component: ComponentApi,
): PresentationAttributesSection | undefined {
  if (component.dataAttributes.length === 0) {
    return undefined
  }

  const slotsByAttribute = new Map<string, Set<string>>()
  for (const target of component.dataAttributes) {
    for (const name of target.attributes) {
      const slots = slotsByAttribute.get(name) ?? new Set<string>()
      slots.add(target.target)
      slotsByAttribute.set(name, slots)
    }
  }

  const slotOrder = new Map(component.slots.map((slot, index) => [slot, index]))
  const targetOrder = new Map(
    component.dataAttributes.map((target, index) => [
      target.target,
      component.slots.length + index,
    ]),
  )
  const orderSlots = (slots: Iterable<string>) =>
    [...slots].sort(
      (left, right) =>
        (slotOrder.get(left) ?? targetOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (slotOrder.get(right) ?? targetOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
    )

  const items: PresentationAttributeItem[] = []
  for (const [name, slots] of slotsByAttribute) {
    const item: PresentationAttributeItem = { name, slots: orderSlots(slots) }
    const description = DATA_ATTRIBUTE_DESCRIPTIONS[name]
    if (description) {
      item.description = description
    }
    items.push(item)
  }

  return {
    id: 'api-attributes',
    heading: 'Attributes',
    slots: orderSlots(
      new Set([...component.slots, ...component.dataAttributes.map((target) => target.target)]),
    ),
    items,
  }
}

export function createApiReferenceModel(
  component: ComponentApi | undefined,
): ApiReferencePresentationModel | null {
  if (!component) {
    return null
  }

  const parts = component.parts.map((part): PresentationPartSection => {
    return {
      id: `api-${part.id}`,
      heading: part.name,
      shortHeading: getPartShortHeading(component, part),
      ...(part.description ? { description: part.description } : {}),
      ...(part.defaultElement ? { defaultElement: part.defaultElement } : {}),
      props: sortProps(part.props, `api-${part.id}`),
    }
  })

  const itemGenericsSignature = formatGenerics(component.item?.generics)
  const item = component.item?.props.length
    ? {
        id: 'api-items',
        heading: 'Items',
        ...(component.item.description ? { description: component.item.description } : {}),
        ...(itemGenericsSignature ? { genericsSignature: itemGenericsSignature } : {}),
        props: sortProps(component.item.props, 'api-items'),
      }
    : undefined
  const attributes = createAttributesSection(component)

  return {
    componentKey: component.key,
    componentName: component.name,
    kind: component.kind,
    ...(component.description ? { description: component.description } : {}),
    parts,
    ...(item ? { item } : {}),
    ...(attributes ? { attributes } : {}),
  }
}

export function getApiReferenceTocEntries(component: ComponentApi | undefined): TocEntry[] {
  const model = createApiReferenceModel(component)
  if (!model) {
    return []
  }

  const entries: TocEntry[] = [{ id: 'api-reference', label: 'API', level: 1 }]
  if (model.kind === 'composite') {
    for (const part of model.parts) {
      entries.push({ id: part.id, label: part.shortHeading, level: 2 })
    }
  }
  if (model.item) {
    entries.push({ id: model.item.id, label: model.item.heading, level: 2 })
  }
  if (model.attributes) {
    entries.push({ id: model.attributes.id, label: model.attributes.heading, level: 2 })
  }
  return entries
}
