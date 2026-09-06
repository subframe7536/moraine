import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { useId } from '../../shared/utils.ts'

import type { StepperProps, StepperT } from './stepper.types.ts'

type StepperState = 'inactive' | 'active' | 'completed'

export type { StepperProps, StepperT } from './stepper.types.ts'

interface NormalizedStepperItem {
  item: StepperT.Item
  index: number
  value: StepperT.Value
}

/**
 * Tab-structured step navigation with configurable orientation and separator layout.
 */
export function Stepper(props: StepperProps): JSX.Element {
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
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const design = useMoraineDesign()
  const stepperDesign = () => design().stepper

  const merged = mergeProps(
    {
      orientation: 'horizontal' as const,
      size: 'md' as const,
      linear: true,
      clickable: false,
    },
    () => stepperDesign().defaultVariants,
    local,
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return stepperDesign().recipe({
          orientation: merged.orientation,
          size: merged.size,
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const id = useId(() => merged.id, 'stepper')
  const [requestedValue, setRequestedValue] = useControllableValue<StepperT.Value>({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue,
  })
  const triggerRefs = new Map<StepperT.Value, HTMLButtonElement>()

  const normalizedItems = createMemo<NormalizedStepperItem[]>(() =>
    (merged.items ?? []).map((item, index) => {
      const title = createLazyMemo(() => item.title)
      const description = createLazyMemo(() => item.description)
      const icon = createLazyMemo(() => item.icon)
      const content = createLazyMemo(() => item.content)
      return {
        item: mergeProps(item, {
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
        }),
        index,
        value: item.value ?? String(index),
      }
    }),
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
    <div id={id()} data-slot="root" {...resolved.rootClassAndStyle()} {...rest}>
      <div
        role="tablist"
        aria-orientation={merged.orientation ?? undefined}
        data-slot="header"
        {...resolved.slotClassAndStyle('header')}
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
                data-state={state()}
                data-disabled={disabled() ? '' : undefined}
                {...resolved.slotClassAndStyle('item', {
                  get state() {
                    return { class: entry.item.class }
                  },
                })}
              >
                <div data-slot="container" {...resolved.slotClassAndStyle('container')}>
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
                    data-state={state()}
                    data-clickable={merged.clickable ? '' : undefined}
                    disabled={disabled()}
                    aria-labelledby={entry.item.title ? titleId() : undefined}
                    aria-describedby={entry.item.description ? descriptionId() : undefined}
                    {...resolved.slotClassAndStyle('trigger')}
                    onClick={() => selectStep(entry.value)}
                    onKeyDown={(event) => {
                      onNavigationKeyDown(event, entry.value, merged.orientation ?? 'horizontal')
                    }}
                  >
                    <Icon name={entry.item.icon || (() => entry.index + 1)} />
                  </button>

                  <Show when={entry.index < normalizedItems().length - 1}>
                    <div
                      data-slot="separator"
                      data-state={state()}
                      data-disabled={disabled() ? '' : undefined}
                      {...resolved.slotClassAndStyle('separator')}
                    />
                  </Show>
                </div>

                <div data-slot="wrapper" {...resolved.slotClassAndStyle('wrapper')}>
                  <Show when={entry.item.title}>
                    <div data-slot="title" id={titleId()} {...resolved.slotClassAndStyle('title')}>
                      {entry.item.title}
                    </div>
                  </Show>

                  <Show when={entry.item.description}>
                    <div
                      data-slot="description"
                      id={descriptionId()}
                      {...resolved.slotClassAndStyle('description')}
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
          <Show when={resolvedValue() === entry.value && entry.item.content}>
            <div
              id={getContentId(entry.value)}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={getTriggerId(entry.value)}
              data-selected=""
              data-slot="content"
              {...resolved.slotClassAndStyle('content', {
                get state() {
                  return { class: entry.item.class }
                },
              })}
            >
              {entry.item.content}
            </div>
          </Show>
        )}
      </For>
    </div>
  )
}
