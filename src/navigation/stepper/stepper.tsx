import * as KobalteTabs from '@kobalte/core/tabs'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { createControllableSignal } from '../../shared/create-controllable-signal'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'

import type { StepperVariantProps } from './stepper.class'
import {
  stepperContainerVariants,
  stepperDescriptionVariants,
  stepperHeaderVariants,
  stepperItemVariants,
  stepperRootVariants,
  stepperSeparatorVariants,
  stepperTitleVariants,
  stepperTriggerVariants,
  stepperWrapperVariants,
} from './stepper.class'

type StepperState = 'inactive' | 'active' | 'completed'
type StepperOrientation = 'horizontal' | 'vertical'
type StepperActivationMode = 'automatic' | 'manual'

export namespace StepperT {
  export type Value = string

  export type Slot =
    | 'root'
    | 'header'
    | 'item'
    | 'container'
    | 'trigger'
    | 'indicator'
    | 'icon'
    | 'separator'
    | 'wrapper'
    | 'title'
    | 'description'
    | 'content'
  export type Variant = StepperVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement> & {
    value?: Value
    defaultValue?: Value
    onChange?: (value: Value) => void
    orientation?: StepperOrientation
    activationMode?: StepperActivationMode
  }

  /**
   * An individual step in the stepper.
   */
  export interface Item {
    /**
     * Unique value for the step.
     * @default index of the item
     */
    value?: Value

    /**
     * Title of the step.
     */
    title?: JSX.Element

    /**
     * Secondary description of the step.
     */
    description?: JSX.Element

    /**
     * Icon to display in the step indicator.
     * @default index + 1
     */
    icon?: IconT.Name

    /**
     * Content to display when the step is active.
     */
    content?: JSX.Element

    /**
     * Whether the step is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Additional class name for the step item.
     */
    class?: string
  }

  /**
   * Base props for the Stepper component.
   */
  export interface Base {
    /**
     * Array of steps to display.
     */
    items?: Item[]

    /**
     * Whether to enforce linear navigation (must complete steps in order).
     * @default true
     */
    linear?: boolean

    /**
     * Whether the entire stepper is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether steps are clickable for navigation.
     * @default false
     */
    clickable?: boolean
  }

