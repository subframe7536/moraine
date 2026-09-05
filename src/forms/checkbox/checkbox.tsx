import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps, untrack } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { CheckboxVariantProps } from './checkbox.class.ts'
import { checkboxRecipe } from './checkbox.class.ts'

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

    /** Vertical alignment wrapper for the checkbox control. */
    container?: T

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
    Classes,
    Styles
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

  const config = useMoraineConfig()
  const provider = () => config().checkbox

  const merged = mergeProps(
    {
      variant: 'list' as const,
      indicator: 'start' as const,
      checkedIcon: 'icon-check' as const,
      indeterminateIcon: 'icon-minus' as const,
      formFieldBind: true,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },
    () => provider()?.variants,
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const generatedId = useId(() => merged.id, 'checkbox')

  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
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

  const slots = createMemo(() =>
    checkboxRecipe({
      variant: merged.variant,
      indicator: merged.indicator,
      size: field.size(),
      required: field.required(),
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
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

  const defaultCheckedState = createMemo<boolean | 'indeterminate'>(() => {
    if (merged.defaultChecked === undefined) {
      return false
    }

    return toCheckedState(merged.defaultChecked)
  })
  const initialDefaultChecked = untrack(defaultCheckedState)

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
    defaultValue: () => initialDefaultChecked,
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
  const activeIcon = createMemo(() =>
    indeterminate() ? merged.indeterminateIcon : merged.checkedIcon,
  )

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

  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() => (description() ? `${field.id()}-description` : undefined))
  const checkboxAriaAttrs = createMemo(() => {
    const attrs = { ...field.ariaAttrs() }
    const describedBy = [attrs['aria-describedby'], descriptionId()].filter(Boolean).join(' ')

    if (describedBy) {
      attrs['aria-describedby'] = describedBy
    }
    if (!attrs['aria-labelledby'] && label()) {
      attrs['aria-labelledby'] = labelId()
    }

    return attrs
  })

  createEffect(() => {
    if (inputEl) {
      inputEl.checked = Boolean(resolvedChecked())
      inputEl.indeterminate = indeterminate()
    }
  })

  useFormReset(
    () => inputEl?.form,
    () => {
      const explicitlyControlled = merged.checked !== undefined
      const nextChecked = explicitlyControlled ? checked() : initialDefaultChecked

      if (!explicitlyControlled) {
        setChecked(nextChecked)

        if (merged.formFieldBind !== false) {
          field.setFormValue(
            nextChecked === 'indeterminate'
              ? undefined
              : nextChecked
                ? merged.trueValue
                : merged.falseValue,
          )
        }
      }

      if (inputEl) {
        inputEl.checked = nextChecked === true
        inputEl.indeterminate = nextChecked === 'indeterminate'
      }
    },
  )

  function toggle(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    onChange(!resolvedChecked())
  }

  let enterPressed = false

  function onControlKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return
    }

    enterPressed = true
    event.preventDefault()
  }

  function onControlKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      enterPressed = false
    }
  }

  function onControlClick(event: MouseEvent): void {
    if (enterPressed) {
      event.preventDefault()
    }
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
    if (event.button !== 0) {
      return
    }

    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    if (target.closest('[data-slot="control"]')) {
      toggle()
      return
    }

    if (merged.variant !== 'card' || isInteractiveTarget(target)) {
      return
    }

    toggle()
  }

  return (
    <div data-slot="root" {...rest} {...resolved.rootClassAndStyle()} onClick={onRootClick}>
      <div data-slot="container" {...resolved.slotClassAndStyle('container')}>
        <HiddenInput
          ref={(element) => {
            inputEl = element
          }}
          id={`${field.id()}-input`}
          type="checkbox"
          name={field.name()}
          value={merged.value}
          checked={Boolean(resolvedChecked())}
          required={field.required()}
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
          {...resolved.slotClassAndStyle('control', {
            state: [
              merged.indicator === 'hidden' && 'sr-only',
              field.disabled() && 'opacity-64 pointer-events-none',
            ],
          })}
          onPointerDown={onPointerDown}
          onClick={onControlClick}
          onKeyDown={onControlKeyDown}
          onKeyUp={onControlKeyUp}
          onBlur={() => {
            enterPressed = false
          }}
          {...checkboxAriaAttrs()}
          data-checked={resolvedChecked() ? '' : undefined}
          data-disabled={field.disabled() ? '' : undefined}
          data-indeterminate={indeterminate() ? '' : undefined}
          data-readonly={readOnly() ? '' : undefined}
          data-required={field.required() ? '' : undefined}
        >
          <Show when={resolvedChecked() || indeterminate()}>
            <span
              data-slot="indicator"
              {...resolved.slotClassAndStyle('indicator')}
              data-checked={resolvedChecked() ? '' : undefined}
              data-disabled={field.disabled() ? '' : undefined}
              data-indeterminate={indeterminate() ? '' : undefined}
              data-readonly={readOnly() ? '' : undefined}
              data-required={field.required() ? '' : undefined}
            >
              <Icon name={activeIcon()} {...resolved.slotClassAndStyle('icon')} />
            </span>
          </Show>
        </button>
      </div>

      <Show when={label() || description()}>
        <div data-slot="wrapper" {...resolved.slotClassAndStyle('wrapper')}>
          <Show when={label()}>
            <Show
              when={merged.variant === 'card'}
              fallback={
                <label
                  for={field.id()}
                  id={labelId()}
                  data-slot="label"
                  {...resolved.slotClassAndStyle('label')}
                >
                  {label()}
                </label>
              }
            >
              <p id={labelId()} data-slot="label" {...resolved.slotClassAndStyle('label')}>
                {label()}
              </p>
            </Show>
          </Show>

          <Show when={description()}>
            <p
              id={descriptionId()}
              data-slot="description"
              {...resolved.slotClassAndStyle('description')}
            >
              {description()}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  )
}
