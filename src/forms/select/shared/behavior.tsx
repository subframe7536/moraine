import { Show, createSignal, onCleanup } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

import { Icon } from '../../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../../shared/render-prop.ts'
import type { SlotClassValue, SlotStyleValue } from '../../../shared/types.ts'
import { cn, useId } from '../../../shared/utils.ts'
import { useFormField } from '../../form-field/form-field-context.ts'
import type { FormFieldSize, UseFormFieldReturn } from '../../form-field/form-field-context.ts'

import type { BaseSelectItems, NormalizedGroup, NormalizedOption } from './types.ts'

interface UseSelectFieldProps {
  id?: string
  name?: string
  size?: FormFieldSize
  disabled?: boolean
  required?: boolean
  initialValue: unknown
}

interface RenderDefaultSelectOptionOptions<TItem> {
  option:
    | (TItem & {
        icon?: import('../../../elements/icon/index.ts').IconT.Name
        label?: string | JSX.Element
        description?: string | JSX.Element
        isSelected: boolean
      })
    | null
  classes?: Partial<
    Record<'empty' | 'itemDescription' | 'itemLabel' | 'itemTrailing', SlotClassValue>
  >
  styles?: Partial<
    Record<'empty' | 'itemDescription' | 'itemLabel' | 'itemTrailing', SlotStyleValue>
  >
  labelRender?: ComponentOrElement<{ option: TItem }>
}

interface CreateEmptyRendererOptions<TApi, TProps extends Record<string, unknown>> {
  emptyRender?: ComponentOrElement<TProps>
  buildProps: (api: TApi) => TProps
}

/**
 * Shared form-field bridge for select-like controls.
 */
export function useSelectField(props: () => UseSelectFieldProps): UseFormFieldReturn {
  const generatedId = useId(() => props().id, 'select')

  const field = useFormField(
    () => {
      const current = props()

      return {
        id: current.id,
        name: current.name,
        size: current.size,
        disabled: current.disabled,
        required: current.required,
      }
    },
    () => ({
      bind: false,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: props().initialValue,
    }),
  )

  return field
}

/**
 * Shared open/close control logic for select-like dropdown menus.
 */
export function useSelectMenuControl(options: {
  close: VoidFunction
  isOpen: Accessor<boolean>
  open: VoidFunction
}) {
  const [isDismissing, setIsDismissing] = createSignal(false)
  let dismissGeneration = 0
  let disposed = false

  onCleanup(() => {
    disposed = true
  })

  function markDismissing() {
    setIsDismissing(true)
    const generation = ++dismissGeneration
    queueMicrotask(() => {
      if (!disposed && dismissGeneration === generation) {
        setIsDismissing(false)
      }
    })
  }

  function openMenu() {
    if (!options.isOpen()) {
      options.open()
    }
  }

  function toggleMenu() {
    if (options.isOpen()) {
      options.close()
      return
    }

    options.open()
  }

  function onContentInteractOutside() {
    markDismissing()
  }

  return {
    isDismissing,
    markDismissing,
    onContentInteractOutside,
    openMenu,
    toggleMenu,
  }
}

/**
 * Shared option normalization helpers for select-like components.
 */
function normalizeLeafOption<TItems extends BaseSelectItems<TItems>>(
  option: TItems,
  valueOccurrences: Map<string, number>,
  resolvedItem?: TItems,
): NormalizedOption<TItems> {
  const renderItem = resolvedItem ?? ({ ...option } as TItems)
  const value = renderItem.value ?? ''
  const label = renderItem.label
  const serializedValue = String(value)
  const key = renderItem.key ?? (typeof label === 'string' ? label : serializedValue)
  const identity = `${typeof value}:${serializedValue}:${key}`
  const occurrence = valueOccurrences.get(identity) ?? 0
  valueOccurrences.set(identity, occurrence + 1)

  return {
    id: `${encodeURIComponent(identity)}:${occurrence}`,
    value,
    label: label ?? serializedValue,
    key,
    disabled: Boolean(renderItem.disabled),
    raw: option,
    renderItem: renderItem as TItems,
  }
}

