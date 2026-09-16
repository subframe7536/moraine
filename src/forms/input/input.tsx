import type { JSX } from 'solid-js'
import { createMemo, mergeProps, onCleanup, onMount, splitProps } from 'solid-js'

import type { ModelModifiers } from '../../shared/input-modifiers.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField, useFieldContext } from '../field/field-context.ts'
import { useInputGroupContext } from '../input-group/input-group-context.ts'
import { mergeAriaTokens } from '../shared/merge-aria-tokens.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import type { InputProps, InputT } from './input.types.ts'

/** Native text input with value modifiers and form field integration. */
export function Input<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: InputProps<M>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
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
    'modelModifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const themeField = useFieldContext()
  const group = useInputGroupContext()
  const resolved = createComponentStyles('input', local, {
    inheritedVariants: () => ({
      grouped: Boolean(group),
      groupedOrientation: group?.orientation,
      size: group?.size ?? themeField?.size,
    }),
  })

  const merged = mergeProps(
    {
      type: 'text',
      autocomplete: 'off',
      autofocusDelay: 0,
    },

    local,
  )
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

  return (
    <input
      {...rest}
      id={field.id()}
      type={merged.type}
      name={field.name()}
      required={field.required()}
      disabled={field.disabled()}
      readonly={field.readOnly()}
      autocomplete={merged.autocomplete}
      data-slot="root"
      {...dataAttrs()}
      {...ariaAttrs()}
      {...textControl.valueProps()}
      ref={(element) => {
        inputEl = element
        callRef(local.ref, element)
      }}
      {...resolved.root}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}
