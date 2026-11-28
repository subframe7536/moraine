import type { JSX } from '@solidjs/web'
import { createEffect, onSettled, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { InputModifiers } from '../../shared/input-modifiers'
import { callHandler, createId, mergeDefinedProps } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { useInputGroupContext } from '../input-group/input-group-context'
import { mergeFieldAriaAttributes } from '../shared/form/field-aria'
import { useFormReset } from '../shared/form/use-form-reset'
import { useTextControlValue } from '../shared/form/use-text-control-value'

import { textareaDataAttributes, textareaRecipe } from './textarea.recipe'
import type { TextareaProps, TextareaT } from './textarea.types'
// --- Autosize helpers ---
function getVerticalPadding(styles: CSSStyleDeclaration): number {
  const paddingTop = Number.parseInt(styles.paddingTop, 10) || 0
  const paddingBottom = Number.parseInt(styles.paddingBottom, 10) || 0
  return paddingTop + paddingBottom
}

function getLineHeight(styles: CSSStyleDeclaration): number {
  const lineHeight = Number.parseInt(styles.lineHeight, 10) || 0
  return lineHeight > 0 ? lineHeight : 16
}

function calculateNeededRows(el: HTMLTextAreaElement, padding: number, lineHeight: number): number {
  return Math.ceil((el.scrollHeight - padding) / lineHeight)
}

/**
 * Multi-line text input with autoresize support and form field integration. Use it for
 * multi-line native text entry, `Input` for a single line, and `InputGroup` to place controls
 * around it. Controlled with `value` and `onValueChange`, or uncontrolled with `defaultValue`;
 * wrap it in `Field` for a label, description, and validation message.
 *
 * @example
 * ```tsx
 * import { createSignal, merge, omit } from 'solid-js'
 * import { Field, Textarea } from 'moraine'
 *
 * const [message, setMessage] = createSignal('')
 *
 * <Field label="Message">
 *   <Textarea
 *     value={message()}
 *     onValueChange={setMessage}
 *     placeholder="Write a message"
 *     autoResize
 *     rows={2}
 *     maxRows={6}
 *   />
 * </Field>
 * ```
 */
export function Textarea<
  TModifiers extends InputModifiers | undefined = InputModifiers | undefined,
>(props: TextareaProps<TModifiers>): JSX.Element {
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
    'variant',
    'autoComplete',
    'autoFocus',
    'autoFocusDelay',
    'autoResize',
    'autoResizeDelay',
    'rows',
    'maxRows',
    'modifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'onCompositionStart',
    'onCompositionEnd',
    'classes',
    'styles',
    'class',
    'style',
  )
  const themeField = useFieldContext()
  const group = useInputGroupContext()
  const {
    slots: { root: rootSlot },
  } = useRecipe(textareaRecipe, props, {
    data: {
      root: textareaDataAttributes.root(() => ({
        invalid: field.invalid,
        disabled: field.disabled,
        required: field.required,
        readonly: field.readOnly,
        autoresize: () => merged.autoResize,
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

  const merged = mergeDefinedProps(
    {
      rows: 3,
      maxRows: 0,
      autoFocusDelay: 0,
      autoResizeDelay: 0,

      autoResize: false,
    },

    props,
  )
  const modifiers = () => merged.modifiers
  const generatedId = createId(() => merged.id, 'textarea')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      return merged.defaultValue === undefined ? '' : merged.defaultValue
    },
  })

  let textareaEl: HTMLTextAreaElement | undefined

  const textControl = useTextControlValue<TextareaT.Value, TModifiers>({
    defaultValue: () => merged.defaultValue,
    getElement: () => textareaEl,
    getFormValue: field.value,
    getFormPath: field.path,
    modifiers,
    onValueChange: () => merged.onValueChange,
    setFormValue: field.setFormValue,
    value: () => merged.value,
  })
  const isLazy = textControl.isLazy
  const restoreControlledValue = textControl.restoreControlledValue

  let initialOverflow = ''

  function autoResize(): void {
    if (!textareaEl) {
      return
    }

    const rows = merged.rows ?? 3
    textareaEl.rows = rows

    if (!merged.autoResize) {
      textareaEl.style.overflow = initialOverflow
      return
    }

    textareaEl.style.overflow = 'hidden'

    const ownerWindow = textareaEl.ownerDocument.defaultView
    const styles = ownerWindow
      ? ownerWindow.getComputedStyle(textareaEl)
      : typeof getComputedStyle === 'function'
        ? getComputedStyle(textareaEl)
        : undefined
    if (!styles) {
      return
    }
    const padding = getVerticalPadding(styles)
    const lineHeight = getLineHeight(styles)

    const nextRows = calculateNeededRows(textareaEl, padding, lineHeight)
    const maxRows = merged.maxRows ?? 0
    textareaEl.rows = Math.max(rows, maxRows > 0 ? Math.min(nextRows, maxRows) : nextRows)
    textareaEl.style.overflow = maxRows > 0 && nextRows > maxRows ? 'auto' : 'hidden'
  }

  let cancelAutoResizeTimer: (() => void) | undefined

  function scheduleAutoResize(delay = 0): void {
    cancelAutoResizeTimer?.()

    const ownerWindow = textareaEl?.ownerDocument.defaultView
    if (ownerWindow) {
      const timer = ownerWindow.setTimeout(() => {
        cancelAutoResizeTimer = undefined
        untrack(autoResize)
      }, delay)
      cancelAutoResizeTimer = () => ownerWindow.clearTimeout(timer)
      return
    }

    const timer = setTimeout(() => {
      cancelAutoResizeTimer = undefined
      untrack(autoResize)
    }, delay)
    cancelAutoResizeTimer = () => clearTimeout(timer)
  }

  const onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()

    if (!isLazy()) {
      textControl.updateValue(event.currentTarget.value)
      field.emit('input')
    }
    callHandler(event, merged.onInput)
    if (!isLazy()) {
      restoreControlledValue()
    }
  }

  const onChange: JSX.EventHandler<HTMLTextAreaElement, Event> = (event) => {
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

  const onBlur: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('blur', event)
    callHandler(event, merged.onBlur)
  }

  const onFocus: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('focus', event)
    callHandler(event, merged.onFocus)
  }

  const onCompositionStart: JSX.EventHandler<HTMLTextAreaElement, CompositionEvent> = (event) => {
    textControl.onCompositionStart()
    callHandler(event, merged.onCompositionStart)
  }

  const onCompositionEnd: JSX.EventHandler<HTMLTextAreaElement, CompositionEvent> = (event) => {
    textControl.onCompositionEnd()
    callHandler(event, merged.onCompositionEnd)
  }

  createEffect(
    () =>
      [
        merged.autoResize,
        merged.rows,
        merged.maxRows,
        merged.autoResizeDelay,
        merged.value,
        field.value(),
      ] as const,
    () => scheduleAutoResize(),
    { defer: true },
  )

  useFormReset(
    () => textareaEl?.form,
    () => {
      restoreControlledValue()
      scheduleAutoResize()
    },
  )

  onSettled(() => {
    if (textareaEl) {
      initialOverflow = textareaEl.style.overflow
      if (textControl.initialDefaultValue !== undefined) {
        textareaEl.defaultValue = String(textControl.initialDefaultValue ?? '')
      }
      restoreControlledValue()
    }

    let autoFocusTimer: ReturnType<typeof setTimeout> | undefined
    if (merged.autoFocus) {
      autoFocusTimer = setTimeout(() => {
        if (!field.disabled()) {
          textareaEl?.focus()
        }
      }, merged.autoFocusDelay)
    }

    scheduleAutoResize(merged.autoResizeDelay)

    return () => {
      if (autoFocusTimer !== undefined) {
        clearTimeout(autoFocusTimer)
      }
      cancelAutoResizeTimer?.()
      cancelAutoResizeTimer = undefined
    }
  })

  return (
    <textarea
      data-slot="textarea"
      {...rootSlot}
      {...rest}
      id={field.id()}
      name={field.name()}
      rows={merged.rows ?? 3}
      required={field.required()}
      disabled={field.disabled()}
      readonly={field.readOnly()}
      autocomplete={merged.autoComplete}
      {...mergeFieldAriaAttributes(rest, field.ariaAttrs())}
      {...textControl.valueProps()}
      {...textControl.controlledValueProps()}
      ref={[
        (element) => {
          textareaEl = element
        },
        field.setControlRef,
        props.ref,
      ]}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    />
  )
}
