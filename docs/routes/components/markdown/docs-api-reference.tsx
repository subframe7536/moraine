import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, Icon, Input, Select, cn } from '../../../../src/index.ts'
import { createMediaQuery } from '../../../../src/shared/use-media-query.ts'
import { getApiReferenceTocEntries } from '../../../build/api-doc/reference-sections.ts'
import type {
  ApiAttributeDoc,
  ComponentDoc,
  PropDoc,
  SlotDoc,
} from '../../../build/api-doc/types.ts'
import {
  MARKDOWN_ANCHOR_HEADING_CLASS,
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../../../build/markdown/shared.class.ts'

export interface PropsTableProps {
  sections: PropsTableSection[]
}

export interface InheritedGroupDoc {
  from: string
  props: PropDoc[]
}

export interface ComponentPropsDoc {
  own: PropDoc[]
  inherited: InheritedGroupDoc[]
}

export interface PropsTableSection {
  id: string
  heading: string
  description?: string
  nameColumn?: string
  badges?: string[]
  props: PropDoc[]
  slots?: SlotReferenceDoc[]
  groups?: {
    description: string
    props: PropDoc[]
  }[]
}

export type SlotReferenceDoc = SlotDoc

type AttributeGroupKind = 'css' | 'data' | 'aria'

interface FlatAttributeItem {
  slotName: string
  kind: AttributeGroupKind
  attribute: ApiAttributeDoc
}

function normalizeType(type: string): string {
  let result = type
  result = result.replaceAll('cls_variant0.', '').replaceAll('_$', '')
  return result
}

function getSlotMetadataCount(slot: SlotReferenceDoc): number {
  return slot.cssVariables.length + slot.dataAttributes.length + slot.ariaAttributes.length
}

function formatAttributeCount(count: number): string {
  return count === 1 ? '1 attribute' : `${count} attributes`
}

function getAttributeGroupTone(kind: AttributeGroupKind): {
  dot: string
  pill: string
  badge: string
} {
  if (kind === 'css') {
    return {
      dot: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
      pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:border-emerald-500/50',
      badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    }
  }

  if (kind === 'aria') {
    return {
      dot: 'text-sky-700 bg-sky-500/10 border-sky-500/20',
      pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:border-sky-500/50',
      badge: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/20',
    }
  }

  return {
    dot: 'text-primary bg-primary/10 border-primary/20',
    pill: 'bg-primary/10 text-primary border-primary/25 hover:border-primary/50',
    badge: 'text-primary bg-primary/10 border-primary/20',
  }
}

export function createDocsApiReferenceModel(
  apiDoc: ComponentDoc | undefined,
): DocsApiReferenceModel {
  const sections: PropsTableSection[] = []
  const ownProps = apiDoc?.props.own ?? []
  const inheritedProps = apiDoc?.props.inherited ?? []
  const itemDoc = apiDoc?.item
  const hasSlots = Boolean(apiDoc?.slots.length)

  if (!apiDoc) {
    return { sections }
  }

  if (hasSlots) {
    sections.push({
      id: 'attributes',
      heading: 'Attributes',
      slots: apiDoc.slots,
      props: [],
    })
  }

  if (ownProps.length > 0) {
    sections.push({
      id: 'api-props',
      heading: 'Props',
      props: ownProps,
    })
  }

  if (itemDoc) {
    sections.push({
      id: 'api-items',
      heading: 'Items',
      description: itemDoc.description,
      props: itemDoc.props,
    })
  }

  if (inheritedProps.length > 0) {
    sections.push({
      id: 'api-inherited',
      heading: 'Inherited',
      props: [],
      groups: inheritedProps.map((group) => ({
        description: `From ${group.from}`,
        props: group.props,
      })),
    })
  }

  return { sections }
}

export function getDocsApiReferenceTocEntries(apiDoc: ComponentDoc | undefined) {
  return getApiReferenceTocEntries(apiDoc)
}

function PropRows(tableProps: {
  props: PropDoc[]
  nameColumn?: string
  nameColumnClass?: string
  minimal?: boolean
  class?: string
}): JSX.Element {
  return (
    <div
      class={cn(
        'mb-6 mt-4 border border-border/60 rounded-xl bg-card/30 overflow-x-auto',
        tableProps.class,
      )}
    >
      <table class="text-sm m-0 w-full border-collapse">
        <thead>
          <tr class="text-[0.7rem] text-muted-foreground/80 tracking-wider text-left bg-muted/40 uppercase">
            <th class={cn('font-semibold px-3.5 py-2.5', tableProps.nameColumnClass)}>
              {tableProps.nameColumn ?? 'Prop'}
            </th>
            <Show when={!tableProps.minimal}>
              <th class="font-semibold px-3.5 py-2.5">Type</th>
            </Show>
            <Show when={!tableProps.minimal}>
              <th class="font-semibold px-3.5 py-2.5">Default</th>
            </Show>
            <th class="font-semibold px-3.5 py-2.5">Description</th>
          </tr>
        </thead>
        <tbody>
          <For each={tableProps.props}>
            {(prop) => (
              <tr class="border-t border-border/40 transition-colors hover:bg-muted/30">
                <td class="text-xs text-primary font-medium font-mono px-3.5 py-2.5 whitespace-nowrap">
                  {prop.name}
                  {prop.required ? '*' : ''}
                </td>
                <Show when={!tableProps.minimal}>
                  <td class="px-3.5 py-2.5">
                    <code class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
                      {normalizeType(prop.type)}
                    </code>
                  </td>
                </Show>
                <Show when={!tableProps.minimal}>
                  <td class="text-xs text-muted-foreground px-3.5 py-2.5">
                    <Show
                      when={prop.defaultValue}
                      fallback={<span class="text-muted-foreground/60">—</span>}
                    >
                      <code class="font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
                        {prop.defaultValue}
                      </code>
                    </Show>
                  </td>
                </Show>
                <td class="text-xs text-muted-foreground leading-relaxed px-3.5 py-2.5">
                  <Show
                    when={prop.description}
                    fallback={<span class="text-muted-foreground/60">—</span>}
                  >
                    {(description) => (
                      <div
                        // oxlint-disable-next-line subf/solid-no-innerhtml
                        innerHTML={description()}
                      />
                    )}
                  </Show>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

function AttributeRow(props: {
  attribute: ApiAttributeDoc
  kind: AttributeGroupKind
  slotName?: string
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
}): JSX.Element {
  const isCopiedName = () =>
    props.copiedKey === `name:${props.attribute.name}:${props.slotName ?? ''}`
  const tone = createMemo(() => getAttributeGroupTone(props.kind))

  return (
    <tr class="group border-t border-border/40 transition-colors hover:bg-muted/30">
      <td class="px-3.5 py-3 align-top whitespace-nowrap">
        <div class="flex gap-2 items-center">
          <button
            type="button"
            onClick={() =>
              props.onCopy(
                props.attribute.name,
                `name:${props.attribute.name}:${props.slotName ?? ''}`,
              )
            }
            class={cn(
              'group/btn text-xs font-medium font-mono px-2 py-1 text-left border rounded-md flex gap-1.5 cursor-pointer transition-all items-center',
              tone().pill,
            )}
            title="Click to copy attribute name"
          >
            <span>{props.attribute.name}</span>
            <Icon
              name={isCopiedName() ? 'i-lucide:check' : 'i-lucide:copy'}
              class={cn(
                'shrink-0 size-3 transition-opacity',
                isCopiedName()
                  ? 'text-emerald-600 opacity-100 dark:text-emerald-400'
                  : 'text-muted-foreground opacity-0 group-hover/btn:opacity-100',
              )}
            />
          </button>
          <Show when={isCopiedName()}>
            <span class="text-[0.68rem] text-emerald-600 font-medium animate-fade-in dark:text-emerald-400">
              Copied!
            </span>
          </Show>
        </div>
      </td>
      <Show when={props.slotName}>
        <td class="px-3.5 py-3 align-top whitespace-nowrap">
          <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 border border-border/40 rounded-md bg-muted/60">
            {props.slotName}
          </span>
        </td>
      </Show>
      <td class="px-3.5 py-3 align-top whitespace-nowrap">
        <code class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
          {normalizeType(props.attribute.type)}
        </code>
      </td>
      <td class="px-3.5 py-3 align-top min-w-64">
        <Show
          when={props.attribute.description}
          fallback={<span class="text-muted-foreground/60">—</span>}
        >
          <div
            class="text-xs text-muted-foreground leading-relaxed [&_code]:(text-[0.7rem] font-mono px-1 py-0.2 border border-border/40 rounded bg-muted/80)"
            // oxlint-disable-next-line subf/solid-no-innerhtml
            innerHTML={props.attribute.description}
          />
        </Show>
      </td>
    </tr>
  )
}

function AttributeCategoryTable(props: {
  kind: AttributeGroupKind
  title: string
  nameColumn: string
  attributes: ApiAttributeDoc[]
  slotName?: string
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
}): JSX.Element {
  const tone = createMemo(() => getAttributeGroupTone(props.kind))

  return (
    <section class="border border-border/60 rounded-xl bg-card/30 overflow-hidden">
      <div class="px-3.5 py-2.5 border-b border-border/50 bg-muted/40 flex gap-3 items-center justify-between">
        <div class="flex gap-2 min-w-0 items-center">
          <span aria-hidden="true" class={cn('border rounded-full shrink-0 size-2', tone().dot)} />
          <h4 class="text-[0.7rem] text-foreground tracking-wider font-semibold truncate uppercase">
            {props.title}
          </h4>
        </div>
        <span
          class={cn(
            'text-[0.68rem] font-medium font-mono px-1.5 py-0.5 border rounded-md shrink-0',
            tone().badge,
          )}
        >
          {props.attributes.length}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="text-sm m-0 w-full border-collapse">
          <thead>
            <tr class="text-[0.68rem] text-muted-foreground/80 tracking-wider text-left bg-muted/20 uppercase">
              <th class="font-semibold px-3.5 py-2.5">{props.nameColumn}</th>
              <Show when={props.slotName}>
                <th class="font-semibold px-3.5 py-2.5">Slot</th>
              </Show>
              <th class="font-semibold px-3.5 py-2.5">Type</th>
              <th class="font-semibold px-3.5 py-2.5">Description</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.attributes}>
              {(attr) => (
                <AttributeRow
                  attribute={attr}
                  kind={props.kind}
                  slotName={props.slotName}
                  copiedKey={props.copiedKey}
                  onCopy={props.onCopy}
                />
              )}
            </For>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AttributesSection(props: { section: PropsTableSection }): JSX.Element {
  const isMobile = createMediaQuery('(max-width: 767px)', false)
  const slotOptions = createMemo(() => props.section.slots ?? [])
  const firstSlotName = createMemo(() => slotOptions()[0]?.name)

  const [selectedSlotName, setSelectedSlotName] = createSignal<string | undefined>()
  const [viewMode, setViewMode] = createSignal<'slot' | 'all'>('slot')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null)

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => {
        if (copiedKey() === key) {
          setCopiedKey(null)
        }
      }, 1600)
    } catch {}
  }

  const activeSlotName = createMemo(() => {
    const candidate = selectedSlotName()
    if (candidate && slotOptions().some((slot) => slot.name === candidate)) {
      return candidate
    }
    return firstSlotName()
  })

  const activeSlot = createMemo(() => slotOptions().find((slot) => slot.name === activeSlotName()))

  const totalAttributeCount = createMemo(() =>
    slotOptions().reduce((sum, slot) => sum + getSlotMetadataCount(slot), 0),
  )

  const flatAttributes = createMemo<FlatAttributeItem[]>(() => {
    const query = searchQuery().trim().toLowerCase()
    const items: FlatAttributeItem[] = []

    for (const slot of slotOptions()) {
      for (const attr of slot.cssVariables) {
        if (
          !query ||
          attr.name.toLowerCase().includes(query) ||
          attr.description?.toLowerCase().includes(query) ||
          slot.name.toLowerCase().includes(query)
        ) {
          items.push({ slotName: slot.name, kind: 'css', attribute: attr })
        }
      }
      for (const attr of slot.dataAttributes) {
        if (
          !query ||
          attr.name.toLowerCase().includes(query) ||
          attr.description?.toLowerCase().includes(query) ||
          slot.name.toLowerCase().includes(query)
        ) {
          items.push({ slotName: slot.name, kind: 'data', attribute: attr })
        }
      }
      for (const attr of slot.ariaAttributes) {
        if (
          !query ||
          attr.name.toLowerCase().includes(query) ||
          attr.description?.toLowerCase().includes(query) ||
          slot.name.toLowerCase().includes(query)
        ) {
          items.push({ slotName: slot.name, kind: 'aria', attribute: attr })
        }
      }
    }

    return items
  })

  const filteredSlotAttributes = createMemo(() => {
    const slot = activeSlot()
    if (!slot) {
      return { css: [], data: [], aria: [] }
    }
    const query = searchQuery().trim().toLowerCase()
    const filterList = (list: ApiAttributeDoc[]) =>
      query
        ? list.filter(
            (attr) =>
              attr.name.toLowerCase().includes(query) ||
              attr.description?.toLowerCase().includes(query) ||
              attr.type.toLowerCase().includes(query),
          )
        : list

    return {
      css: filterList(slot.cssVariables),
      data: filterList(slot.dataAttributes),
      aria: filterList(slot.ariaAttributes),
    }
  })

  const filteredSlotMatchCount = createMemo(() => {
    const current = filteredSlotAttributes()
    return current.css.length + current.data.length + current.aria.length
  })

  return (
    <div class="mt-4 space-y-4">
      {/* Control Bar: Search & View Mode Toggle */}
      <div class="flex flex-col gap-2.5 sm:(flex-row items-center justify-between)">
        <div class="flex-1 max-w-sm relative">
          <Input
            size="sm"
            placeholder="Filter attributes & slots..."
            leading="i-lucide:search"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="text-xs w-full"
          />
          <Show when={searchQuery()}>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              class="text-xs text-muted-foreground p-0.5 rounded cursor-pointer right-2.5 top-1/2 absolute hover:text-foreground -translate-y-1/2"
              aria-label="Clear filter"
            >
              <Icon name="i-lucide:x" class="size-3.5" />
            </button>
          </Show>
        </div>

        <div class="p-1 border border-border/50 rounded-lg bg-muted/40 flex shrink-0 gap-1 items-center self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('slot')}
            class={cn(
              'text-xs font-medium px-2.5 py-1 rounded-md flex gap-1.5 cursor-pointer transition-colors items-center',
              viewMode() === 'slot'
                ? 'text-foreground border border-border/50 bg-background shadow-xs'
                : 'text-muted-foreground border border-transparent hover:text-foreground',
            )}
          >
            <Icon name="i-lucide:layout-grid" class="size-3" />
            <span>By Slot</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            class={cn(
              'text-xs font-medium px-2.5 py-1 rounded-md flex gap-1.5 cursor-pointer transition-colors items-center',
              viewMode() === 'all'
                ? 'text-foreground border border-border/50 bg-background shadow-xs'
                : 'text-muted-foreground border border-transparent hover:text-foreground',
            )}
          >
            <Icon name="i-lucide:list" class="size-3" />
            <span>All Slots</span>
            <span class="text-[0.65rem] text-muted-foreground font-mono px-1.5 py-0.2 rounded-full bg-muted">
              {totalAttributeCount()}
            </span>
          </button>
        </div>
      </div>

      {/* Mode 1: By Slot View */}
      <Show when={viewMode() === 'slot'}>
        <Show
          when={isMobile()}
          fallback={
            <div class="scrollbar-none pb-1 flex gap-1.5 items-center overflow-x-auto">
              <For each={slotOptions()}>
                {(slot) => {
                  const count = getSlotMetadataCount(slot)
                  const isSelected = () => activeSlotName() === slot.name
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedSlotName(slot.name)}
                      class={cn(
                        'text-xs font-mono px-3 py-1.5 border rounded-lg flex shrink-0 gap-2 cursor-pointer transition-all items-center',
                        isSelected()
                          ? 'text-primary-foreground font-semibold border-primary bg-primary shadow-xs'
                          : count > 0
                            ? 'bg-card/60 text-muted-foreground border-border/60 hover:(bg-muted/60 text-foreground border-border)'
                            : 'bg-muted/20 text-muted-foreground/50 border-border/30 hover:text-muted-foreground',
                      )}
                    >
                      <span>{slot.name}</span>
                      <span
                        class={cn(
                          'text-[0.65rem] font-medium font-sans px-1.5 py-0.2 rounded-full',
                          isSelected()
                            ? 'text-primary-foreground bg-primary-foreground/20'
                            : count > 0
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-muted/40 text-muted-foreground/40',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                }}
              </For>
            </div>
          }
        >
          <Select
            options={slotOptions().map((slot) => ({
              label: `${slot.name} (${getSlotMetadataCount(slot)})`,
              value: slot.name,
            }))}
            value={activeSlotName() ?? null}
            size="sm"
            placeholder="Select a slot"
            classes={{
              root: 'w-full',
              control: 'w-full',
              input: 'font-mono text-xs',
            }}
            onChange={(value) => {
              if (typeof value === 'string') {
                setSelectedSlotName(value)
              }
            }}
          />
        </Show>

        <Show when={activeSlot()}>
          {(slot) => {
            const hasData = () => filteredSlotMatchCount() > 0
            const attributes = filteredSlotAttributes()

            return (
              <div class="pt-1 space-y-4">
                <header class="pb-3 border-b border-border/50">
                  <div class="flex flex-wrap gap-x-2.5 gap-y-1 items-baseline">
                    <span class="text-[0.68rem] text-muted-foreground/80 tracking-wider font-semibold uppercase">
                      Slot
                    </span>
                    <code class="text-base text-foreground font-mono font-semibold">
                      {slot().name}
                    </code>
                    <span class="text-xs text-muted-foreground font-medium font-mono px-2 py-0.5 border border-border/50 rounded-md bg-muted/60">
                      {formatAttributeCount(getSlotMetadataCount(slot()))}
                    </span>
                  </div>

                  <Show when={slot().description}>
                    {(description) => (
                      <div
                        class="text-sm text-muted-foreground leading-relaxed mt-2 max-w-2xl [&_code]:(text-xs text-foreground font-mono px-1 py-0.5 border border-border/40 rounded-md bg-muted/70) [&_a]:text-primary [&_p]:m-0"
                        // oxlint-disable-next-line subf/solid-no-innerhtml
                        innerHTML={description()}
                      />
                    )}
                  </Show>
                </header>

                <Show
                  when={hasData()}
                  fallback={
                    <div class="text-xs text-muted-foreground px-4 py-8 text-center border border-border/60 rounded-xl border-dashed bg-muted/15">
                      <Show when={searchQuery()} fallback="No attribute metadata for this slot.">
                        No attributes matching "{searchQuery()}" in slot "{slot().name}".
                      </Show>
                    </div>
                  }
                >
                  <div class="space-y-4">
                    <Show when={attributes.css.length > 0}>
                      <AttributeCategoryTable
                        kind="css"
                        title="CSS Variables"
                        nameColumn="CSS Variable"
                        attributes={attributes.css}
                        copiedKey={copiedKey()}
                        onCopy={handleCopy}
                      />
                    </Show>

                    <Show when={attributes.data.length > 0}>
                      <AttributeCategoryTable
                        kind="data"
                        title="Data Attributes"
                        nameColumn="Data Attribute"
                        attributes={attributes.data}
                        copiedKey={copiedKey()}
                        onCopy={handleCopy}
                      />
                    </Show>

                    <Show when={attributes.aria.length > 0}>
                      <AttributeCategoryTable
                        kind="aria"
                        title="ARIA Attributes"
                        nameColumn="ARIA Attribute"
                        attributes={attributes.aria}
                        copiedKey={copiedKey()}
                        onCopy={handleCopy}
                      />
                    </Show>
                  </div>
                </Show>
              </div>
            )
          }}
        </Show>
      </Show>

      {/* Mode 2: All Slots View */}
      <Show when={viewMode() === 'all'}>
        <Show
          when={flatAttributes().length > 0}
          fallback={
            <div class="text-xs text-muted-foreground px-4 py-8 text-center border border-border/60 rounded-xl border-dashed bg-muted/15">
              No attributes matching "{searchQuery()}".
            </div>
          }
        >
          <div class="border border-border/60 rounded-xl bg-card/30 overflow-hidden">
            <div class="px-3.5 py-2.5 border-b border-border/50 bg-muted/40 flex items-center justify-between">
              <span class="text-xs text-foreground tracking-wider font-semibold uppercase">
                All Slot Attributes
              </span>
              <span class="text-xs text-muted-foreground font-mono">
                {flatAttributes().length} items
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="text-sm m-0 w-full border-collapse">
                <thead>
                  <tr class="text-[0.68rem] text-muted-foreground/80 tracking-wider text-left bg-muted/20 uppercase">
                    <th class="font-semibold px-3.5 py-2.5">Attribute</th>
                    <th class="font-semibold px-3.5 py-2.5">Slot</th>
                    <th class="font-semibold px-3.5 py-2.5">Type</th>
                    <th class="font-semibold px-3.5 py-2.5">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={flatAttributes()}>
                    {(item) => (
                      <AttributeRow
                        attribute={item.attribute}
                        kind={item.kind}
                        slotName={item.slotName}
                        copiedKey={copiedKey()}
                        onCopy={handleCopy}
                      />
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  )
}

export function HeadingWithAnchor(props: {
  id: string
  children: JSX.Element
  level: number
  class?: string
}): JSX.Element {
  const comp = createMemo(() => `h${props.level}`)
  return (
    <Dynamic
      component={comp()}
      id={props.id}
      class={cn(MARKDOWN_ANCHOR_HEADING_CLASS, `docs-${comp()}`, props.class)}
    >
      {props.children}
      <a
        href={`#${props.id}`}
        class={MARKDOWN_ANCHOR_LINK_CLASS}
        aria-label={DOCS_HEADING_ANCHOR_ARIA_LABEL}
      >
        #
      </a>
    </Dynamic>
  )
}

function SectionTableBlock(sectionProps: { section: PropsTableSection }): JSX.Element {
  return (
    <>
      <HeadingWithAnchor id={sectionProps.section.id} level={3}>
        {sectionProps.section.heading}
      </HeadingWithAnchor>

      <Show when={sectionProps.section.description}>
        {(description) => (
          <div
            class="text-sm text-muted-foreground"
            // oxlint-disable-next-line subf/solid-no-innerhtml
            innerHTML={description()}
          />
        )}
      </Show>

      <Show
        when={sectionProps.section.slots?.length}
        fallback={
          <Show
            when={!sectionProps.section.badges?.length}
            fallback={
              <div class="mb-6 mt-4 flex flex-wrap gap-2">
                <For each={sectionProps.section.badges ?? []}>
                  {(badge) => <Badge>{badge}</Badge>}
                </For>
              </div>
            }
          >
            <Show
              when={sectionProps.section.groups?.length}
              fallback={
                <PropRows
                  props={sectionProps.section.props}
                  nameColumn={sectionProps.section.nameColumn}
                />
              }
            >
              <For each={sectionProps.section.groups}>
                {(group) => (
                  <>
                    <div
                      class="text-sm text-muted-foreground"
                      // oxlint-disable-next-line subf/solid-no-innerhtml
                      innerHTML={group.description}
                    />
                    <PropRows props={group.props} nameColumn={sectionProps.section.nameColumn} />
                  </>
                )}
              </For>
            </Show>
          </Show>
        }
      >
        <AttributesSection section={sectionProps.section} />
      </Show>
    </>
  )
}

interface DocsApiReferenceProps {
  apiDoc?: ComponentDoc
}

export const DocsApiReference = (props: DocsApiReferenceProps) => {
  const model = createMemo(() => createDocsApiReferenceModel(props.apiDoc))

  return (
    <Show when={model().sections.length > 0}>
      <HeadingWithAnchor id="api-reference" level={2}>
        API
      </HeadingWithAnchor>
      <For each={model().sections}>{(section) => <SectionTableBlock section={section} />}</For>
    </Show>
  )
}

export interface DocsApiReferenceModel {
  sections: PropsTableSection[]
}
