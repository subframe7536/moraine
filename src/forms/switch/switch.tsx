import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, onMount } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useEventListener } from '../../shared/use-event-listener'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../form-field/form-options'

import type { SwitchVariantProps } from './switch.class'
import { switchTrackVariants, switchThumbVariants, switchWrapperVariants } from './switch.class'

export namespace SwitchT {
  export interface Slot<T = unknown> {
    /** Switch wrapper that coordinates input, track, thumb, and text content. */
    root?: T

    /** Visible switch track that shows checked and unchecked state. */
    track?: T

    /** Movable knob inside the switch track. */
    thumb?: T

    /** Checked, unchecked, or loading icon rendered inside the thumb. */
    icon?: T

    /** Inner layout wrapper used by switch list and card variants. */
    wrapper?: T

    /** Primary switch label text. */
    label?: T

    /** Supporting text associated with the switch. */
    description?: T
  }

  export type Variant = SwitchVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Extend = never

  export interface Item {}

  /**
   * Base props for the Switch component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Pointer down handler for the switch root container.
     */
    onPointerDown?: JSX.EventHandler<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the switch is checked.
     * @default 'on'
     */
    value?: string

    /**
     * Whether the switch is checked.
     */
    checked?: TTrue | TFalse

    /**
     * Whether the switch is checked by default.
     */
    defaultChecked?: boolean

    /**
     * Value to use when the switch is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the switch is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Whether the switch is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Icon shown when the switch is checked.
     */
    checkedIcon?: IconT.Name

    /**
     * Icon shown when the switch is unchecked.
     */
    uncheckedIcon?: IconT.Name

    /**
     * Label for the switch.
     */
    label?: JSX.Element

    /**
     * Description for the switch.
     */
    description?: JSX.Element

    /**
     * Callback when the switch state changes.
     */
    onChange?: (value: TTrue | TFalse) => void
  }

  /**
   * Props for the Switch component.
   */
  export interface Props<TTrue = boolean, TFalse = boolean> extends BaseProps<
    Base<TTrue, TFalse>,
    Variant,
    Extend,
    Classes,
    Styles
  > {}
}

/**
 * Props for the Switch component.
 */
export interface SwitchProps<TTrue = boolean, TFalse = boolean> extends SwitchT.Props<
  TTrue,
  TFalse
> {}

