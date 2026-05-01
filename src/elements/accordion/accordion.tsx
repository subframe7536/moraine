import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { createControllableSignal } from '../../shared/create-controllable-signal'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
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
  export type Variant = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement> & {
    value?: string[]
    defaultValue?: string[]
    onChange?: (value: string[]) => void
    multiple?: boolean
    collapsible?: boolean
  }

  export interface Item {
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
  /**
   * Base props for the Accordion component.
   */
  export interface Base {
    /**
     * Array of accordion items to render.
     */
    items?: Item[]

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
  )

  const [local, rest] = splitProps(merged, [
    'collapsible',
    'defaultValue',
    'disabled',
    'items',
    'multiple',
    'onChange',
    'trailing',
    'unmountOnHide',
    'value',
    'classes',
    'styles',
  ])

  const id = useId(() => rest.id as string | undefined, 'accordion')
  const items = createMemo(() =>
    (local.items ?? []).map((item, index) => ({
      item,
      index,
      value: item.value ?? String(index),
    })),
  )
  const [expandedValues, setExpandedValues] = createControllableSignal<string[]>({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? [],
    onChange: local.onChange,
  })
  const resolvedExpandedValues = createMemo(() => {
    const value = expandedValues() ?? []
    const validValues = value.filter((entry) => items().some((item) => item.value === entry))

    if (local.multiple) {
      return validValues
    }

    return validValues.slice(0, 1)
  })

  function toggleItem(value: string, disabled: boolean | undefined): void {
    if (local.disabled || disabled) {
      return
    }

    const currentValues = resolvedExpandedValues()
    const isExpanded = currentValues.includes(value)

    if (local.multiple) {
      setExpandedValues(
        isExpanded ? currentValues.filter((entry) => entry !== value) : [...currentValues, value],
      )
      return
    }

    if (isExpanded) {
      if (!local.collapsible) {
        return
      }

      setExpandedValues([])
      return
    }

    setExpandedValues([value])
  }

  return (
    <div
      data-slot="root"
      style={local.styles?.root}
      class={cn('flex flex-col w-full', local.disabled && 'effect-dis', local.classes?.root)}
      {...rest}
    >
      <For each={items()}>
        {(entry) => {
          const isExpanded = createMemo(() => resolvedExpandedValues().includes(entry.value))
          const contentId = `${id()}-content-${entry.value}`
          const triggerId = `${id()}-trigger-${entry.value}`
          const isItemDisabled = () => Boolean(local.disabled || entry.item.disabled)

          return (
            <div
              data-slot="item"
              style={local.styles?.item}
              data-disabled={isItemDisabled() ? '' : undefined}
              class={cn('not-last:b-(b b-border) data-disabled:effect-dis', local.classes?.item)}
            >
              <div
                data-slot="header"
                style={local.styles?.header}
                class={cn('flex', local.classes?.header)}
              >
                <button
                  id={triggerId}
                  type="button"
                  data-slot="trigger"
                  style={local.styles?.trigger}
                  aria-controls={contentId}
                  aria-expanded={isExpanded()}
                  disabled={isItemDisabled()}
                  class={cn(
                    'group text-sm font-medium py-2.5 text-left outline-none b-1 b-transparent rounded-lg flex flex-1 gap-1.5 min-w-0 w-full transition items-center justify-between relative focus-visible:effect-fv-border disabled:effect-dis hover:underline',
                    local.classes?.trigger,
                  )}
                  onClick={() => toggleItem(entry.value, entry.item.disabled)}
                >
                  <Show when={entry.item.leading}>
                    <Icon
                      name={entry.item.leading}
                      slotName="leading"
                      style={local.styles?.leading}
                      class={cn('shrink-0 size-5', local.classes?.leading)}
                    />
                  </Show>

                  <Show when={entry.item.label}>
                    <span
                      data-slot="label"
                      style={local.styles?.label}
                      class={cn('text-start break-words', local.classes?.label)}
                    >
                      {entry.item.label}
                    </span>
                  </Show>

                  <Show when={local.trailing}>
                    <Icon
                      name={local.trailing}
                      slotName="trailing"
                      style={local.styles?.trailing}
                      class={cn(
                        'text-muted-foreground ml-auto shrink-0 size-4 pointer-events-none duration-150',
                        isExpanded() && 'rotate-180',
                        local.classes?.trailing,
                      )}
                    />
                  </Show>
                </button>
              </div>

              <Show when={local.unmountOnHide ? isExpanded() : true}>
                <div
                  id={contentId}
                  role="region"
                  data-slot="content"
                  style={local.styles?.content}
                  data-expanded={isExpanded() ? '' : undefined}
                  data-closed={isExpanded() ? undefined : ''}
                  hidden={!isExpanded()}
                  aria-labelledby={triggerId}
                  class={cn(
                    'text-sm overflow-hidden data-closed:animate-accordion-up data-expanded:animate-accordion-down',
                    local.classes?.content,
                  )}
                >
                  <Show when={entry.item.content}>
                    <div
                      class="style-accordion-content pb-2.5 h-$kb-collapsible-content-height"
                    >
                      {entry.item.content}
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          )
        }}
      </For>
    </div>
  )
}
