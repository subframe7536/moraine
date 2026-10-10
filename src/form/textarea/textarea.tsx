import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from 'solid-js'

import { createStyles } from '../../provider/index'
import type { ModelModifiers } from '../../shared/input-modifiers'
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFormField, useFieldContext } from '../field/field-context'
import { useInputGroupContext } from '../input-group/input-group-context'
import { mergeFieldAriaAttributes } from '../shared/field-aria'
import { useFormReset } from '../shared/use-form-reset'
import { useTextControlValue } from '../shared/use-text-control-value'

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

/** Multi-line text input with autoresize support and form field integration. */
export function Textarea<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: TextareaProps<M>,
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
    'variant',
    'autofocus',
    'autofocusDelay',
    'autoResize',
    'autoResizeDelay',
    'rows',
    'maxRows',
    'modelModifiers',
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
  ])
  const themeField = useFieldContext()
  const group = useInputGroupContext()
  const resolved = createStyles(textareaRecipe, local, {
    inheritedVariants: () => ({
      grouped: Boolean(group),
      groupedOrientation: group?.orientation,
      size: group?.size ?? themeField?.size,
    }),
  })

  const merged = mergeProps(
    {
      rows: 3,
      maxRows: 0,
      autofocusDelay: 0,
      autoResizeDelay: 0,

      autoResize: false,
    },

    local,
  )
  const modelModifiers = () => merged.modelModifiers
  const generatedId = createId(() => merged.id, 'textarea')
  const field = useFormField(merged, {
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      return merged.defaultValue ?? ''
    },
  })

  let textareaEl: HTMLTextAreaElement | undefined

  const textControl = useTextControlValue<TextareaT.Value, M>({
    defaultValue: () => merged.defaultValue,
    getElement: () => textareaEl,
    getFormValue: field.value,
    getFormPath: field.path,
    modelModifiers,
    onValueChange: () => merged.onValueChange,
    setFormValue: field.setFormValue,
    value: () => merged.value,
  })
  const isLazy = textControl.isLazy
  const dataAttrs = textareaDataAttributes.root({
    invalid: field.invalid,
    disabled: field.disabled,
    required: field.required,
    readonly: field.readOnly,
    autoresize: () => merged.autoResize,
  })

  const ariaAttrs = createMemo(() => mergeFieldAriaAttributes(rest, field.ariaAttrs()))

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
      restoreControlledValue()
    }
    callHandler(event, merged.onInput)
  }

  const onChange: JSX.EventHandler<HTMLTextAreaElement, Event> = (event) => {
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
    on(
      [
        () => merged.autoResize,
        () => merged.rows,
        () => merged.maxRows,
        () => merged.autoResizeDelay,
        () => merged.value,
        field.value,
      ],
      () => scheduleAutoResize(),
    ),
  )

  let autofocusTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => {
    if (autofocusTimer !== undefined) {
      clearTimeout(autofocusTimer)
    }
    cancelAutoResizeTimer?.()
    cancelAutoResizeTimer = undefined
  })

  useFormReset(
    () => textareaEl?.form,
    () => {
      restoreControlledValue()
      scheduleAutoResize()
    },
  )

  onMount(() => {
    if (textareaEl) {
      initialOverflow = textareaEl.style.overflow
      if (textControl.initialDefaultValue !== undefined) {
        textareaEl.defaultValue = String(textControl.initialDefaultValue)
      }
      restoreControlledValue()
    }

    if (merged.autofocus) {
      autofocusTimer = setTimeout(() => {
        if (!field.disabled()) {
          textareaEl?.focus()
        }
      }, merged.autofocusDelay)
    }

    scheduleAutoResize(merged.autoResizeDelay)
  })

  return (
    <textarea
      data-slot="textarea"
      {...dataAttrs}
      {...rest}
      id={field.id()}
      name={field.name()}
      rows={merged.rows ?? 3}
      required={field.required()}
      disabled={field.disabled()}
      readonly={field.readOnly()}
      {...ariaAttrs()}
      {...textControl.valueProps()}
      ref={(element) => {
        textareaEl = element
        field.setControlRef(element)
        callRef(local.ref, element)
      }}
      {...resolved.styles.root}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    />
  )
}
