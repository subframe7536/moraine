import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
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

export namespace StepperT {
  export type Value = string

  export interface Slot<T = unknown> {
    /**
     * Stepper container that owns orientation, step state, and panel rendering.
     */

    root?: T

    /** Step navigation header that contains all step triggers. */
    header?: T

    /** Wrapper for one step trigger. */
    item?: T

    /** Text column inside a step trigger. */
    container?: T

    /** Interactive step control users activate to select a step. */
    trigger?: T

    /** Step marker that communicates index, active state, or completion. */
    indicator?: T

    /** Icon rendered inside a completed or custom step indicator. */
    icon?: T

    /** Connector line between adjacent steps. */
    separator?: T

    /** Inner layout wrapper for a single step trigger. */
    wrapper?: T

    /** Primary title text for a step. */
    title?: T

    /** Supporting description for a step. */
    description?: T

    /** Panel rendered for the active step content. */
    content?: T
  }
  export type Variant = StepperVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend = never

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
     * Unique identifier for the stepper root element.
     */
    id?: string

    /**
     * Controlled active step value.
     */
    value?: Value

    /**
     * Default active step value for uncontrolled usage.
     */
    defaultValue?: Value

    /**
     * Callback when the active step changes.
     */
    onChange?: (value: Value) => void

    /**
     * The orientation of the stepper.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Whether keyboard activation happens immediately or only after confirmation.
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

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
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
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
 * Tab-structured step navigation with configurable orientation and separator layout.
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

  const id = useId(() => merged.id, 'stepper')
  const [requestedValue, setRequestedValue] = useControllableValue<StepperT.Value>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const triggerRefs = new Map<StepperT.Value, HTMLButtonElement>()

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() =>
    (merged.items ?? []).map((item, index) => ({
      item,
      index,
      value: item.value ?? String(index),
    })),
  )

  const resolvedValue = createMemo(() => {
    const value = requestedValue()
    if (value === undefined) {
      const firstEnabled = normalizedItems().find((entry) => !entry.item.disabled)
      return firstEnabled?.value ?? normalizedItems()[0]?.value
    }
    const items = normalizedItems()
    if (items.length === 0) {
      return undefined
    }

    if (items.some((entry) => entry.value === value)) {
      return value
    }

    const firstEnabled = items.find((entry) => !entry.item.disabled)
    return firstEnabled?.value ?? items[0]?.value
  })

  const currentIndex = createMemo(() => {
    const value = resolvedValue()
    return normalizedItems().findIndex((item) => item.value === value)
  })
  const { onNavigationKeyDown } = useSelectableCollectionNavigation<
    NormalizedStepperItem,
    StepperT.Value
  >({
    items: normalizedItems,
    getValue: (entry) => entry.value,
    isDisabled: isItemDisabled,
    loop: () => false,
    activationMode: () => merged.activationMode ?? 'automatic',
    focusValue: (value) => triggerRefs.get(value)?.focus(),
    onSelect: selectStep,
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
    if (merged.disabled || entry.item.disabled) {
      return true
    }

    const activeIndex = currentIndex()

    if (!merged.clickable) {
      if (activeIndex < 0) {
        return false
      }

      return entry.index !== activeIndex
    }

    if (!merged.linear || activeIndex < 0) {
      return false
    }

    return entry.index > activeIndex + 1
  }

  function selectStep(nextValue: StepperT.Value): void {
    if (merged.disabled || nextValue === resolvedValue()) {
      return
    }

    setRequestedValue(nextValue)

    if (merged.clickable) {
      merged.onChange?.(nextValue)
    }
  }

  function getTriggerId(value: StepperT.Value): string {
    return `${id()}-${value}-trigger`
  }

  function getContentId(value: StepperT.Value): string {
    return `${id()}-${value}-content`
  }

  return (
    <div
      id={id()}
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={stepperRootVariants(
        { orientation: merged.orientation },
        merged.classes?.root,
        merged.class,
      )}
    >
      <div
        role="tablist"
        aria-orientation={merged.orientation}
        data-slot="header"
        style={merged.styles?.header}
        class={stepperHeaderVariants({ orientation: merged.orientation }, merged.classes?.header)}
      >
        <For each={normalizedItems()}>
          {(entry) => {
            const state = createMemo(() => getItemState(entry.index))
            const disabled = createMemo(() => isItemDisabled(entry))
            const triggerId = createMemo(() => getTriggerId(entry.value))
            const contentId = createMemo(() => getContentId(entry.value))
            const titleId = createMemo(() => `${contentId()}-step-${entry.index}-title`)
            const descriptionId = createMemo(() => `${contentId()}-step-${entry.index}-description`)
            const selected = createMemo(() => resolvedValue() === entry.value)

            return (
              <div
                data-slot="item"
                style={merged.styles?.item}
                data-state={state()}
                data-disabled={disabled() ? '' : undefined}
                class={stepperItemVariants(
                  {
                    orientation: merged.orientation,
                    size: merged.size,
                  },
                  merged.classes?.item,
                  entry.item.class,
                )}
              >
                <div
                  data-slot="container"
                  style={merged.styles?.container}
                  class={stepperContainerVariants(
                    { orientation: merged.orientation },
                    merged.classes?.container,
                  )}
                >
                  <button
                    id={triggerId()}
                    ref={(element) => {
                      triggerRefs.set(entry.value, element)
                    }}
                    type="button"
                    role="tab"
                    tabIndex={selected() ? 0 : -1}
                    aria-controls={contentId()}
                    aria-selected={selected()}
                    data-selected={selected() ? '' : undefined}
                    data-slot="trigger"
                    style={merged.styles?.trigger}
                    data-state={state()}
                    data-clickable={merged.clickable ? '' : undefined}
                    disabled={disabled()}
                    aria-labelledby={entry.item.title ? titleId() : undefined}
                    aria-describedby={entry.item.description ? descriptionId() : undefined}
                    class={stepperTriggerVariants(
                      {
                        size: merged.size,
                        state: state(),
                      },
                      merged.classes?.trigger,
                    )}
                    onClick={() => selectStep(entry.value)}
                    onKeyDown={(event) => {
                      onNavigationKeyDown(event, entry.value, merged.orientation)
                    }}
                  >
                    <Icon name={entry.item.icon || (() => entry.index + 1)} />
                  </button>

                  <Show when={entry.index < normalizedItems().length - 1}>
                    <div
                      data-slot="separator"
                      style={merged.styles?.separator}
                      data-state={state()}
                      data-disabled={disabled() ? '' : undefined}
                      class={stepperSeparatorVariants(
                        {
                          orientation: merged.orientation,
                        },
                        merged.classes?.separator,
                      )}
                    />
                  </Show>
                </div>

                <div
                  data-slot="wrapper"
                  style={merged.styles?.wrapper}
                  class={stepperWrapperVariants(
                    { orientation: merged.orientation },
                    merged.classes?.wrapper,
                  )}
                >
                  <Show when={entry.item.title}>
                    <div
                      data-slot="title"
                      style={merged.styles?.title}
                      id={titleId()}
                      class={stepperTitleVariants({ size: merged.size }, merged.classes?.title)}
                    >
                      {entry.item.title}
                    </div>
                  </Show>

                  <Show when={entry.item.description}>
                    <div
                      data-slot="description"
                      style={merged.styles?.description}
                      id={descriptionId()}
                      class={stepperDescriptionVariants(
                        { size: merged.size },
                        merged.classes?.description,
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
      </div>

      <For each={normalizedItems()}>
        {(entry) => (
          <Show when={entry.item.content && resolvedValue() === entry.value}>
            <div
              id={getContentId(entry.value)}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={getTriggerId(entry.value)}
              data-selected=""
              data-slot="content"
              style={merged.styles?.content}
              class={cn('w-full', entry.item.class, merged.classes?.content)}
            >
              {entry.item.content}
            </div>
          </Show>
        )}
      </For>
    </div>
  )
}
