import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Select, cn } from '../../../../src'
import {
  createApiReferenceModel,
  getApiReferenceTocEntries,
} from '../../../build/api-doc/presentation'
import type {
  ApiReferencePresentationModel,
  PresentationAttributeItem,
  PresentationAttributesSection,
  PresentationPartSection,
  PresentationPropItem,
} from '../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../build/api-doc/types'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../../../build/markdown/shared.class'

export type PropDoc = PresentationPropItem

const REFERENCE_ROOT_CLASS =
  'mt-3 mb-6 border border-border/60 bg-card/20 overflow-hidden [content-visibility:auto]'
const PROP_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_2.5rem] sm:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_2.5rem] lg:grid-cols-[minmax(8rem,5fr)_minmax(0,7fr)_minmax(6rem,4.5fr)_2.5rem]'
const ATTRIBUTE_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_2.5rem] md:grid-cols-[minmax(8rem,4fr)_minmax(8rem,4fr)_minmax(0,8fr)_2.5rem]'

function ReferenceChevron(props: { expanded: boolean }): JSX.Element {
  return (
    <span class="flex h-full items-center justify-center" aria-hidden="true">
      <svg
        class={cn('transition-transform', props.expanded && 'rotate-180')}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
      >
        <path d="M1 3.5L5 7.5L9 3.5" stroke="currentColor" />
      </svg>
    </span>
  )
}

function PropDetails(props: { prop: PropDoc; panelId: string }): JSX.Element {
  return (
    <div
      id={props.panelId}
      role="region"
      aria-labelledby={props.prop.anchorId}
      class="px-3 py-3 border-t border-border/40 bg-muted/15 sm:px-4"
    >
      <dl class="text-sm m-0 gap-x-4 gap-y-3 grid sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt class="text-xs text-muted-foreground font-medium">Name</dt>
        <dd class="m-0 min-w-0">
          <a href={`#${props.prop.anchorId}`} class="text-primary font-mono hover:underline">
            {props.prop.name}
          </a>
        </dd>

        <Show when={props.prop.description}>
          {(description) => (
            <>
              <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
                Description
              </dt>
              <dd
                class="text-muted-foreground leading-relaxed m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30"
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={description()}
              />
            </>
          )}
        </Show>

        <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
          Type
        </dt>
        <dd class="m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
          <code class="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
            {props.prop.type}
          </code>
        </dd>

        <Show when={props.prop.defaultValue !== undefined}>
          <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
            Default
          </dt>
          <dd class="m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
            <code class="text-xs text-foreground font-mono">{props.prop.defaultValue}</code>
          </dd>
        </Show>
      </dl>
    </div>
  )
}

function PropRowItem(props: { prop: PropDoc }): JSX.Element {
  const [expanded, setExpanded] = createSignal(false)
  const panelId = () => `${props.prop.anchorId}-details`
  const requiredText = () => (props.prop.optional ? '' : ', required')
  const defaultText = () =>
    props.prop.defaultValue === undefined ? '' : `, default: ${props.prop.defaultValue}`

  return (
    <div class={cn('border-t border-border/40', expanded() && 'bg-muted/10')}>
      <button
        id={props.prop.anchorId}
        type="button"
        aria-expanded={expanded()}
        aria-controls={panelId()}
        aria-label={`${props.prop.name}${requiredText()}, type: ${props.prop.type}${defaultText()}`}
        class={cn(
          PROP_GRID_CLASS,
          'text-sm p-0 text-left min-h-10 w-full cursor-pointer transition-colors items-stretch hover:bg-muted/30',
        )}
        onClick={() => setExpanded(!expanded())}
      >
        <span class="text-primary font-medium font-mono px-3 py-2.5 min-w-0 truncate">
          {props.prop.name}
          <Show when={!props.prop.optional}>
            <span aria-hidden="true">*</span>
            <span class="sr-only"> (required)</span>
          </Show>
        </span>
        <code
          class="text-xs text-muted-foreground font-mono px-3 py-2.5 min-w-0 hidden truncate sm:block"
          title={props.prop.type}
        >
          {props.prop.type}
        </code>
        <span class="text-xs text-muted-foreground font-mono px-3 py-2.5 min-w-0 hidden truncate lg:block">
          {props.prop.defaultValue ?? '—'}
        </span>
        <ReferenceChevron expanded={expanded()} />
      </button>
      <Show when={expanded()}>
        <PropDetails prop={props.prop} panelId={panelId()} />
      </Show>
    </div>
  )
}

