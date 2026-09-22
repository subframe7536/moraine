import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { useCn } from '../../provider/cn-context.ts'
import { createStyles } from '../../provider/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { useId } from '../../shared/utils.ts'

import { stepperDataAttributes, stepperRecipe } from './stepper.recipe'
import type { StepperProps, StepperT } from './stepper.types.ts'

type StepperState = 'inactive' | 'active' | 'completed'

interface NormalizedStepperItem {
  item: StepperT.Item
  index: number
  value: StepperT.Value
}

/**
 * Tab-structured step navigation with configurable orientation and separator layout.
 */
export function Stepper(props: StepperProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'defaultValue',
    'onChange',
    'orientation',
    'activationMode',
    'items',
    'linear',
    'disabled',
    'clickable',
    'loop',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(stepperRecipe, local)
  const merged = mergeProps(
    {
      get orientation() {
        return resolved.variants.orientation
      },

      linear: true,
      clickable: false,
      loop: false,
    },
    local,
  )

  const id = useId(() => merged.id, 'stepper')
  const [requestedValue, setRequestedValue] = useControllableValue<StepperT.Value | null>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? null,
  })
  const triggerRefs = new Map<StepperT.Value, HTMLButtonElement>()

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() =>
    (merged.items ?? []).map((item, index) => {
      const title = createLazyMemo(() => item.title)
      const description = createLazyMemo(() => item.description)
      const icon = createLazyMemo(() => item.icon)
      const content = createLazyMemo(() => item.content)
      const mergedItem = mergeProps(item, {
        get title() {
          return title()
        },
        get description() {
          return description()
        },
        get icon() {
          return icon()
        },
        get content() {
          return content()
        },
      })
      return {
        item: mergedItem,
        index,
        value: item.value ?? String(index),
      }
    }),
  )

  const resolvedValue = createMemo(() => {
    const value = requestedValue()
    if (value === null) {
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
    loop: () => merged.loop,
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
    <div id={id()} data-slot="root" {...resolved.styles.root} {...rest}>
      <div
        role="tablist"
        aria-orientation={merged.orientation ?? undefined}
        data-slot="header"
        {...resolved.styles.header}
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
            const panelMounted = createMemo(() => selected() && Boolean(entry.item.content))

            return (
              <div
                data-slot="item"
                {...stepperDataAttributes.item({
                  state,
                  disabled,
                })}
                class={cn(resolved.styles.item.class, entry.item.class)}
                style={resolved.styles.item.style}
              >
                <button
                  id={triggerId()}
                  ref={(element) => {
                    triggerRefs.set(entry.value, element)
                  }}
                  type="button"
                  role="tab"
                  tabIndex={selected() ? 0 : -1}
                  aria-controls={panelMounted() ? contentId() : undefined}
                  aria-selected={selected()}
                  data-slot="trigger"
                  {...stepperDataAttributes.trigger({
                    selected,
                    state,
                    clickable: () => merged.clickable,
                  })}
                  disabled={disabled()}
                  aria-labelledby={entry.item.title ? titleId() : undefined}
                  aria-describedby={entry.item.description ? descriptionId() : undefined}
                  {...resolved.styles.trigger}
                  onClick={() => selectStep(entry.value)}
                  onKeyDown={(event) => {
                    onNavigationKeyDown(event, entry.value, merged.orientation ?? 'horizontal')
                  }}
                >
                  <span
                    {...stepperDataAttributes.indicator({ state })}
                    data-slot="indicator"
                    {...resolved.styles.indicator}
                  >
                    <Icon
                      name={entry.item.icon || (() => entry.index + 1)}
                      class={resolved.styles.icon.class}
                      style={resolved.styles.icon.style}
                    />
                  </span>

                  <Show when={entry.item.title || entry.item.description}>
                    <span data-slot="wrapper" {...resolved.styles.wrapper}>
                      <Show when={entry.item.title}>
                        <span data-slot="title" id={titleId()} {...resolved.styles.title}>
                          {entry.item.title}
                        </span>
                      </Show>

                      <Show when={entry.item.description}>
                        <span
                          data-slot="description"
                          id={descriptionId()}
                          {...resolved.styles.description}
                        >
                          {entry.item.description}
                        </span>
                      </Show>
                    </span>
                  </Show>
                </button>
                <Show when={entry.index < normalizedItems().length - 1}>
                  <div
                    aria-hidden="true"
                    data-slot="separator"
                    {...stepperDataAttributes.separator({
                      state,
                      disabled,
                    })}
                    {...resolved.styles.separator}
                  />
                </Show>
              </div>
            )
          }}
        </For>
      </div>

      <For each={normalizedItems()}>
        {(entry) => (
          <Show when={resolvedValue() === entry.value && entry.item.content}>
            <div
              id={getContentId(entry.value)}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={getTriggerId(entry.value)}
              {...stepperDataAttributes.content({ selected: true })}
              data-slot="content"
              class={cn(resolved.styles.content.class, entry.item.class)}
              style={resolved.styles.content.style}
            >
              {entry.item.content}
            </div>
          </Show>
        )}
      </For>
    </div>
  )
}
