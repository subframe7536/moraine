import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, Select, Tabs, cn } from '../../src'
import { createMediaQuery } from '../../src/shared/use-media-query'
import type { PropDoc } from '../vite-plugin/api-doc/types'
import {
  MARKDOWN_ANCHOR_HEADING_CLASS,
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../vite-plugin/markdown/shared'

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

export interface SlotReferenceDoc {
  name: string
  description?: string
  cssVariables: PropDoc[]
  dataAttributes: PropDoc[]
  ariaAttributes: PropDoc[]
}

type AttributeGroupKind = 'css' | 'data' | 'aria'

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

function getAttributeGroupTone(kind: AttributeGroupKind): string {
  if (kind === 'css') {
    return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'
  }

  if (kind === 'aria') {
    return 'text-sky-700 bg-sky-500/10 border-sky-500/20'
  }

  return 'text-primary bg-primary/10 border-primary/20'
}

function PropRows(tableProps: {
  props: PropDoc[]
  nameColumn?: string
  nameColumnClass?: string
  minimal?: boolean
  class?: string
}): JSX.Element {
  return (
    <div class={cn('mb-6 mt-4 b-1 b-border rounded-lg overflow-x-auto', tableProps.class)}>
      <table class="text-sm m-0 w-full border-collapse">
        <thead>
          <tr class="text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase">
            <th class={cn('font-medium px-3 py-2', tableProps.nameColumnClass)}>
              {tableProps.nameColumn ?? 'Prop'}
            </th>
            <Show when={!tableProps.minimal}>
              <th class="font-medium px-3 py-2">Type</th>
            </Show>
            <Show when={!tableProps.minimal}>
              <th class="font-medium px-3 py-2">Default</th>
            </Show>
            <th class="font-medium px-3 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <For each={tableProps.props}>
            {(prop) => (
              <tr class="b-t b-border hover:bg-muted/50">
                <td class="text-xs text-primary font-mono px-3 py-2 whitespace-nowrap">
                  {prop.name}
                  {prop.required ? '*' : ''}
                </td>
                <Show when={!tableProps.minimal}>
                  <td class="px-3 py-2">
                    <code class="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                      {normalizeType(prop.type)}
                    </code>
                  </td>
                </Show>
                <Show when={!tableProps.minimal}>
                  <td class="text-xs text-muted-foreground px-3 py-2">
                    <Show
                      when={prop.defaultValue}
                      fallback={<span class="text-muted-foreground/80">—</span>}
                    >
                      <code class="px-1.5 py-0.5 rounded bg-muted">{prop.defaultValue}</code>
                    </Show>
                  </td>
                </Show>
                <td class="text-muted-foreground px-3 py-2">
                  <Show
                    when={prop.description}
                    fallback={<span class="text-muted-foreground/80">—</span>}
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

function AttributeRows(props: {
  kind: AttributeGroupKind
  title: string
  nameColumn: string
  props: PropDoc[]
}): JSX.Element {
  return (
    <section class="b-1 b-border rounded-lg bg-background overflow-hidden">
      <div class="px-3 py-2 b-b b-border bg-muted/45 flex gap-3 items-center justify-between">
        <div class="flex gap-2 min-w-0 items-center">
          <span
            aria-hidden="true"
            class={cn('b-1 rounded-full shrink-0 size-1.75', getAttributeGroupTone(props.kind))}
          />
          <h4 class="text-xs text-foreground tracking-wider font-semibold truncate uppercase">
            {props.title}
          </h4>
        </div>
        <span class="text-[0.68rem] text-muted-foreground font-medium px-1.5 py-0.5 b-1 b-border rounded bg-background shrink-0">
          {props.props.length}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="text-sm m-0 w-full border-collapse">
          <thead>
            <tr class="text-[0.68rem] text-muted-foreground tracking-wider text-left uppercase">
              <th class="font-medium px-3 py-2">{props.nameColumn}</th>
              <th class="font-medium px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.props}>
              {(prop) => (
                <tr class="b-t b-border hover:bg-muted/35">
                  <td class="text-xs text-primary font-mono px-3 py-2 whitespace-nowrap">
                    {prop.name}
                  </td>
                  <td class="text-muted-foreground px-3 py-2 min-w-72">
                    <Show
                      when={prop.description}
                      fallback={<span class="text-muted-foreground/80">—</span>}
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
    </section>
  )
}

function SlotReferencePanel(props: { sectionId: string; slot: SlotReferenceDoc }): JSX.Element {
  const hasMetadata = createMemo(
    () =>
      props.slot.cssVariables.length > 0 ||
      props.slot.dataAttributes.length > 0 ||
      props.slot.ariaAttributes.length > 0,
  )
  const metadataCount = createMemo(() => getSlotMetadataCount(props.slot))

  return (
    <section class="min-w-0">
      <header class="mb-5 pb-4 b-b b-border/70">
        <div class="flex flex-wrap gap-x-2.5 gap-y-1 items-baseline">
          <span class="text-[0.68rem] text-muted-foreground tracking-wider font-semibold uppercase">
            Slot
          </span>
          <code class="text-lg text-foreground leading-none font-mono">{props.slot.name}</code>
          <span class="text-xs text-muted-foreground font-medium px-1.5 py-0.5 b-1 b-border rounded-md bg-muted/45">
            {formatAttributeCount(metadataCount())}
          </span>
        </div>

        <Show when={props.slot.description}>
          {(description) => (
            <div
              class="text-sm text-muted-foreground leading-6 mt-2.5 max-w-2xl [&_code]:(text-xs text-foreground px-1 py-0.5 rounded bg-muted) [&_a]:text-primary [&_p]:m-0"
              // oxlint-disable-next-line subf/solid-no-innerhtml
              innerHTML={description()}
            />
          )}
        </Show>
      </header>

      <Show
        when={hasMetadata()}
        fallback={
          <div class="text-sm text-muted-foreground px-4 py-8 text-center b-1 b-border rounded-lg b-dashed bg-muted/25">
            No attribute metadata for this slot.
          </div>
        }
      >
        <div class="space-y-4">
          <Show when={props.slot.cssVariables.length > 0}>
            <AttributeRows
              kind="css"
              title="CSS Variables"
              props={props.slot.cssVariables}
              nameColumn="CSS Variable"
            />
          </Show>

          <Show when={props.slot.dataAttributes.length > 0}>
            <AttributeRows
              kind="data"
              title="Data Attributes"
              props={props.slot.dataAttributes}
              nameColumn="Data Attribute"
            />
          </Show>

          <Show when={props.slot.ariaAttributes.length > 0}>
            <AttributeRows
              kind="aria"
              title="ARIA Attributes"
              props={props.slot.ariaAttributes}
              nameColumn="ARIA Attribute"
            />
          </Show>
        </div>
      </Show>
    </section>
  )
}

function SlotTabLabel(props: { slot: SlotReferenceDoc }): JSX.Element {
  const metadataCount = createMemo(() => getSlotMetadataCount(props.slot))

  return (
    <span class="flex gap-2 min-w-0 w-full items-center justify-between">
      <span class="font-mono truncate">{props.slot.name}</span>
      <Show when={metadataCount() > 0}>
        <span
          aria-hidden="true"
          class="text-[0.65rem] text-muted-foreground leading-none font-sans px-1.5 py-1 b-1 b-border rounded bg-muted shrink-0"
        >
          {metadataCount()}
        </span>
      </Show>
    </span>
  )
}

function AttributesSection(props: { section: PropsTableSection }): JSX.Element {
  const isMobile = createMediaQuery('(max-width: 767px)', false)
  const slotOptions = createMemo(() => props.section.slots ?? [])
  const firstSlotName = createMemo(() => slotOptions()[0]?.name)
  const [selectedSlotName, setSelectedSlotName] = createSignal<string | undefined>()
  const activeSlotName = createMemo(() => {
    const candidate = selectedSlotName()

    if (candidate && slotOptions().some((slot) => slot.name === candidate)) {
      return candidate
    }

    return firstSlotName()
  })
  const activeSlot = createMemo(() => slotOptions().find((slot) => slot.name === activeSlotName()))

  return (
    <Show
      when={isMobile()}
      fallback={
        <Tabs
          value={activeSlotName()}
          onChange={setSelectedSlotName}
          orientation="vertical"
          variant="pill"
          size="md"
          classes={{
            root: 'mt-5 b-1 b-border rounded-xl bg-muted/25 overflow-hidden gap-0 md:grid md:grid-cols-[14rem_minmax(0,1fr)]',
            list: 'w-full h-full rounded-none bg-muted/45 p-2 md:border-r md:border-border items-stretch justify-start',
            indicator: 'hidden',
            trigger:
              'w-full justify-between text-xs rounded-md px-2.5 py-2 data-selected:(bg-background text-foreground shadow-xs) hover:bg-background/70',
            label: 'w-full min-w-0',
            content: 'bg-background px-4 py-4 md:px-5 md:py-5',
          }}
          items={slotOptions().map((slot) => ({
            label: <SlotTabLabel slot={slot} />,
            value: slot.name,
            content: <SlotReferencePanel sectionId={props.section.id} slot={slot} />,
          }))}
        />
      }
    >
      <div class="mt-5 space-y-3">
        <Select
          options={slotOptions().map((slot) => ({ label: slot.name, value: slot.name }))}
          value={activeSlotName() ?? null}
          size="sm"
          placeholder={props.section.heading}
          classes={{
            root: 'w-full',
            control: 'w-full',
            input: 'font-mono',
          }}
          onChange={(value) => {
            if (value !== null) {
              setSelectedSlotName(String(value))
            }
          }}
        />

        <div class="px-4 py-4 b-1 b-border rounded-xl bg-background">
          <Show when={activeSlot()}>
            {(slot) => <SlotReferencePanel sectionId={props.section.id} slot={slot()} />}
          </Show>
        </div>
      </div>
    </Show>
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
  model?: DocsApiReferenceModel
}

export const DocsApiReference = (props: DocsApiReferenceProps) => {
  return (
    <Show when={(props.model?.sections?.length ?? 0) > 0}>
      <For each={props.model?.sections ?? []}>
        {(section) => <SectionTableBlock section={section} />}
      </For>
    </Show>
  )
}

export interface DocsApiReferenceModel {
  sections: PropsTableSection[]
}
