import * as KobalteTabs from '@kobalte/core/tabs'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, onCleanup } from 'solid-js'

import { IconButton } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import type { RockUIComposeProps } from '../../shared/types'
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

export type StepperValue = string

/**
 * An individual step in the stepper.
 */
export interface StepperItem {
  /**
   * Unique value for the step.
   * @default index of the item
   */
  value?: StepperValue

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
  icon?: IconName

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

  /**
   * Additional arbitrary properties for the step item.
   */
  [key: string]: unknown
}

type StepperState = 'inactive' | 'active' | 'completed'

type StepperSlots =
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

export type StepperClasses = SlotClasses<StepperSlots>

export type StepperStyles = SlotStyles<StepperSlots>

/**
 * Base props for the Stepper component.
 */
export interface StepperBaseProps extends StepperVariantProps {
  /**
   * Array of steps to display.
   */
  items?: StepperItem[]

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

  /**
   * Slot-based class overrides.
   */
  classes?: StepperClasses

  /**
   * Slot-based style overrides.
   */
  styles?: StepperStyles
}

/**
 * Props for the Stepper component.
 */
export type StepperProps = RockUIComposeProps<StepperBaseProps, KobalteTabs.TabsRootProps>

interface NormalizedStepperItem {
  item: StepperItem
  index: number
  value: StepperValue
}

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

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() =>
    (merged.items ?? []).map((item, index) => ({
      item,
      index,
      value: item.value ?? String(index),
    })),
  )

  const resolvedValue = createMemo(() => {
    const value = merged.value
    if (value === undefined) {
      return undefined
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

  function StepperBody(): JSX.Element {
    const tabsContext = KobalteTabs.useTabsContext()

    const currentValue = createMemo(() => tabsContext.listState().selectedKey())

    const currentIndex = createMemo(() => {
      const value = currentValue()
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

      if (!merged.linear) {
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
        merged.orientation === 'vertical'
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
          style={merged.styles?.header}
          class={stepperHeaderVariants({ orientation: merged.orientation }, merged.classes?.header)}
        >
          <For each={normalizedItems()}>
            {(entry) => {
              const state = createMemo(() => getItemState(entry.index))
              const disabled = createMemo(() => isItemDisabled(entry))
              const idPrefix = createMemo(() => tabsContext.generateContentId(entry.value))

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
                    <KobalteTabs.Trigger
                      data-slot="trigger"
                      style={merged.styles?.trigger}
                      data-state={state()}
                      value={entry.value}
                      as={IconButton}
                      name={entry.item.icon || (() => entry.index + 1)}
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
                          size: merged.size,
                          state: state(),
                        },
                        merged.classes?.trigger,
                      )}
                    />

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
                        id={`${idPrefix()}-step-${entry.index}-title`}
                        class={stepperTitleVariants({ size: merged.size }, merged.classes?.title)}
                      >
                        {entry.item.title}
                      </div>
                    </Show>

                    <Show when={entry.item.description}>
                      <div
                        data-slot="description"
                        style={merged.styles?.description}
                        id={`${idPrefix()}-step-${entry.index}-description`}
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
        </KobalteTabs.List>

        <For each={normalizedItems()}>
          {(entry) => (
            <Show when={entry.item.content}>
              <KobalteTabs.Content
                data-slot="content"
                style={merged.styles?.content}
                value={entry.value}
                class={cn('w-full', entry.item.class, merged.classes?.content)}
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
      style={merged.styles?.root}
      id={id()}
      activationMode={merged.activationMode}
      orientation={merged.orientation}
      disabled={merged.disabled}
      value={resolvedValue()}
      defaultValue={merged.defaultValue}
      onChange={(e) => merged.clickable && merged.onChange?.(e)}
      class={stepperRootVariants({ orientation: merged.orientation }, merged.classes?.root)}
    >
      <StepperBody />
    </KobalteTabs.Root>
  )
}
