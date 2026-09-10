import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon'
import { HiddenInput } from '../../shared/hidden-input'
import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFormFieldContext } from '../form/form-context'
import { isInteractiveTarget } from '../shared/is-interactive-target'
import { useFormReset } from '../shared/use-form-reset'

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
    'formFieldBind',
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
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('checkbox', local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const merged = mergeProps(
    {
      checkedIcon: 'icon-check' as const,
      indeterminateIcon: 'icon-minus' as const,
      formFieldBind: true,
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
      bind: merged.formFieldBind,
      defaultId: generatedId(),
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

    if (resolved.variants.variant !== 'card' || isInteractiveTarget(target)) {
      return
    }

    toggle()
  }

  return (
    <div data-slot="root" {...rest} {...resolved.root} onClick={onRootClick}>
      <div data-slot="container" {...resolved.slot('container')}>
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
          class={cn(resolved.slot('control').class, [
            resolved.variants.indicator === 'hidden' && 'sr-only',
          ])}
          style={resolved.slot('control').style}
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
              {...resolved.slot('indicator')}
              data-checked={resolvedChecked() ? '' : undefined}
              data-disabled={field.disabled() ? '' : undefined}
              data-indeterminate={indeterminate() ? '' : undefined}
              data-readonly={readOnly() ? '' : undefined}
              data-required={field.required() ? '' : undefined}
            >
              <Icon name={activeIcon()} {...resolved.slot('icon')} />
            </span>
          </Show>
        </button>
      </div>

      <Show when={label() || description()}>
        <div data-slot="wrapper" {...resolved.slot('wrapper')}>
          <Show when={label()}>
            <Show
              when={resolved.variants.variant === 'card'}
              fallback={
                <label
                  for={field.id()}
                  id={labelId()}
                  data-slot="label"
                  data-required={field.required() ? '' : undefined}
                  {...resolved.slot('label')}
                >
                  {label()}
                </label>
              }
            >
              <p
                id={labelId()}
                data-slot="label"
                data-required={field.required() ? '' : undefined}
                {...resolved.slot('label')}
              >
                {label()}
              </p>
            </Show>
          </Show>

          <Show when={description()}>
            <p id={descriptionId()} data-slot="description" {...resolved.slot('description')}>
              {description()}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  )
}