function PropRows(props: { props: PropDoc[]; nameColumn?: string }): JSX.Element {
  return (
    <div class={REFERENCE_ROOT_CLASS}>
      <div
        class={cn(
          PROP_GRID_CLASS,
          'text-[0.7rem] text-muted-foreground tracking-wider bg-muted/40 uppercase',
        )}
      >
        <span role="columnheader" class="font-semibold px-3 py-2">
          {props.nameColumn ?? 'Prop'}
        </span>
        <span role="columnheader" class="font-semibold px-3 py-2 hidden sm:block">
          Type
        </span>
        <span role="columnheader" class="font-semibold px-3 py-2 hidden lg:block">
          Default
        </span>
        <span aria-hidden="true" />
      </div>
      <For each={props.props}>{(prop) => <PropRowItem prop={prop} />}</For>
    </div>
  )
}

function AttributeDetails(props: {
  attribute: PresentationAttributeItem
  panelId: string
  triggerId: string
}): JSX.Element {
  return (
    <div
      id={props.panelId}
      role="region"
      aria-labelledby={props.triggerId}
      class="px-3 py-3 border-t border-border/40 bg-muted/15"
    >
      <dl class="text-sm m-0 gap-x-4 gap-y-3 grid sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt class="text-xs text-muted-foreground font-medium">Slot</dt>
        <dd class="m-0 flex flex-wrap gap-x-2 gap-y-1 min-w-0">
          <For each={props.attribute.slots}>
            {(slot) => <code class="text-xs text-foreground font-mono">{slot}</code>}
          </For>
        </dd>
        <Show when={props.attribute.description}>
          {(description) => (
            <>
              <dt class="text-xs text-muted-foreground font-medium sm:pt-3 sm:border-t sm:border-border/30">
                Description
              </dt>
              <dd class="text-muted-foreground leading-relaxed m-0 min-w-0 sm:pt-3 sm:border-t sm:border-border/30">
                {description()}
              </dd>
            </>
          )}
        </Show>
      </dl>
    </div>
  )
}

function AttributeRow(props: { attribute: PresentationAttributeItem }): JSX.Element {
  const [expanded, setExpanded] = createSignal(false)
  const triggerId = () => `api-attribute-${props.attribute.name}`
  const panelId = () => `${triggerId()}-details`

  return (
    <div class={cn('border-t border-border/40', expanded() && 'bg-muted/10')}>
      <button
        id={triggerId()}
        type="button"
        aria-expanded={expanded()}
        aria-controls={panelId()}
        aria-label={`${props.attribute.name}, slots: ${props.attribute.slots.join(', ')}`}
        class={cn(
          ATTRIBUTE_GRID_CLASS,
          'text-sm p-0 text-left min-h-10 w-full cursor-pointer transition-colors items-stretch hover:bg-muted/30',
        )}
        onClick={() => setExpanded(!expanded())}
      >
        <code class="text-xs text-primary font-medium font-mono px-3 py-2.5 min-w-0 truncate">
          {props.attribute.name}
        </code>
        <span class="text-xs text-muted-foreground px-3 py-2.5 flex-wrap gap-x-2 gap-y-1 min-w-0 hidden md:flex">
          <For each={props.attribute.slots}>{(slot) => <code class="font-mono">{slot}</code>}</For>
        </span>
        <span class="text-xs text-muted-foreground leading-relaxed px-3 py-2.5 min-w-0 hidden md:block">
          {props.attribute.description ?? '—'}
        </span>
        <ReferenceChevron expanded={expanded()} />
      </button>
      <Show when={expanded()}>
        <AttributeDetails attribute={props.attribute} panelId={panelId()} triggerId={triggerId()} />
      </Show>
    </div>
  )
}

const ALL_SLOTS = '__all__'

function AttributesSection(props: { attributes: PresentationAttributesSection }): JSX.Element {
  const [selectedSlot, setSelectedSlot] = createSignal(ALL_SLOTS)
  const slotOptions = () => [
    { value: ALL_SLOTS, label: 'All slots' },
    ...props.attributes.slots.map((slot) => ({ value: slot, label: slot })),
  ]
  const visibleAttributes = () => {
    const slot = selectedSlot()
    return slot === ALL_SLOTS
      ? props.attributes.items
      : props.attributes.items.filter((attribute) => attribute.slots.includes(slot))
  }
  const filterId = 'api-attributes-slot-filter'

  return (
    <section class="mt-8 pt-6 border-t border-border/40">
      <HeadingWithAnchor id={props.attributes.id} level={3}>
        {props.attributes.heading}
      </HeadingWithAnchor>
      <div class="mt-3 flex justify-end">
        <label for={filterId} class="sr-only">
          Filter attributes by slot
        </label>
        <Select
          id={filterId}
          aria-label="Filter attributes by slot"
          size="sm"
          class="w-40"
          items={slotOptions()}
          value={selectedSlot()}
          onChange={(value) => setSelectedSlot(value ?? ALL_SLOTS)}
        />
      </div>
      <div class={REFERENCE_ROOT_CLASS}>
        <div
          class={cn(
            ATTRIBUTE_GRID_CLASS,
            'text-[0.7rem] text-muted-foreground tracking-wider bg-muted/40 uppercase',
          )}
        >
          <span role="columnheader" class="font-semibold px-3 py-2">
            Attributes
          </span>
          <span role="columnheader" class="font-semibold px-3 py-2 hidden md:block">
            Slot
          </span>
          <span role="columnheader" class="font-semibold px-3 py-2 hidden md:block">
            Description
          </span>
          <span aria-hidden="true" />
        </div>
        <For each={visibleAttributes()}>
          {(attribute) => <AttributeRow attribute={attribute} />}
        </For>
      </div>
    </section>
  )
}

