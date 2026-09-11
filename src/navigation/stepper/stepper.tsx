import type { JSX } from 'solid-js'
import { For, Show, createMemo, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { useCn } from '../../shared/provider/cn-context.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { useId } from '../../shared/utils.ts'

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
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('stepper', local)
  const merged = mergeProps(
    {
      get orientation() {
        return resolved.variants.orientation ?? 'horizontal'
      },

      linear: true,
      clickable: false,
    },
    local,
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
  const activeEntry = createMemo(() => normalizedItems()[currentIndex()])
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

  function getTitleId(entry: NormalizedStepperItem): string {
    return `${getContentId(entry.value)}-step-${entry.index}-title`
  }

  function getDescriptionId(entry: NormalizedStepperItem): string {
    return `${getContentId(entry.value)}-step-${entry.index}-description`
  }

  return (
    <div id={id()} data-slot="root" {...resolved.root} {...rest}>
      <div
        role="tablist"
        aria-orientation={merged.orientation ?? undefined}
        data-slot="list"
        {...resolved.slot('list')}
      >
        <For each={normalizedItems()}>
          {(entry) => {
            const state = () => getItemState(entry.index)
            const disabled = () => isItemDisabled(entry)
            const selected = () => resolvedValue() === entry.value
            const title = createMemo(() => entry.item.title)
            const description = createMemo(() => entry.item.description)

            return (
              <div
                data-slot="item"
                data-state={state()}
                data-disabled={disabled() ? '' : undefined}
                class={cn(resolved.slot('item').class, entry.item.class)}
                style={resolved.slot('item').style}
              >
                <button
                  id={getTriggerId(entry.value)}
                  ref={(element) => {
                    triggerRefs.set(entry.value, element)
                  }}
                  type="button"
                  role="tab"
                  tabIndex={selected() ? 0 : -1}
                  aria-controls={getContentId(entry.value)}
                  aria-selected={selected()}
                  data-selected={selected() ? '' : undefined}
                  data-slot="trigger"
                  data-clickable={merged.clickable ? '' : undefined}
                  disabled={disabled()}
                  aria-labelledby={title() ? getTitleId(entry) : undefined}
                  aria-describedby={description() ? getDescriptionId(entry) : undefined}
                  {...resolved.slot('trigger')}
                  onClick={() => selectStep(entry.value)}
                  onKeyDown={(event) => {
                    onNavigationKeyDown(event, entry.value, merged.orientation ?? 'horizontal')
                  }}
                >
                  <span data-slot="indicator" data-state={state()} {...resolved.slot('indicator')}>
                    <Icon name={entry.item.icon || (() => entry.index + 1)} />
                  </span>
                  <span data-slot="body" {...resolved.slot('body')}>
                    <Show when={title()}>
                      {(title) => (
                        <span data-slot="title" id={getTitleId(entry)} {...resolved.slot('title')}>
                          {title()}
                        </span>
                      )}
                    </Show>
                    <Show when={description()}>
                      {(description) => (
                        <span
                          data-slot="description"
                          id={getDescriptionId(entry)}
                          {...resolved.slot('description')}
                        >
                          {description()}
                        </span>
                      )}
                    </Show>
                  </span>
                </button>
                <Show when={entry.index < normalizedItems().length - 1}>
                  <span
                    aria-hidden="true"
                    data-slot="separator"
                    data-state={state()}
                    data-disabled={disabled() ? '' : undefined}
                    {...resolved.slot('separator')}
                  />
                </Show>
              </div>
            )
          }}
        </For>
      </div>
      <Show when={activeEntry()} keyed>
        {(entry) => (
          <Show when={entry.item.content}>
            {(content) => (
              <div
                id={getContentId(entry.value)}
                role="tabpanel"
                tabIndex={0}
                aria-labelledby={getTriggerId(entry.value)}
                data-selected=""
                data-slot="content"
                {...resolved.slot('content')}
              >
                {content()}
              </div>
            )}
          </Show>
        )}
      </Show>
    </div>
  )
}