/** Toggle switch control with icon slots and loading state. */
export function Switch<TTrue = boolean, TFalse = boolean>(
  props: SwitchProps<TTrue, TFalse>,
): JSX.Element {
  const merged = mergeProps(
    {
      size: 'md' as const,
      loading: false,
      loadingIcon: 'icon-loading' as IconT.Name,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },
    props,
  )

  const generatedId = useId(() => merged.id, 'switch')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled || merged.loading,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        normalizeFieldValue(
          merged.checked !== undefined ? merged.checked : merged.defaultChecked,
        ) ?? merged.falseValue,
    }),
  )
  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() => `${field.id()}-description`)

  let inputEl: HTMLInputElement | undefined

  function toCheckedState(value: unknown): boolean {
    if (value === merged.trueValue) {
      return true
    }

    if (value === merged.falseValue) {
      return false
    }

    return typeof value === 'boolean' ? value : false
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined) {
      return value
    }

    if (value === merged.trueValue || value === merged.falseValue) {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? merged.trueValue : merged.falseValue
    }

    return value
  }

  const [checked, setChecked] = useControllableValue<boolean>({
    value: () => {
      if (merged.checked !== undefined) {
        return toCheckedState(merged.checked)
      }

      if (field.value() !== undefined) {
        return toCheckedState(field.value())
      }

      return undefined
    },
    defaultValue: () => Boolean(merged.defaultChecked),
  })

  createEffect(() => {
    if (merged.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(merged.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = nextChecked ? (merged.trueValue as TTrue) : (merged.falseValue as TFalse)

    setChecked(nextChecked)

    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  const readOnly = createMemo(() => Boolean(merged.readOnly))

  createEffect(() => {
    if (inputEl) {
      inputEl.checked = Boolean(checked())
    }
  })

  function toggle(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    onChange(!checked())
  }

  onMount(() => {
    const form = inputEl?.form
    if (!form) {
      return
    }

    function onReset(): void {
      // oxlint-disable-next-line subf/solid-reactivity
      queueMicrotask(() => {
        const nextChecked = Boolean(merged.defaultChecked)
        setChecked(nextChecked)

        if (inputEl) {
          inputEl.checked = nextChecked
        }

        field.setFormValue(nextChecked ? merged.trueValue : merged.falseValue)
      })
    }

    useEventListener(form, 'reset', onReset)
  })

  function onRootKeyDown(event: KeyboardEvent): void {
    if (event.key !== ' ' && event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    toggle()
  }

  function onPointerDown(
    event: Parameters<JSX.EventHandler<HTMLButtonElement, PointerEvent>>[0],
  ): void {
    merged.onPointerDown?.(event)

    if (document.activeElement === inputEl) {
      event.preventDefault()
    }
  }

  function resolvedIconName(): IconT.Name | undefined {
    if (merged.loading) {
      return merged.loadingIcon
    }

    return checked() ? merged.checkedIcon : merged.uncheckedIcon
  }

  return (
    <div
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn('flex flex-row', merged.classes?.root, merged.class)}
    >
      <HiddenInput
        ref={(element) => {
          inputEl = element
        }}
        id={`${field.id()}-input`}
        type="checkbox"
        name={field.name()}
        value={merged.value}
        checked={Boolean(checked())}
        required={merged.required}
        disabled={field.disabled()}
        readOnly={readOnly()}
        tabIndex={-1}
        aria-hidden="true"
        class="peer"
        data-slot="input"
        onChange={(event) => {
          event.stopPropagation()

          if (field.disabled() || readOnly()) {
            event.currentTarget.checked = Boolean(checked())
            return
          }

          onChange(event.currentTarget.checked)
          event.currentTarget.checked = Boolean(checked())
        }}
      />

      <button
        id={field.id()}
        type="button"
        role="switch"
        disabled={field.disabled()}
        data-slot="track"
        data-invalid={field.invalid() ? '' : undefined}
        aria-checked={Boolean(checked())}
        aria-required={merged.required || undefined}
        aria-disabled={field.disabled() || undefined}
        aria-readonly={readOnly() || undefined}
        aria-labelledby={merged.label ? labelId() : undefined}
        aria-describedby={merged.description ? descriptionId() : undefined}
        {...field.ariaAttrs()}
        style={merged.styles?.track}
        class={switchTrackVariants(
          {
            size: field.size(),
          },
          merged.classes?.track,
          field.disabled() && 'effect-dis',
        )}
        onPointerDown={onPointerDown}
        onClick={() => toggle()}
        onKeyDown={onRootKeyDown}
        data-checked={checked() ? '' : undefined}
        data-disabled={field.disabled() ? '' : undefined}
        data-readonly={readOnly() ? '' : undefined}
      >
        <span
          data-slot="thumb"
          data-checked={checked() ? '' : undefined}
          data-disabled={field.disabled() ? '' : undefined}
          data-readonly={readOnly() ? '' : undefined}
          style={merged.styles?.thumb}
          class={switchThumbVariants(
            {
              size: field.size(),
            },
            merged.classes?.thumb,
          )}
        >
          <Show when={resolvedIconName()} keyed>
            {(iconName) => (
              <Icon
                name={iconName}
                data-checked={!merged.loading && checked() ? '' : undefined}
                data-unchecked={!merged.loading && !checked() ? '' : undefined}
                data-loading={merged.loading ? '' : undefined}
                class={cn(
                  'text-primary size-10/12 transition-opacity absolute data-unchecked:(text-muted-foreground opacity-90) data-checked:opacity-100 data-loading:effect-loading',
                  merged.classes?.icon,
                )}
              />
            )}
          </Show>
        </span>
      </button>

      <Show when={merged.label || merged.description}>
        <span
          data-slot="wrapper"
          style={merged.styles?.wrapper}
          class={switchWrapperVariants(
            {
              size: field.size(),
            },
            merged.classes?.wrapper,
          )}
        >
          <Show when={merged.label}>
            <label
              for={field.id()}
              id={labelId()}
              data-slot="label"
              style={merged.styles?.label}
              class={cn(
                'text-foreground font-medium block cursor-pointer',
                merged.required && "after:(text-destructive ms-0.5 content-['*'])",
                merged.classes?.label,
              )}
            >
              {merged.label}
            </label>
          </Show>

          <Show when={merged.description}>
            <span
              id={descriptionId()}
              data-slot="description"
              style={merged.styles?.description}
              class={cn('text-muted-foreground block', merged.classes?.description)}
            >
              {merged.description}
            </span>
          </Show>
        </span>
      </Show>
    </div>
  )
}
