import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, onCleanup, onMount, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { ModelModifiers } from '../../shared/input-modifiers'
import { createComponentStyles } from '../../shared/provider'
import { renderComponentOrElement } from '../../shared/render-prop'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFormFieldContext } from '../form/form-context'
import { isInteractiveTarget } from '../shared/is-interactive-target'
import { mergeAriaTokens } from '../shared/merge-aria-tokens'
import { useFormReset } from '../shared/use-form-reset'
import { useTextControlValue } from '../shared/use-text-control-value'

import type { InputProps, InputT } from './input.types'

/** Text input component with leading/trailing icon slots, loading state, and form field integration. */
export function Input<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: InputProps<M>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'readOnly',
    'disabled',
    'size',
    'type',
    'autocomplete',
    'autofocus',
    'autofocusDelay',
    'leading',
    'trailing',
    'loading',
    'loadingIcon',
    'modelModifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'children',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('input', local, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,

      loadingIcon: 'icon-loading' as const,
    },

    local,
  )
  const leading = createMemo(() => merged.leading)
  const trailing = createMemo(() => merged.trailing)
  const loadingIcon = createMemo(() => merged.loadingIcon)
  const modelModifiers = createMemo(() => merged.modelModifiers)

  const generatedId = useId(() => merged.id, 'input')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: local.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: merged.readOnly,
    }),
    () => ({
      defaultId: generatedId(),
      initialValue: merged.defaultValue ?? '',
    }),
  )

  let inputEl: HTMLInputElement | undefined

  const textControl = useTextControlValue<InputT.Value, M>({
    defaultValue: () => merged.defaultValue,
    getElement: () => inputEl,
    getFormValue: field.value,
    getFormPath: field.path,
    modelModifiers,
    onValueChange: () => merged.onValueChange,
    setFormValue: field.setFormValue,
    shouldRestoreValue: () => merged.type !== 'file',
    value: () => merged.value,
  })
  const isLazy = textControl.isLazy
  const loadingTarget = createMemo<'leading' | 'trailing'>(() => {
    if (leading()) {
      return 'leading'
    }

    if (trailing()) {
      return 'trailing'
    }

    return 'leading'
  })

  const resolvedLeading = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'leading') {
      return loadingIcon()
    }

    return leading()
  })
  const resolvedTrailing = createMemo<IconT.Name | undefined>(() => {
    if (merged.loading && loadingTarget() === 'trailing') {
      return loadingIcon()
    }

    return trailing()
  })

  const isLeadingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'leading'),
  )
  const isTrailingLoading = createMemo(() =>
    Boolean(merged.loading && loadingTarget() === 'trailing'),
  )
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-required': field.required() ? '' : undefined,
    'data-readonly': field.readOnly() ? '' : undefined,
  }))

  const ariaAttrs = createMemo(() => {
    const generated = field.ariaAttrs()
    return {
      'aria-invalid':
        rest['aria-invalid'] !== undefined ? rest['aria-invalid'] : generated['aria-invalid'],
      'aria-required':
        rest['aria-required'] !== undefined ? rest['aria-required'] : generated['aria-required'],
      'aria-disabled':
        rest['aria-disabled'] !== undefined ? rest['aria-disabled'] : generated['aria-disabled'],
      'aria-readonly':
        rest['aria-readonly'] !== undefined ? rest['aria-readonly'] : generated['aria-readonly'],
      'aria-describedby': mergeAriaTokens(rest['aria-describedby'], generated['aria-describedby']),
      'aria-labelledby': mergeAriaTokens(rest['aria-labelledby'], generated['aria-labelledby']),
    }
  })

  const restoreControlledValue = textControl.restoreControlledValue

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    if (!isLazy()) {
      textControl.updateValue(event.currentTarget.value)
      field.emit('input')
      restoreControlledValue()
    }
    callHandler(event, merged.onInput)
  }

  const onChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      textControl.updateValue(value)
      field.emit('input')
    }

    if (modelModifiers()?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change', event)
    restoreControlledValue()
    callHandler(event, merged.onChange)
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('blur', event)
    callHandler(event, merged.onBlur)
  }

  const onFocus: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('focus', event)
    callHandler(event, merged.onFocus)
  }

  const onRootPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    if (
      event.button !== 0 ||
      event.defaultPrevented ||
      event.target === inputEl ||
      isInteractiveTarget(event.target)
    ) {
      return
    }

    inputEl?.focus()
  }

  let autofocusTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (autofocusTimer !== undefined) {
      clearTimeout(autofocusTimer)
    }
  })

  useFormReset(() => inputEl?.form, restoreControlledValue)

  onMount(() => {
    if (inputEl && textControl.initialDefaultValue !== undefined && merged.type !== 'file') {
      inputEl.defaultValue = String(textControl.initialDefaultValue)
      restoreControlledValue()
    }

    if (!merged.autofocus) {
      return
    }

    autofocusTimer = setTimeout(() => {
      if (!field.disabled()) {
        inputEl?.focus()
      }
    }, merged.autofocusDelay ?? 0)
  })

  function RenderAdornment(props: { value: IconT.Name; loading: boolean }) {
    return (
      <Show
        when={typeof props.value !== 'string'}
        fallback={<Icon name={props.value} data-loading={props.loading ? '' : undefined} />}
      >
        {renderComponentOrElement(props.value, {})}
      </Show>
    )
  }

  return (
    <div
      ref={(element) => callRef(local.ref, element)}
      data-slot="root"
      onPointerDown={onRootPointerDown}
      {...dataAttrs()}
      {...resolved.root}
    >
      <Show when={resolvedLeading()}>
        {(adornment) => (
          <span data-slot="leading" {...resolved.slot('leading')}>
            <RenderAdornment value={adornment()} loading={isLeadingLoading()} />
          </span>
        )}
      </Show>

      <input
        {...rest}
        id={field.id()}
        type={merged.type}
        name={field.name()}
        required={field.required()}
        disabled={field.disabled()}
        readonly={field.readOnly()}
        autocomplete={merged.autocomplete}
        data-slot="input"
        {...dataAttrs()}
        {...ariaAttrs()}
        {...textControl.valueProps()}
        ref={(element) => {
          inputEl = element
          callRef(local.inputRef, element)
        }}
        {...resolved.slot('input')}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
      />

      {merged.children}

      <Show when={resolvedTrailing()}>
        {(adornment) => (
          <span data-slot="trailing" {...resolved.slot('trailing')}>
            <RenderAdornment value={adornment()} loading={isTrailingLoading()} />
          </span>
        )}
      </Show>
    </div>
  )
}
