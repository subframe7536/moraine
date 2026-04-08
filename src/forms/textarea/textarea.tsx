import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, mergeProps, on, onMount } from 'solid-js'

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

import type { TextareaVariantProps } from './textarea.class'
import {
  textareaBaseVariants,
  textareaFooterVariants,
  textareaHeaderVariants,
  textareaRootVariants,
} from './textarea.class'

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

export namespace TextareaT {
  export type Value = string | number | undefined
  export type ChangeValue = Value | null

  export type Slot = 'root' | 'header' | 'input' | 'footer'

  export type Variant = Pick<TextareaVariantProps, 'size' | 'variant' | 'autoresize'>

  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = never

  export interface Items {}

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
    autoResizeDelay?: number

    /**
     * Default number of rows.
     * @default 3
     */
    rows?: number

    /**
     * Maximum number of rows allowed during autoresize.
     * @default 0
     */
    maxRows?: number

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

  const generatedId = useId(() => merged.id, 'textarea')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      deferInputValidation: true,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  let textareaEl: HTMLTextAreaElement | undefined

  const isLazy = createMemo(() => Boolean(merged.modelModifiers?.lazy))

  const textareaValueProps = createMemo<{
    value?: TextareaT.Value
    defaultValue?: TextareaT.Value
  }>(() => {
    if (merged.value !== undefined) {
      return { value: merged.value }
    }

    if (merged.defaultValue !== undefined) {
      return { defaultValue: merged.defaultValue }
    }

    return {}
  })

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<TextareaT.ChangeValue>(value, merged.modelModifiers)
    field.setFormValue(nextValue)
    merged.onValueChange?.(nextValue)
    field.emit('input')
  }

  function autoResize(): void {
    if (!merged.autoresize || !textareaEl) {
      return
    }

    const rows = merged.rows ?? 3
    textareaEl.rows = rows

    const prevOverflow = textareaEl.style.overflow
    textareaEl.style.overflow = 'hidden'

    const styles = window.getComputedStyle(textareaEl)
    const padding = getVerticalPadding(styles)
    const lineHeight = getLineHeight(styles)

    const nextRows = calculateNeededRows(textareaEl, padding, lineHeight)
    if (nextRows > rows) {
      textareaEl.rows = merged.maxRows ? Math.min(nextRows, merged.maxRows) : nextRows
    }

    textareaEl.style.overflow = prevOverflow
  }

  const onInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()
    callHandler(event, merged.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLTextAreaElement, Event> = (event) => {
    const value = event.currentTarget.value
    if (isLazy()) {
      updateInputValue(value)
    }

    if (merged.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change')
    callHandler(event, merged.onChange as JSX.EventHandlerUnion<HTMLTextAreaElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('blur')
    callHandler(event, merged.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emit('focus')
    callHandler(event, merged.onFocus as any)
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
      () => merged.value,
      () => {
        // oxlint-disable-next-line subf/solid-reactivity
        queueMicrotask(() => {
          autoResize()
        })
      },
    ),
  )

  onMount(() => {
    if (merged.autofocus) {
      setTimeout(() => {
        textareaEl?.focus()
      }, merged.autofocusDelay)
    }

    setTimeout(() => {
      autoResize()
    }, merged.autoResizeDelay)
  })

  return (
    <div
      data-slot="root"
      style={merged.styles?.root}
      data-invalid={field.invalid() ? '' : undefined}
      data-disabled={field.disabled() ? '' : undefined}
      class={textareaRootVariants(
        {
          size: field.size(),
          variant: merged.variant,
        },
        merged.classes?.root,
      )}
      onPointerDown={onRootPointerDown}
    >
      <Show when={merged.header}>
        <div
          data-slot="header"
          style={merged.styles?.header}
          class={textareaHeaderVariants(
            {
              size: field.size(),
            },
            merged.classes?.header,
          )}
        >
          {merged.header}
        </div>
      </Show>

      <textarea
        id={field.id()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        rows={merged.rows ?? 3}
        placeholder={merged.placeholder}
        required={merged.required}
        disabled={field.disabled()}
        readOnly={merged.readOnly}
        maxLength={merged.maxLength}
        data-slot="input"
        style={merged.styles?.input}
        class={textareaBaseVariants(
          {
            size: field.size(),
            autoresize: merged.autoresize,
          },
          merged.classes?.input,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...field.ariaAttrs()}
        {...textareaValueProps()}
      />

      {merged.children}

      <Show when={merged.footer}>
        <div
          data-slot="footer"
          style={merged.styles?.footer}
          class={textareaFooterVariants(
            {
              size: field.size(),
            },
            merged.classes?.footer,
          )}
        >
          {merged.footer}
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
