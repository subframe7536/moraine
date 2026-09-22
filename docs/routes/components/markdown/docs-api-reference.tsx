import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, Collapsible, Select, cn, Icon } from '../../../../src'
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
  'grid grid-cols-1 md:grid-cols-[minmax(8rem,4fr)_minmax(8rem,4fr)_minmax(0,8fr)]'

function ReferenceChevron(): JSX.Element {
  return (
    <span class="flex h-full items-center justify-center" aria-hidden="true">
      <svg
        class="group-data-expanded:rotate-180 transition-transform"
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

function PropDetails(props: { prop: PropDoc }): JSX.Element {
  return (
    <div
      role="region"
      aria-labelledby={`${props.prop.anchorId}-trigger`}
      class="px-3 py-3 border-t border-border/40 sm:px-4"
    >
      <dl class="text-sm m-0 gap-x-4 gap-y-3 grid sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt class="text-xs text-muted-foreground font-medium">Name</dt>
        <dd class="m-0 min-w-0">
          <a
            href={`#${props.prop.anchorId}`}
            class="text-primary font-mono underline underline-offset-4 hover:underline-0"
          >
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
  const requiredText = () => (props.prop.optional ? '' : ', required')
  const defaultText = () =>
    props.prop.defaultValue === undefined ? '' : `, default: ${props.prop.defaultValue}`

  return (
    <Collapsible id={props.prop.anchorId} transition class="group border-t border-border/40">
      <Collapsible.Trigger
        aria-label={`${props.prop.name}${requiredText()}, type: ${props.prop.type}${defaultText()}`}
        class={cn(
          PROP_GRID_CLASS,
          'text-sm p-0 text-left min-h-10 w-full cursor-pointer transition-colors items-stretch hover:bg-muted/30',
        )}
      >
        <span class="text-foreground font-medium font-mono px-3 py-2.5 min-w-0 truncate">
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
        <ReferenceChevron />
      </Collapsible.Trigger>
      <Collapsible.Content class="bg-muted/50">
        <PropDetails prop={props.prop} />
      </Collapsible.Content>
    </Collapsible>
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

function AttributeRow(props: { attribute: PresentationAttributeItem }): JSX.Element {
  return (
    <div
      data-attribute={props.attribute.name}
      class={cn(ATTRIBUTE_GRID_CLASS, 'text-sm border-t border-border/40 min-h-10')}
    >
      <code class="font-medium font-mono px-3 py-2.5 min-w-0 truncate">{props.attribute.name}</code>
      <span class="text-muted-foreground px-3 pb-2.5 min-w-0 md:py-2.5">
        <span class="font-medium md:hidden">Slot: </span>
        {props.attribute.slots.join(', ')}
      </span>
      <span class="text-muted-foreground leading-relaxed px-3 pb-2.5 min-w-0 md:py-2.5">
        <span class="font-medium md:hidden">Description: </span>
        {props.attribute.description ?? '—'}
      </span>
    </div>
  )
}

function EmptyAttributes(): JSX.Element {
  return (
    <div role="status" class="px-4 py-8 border-t border-border/40 flex flex-col items-center">
      <Icon name="i-lucide:square-dashed" />
      <div class="text-sm font-medium mt-3">No attributes</div>
      <div class="text-xs text-muted-foreground mt-1">
        This slot does not expose any public data attributes.
      </div>
    </div>
  )
}

const ALL_SLOTS = '__all__'

function AttributesSection(props: { attributes: PresentationAttributesSection }): JSX.Element {
  const [selectedSlot, setSelectedSlot] = createSignal(ALL_SLOTS)
  const visibleAttributes = () => {
    const slot = selectedSlot()
    return slot === ALL_SLOTS
      ? props.attributes.items
      : props.attributes.items.filter((attribute) => attribute.slots.includes(slot))
  }
  const filterId = 'api-attributes-slot-filter'

  return (
    <section class="border-t border-border/40">
      <HeadingWithAnchor id={props.attributes.id} level={2}>
        {props.attributes.heading}
      </HeadingWithAnchor>
      <div class="mt-3 flex justify-start">
        <label for={filterId} class="sr-only">
          Filter attributes by slot
        </label>
        <Select
          id={filterId}
          aria-label="Filter attributes by slot"
          size="sm"
          class="w-48"
          classes={{
            content: 'max-h-60',
            item: 'justify-between',
          }}
          items={[
            { value: ALL_SLOTS, label: `All slots`, count: props.attributes.items.length },
            ...props.attributes.slots.map((slot) => ({
              value: slot,
              label: slot,
              count: props.attributes.items.filter((attribute) => attribute.slots.includes(slot))
                .length,
            })),
          ]}
          value={selectedSlot()}
          onChange={(value) => setSelectedSlot(value ?? ALL_SLOTS)}
          itemRender={(props) => (
            <>
              <div>{props.item.label}</div>
              <Show when={props.item.count > 0}>
                <Badge variant="outline">{props.item.count}</Badge>
              </Show>
            </>
          )}
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
        </div>
        <Show when={visibleAttributes().length > 0} fallback={<EmptyAttributes />}>
          <For each={visibleAttributes()}>
            {(attribute) => <AttributeRow attribute={attribute} />}
          </For>
        </Show>
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
          <Show when={reference().attributes}>
            {(attributes) => <AttributesSection attributes={attributes()} />}
          </Show>
          <Show when={reference().item}>
            {(item) => (
              <section class="border-t border-border/40">
                <HeadingWithAnchor id={item().id} level={2}>
                  {item().heading}
                </HeadingWithAnchor>
                <Show when={item().description}>
                  <p class="text-sm text-muted-foreground mt-1">{item().description}</p>
                </Show>
                <PropRows props={item().props} nameColumn="Field" />
              </section>
            )}
          </Show>
          <HeadingWithAnchor id="api-reference" level={2}>
            Props
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
                <section class="border-t border-border/40 first:mt-4 first:pt-0 first:border-0">
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
        </>
      )}
    </Show>
  )
}

function PartMetadata(props: { part: PresentationPartSection; description?: string }): JSX.Element {
  const description = () => props.part.description ?? props.description

  return (
    <Show when={description() || props.part.defaultElement}>
      <p>
        <Show when={description()}>{`${description()} `}</Show>

        <Show when={props.part.defaultElement}>
          Renders a <code class="font-mono">&lt;{props.part.defaultElement}&gt;</code> element by
          default.
        </Show>
      </p>
    </Show>
  )
}
