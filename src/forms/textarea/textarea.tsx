import type { JSX } from 'solid-js'
import { createEffect, createMemo, mergeProps, on, onCleanup, onMount, splitProps } from 'solid-js'

import type { ModelModifiers } from '../../shared/input-modifiers.ts'
import { createStyles } from '../../shared/provider/index.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField, useFieldContext } from '../field/field-context.ts'
import { useInputGroupContext } from '../input-group/input-group-context.ts'
import { mergeAriaTokens } from '../shared/merge-aria-tokens.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import { textareaRecipe } from './textarea.recipe'
import type { TextareaProps, TextareaT } from './textarea.types.ts'

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
    field.emit('blur', event)
    callHandler(event, merged.onBlur)
  }

  const onFocus: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('focus', event)
    callHandler(event, merged.onFocus)
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
    <textarea
      {...rest}
      id={field.id()}
      name={field.name()}
      rows={merged.rows ?? 3}
      required={field.required()}
      disabled={field.disabled()}
      readonly={field.readOnly()}
      data-slot="root"
      data-autoresize={merged.autoResize ? '' : undefined}
      {...dataAttrs()}
      {...(ariaAttrs() as JSX.AriaAttributes)}
      {...textControl.valueProps()}
      ref={(element) => {
        textareaEl = element
        callRef(local.ref, element)
      }}
      {...resolved.styles.root}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}
