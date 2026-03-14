import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, onMount, splitProps } from 'solid-js'

import type { ModelModifiers } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { callHandler, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS, FORM_INPUT_INTERACTION_KEYS } from '../form-field/form-options'

import type { TextareaVariantProps } from './textarea.class'
import {
  textareaBaseVariants,
  textareaFooterVariants,
  textareaHeaderVariants,
  textareaRootVariants,
} from './textarea.class'

type TextareaStyleVariantProps = Pick<
  TextareaVariantProps,
  'size' | 'variant' | 'highlight' | 'autoresize'
>

export type TextareaValue = string | number | undefined
export type TextareaChangeValue = TextareaValue | null

type TextareaSlots = 'root' | 'header' | 'base' | 'footer'

export type TextareaClasses = SlotClasses<TextareaSlots>

export type TextareaStyles = SlotStyles<TextareaSlots>

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
  maxLength?: number
  autoresizeDelay?: number
  rows?: number
  maxrows?: number
  header?: JSX.Element
  footer?: JSX.Element
  modelModifiers?: ModelModifiers
  onValueChange?: (value: TextareaChangeValue) => void
  onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>
  onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>
  onBlur?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  onFocus?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  classes?: TextareaClasses
  styles?: TextareaStyles
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
      variant: 'outlined' as const,
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
      'maxLength',
      'header',
      'footer',
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
    () => ({
      deferInputValidation: true,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: styleProps.defaultValue ?? '',
    }),
  )

  let textareaEl: HTMLTextAreaElement | undefined

  const isLazy = createMemo(() => Boolean(formProps.modelModifiers?.lazy))

  const textareaValueProps = createMemo<{
    value?: TextareaValue
    defaultValue?: TextareaValue
  }>(() => {
    if (formProps.value !== undefined) {
      return { value: formProps.value }
    }

    if (styleProps.defaultValue !== undefined) {
      return { defaultValue: styleProps.defaultValue }
    }

    return {}
  })

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<TextareaChangeValue>(value, formProps.modelModifiers)

    field.setFormValue(nextValue)
    formProps.onValueChange?.(nextValue)
    field.emit('input')
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

    field.emit('change')
    callHandler(event, formProps.onChange as JSX.EventHandlerUnion<HTMLTextAreaElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('blur')
    callHandler(event, formProps.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('focus')
    callHandler(event, formProps.onFocus as any)
  }

  const onRootPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
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
      () => formProps.value,
      (_value) => {
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
      style={merged.styles?.root}
      data-invalid={field.invalid() ? '' : undefined}
      data-highlight={field.highlight() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      class={textareaRootVariants(
        {
          size: field.size(),
          variant: styleProps.variant,
        },
        styleProps.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <Show when={layoutProps.header}>
        <div
          data-slot="header"
          style={merged.styles?.header}
          class={textareaHeaderVariants(
            {
              size: field.size(),
            },
            styleProps.classes?.header,
          )}
        >
          {layoutProps.header}
        </div>
      </Show>

      <textarea
        id={field.id()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        rows={layoutProps.rows ?? 3}
        placeholder={layoutProps.placeholder}
        required={formProps.required}
        disabled={field.disabled()}
        readOnly={formProps.readOnly}
        maxLength={layoutProps.maxLength}
        data-slot="base"
        style={merged.styles?.base}
        class={textareaBaseVariants(
          {
            size: field.size(),
            autoresize: layoutProps.autoresize,
          },
          styleProps.classes?.base,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
        {...textareaValueProps()}
      />

      {layoutProps.children}

      <Show when={layoutProps.footer}>
        <div
          data-slot="footer"
          style={merged.styles?.footer}
          class={textareaFooterVariants(
            {
              size: field.size(),
            },
            styleProps.classes?.footer,
          )}
        >
          {layoutProps.footer}
        </div>
      </Show>
    </div>
  )
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])',
    ),
  )
}
