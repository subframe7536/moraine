import * as KobalteAccordion from '@kobalte/core/accordion'
import type { JSX } from 'solid-js'
import { For, Show, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import { Icon } from '../icon'
import type { IconT } from '../icon'

export namespace AccordionT {
  export type Slot =
    | 'root'
    | 'item'
    | 'header'
    | 'trigger'
    | 'leading'
    | 'label'
    | 'trailing'
    | 'content'
  export type Variant = {}
  export interface Items {
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
    leading?: IconT.Name

    /**
     * Content to display when the accordion item is expanded.
     */
    content?: JSX.Element
  }
  export type Extend = KobalteAccordion.AccordionRootProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

  /**
   * Base props for the Accordion component.
   */
  export interface Base {
    /**
     * Array of accordion items to render.
     */
    items?: Items[]

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
    trailing?: IconT.Name
  }

  /**
   * Props for the Accordion component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Accordion component.
 */
export interface AccordionProps extends AccordionT.Props {}

/** Stacked disclosure component with single or multiple expanded sections. */
export function Accordion(props: AccordionProps): JSX.Element {
  const merged = mergeProps(
    {
      multiple: false,
      collapsible: true,
      unmountOnHide: true,
      trailing: 'icon-chevron-down' as IconT.Name,
    },
    props,
  ) as AccordionProps

  const [behaviorProps, renderProps, restProps] = splitProps(
    merged,
    ['disabled', 'unmountOnHide'],
    ['items', 'trailing', 'classes', 'styles'],
  )

  return (
    <KobalteAccordion.Root
      data-slot="root"
      style={renderProps.styles?.root}
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
            style={renderProps.styles?.item}
            class={cn(
              'not-last:b-(b b-border) data-disabled:effect-dis',
              renderProps.classes?.item,
            )}
          >
            <KobalteAccordion.Header
              data-slot="header"
              style={renderProps.styles?.header}
              class={cn('flex', renderProps.classes?.header)}
            >
              <KobalteAccordion.Trigger
                data-slot="trigger"
                style={renderProps.styles?.trigger}
                class={cn(
                  'group text-sm font-medium py-2.5 text-left outline-none b-1 b-transparent rounded-lg flex flex-1 gap-1.5 min-w-0 w-full transition items-center justify-between relative focus-visible:effect-fv-border disabled:effect-dis hover:underline',
                  renderProps.classes?.trigger,
                )}
              >
                <Show when={item.leading}>
                  <Icon
                    name={item.leading}
                    slotName="leading"
                    style={renderProps.styles?.leading}
                    class={cn('shrink-0 size-5', renderProps.classes?.leading)}
                  />
                </Show>

                <Show when={item.label}>
                  <span
                    data-slot="label"
                    style={renderProps.styles?.label}
                    class={cn('text-start break-words', renderProps.classes?.label)}
                  >
                    {item.label}
                  </span>
                </Show>

                <Show when={renderProps.trailing}>
                  <Icon
                    name={renderProps.trailing}
                    slotName="trailing"
                    style={renderProps.styles?.trailing}
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
                  style={renderProps.styles?.content}
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