export function normalizeOptions<TItems extends BaseSelectItems<TItems>>(
  options: TItems[] | undefined,
): Array<NormalizedOption<TItems> | NormalizedGroup<TItems>> {
  const valueOccurrences = new Map<string, number>()

  return (options ?? []).map((option, index) => {
    const renderItem = { ...option }
    if (Array.isArray(renderItem.children) && renderItem.children.length > 0) {
      return {
        id: `group:${index}`,
        label: renderItem.label ?? '',
        options: renderItem.children.map((child) => normalizeLeafOption(child, valueOccurrences)),
        isGroup: true as const,
      }
    }

    return normalizeLeafOption(option, valueOccurrences, renderItem as TItems)
  })
}

export function flattenOptions<TItems>(
  items: Array<NormalizedOption<TItems> | NormalizedGroup<TItems>>,
): NormalizedOption<TItems>[] {
  const result: NormalizedOption<TItems>[] = []

  for (const item of items) {
    if (item.isGroup) {
      result.push(...item.options)
    } else {
      result.push(item)
    }
  }

  return result
}

export function findNormalizedOptionByValue<TItems>(
  options: NormalizedOption<TItems>[],
  value: string | number | null | undefined,
): NormalizedOption<TItems> | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return options.find((option) => Object.is(option.value, value))
}

export function findNormalizedOptionByText<TItems>(
  options: NormalizedOption<TItems>[],
  value: string,
): NormalizedOption<TItems> | undefined {
  const normalizedValue = value.trim().toLowerCase()
  if (!normalizedValue) {
    return undefined
  }

  return options.find(
    (option) =>
      option.key.toLowerCase() === normalizedValue ||
      String(option.value).toLowerCase() === normalizedValue,
  )
}

export function emitSelectValueChange<TValue>(
  field: Pick<UseFormFieldReturn, 'setFormValue' | 'emit'>,
  value: TValue,
  onChange?: (value: TValue) => void,
): void {
  field.setFormValue(value)
  onChange?.(value)
  field.emit('change')
  field.emit('input')
}

export function mapNormalizedToRawValue<TRaw extends { value?: string | number }>(
  option: NormalizedOption<TRaw>,
): string | number {
  return option.value
}

export function mapNormalizedListToRawValues<TRaw extends { value?: string | number }>(
  options: NormalizedOption<TRaw>[],
): Array<string | number> {
  return options.map((option) => mapNormalizedToRawValue(option))
}

export function renderDefaultSelectOption<TItem>(
  options: RenderDefaultSelectOptionOptions<TItem>,
): JSX.Element {
  const option = options.option
  if (!option) {
    return (
      <div
        data-slot="empty"
        class={cn('text-sm text-muted-foreground p-2 text-center', options.classes?.empty)}
        style={options.styles?.empty}
      >
        No options
      </div>
    )
  }

  const label = (): JSX.Element => (
    <span
      data-slot="itemLabel"
      style={options.styles?.itemLabel}
      class={cn('truncate', options.classes?.itemLabel)}
    >
      <Show when={options.labelRender !== undefined} fallback={option.label}>
        {renderComponentOrElement(options.labelRender, { option })}
      </Show>
    </span>
  )

  return (
    <>
      <span class="flex flex-1 gap-2 min-w-0 items-center">
        <Show when={option.icon}>{(icon) => <Icon name={icon()} class="shrink-0" />}</Show>
        <span class="flex-1 min-w-0">
          {label()}
          <Show when={option.description}>
            {(description) => (
              <span
                data-slot="itemDescription"
                style={options.styles?.itemDescription}
                class={cn('text-xs text-muted-foreground block', options.classes?.itemDescription)}
              >
                {description()}
              </span>
            )}
          </Show>
        </span>
      </span>

      <Show when={option.isSelected}>
        <span
          data-slot="itemTrailing"
          style={options.styles?.itemTrailing}
          class={cn(
            'text-sm flex shrink-0 size-4 pointer-events-none items-center end-2 justify-center absolute',
            options.classes?.itemTrailing,
          )}
        >
          <Icon name="icon-check" />
        </span>
      </Show>
    </>
  )
}

export function createEmptyRenderer<TContext, TProps extends Record<string, unknown>>(
  options: CreateEmptyRendererOptions<TContext, TProps>,
): ((context: TContext) => JSX.Element) | undefined {
  if (options.emptyRender === undefined) {
    return undefined
  }
  return (context) => renderComponentOrElement(options.emptyRender, options.buildProps(context))
}
