import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'

import type { ModelModifiers } from '../../shared/input-modifiers'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content'
import { createComponentStyles } from '../../shared/provider'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormField, useFormFieldContext } from '../form/form-context'
import { isInteractiveTarget } from '../shared/is-interactive-target'
import { mergeAriaTokens } from '../shared/merge-aria-tokens'
import { useFormReset } from '../shared/use-form-reset'
import { useTextControlValue } from '../shared/use-text-control-value'

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
    'textareaRef',
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
    'header',
    'footer',
    'modelModifiers',
    'onValueChange',
    'onChange',
    'onInput',
    'onBlur',
    'onFocus',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('textarea', local, {
    inheritedVariants: () => ({ size: themeField?.size }),
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
  const header = createMemo(() => merged.header)
  const footer = createMemo(() => merged.footer)
  const showHeader = createMemo(() => hasNonEmptyJsxContent(header()))
  const showFooter = createMemo(() => hasNonEmptyJsxContent(footer()))
  const modelModifiers = createMemo(() => merged.modelModifiers)

  const generatedId = useId(() => merged.id, 'textarea')
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

  let textareaEl: HTMLTextAreaElement | undefined
  const [isFocused, setIsFocused] = createSignal(false)

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

    const styles = window.getComputedStyle(textareaEl)
    const padding = getVerticalPadding(styles)
    const lineHeight = getLineHeight(styles)

    const nextRows = calculateNeededRows(textareaEl, padding, lineHeight)
    const maxRows = merged.maxRows ?? 0
    textareaEl.rows = Math.max(rows, maxRows > 0 ? Math.min(nextRows, maxRows) : nextRows)
    textareaEl.style.overflow = maxRows > 0 && nextRows > maxRows ? 'auto' : 'hidden'
  }

  let autoResizeTimer: ReturnType<typeof setTimeout> | undefined

  function scheduleAutoResize(delay = 0): void {
    if (autoResizeTimer !== undefined) {
      clearTimeout(autoResizeTimer)
    }

    autoResizeTimer = setTimeout(() => {
      autoResizeTimer = undefined
      autoResize()
    }, delay)
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
    setIsFocused(false)
    field.emit('blur', event)
    callHandler(event, merged.onBlur)
  }

  const onFocus: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    setIsFocused(true)
    field.emit('focus', event)
    callHandler(event, merged.onFocus)
  }

  const onRootPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    if (
      event.button !== 0 ||
      event.defaultPrevented ||
      event.target === textareaEl ||
      isInteractiveTarget(event.target)
    ) {
      return
    }

    textareaEl?.focus()
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
    if (autoResizeTimer !== undefined) {
      clearTimeout(autoResizeTimer)
    }
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
    <div
      ref={(el) => callRef(local.ref, el)}
      data-slot="root"
      {...resolved.root}
      onPointerDown={onRootPointerDown}
      data-focused={isFocused() ? '' : undefined}
      {...dataAttrs()}
    >
      <Show when={showHeader()}>
        <div data-slot="header" {...resolved.slot('header')}>
          {header()}
        </div>
      </Show>

      <textarea
        {...rest}
        id={field.id()}
        name={field.name()}
        rows={merged.rows ?? 3}
        required={field.required()}
        disabled={field.disabled()}
        readonly={field.readOnly()}
        data-slot="input"
        data-autoresize={merged.autoResize ? '' : undefined}
        {...dataAttrs()}
        {...ariaAttrs()}
        {...textControl.valueProps()}
        ref={(element) => {
          textareaEl = element
          callRef(local.textareaRef, element)
        }}
        {...resolved.slot('textarea')}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
      />

      {merged.children}

      <Show when={showFooter()}>
        <div data-slot="footer" {...resolved.slot('footer')}>
          {footer()}
        </div>
      </Show>
    </div>
  )
}
