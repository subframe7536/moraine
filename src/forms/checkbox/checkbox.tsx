import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useEventListener } from '../../shared/use-event-listener'
import { callHandler, cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../form-field/form-options'

import type { CheckboxVariantProps } from './checkbox.class'
import {
  checkboxBaseVariants,
  checkboxCardPaddingVariants,
  checkboxIconVariants,
  checkboxLabelVariants,
  checkboxRootVariants,
  checkboxWrapperVariants,
} from './checkbox.class'

export namespace CheckboxT {
  export interface Slot<T = unknown> {
    /**
     * Labelable checkbox wrapper that coordinates input, indicator, and text content.
     */
    root?: T

    /** Visible checkbox control users recognize as the toggle target. */
    control?: T

    /** Visual checked or indeterminate state layer inside the control. */
    indicator?: T

    /** Check or indeterminate icon rendered for the current state. */
    icon?: T

    /** Inner layout wrapper used by card and list checkbox variants. */
    wrapper?: T

    /** Primary checkbox label text. */
    label?: T

    /** Supporting text associated with the checkbox. */
    description?: T
  }

  export type Variant = CheckboxVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Checkbox component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Pointer down handler for the checkbox control.
     */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the checkbox is checked.
     * @default 'on'
     */
    value?: string

    /**
     * Whether the checkbox is checked (controlled).
     */
    checked?: TTrue | TFalse | 'indeterminate'

    /**
     * Whether the checkbox is checked by default (uncontrolled).
     * @default false
     */
    defaultChecked?: boolean | 'indeterminate'

    /**
     * Value to use when the checkbox is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the checkbox is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Label for the checkbox.
     */
    label?: JSX.Element

    /**
     * Description text for the checkbox.
     */
    description?: JSX.Element

    /**
     * Whether to bind the checkbox value to the parent FormField.
     * @default true
     */
    formFieldBind?: boolean

    /**
     * Callback when the checked state changes.
     */
    onChange?: (value: TTrue | TFalse) => void

    /**
     * Whether the checkbox is in an indeterminate state.
     * @default false
     */
    indeterminate?: boolean

    /**
     * Icon to show when checked.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name

    /**
     * Icon to show when indeterminate.
     * @default 'icon-minus'
     */
    indeterminateIcon?: IconT.Name
  }

  /**
   * Props for the Checkbox component.
   */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variant,
    Slot
  >
}

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps<TTrue = boolean, TFalse = boolean> extends CheckboxT.Props<
  TTrue,
  TFalse
> {}

