import { Show, createSignal } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

import { Icon } from '../../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../../shared/types'
import { cn, useId } from '../../../shared/utils'
import { useFormField } from '../../form-field/form-field-context'
import type { FormFieldSize, UseFormFieldReturn } from '../../form-field/form-field-context'

import type { BaseSelectItems, NormalizedGroup, NormalizedOption } from './types'

interface UseSelectFieldProps {
  id?: string
  name?: string
  size?: FormFieldSize
  disabled?: boolean
  initialValue: unknown
}

interface RenderDefaultSelectOptionOptions<TItem> {
  option:
    | (TItem & {
        icon?: import('../../../elements/icon').IconT.Name
        label?: string | JSX.Element
        description?: string | JSX.Element
        isSelected: boolean
      })
    | null
  classes?: SlotClasses<'empty' | 'itemDescription' | 'itemLabel' | 'itemTrailing'>
  styles?: SlotStyles<'empty' | 'itemDescription' | 'itemLabel' | 'itemTrailing'>
  labelRender?: (option: TItem) => JSX.Element
}

interface CreateEmptyRendererOptions<TApi, TCtx> {
  emptyRender?: string | ((context: TCtx) => JSX.Element)
  classes?: SlotClasses<'empty'>
  styles?: SlotStyles<'empty'>
  buildContext: (api: TApi) => TCtx
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

  function markDismissing() {
    setIsDismissing(true)
    queueMicrotask(() => {
      setIsDismissing(false)
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
): NormalizedOption<TItems> {
  const value = option.value
  const label = option.label
  const normalizedValue = String(value ?? '')
  const key = option.key ?? (typeof label === 'string' ? label : normalizedValue)

  return {
    value: normalizedValue,
    label: label ?? normalizedValue,
    key,
    disabled: Boolean(option.disabled),
    raw: option,
  }
}

export function normalizeOptions<TItems extends BaseSelectItems<TItems>>(
  options: TItems[] | undefined,
): Array<NormalizedOption<TItems> | NormalizedGroup<TItems>> {
  return (options ?? []).map((option) => {
    if (Array.isArray(option.children) && option.children.length > 0) {
      return {
        label: option.label ?? '',
        options: option.children.map((child) => normalizeLeafOption(child)),
        isGroup: true as const,
      }
    }

    return normalizeLeafOption(option)
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

  const normalizedValue = String(value)
  return options.find((option) => option.value === normalizedValue)
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
      option.value.toLowerCase() === normalizedValue,
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
  return option.raw.value ?? option.value
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
      <Show when={options.labelRender} keyed fallback={option.label}>
        {(render) => render(option)}
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
            'text-sm ms-auto inline-flex shrink-0 items-center justify-center',
            options.classes?.itemTrailing,
          )}
        >
          <Icon name="icon-check" />
        </span>
      </Show>
    </>
  )
}

export function createEmptyRenderer<TContext, TCtx>(
  options: CreateEmptyRendererOptions<TContext, TCtx>,
): ((context: TContext) => JSX.Element) | undefined {
  if (!options.emptyRender) {
    return undefined
  }
  return (context) => (
    <Show when={options.emptyRender} keyed>
      {(render) => (
        <Show
          when={typeof render === 'string'}
          fallback={(render as (context: TCtx) => JSX.Element)(options.buildContext(context))}
        >
          <div data-slot="empty" style={options.styles?.empty} class={cn(options.classes?.empty)}>
            {render as string}
          </div>
        </Show>
      )}
    </Show>
  )
}
