import type { JSX } from 'solid-js'
import { createEffect, createMemo, mergeProps, on, onMount, splitProps } from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'
import type { ModelModifiers } from '../shared/input-modifiers'
import { applyInputModifiers } from '../shared/input-modifiers'
import type { SlotClasses } from '../shared/slot-class'
import { callHandler, useId } from '../shared/utils'

import type { TextareaVariantProps } from './textarea.class'
import {
  textareaBaseVariants,
  textareaPaddingVariants,
  textareaRootVariants,
} from './textarea.class'

type TextareaStyleVariantProps = Pick<
  TextareaVariantProps,
  'size' | 'variant' | 'highlight' | 'autoresize'
>

export type TextareaValue = string | number | null | undefined

type TextareaSlots = 'root' | 'base'

export type TextareaClasses = SlotClasses<TextareaSlots>

export interface TextareaBaseProps
  extends
    TextareaStyleVariantProps,
    FormIdentityOptions,
    FormValueOptions<TextareaValue>,
    FormRequiredOption,
    FormReadOnlyOption,
    FormDisableOption {
  placeholder?: string
  autofocus?: boolean
  autofocusDelay?: number
  autoresizeDelay?: number
  rows?: number
  maxrows?: number
  modelModifiers?: ModelModifiers<TextareaValue>
  onValueChange?: (value: TextareaValue) => void
  onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>
  onBlur?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  onFocus?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  classes?: TextareaClasses
  children?: JSX.Element
}

export type TextareaProps = TextareaBaseProps

export function Textarea(props: TextareaProps): JSX.Element {
  const merged = mergeProps(
    {
      rows: 3,
      maxrows: 0,
      autofocusDelay: 0,
      autoresizeDelay: 0,
      variant: 'outline' as const,
      autoresize: false,
    },
    props,
  )

  const [formProps, layoutProps, styleProps] = splitProps(
    merged as TextareaProps,
    [
      ...FORM_ID_NAME_DISABLED_KEYS,
      'value',
      'required',
      'readOnly',
      'modelModifiers',
      'onValueChange',
      'onInput',
      'onChange',
      ...FORM_INPUT_INTERACTION_KEYS,
    ],
    [
      'placeholder',
      'rows',
      'maxrows',
      'autoresize',
      'autoresizeDelay',
      'autofocus',
      'autofocusDelay',
      'children',
    ],
  )

  const generatedId = useId(() => formProps.id, 'textarea')
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      highlight: styleProps.highlight,
      disabled: formProps.disabled,
    }),
    {
      deferInputValidation: true,
      defaultId: generatedId,
      defaultSize: 'md',
    },
  )

  let textareaEl: HTMLTextAreaElement | undefined

  const isLazy = createMemo(() => Boolean(formProps.modelModifiers?.lazy))

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<TextareaValue>(value, formProps.modelModifiers)

    formProps.onValueChange?.(nextValue)
    field.emitFormInput()
  }

  function autoResize(): void {
    if (!layoutProps.autoresize || !textareaEl) {
      return
    }

    const rows = layoutProps.rows ?? 3
    textareaEl.rows = rows

    const previousOverflow = textareaEl.style.overflow
    textareaEl.style.overflow = 'hidden'

    const styles = window.getComputedStyle(textareaEl)
    const paddingTop = Number.parseInt(styles.paddingTop, 10) || 0
    const paddingBottom = Number.parseInt(styles.paddingBottom, 10) || 0
    const padding = paddingTop + paddingBottom

    let lineHeight = Number.parseInt(styles.lineHeight, 10) || 0
    if (lineHeight <= 0) {
      lineHeight = 16
    }

    const nextRows = Math.ceil((textareaEl.scrollHeight - padding) / lineHeight)
    if (nextRows > rows) {
      textareaEl.rows = layoutProps.maxrows ? Math.min(nextRows, layoutProps.maxrows) : nextRows
    }

    textareaEl.style.overflow = previousOverflow
  }

  const onInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()
    callHandler(event, formProps.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLTextAreaElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (formProps.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emitFormChange()
    callHandler(event, formProps.onChange as JSX.EventHandlerUnion<HTMLTextAreaElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormBlur()
    callHandler(event, formProps.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormFocus()
    callHandler(event, formProps.onFocus as any)
  }

  const onRootPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.button !== 0 || event.defaultPrevented || event.target === textareaEl) {
      return
    }

    textareaEl?.focus()
  }

  createEffect(
    on(
      () => formProps.value,
      () => {
        // oxlint-disable-next-line solid/reactivity
        queueMicrotask(() => {
          autoResize()
        })
      },
    ),
  )

  onMount(() => {
    setTimeout(() => {
      if (layoutProps.autofocus) {
        textareaEl?.focus()
      }
    }, layoutProps.autofocusDelay ?? 0)

    setTimeout(() => {
      autoResize()
    }, layoutProps.autoresizeDelay ?? 0)
  })

  return (
    <div
      data-slot="root"
      class={textareaRootVariants(
        {
          size: field.size(),
          variant: styleProps.variant,
          highlight: field.highlight(),
          disabled: field.disabled(),
        },
        styleProps.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <textarea
        id={field.id()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        value={formProps.value as string | number | string[] | undefined}
        rows={layoutProps.rows ?? 3}
        placeholder={layoutProps.placeholder}
        required={formProps.required}
        disabled={field.disabled()}
        readOnly={formProps.readOnly}
        data-slot="base"
        class={textareaBaseVariants(
          {
            size: field.size(),
            autoresize: layoutProps.autoresize,
          },
          textareaPaddingVariants({
            size: field.size(),
          }),
          styleProps.classes?.base,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
      />

      {layoutProps.children}
    </div>
  )
}
