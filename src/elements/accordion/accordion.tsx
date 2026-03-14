import * as KobalteAccordion from '@kobalte/core/accordion'
import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
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

export type AccordionStyles = SlotStyles<AccordionSlots>

export interface AccordionItem {
  /**
   * Header label for the accordion item.
   */
  label?: JSX.Element

  /**
   * Unique value for the accordion item.
   */
  value?: string

  /**
   * Whether the accordion item is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Leading icon name for the accordion item.
   */
  leading?: IconName

  /**
   * Content to display when the accordion item is expanded.
   */
  content?: JSX.Element
}

/**
 * Base props for the Accordion component.
 */
export interface AccordionBaseProps {
  /**
   * Array of accordion items to render.
   */
  items?: AccordionItem[]

  /**
   * Whether the entire accordion is disabled.
   * @default false
   */
  disabled?: boolean

  /**
   * Whether to unmount accordion content when hidden.
   * @default true
   */
  unmountOnHide?: boolean

  /**
   * Trailing icon name for all accordion items.
   * @default 'icon-chevron-down'
   */
  trailing?: IconName

  /**
   * Slot-based class overrides.
   */
  classes?: AccordionClasses

  /**
   * Slot-based style overrides.
   */
  styles?: AccordionStyles
}

/**
 * Props for the Accordion component.
 */
export type AccordionProps = RockUIComposeProps<
  AccordionBaseProps,
  KobalteAccordion.AccordionRootProps
>

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
      style={merged.styles?.root}
      class={cn(
        'flex flex-col w-full',
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
            style={merged.styles?.item}
            class={cn(
              'not-last:b-(b b-border) data-disabled:effect-dis',
              renderProps.classes?.item,
            )}
          >
            <KobalteAccordion.Header
              data-slot="header"
              style={merged.styles?.header}
              class={cn('flex', renderProps.classes?.header)}
            >
              <KobalteAccordion.Trigger
                data-slot="trigger"
                style={merged.styles?.trigger}
                class={cn(
                  'group text-sm font-medium py-2.5 text-left outline-none b-1 b-transparent rounded-lg flex flex-1 gap-1.5 min-w-0 w-full transition items-center justify-between relative focus-visible:effect-fv-border disabled:effect-dis hover:underline',
                  renderProps.classes?.trigger,
                )}
              >
                <Show when={item.leading}>
                  <Icon
                    name={item.leading}
                    data-slot="leading"
                    style={merged.styles?.leading}
                    class={cn('shrink-0 size-5', renderProps.classes?.leading)}
                  />
                </Show>

                <Show when={item.label}>
                  <span
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn('text-start break-words', renderProps.classes?.label)}
                  >
                    {item.label}
                  </span>
                </Show>

                <Show when={renderProps.trailing}>
                  <Icon
                    name={renderProps.trailing}
                    data-slot="trailing"
                    style={merged.styles?.trailing}
                    class={cn(
                      'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none duration-150 group-aria-expanded:rotate-180',
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
                  style={merged.styles?.content}
                  class={cn(
                    'style-accordion-content pb-2.5 h-$kb-collapsible-content-height',
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
