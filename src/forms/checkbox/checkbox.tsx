import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon'
import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { HiddenInput } from '../../shared/hidden-input'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { isInteractiveTarget } from '../shared/is-interactive-target'
import { useFormReset } from '../shared/use-form-reset'

import { checkboxRecipe } from './checkbox.recipe'
import type { CheckboxProps } from './checkbox.types'
/** Single checkbox control with card and list variants and custom true/false values. */
export function Checkbox<TTrue = boolean, TFalse = boolean>(
  props: CheckboxProps<TTrue, TFalse>,
): JSX.Element {
  const cn = useCn()
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
    'fieldBind',
    'onChange',
    'indeterminate',
    'checkedIcon',
    'indeterminateIcon',
    'onPointerDown',
    'inputRef',
    'size',
    'variant',
    'indicator',
    'classes',
    'styles',
    'class',
    'style',
    'onClick',
  ])
  const themeField = useFieldContext()
  const resolved = createStyles(checkboxRecipe, local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const merged = mergeProps(
    {
      checkedIcon: 'icon-check' as const,
      indeterminateIcon: 'icon-minus' as const,
      fieldBind: true,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },

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
      size: local.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      bind: merged.fieldBind,
      defaultId: generatedId(),
      initialValue:
        merged.fieldBind === false
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
  const initialDefaultChecked = untrack(defaultCheckedState)

  let inputEl: HTMLInputElement | undefined

  function toCheckedState(value: unknown): boolean | 'indeterminate' {
    if (value === 'indeterminate') {
      return 'indeterminate'
    }

    return value === merged.trueValue || (typeof value === 'boolean' && value)
  }

  function normalizeFieldValue(
    value: unknown,
    trueValue: unknown = merged.trueValue,
    falseValue: unknown = merged.falseValue,
  ): unknown {
    if (value === undefined || value === 'indeterminate') {
      return value
    }

    if (value === trueValue || value === falseValue) {
      return value
    }

    if (typeof value === 'boolean') {
      return value ? trueValue : falseValue
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

      if (merged.fieldBind !== false && field.value() !== undefined) {
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

  createEffect(
    on(
      [
        field.path,
        () => merged.checked,
        () => merged.fieldBind,
        () => merged.trueValue,
        () => merged.falseValue,
      ],
      ([, value, bind, trueValue, falseValue]) => {
        if (bind !== false && value !== undefined) {
          field.setFormValue(normalizeFieldValue(value, trueValue, falseValue))
        }
      },
    ),
  )

  function onChange(nextChecked: boolean): void {
    const nextValue = toChangeValue(nextChecked)

    setChecked(nextChecked)

    if (merged.fieldBind === false) {
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

  createEffect(
    on([resolvedChecked, indeterminate], ([checked, isIndeterminate]) => {
      if (inputEl) {
        inputEl.checked = Boolean(checked)
        inputEl.indeterminate = isIndeterminate
      }
    }),
  )

  useFormReset(
    () => inputEl?.form,
    () => {
      const explicitlyControlled = merged.checked !== undefined
      const nextChecked = explicitlyControlled ? checked() : initialDefaultChecked

      if (!explicitlyControlled) {
        setChecked(nextChecked)

        if (merged.fieldBind !== false) {
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

    if (resolved.variants.variant !== 'card' || isInteractiveTarget(target)) {
      return
    }

    toggle()
  }

  return (
    <div data-slot="root" {...rest} {...resolved.styles.root} onClick={onRootClick}>
      <div data-slot="container" {...resolved.styles.container}>
        <HiddenInput
          ref={(element) => {
            inputEl = element
            callRef(local.inputRef, element)
          }}
          id={`${field.id()}-input`}
          type="checkbox"
          name={field.name()}
          value={merged.value}
          checked={Boolean(resolvedChecked())}
          required={field.required()}
          disabled={field.disabled()}
          readonly={readOnly()}
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
          class={cn(resolved.styles.control.class, [
            resolved.variants.indicator === 'hidden' && 'sr-only',
          ])}
          style={resolved.styles.control.style}
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
              {...resolved.styles.indicator}
              data-checked={resolvedChecked() ? '' : undefined}
              data-disabled={field.disabled() ? '' : undefined}
              data-indeterminate={indeterminate() ? '' : undefined}
              data-readonly={readOnly() ? '' : undefined}
              data-required={field.required() ? '' : undefined}
            >
              <Icon name={activeIcon()} {...resolved.styles.icon} />
            </span>
          </Show>
        </button>
      </div>

      <Show when={label() || description()}>
        <div data-slot="wrapper" {...resolved.styles.wrapper}>
          <Show when={label()}>
            <Show
              when={resolved.variants.variant === 'card'}
              fallback={
                <label
                  for={field.id()}
                  id={labelId()}
                  data-slot="label"
                  data-required={field.required() ? '' : undefined}
                  {...resolved.styles.label}
                >
                  {label()}
                </label>
              }
            >
              <p
                id={labelId()}
                data-slot="label"
                data-required={field.required() ? '' : undefined}
                {...resolved.styles.label}
              >
                {label()}
              </p>
            </Show>
          </Show>

          <Show when={description()}>
            <p id={descriptionId()} data-slot="description" {...resolved.styles.description}>
              {description()}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  )
}