  /**
   * Props for the Stepper component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Stepper component.
 */
export interface StepperProps extends StepperT.Props {}

interface NormalizedStepperItem {
  item: StepperT.Item
  index: number
  value: StepperT.Value
}

/**
 * Multi-step progress indicator with configurable orientation and separator layout.
 */
export function Stepper(props: StepperProps): JSX.Element {
  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      size: 'md' as const,
      linear: true,
      clickable: false,
    },
    props,
  )
  const [local, rest] = splitProps(merged, [
    'id',
    'value',
    'defaultValue',
    'onChange',
    'orientation',
    'activationMode',
    'size',
    'items',
    'linear',
    'disabled',
    'clickable',
    'classes',
    'styles',
  ])

  const id = useId(() => local.id, 'stepper')

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() =>
    (local.items ?? []).map((item, index) => ({
      item,
      index,
      value: item.value ?? String(index),
    })),
  )

  const getFallbackValue = createMemo(() => {
    const items = normalizedItems()
    const firstEnabled = items.find((entry) => !entry.item.disabled)
    return firstEnabled?.value ?? items[0]?.value
  })

  const [selectedValue, setSelectedValue] = createControllableSignal<StepperT.Value>({
    value: () => local.value,
    defaultValue: () => local.defaultValue ?? getFallbackValue(),
    onChange: local.onChange,
  })

  const resolvedValue = createMemo(() => {
    const value = selectedValue()
    if (value === undefined) {
      return getFallbackValue()
    }
    const items = normalizedItems()
    if (items.length === 0) {
      return undefined
    }

    if (items.some((entry) => entry.value === value)) {
      return value
    }

    return getFallbackValue()
  })

  function StepperBody(): JSX.Element {
    const currentIndex = createMemo(() => {
      const value = resolvedValue()
      return normalizedItems().findIndex((item) => item.value === value)
    })

    function getItemState(index: number): StepperState {
      const activeIndex = currentIndex()
      if (activeIndex >= 0 && index < activeIndex) {
        return 'completed'
      }
      if (index === activeIndex) {
        return 'active'
      }

      return 'inactive'
    }

      function isItemDisabled(entry: NormalizedStepperItem): boolean {
        if (local.disabled || entry.item.disabled) {
          return true
        }

        const activeIndex = currentIndex()

        if (!local.clickable) {
          if (activeIndex < 0) {
            return false
          }

        return entry.index !== activeIndex
      }

        if (!local.linear) {
          return false
        }

      if (activeIndex < 0) {
        return false
      }

      return entry.index > activeIndex + 1
    }

    function handleTriggerKeyDown(event: KeyboardEvent, index: number): void {
      const lastIndex = normalizedItems().length - 1

      if (lastIndex < 0) {
        return
      }

      const isBoundaryKey =
        local.orientation === 'vertical'
          ? (event.key === 'ArrowDown' && index === lastIndex) ||
            (event.key === 'ArrowUp' && index === 0)
          : (event.key === 'ArrowRight' && index === lastIndex) ||
            (event.key === 'ArrowLeft' && index === 0)

      if (!isBoundaryKey) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }

    return (
      <>
        <KobalteTabs.List
          data-slot="header"
          style={local.styles?.header}
          class={stepperHeaderVariants({ orientation: local.orientation }, local.classes?.header)}
        >
          <For each={normalizedItems()}>
            {(entry) => {
              const state = createMemo(() => getItemState(entry.index))
              const disabled = createMemo(() => isItemDisabled(entry))
              const idPrefix = createMemo(() => `${id()}-content-${entry.value}`)

              return (
                <div
                  data-slot="item"
                  style={local.styles?.item}
                  data-state={state()}
                  data-disabled={disabled() ? '' : undefined}
                  class={stepperItemVariants(
                    {
                      orientation: local.orientation,
                      size: local.size,
                    },
                    local.classes?.item,
                    entry.item.class,
                  )}
                >
                  <div
                    data-slot="container"
                    style={local.styles?.container}
                    class={stepperContainerVariants(
                      { orientation: local.orientation },
                      local.classes?.container,
                    )}
                  >
                    <KobalteTabs.Trigger
                      data-slot="trigger"
                      style={local.styles?.trigger}
                      data-state={state()}
                      data-clickable={local.clickable ? '' : undefined}
                      value={entry.value}
                      ref={(el: HTMLElement) => {
                        const listener: EventListener = (event) => {
                          handleTriggerKeyDown(event as KeyboardEvent, entry.index)
                        }

                        el.addEventListener('keydown', listener, true)
                        onCleanup(() => el.removeEventListener('keydown', listener, true))
                      }}
                      disabled={disabled()}
                      aria-labelledby={
                        entry.item.title ? `${idPrefix()}-step-${entry.index}-title` : undefined
                      }
                      aria-describedby={
                        entry.item.description
                          ? `${idPrefix()}-step-${entry.index}-description`
                          : undefined
                      }
                      class={stepperTriggerVariants(
                        {
                          size: local.size,
                          state: state(),
                        },
                        local.classes?.trigger,
                      )}
                    >
                      <Icon name={entry.item.icon || (() => entry.index + 1)} />
                    </KobalteTabs.Trigger>

                    <Show when={entry.index < normalizedItems().length - 1}>
                      <div
                        data-slot="separator"
                        style={local.styles?.separator}
                        data-state={state()}
                        data-disabled={disabled() ? '' : undefined}
                        class={stepperSeparatorVariants(
                          {
                            orientation: local.orientation,
                          },
                          local.classes?.separator,
                        )}
                      />
                    </Show>
                  </div>

                  <div
                    data-slot="wrapper"
                    style={local.styles?.wrapper}
                    class={stepperWrapperVariants(
                      { orientation: local.orientation },
                      local.classes?.wrapper,
                    )}
                  >
                    <Show when={entry.item.title}>
                      <div
                        data-slot="title"
                        style={local.styles?.title}
                        id={`${idPrefix()}-step-${entry.index}-title`}
                        class={stepperTitleVariants({ size: local.size }, local.classes?.title)}
                      >
                        {entry.item.title}
                      </div>
                    </Show>

                    <Show when={entry.item.description}>
                      <div
                        data-slot="description"
                        style={local.styles?.description}
                        id={`${idPrefix()}-step-${entry.index}-description`}
                        class={stepperDescriptionVariants(
                          { size: local.size },
                          local.classes?.description,
                        )}
                      >
                        {entry.item.description}
                      </div>
                    </Show>
                  </div>
                </div>
              )
            }}
          </For>
        </KobalteTabs.List>

        <For each={normalizedItems()}>
          {(entry) => (
            <Show when={entry.item.content}>
              <KobalteTabs.Content
                data-slot="content"
                style={local.styles?.content}
                value={entry.value}
                class={cn('w-full', entry.item.class, local.classes?.content)}
              >
                {entry.item.content}
              </KobalteTabs.Content>
            </Show>
          )}
        </For>
      </>
    )
  }

  return (
    <KobalteTabs.Root
      data-slot="root"
      style={local.styles?.root}
      id={id()}
      activationMode={local.activationMode}
      orientation={local.orientation}
      disabled={local.disabled}
      value={resolvedValue()}
      onChange={(value) => {
        if (!local.clickable) {
          return
        }

        setSelectedValue(value)
      }}
      class={stepperRootVariants({ orientation: local.orientation }, local.classes?.root)}
      {...rest}
    >
      <StepperBody />
    </KobalteTabs.Root>
  )
}
