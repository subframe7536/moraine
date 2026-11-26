import type { JSX } from '@solidjs/web'
import { merge, onSettled, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { InputModifiers } from '../../shared/input-modifiers'
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { useInputGroupContext } from '../input-group/input-group-context'
import { mergeFieldAriaAttributes } from '../shared/form/field-aria'
import { useFormReset } from '../shared/form/use-form-reset'
import { useTextControlValue } from '../shared/form/use-text-control-value'

import { inputDataAttributes, inputRecipe } from './input.recipe'
import type { InputProps, InputT } from './input.types'
/**
 * Native single-line text input with value modifiers and `Field` integration. Use `Textarea` for
 * multi-line text and `NumberInput` for a constrained numeric stepper. Wrap it in `Field` for a
 * label and validation message, or in `InputGroup` for adjacent addons. It is controlled with
 * `value` and `onValueChange`, or uncontrolled with `defaultValue`.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, omit } from 'solid-js'
 * import { Field, Input } from 'moraine'
 *
 * const [query, setQuery] = createSignal('')
 *
 * <Field label="Find a project">
 *   <Input value={query()} onValueChange={setQuery} placeholder="Search projects..." />
 * </Field>
 * ```
 */
export function Input<TModifiers extends InputModifiers | undefined = InputModifiers | undefined>(
  props: InputProps<TModifiers>,
): JSX.Element {
  const rest = omit(
    props,
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
    'autoComplete',
    'autoFocus',
    'autoFocusDelay',
    'modifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'onCompositionStart',
    'onCompositionEnd',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
  )
  const themeField = useFieldContext()
  const group = useInputGroupContext()
  const {
    slots: { root: rootSlot },
  } = useRecipe(inputRecipe, props, {
    data: {
      root: inputDataAttributes.root(() => ({
        invalid: field.invalid,
        disabled: field.disabled,
        required: field.required,
        readonly: field.readOnly,
      })),
    },
    context: () => ({
      variants: {
        grouped: Boolean(group?.grouped),
        groupedOrientation: group?.orientation,
        size: group?.size ?? themeField?.size,
      },
    }),
  })

  const merged = merge(
    {
      type: 'text',
      autoComplete: 'off',
      autoFocusDelay: 0,
    },

    props,
  )
  const modifiers = () => merged.modifiers
  const generatedId = createId(() => merged.id, 'input')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      return merged.defaultValue === undefined ? '' : merged.defaultValue
    },
  })

  let inputEl: HTMLInputElement | undefined

  const textControl = useTextControlValue<InputT.Value, TModifiers>({
    defaultValue: () => merged.defaultValue,
    getElement: () => inputEl,
    getFormValue: field.value,
    getFormPath: field.path,
    modifiers,
    onValueChange: () => merged.onValueChange,
    setFormValue: field.setFormValue,
    shouldRestoreValue: () => merged.type !== 'file',
    value: () => merged.value,
  })
  const isLazy = textControl.isLazy
  const restoreControlledValue = textControl.restoreControlledValue

  const onInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    if (!isLazy()) {
      textControl.updateValue(event.currentTarget.value)
      field.emit('input')
    }
    callHandler(event, merged.onInput)
    if (!isLazy()) {
      restoreControlledValue()
    }
  }

  const onChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      textControl.updateValue(value)
      field.emit('input')
    }

    if (modifiers()?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change', event)
    callHandler(event, merged.onChange)
    restoreControlledValue()
  }

  const onBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('blur', event)
    callHandler(event, merged.onBlur)
  }

  const onFocus: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = (event) => {
    field.emit('focus', event)
    callHandler(event, merged.onFocus)
  }

  const onCompositionStart: JSX.EventHandler<HTMLInputElement, CompositionEvent> = (event) => {
    textControl.onCompositionStart()
    callHandler(event, merged.onCompositionStart)
  }

  const onCompositionEnd: JSX.EventHandler<HTMLInputElement, CompositionEvent> = (event) => {
    textControl.onCompositionEnd()
    callHandler(event, merged.onCompositionEnd)
  }

  useFormReset(() => inputEl?.form, restoreControlledValue)

  onSettled(() => {
    if (inputEl && textControl.initialDefaultValue !== undefined && merged.type !== 'file') {
      inputEl.defaultValue = String(textControl.initialDefaultValue ?? '')
      restoreControlledValue()
    }

    if (!merged.autoFocus) {
      return
    }

    const autoFocusTimer = setTimeout(() => {
      if (!field.disabled()) {
        inputEl?.focus()
      }
    }, merged.autoFocusDelay ?? 0)
    return () => clearTimeout(autoFocusTimer)
  })

  return (
    <input
      data-slot="input"
      {...rootSlot}
      {...rest}
      id={field.id()}
      type={merged.type}
      name={field.name()}
      required={field.required()}
      disabled={field.disabled()}
      readonly={field.readOnly()}
      autocomplete={merged.autoComplete}
      {...mergeFieldAriaAttributes(rest, field.ariaAttrs())}
      {...textControl.valueProps()}
      {...textControl.controlledValueProps()}
      ref={(element) => {
        inputEl = element
        field.setControlRef(element)
        callRef(() => props.ref, element)
      }}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    />
  )
}
