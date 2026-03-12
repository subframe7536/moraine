import * as KobalteAccordion from '@kobalte/core/accordion'
import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconName } from '../icon'

type AccordionSlots =
  | 'root'
  | 'item'
  | 'header'
  | 'trigger'
  | 'leading'
  | 'label'
  | 'trailing'
  | 'content'

export type AccordionClasses = SlotClasses<AccordionSlots>

export interface AccordionItem {
  label?: JSX.Element
  value?: string
  disabled?: boolean
  leading?: IconName
  content?: JSX.Element
}

export interface AccordionBaseProps {
  items?: AccordionItem[]
  disabled?: boolean
  unmountOnHide?: boolean
  trailing?: IconName
  classes?: AccordionClasses
}

export type AccordionProps = AccordionBaseProps &
  Omit<KobalteAccordion.AccordionRootProps, keyof AccordionBaseProps | 'children' | 'class'>

export function Accordion(props: AccordionProps): JSX.Element {
  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      unmountOnHide: true,
      trailing: 'icon-chevron-down' as IconName,
    },
    props,
  ) as AccordionProps

  const [behaviorProps, renderProps, restProps] = splitProps(
    merged,
    ['disabled', 'unmountOnHide'],
    ['items', 'trailing', 'classes'],
  )

  return (
    <KobalteAccordion.Root
      data-slot="root"
      class={cn(
        'flex w-full flex-col',
        behaviorProps.disabled && 'effect-dis',
        renderProps.classes?.root,
      )}
      {...restProps}
    >
      <For each={renderProps.items}>
        {(item, index) => (
          <KobalteAccordion.Item
            value={item.value ?? String(index())}
            disabled={Boolean(behaviorProps.disabled || item.disabled)}
            forceMount={!behaviorProps.unmountOnHide}
            data-slot="item"
            class={cn(
              'not-last:b-(b b-border) data-disabled:effect-dis',
              renderProps.classes?.item,
            )}
          >
            <KobalteAccordion.Header
              data-slot="header"
              class={cn('flex', renderProps.classes?.header)}
            >
              <KobalteAccordion.Trigger
                data-slot="trigger"
                class={cn(
                  'group relative flex w-full flex-1 min-w-0 items-center justify-between gap-1.5 rounded-lg b-1 b-transparent py-2.5 text-left text-sm font-medium outline-none transition hover:underline disabled:effect-dis focus-visible:effect-fv-border',
                  renderProps.classes?.trigger,
                )}
              >
                <Show when={item.leading}>
                  <Icon
                    name={item.leading}
                    data-slot="leading"
                    class={cn('shrink-0 size-5', renderProps.classes?.leading)}
                  />
                </Show>

                <Show when={item.label}>
                  <span
                    data-slot="label"
                    class={cn('text-start break-words', renderProps.classes?.label)}
                  >
                    {item.label}
                  </span>
                </Show>

                <Show when={renderProps.trailing}>
                  <Icon
                    name={renderProps.trailing}
                    data-slot="trailing"
                    class={cn(
                      'pointer-events-none ml-auto shrink-0 size-4 text-muted-foreground duration-150 group-aria-expanded:rotate-180',
                      renderProps.classes?.trailing,
                    )}
                  />
                </Show>
              </KobalteAccordion.Trigger>
            </KobalteAccordion.Header>

            <KobalteAccordion.Content class="text-sm overflow-hidden data-closed:animate-accordion-up data-expanded:animate-accordion-down">
              <Show when={item.content}>
                <div
                  data-slot="content"
                  class={cn(
                    'h-$kb-collapsible-content-height pb-2.5 style-accordion-content',
                    renderProps.classes?.content,
                  )}
                >
                  {item.content}
                </div>
              </Show>
            </KobalteAccordion.Content>
          </KobalteAccordion.Item>
        )}
      </For>
    </KobalteAccordion.Root>
  )
}
