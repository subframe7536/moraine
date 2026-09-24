import type { JSX, Ref } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, splitProps, untrack } from 'solid-js'

import type { IconT } from '../../element/icon'
import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { HiddenInput } from '../../shared/hidden-input'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { useFormReset } from '../shared/use-form-reset'

import { switchDataAttributes, switchRecipe } from './switch.recipe'
import type { SwitchProps } from './switch.types'

/** Toggle switch control with icon slots and loading state. */
export function Switch<TTrue = boolean, TFalse = boolean>(
  props: SwitchProps<TTrue, TFalse>,
): JSX.Element {
  type RootProps = SwitchProps<TTrue, TFalse> & {
    onClick?: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent>
    ref?: Ref<HTMLDivElement>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'ref',
    'inputRef',
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
    'loading',
    'loadingIcon',
    'checkedIcon',
    'uncheckedIcon',
    'label',
    'description',
    'onChange',
    'onPointerDown',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'onClick',
  ])
  const themeField = useFieldContext()
  const resolved = createStyles(switchRecipe, local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const merged = mergeProps(
    {
      loading: false,
      loadingIcon: 'icon-loading' as const,
      trueValue: true,
      falseValue: false,
      value: 'on',
    },
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const loadingIcon = createMemo(() => merged.loadingIcon)
  const checkedIcon = createMemo(() => merged.checkedIcon)
  const uncheckedIcon = createMemo(() => merged.uncheckedIcon)
  const showLabel = createMemo(() => hasNonEmptyJsxContent(label()))
  const showDescription = createMemo(() => hasNonEmptyJsxContent(description()))
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const generatedId = useId(() => merged.id, 'switch')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: local.size,
      disabled: merged.disabled || merged.loading,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      initialValue:
        normalizeFieldValue(
          merged.checked !== undefined ? merged.checked : merged.defaultChecked,
        ) ?? merged.falseValue,
    }),
  )

  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() => `${field.id()}-description`)

  let inputEl: HTMLInputElement | undefined
  const initialDefaultChecked = untrack(() => Boolean(merged.defaultChecked))

  function toCheckedState(value: unknown): boolean {
    if (value === merged.trueValue) {
      return true
    }

    if (value === merged.falseValue) {
      return false
    }

    return typeof value === 'boolean' ? value : false
  }

  function normalizeFieldValue(
    value: unknown,
    trueValue: unknown = merged.trueValue,
    falseValue: unknown = merged.falseValue,
  ): unknown {
    if (value === undefined) {
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

  createEffect(
    on(
      [field.path, () => merged.checked, () => merged.trueValue, () => merged.falseValue],
      ([, value, trueValue, falseValue]) => {
        if (value !== undefined) {
          field.setFormValue(normalizeFieldValue(value, trueValue, falseValue))
        }
      },
    ),
  )

  function onChange(nextChecked: boolean): void {
    const nextValue = nextChecked ? (merged.trueValue as TTrue) : (merged.falseValue as TFalse)

    setChecked(nextChecked)

    field.setFormValue(nextValue)
    merged.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  const switchAriaAttrs = createMemo(() => {
    const attrs = { ...field.ariaAttrs() }
    const describedBy = [attrs['aria-describedby'], showDescription() ? descriptionId() : undefined]
      .filter(Boolean)
      .join(' ')

    if (describedBy) {
      attrs['aria-describedby'] = describedBy
    }
    if (!attrs['aria-labelledby'] && showLabel()) {
      attrs['aria-labelledby'] = labelId()
    }

    return attrs
  })

  createEffect(
    on(checked, (isChecked) => {
      if (inputEl) {
        inputEl.checked = isChecked
      }
    }),
  )

  function toggle(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    onChange(!checked())
  }

  useFormReset(
    () => inputEl?.form,
    () => {
      const controlledChecked = merged.checked
      const nextChecked =
        controlledChecked === undefined ? initialDefaultChecked : toCheckedState(controlledChecked)

      if (controlledChecked === undefined) {
        setChecked(nextChecked)
      }

      if (inputEl) {
        inputEl.checked = nextChecked
      }

      field.setFormValue(nextChecked ? merged.trueValue : merged.falseValue)
    },
  )

  function onPointerDown(
    event: Parameters<JSX.EventHandler<HTMLButtonElement, PointerEvent>>[0],
  ): void {
    const { defaultPrevented } = callHandler(event, merged.onPointerDown)
    if (defaultPrevented) {
      return
    }

    if (document.activeElement === inputEl) {
      event.preventDefault()
    }
  }

  function onTrackFocus(event: FocusEvent): void {
    field.emit('focus', event)
  }

  function onTrackBlur(event: FocusEvent): void {
    field.emit('blur', event)
  }

  const resolvedIconName = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading) {
      return loadingIcon()
    }

    return checked() ? checkedIcon() : uncheckedIcon()
  })

  const onRootClick: JSX.EventHandler<HTMLDivElement, MouseEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onClick)
    if (defaultPrevented || event.button !== 0) {
      return
    }

    const target = event.target
    if (target instanceof Element && target.closest('[data-slot="switch-track"]')) {
      toggle()
    }
  }

  return (
    <div
      ref={(element) => callRef(local.ref, element)}
      {...rest}
      data-slot="switch"
      {...switchDataAttributes.root({
        checked,
        unchecked: () => !checked(),
        disabled: field.disabled,
        readonly: readOnly,
        required: field.required,
        invalid: field.invalid,
        loading: () => merged.loading,
      })}
      {...resolved.styles.root}
      onClick={onRootClick}
    >
      <HiddenInput
        ref={(element) => {
          inputEl = element
          callRef(local.inputRef, element)
        }}
        id={`${field.id()}-input`}
        type="checkbox"
        name={field.name()}
        value={merged.value}
        checked={checked()}
        required={field.required()}
        disabled={field.disabled()}
        readonly={readOnly()}
        tabIndex={-1}
        aria-hidden="true"
        class="peer"
        data-slot="switch-input"
        onChange={(event) => {
          event.stopPropagation()

          if (field.disabled() || readOnly()) {
            event.currentTarget.checked = checked()
            return
          }

          onChange(event.currentTarget.checked)
          event.currentTarget.checked = checked()
        }}
      />

      <button
        ref={field.setControlRef}
        id={field.id()}
        type="button"
        role="switch"
        disabled={field.disabled()}
        data-slot="switch-track"
        aria-checked={checked()}
        {...switchAriaAttrs()}
        {...resolved.styles.track}
        onPointerDown={onPointerDown}
        onFocus={onTrackFocus}
        onBlur={onTrackBlur}
        {...switchDataAttributes.track({
          checked,
          unchecked: () => !checked(),
          disabled: field.disabled,
          readonly: readOnly,
          invalid: field.invalid,
        })}
      >
        <span
          data-slot="switch-thumb"
          {...switchDataAttributes.thumb({
            checked,
            unchecked: () => !checked(),
            disabled: field.disabled,
          })}
          {...resolved.styles.thumb}
        >
          <Show when={resolvedIconName()} keyed>
            {(iconName) => (
              <Icon
                slotName="switch-icon"
                name={iconName}
                {...switchDataAttributes.icon({
                  checked: () => !merged.loading && checked(),
                  unchecked: () => !merged.loading && !checked(),
                  loading: () => merged.loading,
                })}
                class={resolved.styles.icon.class}
              />
            )}
          </Show>
        </span>
      </button>

      <Show when={showLabel() || showDescription()}>
        <span data-slot="switch-wrapper" {...resolved.styles.wrapper}>
          <Show when={showLabel()}>
            <label
              for={field.id()}
              id={labelId()}
              data-slot="switch-label"
              {...switchDataAttributes.label({ required: field.required })}
              {...resolved.styles.label}
            >
              {label()}
            </label>
          </Show>

          <Show when={showDescription()}>
            <span
              id={descriptionId()}
              data-slot="switch-description"
              {...resolved.styles.description}
            >
              {description()}
            </span>
          </Show>
        </span>
      </Show>
    </div>
  )
}
