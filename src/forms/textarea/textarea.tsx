import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, onMount, splitProps } from 'solid-js'

import type { ModelModifiers } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
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

export namespace TextareaT {
  export type Slot = 'root' | 'header' | 'input' | 'footer'

  export type Variant = Pick<TextareaVariantProps, 'size' | 'variant' | 'highlight' | 'autoresize'>

  export interface Items {}

  export type Value = string | number | undefined
  export type ChangeValue = Value | null

  export type Extend = never
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>

  /**
   * Base props for the Textarea component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
    /**
     * Placeholder text for the textarea.
     */
    placeholder?: string

    /**
     * Whether to automatically focus the textarea on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds before focusing the textarea.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Maximum character length for the textarea.
     */
    maxLength?: number

    /**
     * Delay in milliseconds before triggering autoresize on mount.
     * @default 0
     */
    autoresizeDelay?: number

    /**
     * Default number of rows.
     * @default 3
     */
    rows?: number

    /**
     * Maximum number of rows allowed during autoresize.
     * @default 0
     */
    maxrows?: number

    /**
     * Element to render above the textarea.
     */
    header?: JSX.Element

    /**
     * Element to render below the textarea.
     */
    footer?: JSX.Element

    /**
     * Modifiers for input processing (e.g., lazy, trim, number).
     */
    modelModifiers?: ModelModifiers

    /**
     * Callback when the value changes.
     */
    onValueChange?: (value: ChangeValue) => void

    /**
     * Native input event handler.
     */
    onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>

    /**
     * Native change event handler.
     */
    onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>

    /**
     * Native blur event handler.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>

    /**
     * Native focus event handler.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>

    /**
     * Children elements, rendered inside the root below the textarea.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Textarea component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Textarea component.
 */
export interface TextareaProps extends TextareaT.Props {}

/** Multi-line text input with autoresize support and form field integration. */
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
    value?: TextareaT.Value
    defaultValue?: TextareaT.Value
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
    const nextValue = applyInputModifiers<TextareaT.ChangeValue>(value, formProps.modelModifiers)

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
        data-slot="input"
        style={merged.styles?.input}
        class={textareaBaseVariants(
          {
            size: field.size(),
            autoresize: layoutProps.autoresize,
          },
          styleProps.classes?.input,
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
