import { DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions.ts'

import type { ComponentApi, DefaultValue, PartApi, PropApi } from './types.ts'

export interface PresentationPropItem {
  name: string
  optional: boolean
  type: string
  typeHtml?: string
  summaryType: string
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

export function formatExpandedPropType(prop: PropApi): string {
  const type = normalizeApiType(prop.typeDetails ?? prop.type)
  if (!prop.optional) {
    return type
  }

  let depth = 0
  let quote: string | undefined
  let segmentStart = 0
  let hasTopLevelArrow = false
  let hasTopLevelConditional = false
  const segments: string[] = []

  for (let index = 0; index < type.length; index++) {
    const char = type[index]
    if (quote) {
      if (char === '\\') {
        index++
      } else if (char === quote) {
        quote = undefined
      }
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char
    } else if (char === '(' || char === '[' || char === '{' || char === '<') {
      depth++
    } else if (
      char === ')' ||
      char === ']' ||
      char === '}' ||
      (char === '>' && type[index - 1] !== '=')
    ) {
      depth--
    } else if (depth === 0 && type.startsWith('=>', index)) {
      hasTopLevelArrow = true
    } else if (depth === 0 && char === '?') {
      hasTopLevelConditional = true
    } else if (depth === 0 && char === '|') {
      segments.push(type.slice(segmentStart, index).trim())
      segmentStart = index + 1
    }
  }

  segments.push(type.slice(segmentStart).trim())
  if (!hasTopLevelArrow && segments.includes('undefined')) {
    return type
  }

  return `${hasTopLevelArrow || hasTopLevelConditional ? `(${type})` : type} | undefined`
}

const COMMON_BASE_PROPS = new Set(['as', 'children', 'class', 'style', 'classes', 'styles'])

const FORWARDED_DOM_SLOTS: Record<string, Record<string, string>> = {
  'avatar-group': {
    image: 'avatar-image',
    fallback: 'avatar-fallback',
    fallbackContent: 'avatar-fallback-content',
    badge: 'avatar-badge',
  },
  'checkbox-group': {
    container: 'checkbox-container',
    control: 'checkbox-control',
    indicator: 'checkbox-indicator',
    icon: 'checkbox-icon',
    wrapper: 'checkbox-wrapper',
    label: 'checkbox-label',
    description: 'checkbox-description',
  },
  pagination: { controlLabel: 'button-label' },
}

export function getDomSlotName(componentKey: string, slot: string): string {
  const forwarded = FORWARDED_DOM_SLOTS[componentKey]?.[slot]
  if (forwarded) {
    return forwarded
  }
  return slot === 'root'
    ? componentKey
    : `${componentKey}-${slot.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

function formatPropItem(prop: PropApi, anchorPrefix: string): PresentationPropItem {
  return {
    name: prop.name,
    optional: prop.optional,
    type: formatExpandedPropType(prop),
    summaryType: prop.typeDetails
      ? 'Item[]'
      : (prop.type.includes('=>') && !prop.type.trimStart().startsWith('{')) ||
          /^(?:Component(?:OrElement)?|(?:JSX\.)?EventHandler(?:Union)?)</.test(prop.type)
        ? 'function'
        : normalizeApiType(prop.type),
    typeHtml: prop.typeHtml,
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
      slots.add(getDomSlotName(component.key, target.target))
      slotsByAttribute.set(name, slots)
    }
  }

  const slotOrder = new Map(
    component.slots.map((slot, index) => [getDomSlotName(component.key, slot), index]),
  )
  const targetOrder = new Map(
    component.dataAttributes.map((target, index) => [
      getDomSlotName(component.key, target.target),
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
      new Set(
        [...component.slots, ...component.dataAttributes.map((target) => target.target)].map(
          (slot) => getDomSlotName(component.key, slot),
        ),
      ),
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
      props: sortProps(part.props, `api-prop-${part.id}`),
    }
  })

  const attributes = createAttributesSection(component)

  return {
    componentKey: component.key,
    componentName: component.name,
    kind: component.kind,
    ...(component.description ? { description: component.description } : {}),
    parts,
    ...(attributes ? { attributes } : {}),
  }
}

export function getApiReferenceTocEntries(component: ComponentApi | undefined): TocEntry[] {
  const model = createApiReferenceModel(component)
  if (!model) {
    return []
  }

  const entries: TocEntry[] = []
  if (model.attributes) {
    entries.push({ id: model.attributes.id, label: model.attributes.heading, level: 1 })
  }
  entries.push({ id: 'api-reference', label: 'Props', level: 1 })
  if (model.parts.length > 1) {
    for (const part of model.parts) {
      entries.push({ id: part.id, label: part.shortHeading, level: 2 })
    }
  }
  return entries
}