export function HeadingWithAnchor(props: {
  id: string
  children: JSX.Element
  level: number
  class?: string
}): JSX.Element {
  const component = createMemo(() => `h${props.level}`)
  return (
    <Dynamic
      component={component()}
      id={props.id}
      tabIndex={-1}
      class={cn(MARKDOWN_ANCHOR_HEADING_CLASS, `docs-${component()}`, props.class)}
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

export interface DocsApiReferenceModel {
  reference: ApiReferencePresentationModel | null
}

export function createDocsApiReferenceModel(
  apiDoc: ComponentApi | undefined,
): DocsApiReferenceModel {
  return { reference: createApiReferenceModel(apiDoc) }
}

export function getDocsApiReferenceTocEntries(apiDoc: ComponentApi | undefined) {
  return getApiReferenceTocEntries(apiDoc)
}

export function DocsApiReference(props: { apiDoc?: ComponentApi }): JSX.Element {
  const model = createMemo(() => createApiReferenceModel(props.apiDoc))

  return (
    <Show when={model()}>
      {(reference) => (
        <>
          <HeadingWithAnchor id="api-reference" level={2}>
            API
          </HeadingWithAnchor>

          <Show
            when={reference().kind === 'composite'}
            fallback={
              <Show when={reference().parts[0]}>
                {(part) => (
                  <>
                    <PartMetadata part={part()} description={reference().description} />
                    <Show when={part().props.length > 0}>
                      <PropRows props={part().props} />
                    </Show>
                  </>
                )}
              </Show>
            }
          >
            <For each={reference().parts}>
              {(part) => (
                <section class="mt-8 pt-6 border-t border-border/40 first:mt-4 first:pt-0 first:border-0">
                  <HeadingWithAnchor id={part.id} level={3}>
                    {part.shortHeading}
                  </HeadingWithAnchor>
                  <PartMetadata part={part} />
                  <Show when={part.props.length > 0}>
                    <PropRows props={part.props} />
                  </Show>
                </section>
              )}
            </For>
          </Show>

          <Show when={reference().item}>
            {(item) => (
              <section class="mt-8 pt-6 border-t border-border/40">
                <HeadingWithAnchor id={item().id} level={3}>
                  {item().heading}
                </HeadingWithAnchor>
                <Show when={item().description}>
                  <p class="text-sm text-muted-foreground mt-1">{item().description}</p>
                </Show>
                <Show when={item().genericsSignature}>
                  {(generics) => (
                    <p class="text-sm text-muted-foreground mb-0 mt-2">
                      <code class="text-foreground font-mono">{generics()}</code>
                    </p>
                  )}
                </Show>
                <PropRows props={item().props} nameColumn="Field" />
              </section>
            )}
          </Show>

          <Show when={reference().attributes}>
            {(attributes) => <AttributesSection attributes={attributes()} />}
          </Show>
        </>
      )}
    </Show>
  )
}

function PartMetadata(props: { part: PresentationPartSection; description?: string }): JSX.Element {
  return (
    <div class="text-sm text-muted-foreground mt-2 space-y-1.5">
      <Show when={props.part.description ?? props.description}>
        {(description) => <p class="m-0">{description()}</p>}
      </Show>
      <Show when={props.part.accessText}>
        {(accessText) => (
          <p class="m-0">
            Access with <code class="text-foreground font-mono">{accessText()}</code>.
          </p>
        )}
      </Show>
      <Show
        when={props.part.defaultElement}
        fallback={
          <Show when={!props.part.rendersDom}>
            <p class="m-0">Does not render a DOM element.</p>
          </Show>
        }
      >
        {(element) => (
          <p class="m-0">
            Renders a <code class="text-foreground font-mono">&lt;{element()}&gt;</code> element by
            default
            <Show when={props.part.polymorphic}>
              {', and supports a custom rendered element through '}
              <code class="text-foreground font-mono">as</code>
            </Show>
            .
          </p>
        )}
      </Show>
      <Show when={props.part.genericsSignature}>
        {(generics) => (
          <p class="m-0">
            Generic signature: <code class="text-foreground font-mono">{generics()}</code>.
          </p>
        )}
      </Show>
    </div>
  )
}