/** Single checkbox control with card and list variants and custom true/false values. */
export function Checkbox<TTrue = boolean, TFalse = boolean>(
  props: CheckboxProps<TTrue, TFalse>,
): JSX.Element {
  type RootProps = CheckboxProps<TTrue, TFalse> & {
    onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'id',
    'name',
    'disabled',
    'required',
    'readOnly',
    'value',
    'checked',
    'defaultChecked',
    'trueValue',
    'falseValue',
    'label',
    'description',
    'formFieldBind',
    'onChange',
    'indeterminate',
    'checkedIcon',
    'indeterminateIcon',
    'onPointerDown',
    'size',
    'variant',
    'indicator',
    'classes',
    'styles',
    'class',
    'style',
    'onClick',
  ])
  const merged = mergeProps(
    {
      size: 'md' as const,
      variant: 'list' as const,
      indicator: 'start' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      indeterminateIcon: 'icon-minus' as IconT.Name,
      formFieldBind: true,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)

  const generatedId = useId(() => merged.id, 'checkbox')

  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      bind: merged.formFieldBind,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue:
        merged.formFieldBind === false
          ? undefined
          : (normalizeFieldValue(
              merged.checked !== undefined ? merged.checked : merged.defaultChecked,
            ) ?? merged.falseValue),
    }),
  )

  const defaultCheckedState = createMemo<boolean | 'indeterminate'>(() => {
    if (merged.defaultChecked === undefined) {
      return false
    }

    return toCheckedState(merged.defaultChecked)
  })

  let inputEl: HTMLInputElement | undefined

  function toCheckedState(value: unknown): boolean | 'indeterminate' {
    if (value === 'indeterminate') {
      return 'indeterminate'
    }

    return value === merged.trueValue || (typeof value === 'boolean' && value)
  }

  function normalizeFieldValue(value: unknown): unknown {
    if (value === undefined || value === 'indeterminate') {
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

  function toChangeValue(nextChecked: boolean): TTrue | TFalse {
    return nextChecked ? (merged.trueValue as TTrue) : (merged.falseValue as TFalse)
  }

  const [checked, setChecked] = useControllableValue<boolean | 'indeterminate'>({
    value: () => {
      if (merged.checked !== undefined) {
        return toCheckedState(merged.checked)
      }

      if (merged.formFieldBind !== false && field.value() !== undefined) {
        return toCheckedState(field.value())
      }

      return undefined
    },
    defaultValue: defaultCheckedState,
  })

  const resolvedChecked = createMemo<boolean | undefined>(() => {
    const value = checked()

    return value === 'indeterminate' ? false : value
  })

  const indeterminate = createMemo<boolean>(() => {
    if (merged.indeterminate !== undefined) {
      return merged.indeterminate
    }
    return checked() === 'indeterminate'
  })

  createEffect(() => {
    if (merged.formFieldBind === false || merged.checked === undefined) {
      return
    }

    field.setFormValue(normalizeFieldValue(merged.checked))
  })

  function onChange(nextChecked: boolean): void {
    const nextValue = toChangeValue(nextChecked)

    setChecked(nextChecked)

    if (merged.formFieldBind === false) {
      merged.onChange?.(nextValue)
      return
    }

    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  const readOnly = createMemo(() => Boolean(merged.readOnly))
  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() =>
    merged.description ? `${field.id()}-description` : undefined,
  )
  const checkboxAriaAttrs = createMemo(() => {
    const attrs = { ...field.ariaAttrs() }
    const describedBy = [attrs['aria-describedby'], descriptionId()].filter(Boolean).join(' ')

    if (describedBy) {
      attrs['aria-describedby'] = describedBy
    }

    return attrs
  })

  createEffect(() => {
    if (inputEl) {
      inputEl.checked = Boolean(resolvedChecked())
      inputEl.indeterminate = indeterminate()
    }
  })

  onMount(() => {
    const form = inputEl?.form
    if (!form) {
      return
    }

    function onReset(): void {
      // oxlint-disable-next-line subf/solid-reactivity
      queueMicrotask(() => {
        const nextChecked = defaultCheckedState()
        setChecked(nextChecked)

        if (inputEl) {
          inputEl.checked = nextChecked === true
          inputEl.indeterminate = nextChecked === 'indeterminate'
        }

        if (merged.formFieldBind !== false) {
          field.setFormValue(nextChecked === true ? merged.trueValue : merged.falseValue)
        }
      })
    }

    useEventListener(form, 'reset', onReset)
  })

  function toggle(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    onChange(!resolvedChecked())
  }

  function onControlKeyDown(event: KeyboardEvent): void {
    if (event.key !== ' ') {
      return
    }

    event.preventDefault()
    toggle()
  }

  const onPointerDown: JSX.EventHandler<HTMLButtonElement, PointerEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onPointerDown)
    if (defaultPrevented) {
      return
    }

    if (document.activeElement === inputEl) {
      event.preventDefault()
    }
  }

  const onRootClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onClick)
    if (defaultPrevented) {
      return
    }
    if (merged.variant !== 'card') {
      return
    }

    const target = event.target
    if (target instanceof HTMLElement && target.closest('[data-slot="control"]')) {
      return
    }

    toggle()
  }

  return (
    <div
      data-slot="root"
      {...rest}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={checkboxRootVariants(
        {
          variant: merged.variant,
          indicator: merged.indicator === 'hidden' ? undefined : merged.indicator,
        },
        merged.variant === 'card' &&
          checkboxCardPaddingVariants({
            size: field.size(),
          }),
        merged.variant === 'card' && 'cursor-pointer',
        merged.classes?.root,
        merged.class,
      )}
      onClick={onRootClick}
    >
      <HiddenInput
        ref={(element) => {
          inputEl = element
        }}
        id={`${field.id()}-input`}
        type="checkbox"
        name={field.name()}
        value={merged.value}
        checked={Boolean(resolvedChecked())}
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
            event.currentTarget.checked = Boolean(resolvedChecked())
            event.currentTarget.indeterminate = indeterminate()
            return
          }

          onChange(event.currentTarget.checked)
          event.currentTarget.checked = Boolean(resolvedChecked())
          event.currentTarget.indeterminate = indeterminate()
        }}
      />

      <button
        id={field.id()}
        type="button"
        role="checkbox"
        disabled={field.disabled()}
        data-slot="control"
        data-invalid={field.invalid() ? '' : undefined}
        aria-checked={indeterminate() ? 'mixed' : Boolean(resolvedChecked())}
        aria-required={merged.required || undefined}
        aria-disabled={field.disabled() || undefined}
        aria-readonly={readOnly() || undefined}
        aria-labelledby={merged.label ? labelId() : undefined}
        style={merged.styles?.control}
        class={checkboxBaseVariants(
          { size: field.size() },
          merged.indicator === 'hidden' && 'sr-only',
          merged.classes?.control,
          field.disabled() && 'effect-dis',
        )}
        onPointerDown={onPointerDown}
        onClick={() => toggle()}
        onKeyDown={onControlKeyDown}
        {...checkboxAriaAttrs()}
        data-checked={resolvedChecked() ? '' : undefined}
        data-disabled={field.disabled() ? '' : undefined}
        data-indeterminate={indeterminate() ? '' : undefined}
        data-readonly={readOnly() ? '' : undefined}
        data-required={merged.required ? '' : undefined}
      >
        <Show when={resolvedChecked() || indeterminate()}>
          <span
            data-slot="indicator"
            style={merged.styles?.indicator}
            class={cn(
              'text-primary-foreground bg-primary flex size-full items-center justify-center',
              merged.classes?.indicator,
            )}
            data-checked={resolvedChecked() ? '' : undefined}
            data-disabled={field.disabled() ? '' : undefined}
            data-indeterminate={indeterminate() ? '' : undefined}
            data-readonly={readOnly() ? '' : undefined}
            data-required={merged.required ? '' : undefined}
          >
            <Icon
              name={indeterminate() ? merged.indeterminateIcon : merged.checkedIcon}
              class={checkboxIconVariants({ size: field.size() }, merged.classes?.icon)}
            />
          </span>
        </Show>
      </button>

      <Show when={label() || description()}>
        <div
          data-slot="wrapper"
          style={merged.styles?.wrapper}
          class={checkboxWrapperVariants(
            {
              indicator: merged.indicator,
              size: field.size(),
            },
            merged.classes?.wrapper,
          )}
        >
          <Show when={label()}>
            <Show
              when={merged.variant === 'card'}
              fallback={
                <label
                  for={field.id()}
                  id={labelId()}
                  data-slot="label"
                  style={merged.styles?.label}
                  class={checkboxLabelVariants(
                    { required: merged.required },
                    merged.classes?.label,
                  )}
                >
                  {label()}
                </label>
              }
            >
              <p
                id={labelId()}
                data-slot="label"
                style={merged.styles?.label}
                class={checkboxLabelVariants({ required: merged.required }, merged.classes?.label)}
              >
                {label()}
              </p>
            </Show>
          </Show>

          <Show when={description()}>
            <p
              id={descriptionId()}
              data-slot="description"
              style={merged.styles?.description}
              class={cn('text-muted-foreground', merged.classes?.description)}
            >
              {description()}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  )
}
