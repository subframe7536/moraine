import type { JSX } from 'solid-js'
import { For, Show, createSignal } from 'solid-js'

import { Badge, Icon, Select, cn } from '../../../../../src'
import type {
  PresentationAttributeItem,
  PresentationAttributesSection,
} from '../../../../build/api-doc/presentation'

import { REFERENCE_ROOT_CLASS } from './api-prop-rows'
import { HeadingWithAnchor } from './heading-with-anchor'

export const ATTRIBUTE_GRID_CLASS =
  'grid grid-cols-1 md:grid-cols-[minmax(8rem,4fr)_minmax(8rem,4fr)_minmax(0,8fr)]'

const ALL_SLOTS = '__all__'

export function AttributeRow(props: { attribute: PresentationAttributeItem }): JSX.Element {
  return (
    <div
      data-attribute={props.attribute.name}
      class={cn(ATTRIBUTE_GRID_CLASS, 'border-t border-border/40 min-h-10 text-sm')}
    >
      <code class="font-medium font-mono px-3 py-2.5">{props.attribute.name}</code>
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

export function EmptyAttributes(): JSX.Element {
  return (
    <div role="status" class="px-4 py-8 border-t border-border/40 flex flex-col items-center">
      <Icon name="i-lucide:square-dashed" />
      <div class="font-medium mt-3 text-sm">No attributes</div>
      <div class="text-muted-foreground mt-1 text-xs">
        This slot does not expose any public data attributes.
      </div>
    </div>
  )
}

export function AttributesSection(props: {
  attributes: PresentationAttributesSection
}): JSX.Element {
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
          onValueChange={(value) => setSelectedSlot(value ?? ALL_SLOTS)}
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
