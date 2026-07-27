import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps, on, onMount } from 'solid-js'

import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers'
import { applyInputModifiers } from '../../shared/input-modifiers'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useId } from '../../shared/utils'
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

  export interface Slot<T = unknown> {
    /**
     * Textarea wrapper that owns header, textarea, footer, and autoresize state.
     */
    root?: T

    /** Optional content rendered above the textarea. */
    header?: T

    /** Native textarea control used for multi-line text entry. */
    input?: T

    /** Optional content rendered below the textarea. */
    footer?: T
  }

  export type Variant = Pick<TextareaVariantProps, 'size' | 'variant' | 'autoresize'>

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Textarea component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
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
    maxLength?: number | string

    /**
     * Whether the textarea should automatically resize based on content.
     * @default false
     */
    autoResize?: boolean

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
    modelModifiers?: M

    /**
     * Callback when the textarea value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Callback when the textarea value change is committed.
     */
    onChange?: (value: ModifierValue<M>) => void

    /**
     * Native input event handler.
     */
    onInput?: JSX.EventHandler<HTMLTextAreaElement, InputEvent>

    /**
     * Native blur event handler.
     */
    onBlur?: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent>

    /**
     * Native focus event handler.
     */
    onFocus?: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent>

    /**
     * Children elements, rendered inside the root below the textarea.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Textarea component.
   */
  export interface Props<
    M extends ModelModifiers | undefined = ModelModifiers | undefined,
  > extends BaseProps<Base<M>, Variant, Slot> {}
}

/**
 * Props for the Textarea component.
 */
export interface TextareaProps<
  M extends ModelModifiers | undefined = ModelModifiers | undefined,
> extends TextareaT.Props<M> {}

/** Multi-line text input with autoresize support and form field integration. */
export function Textarea<M extends ModelModifiers | undefined = ModelModifiers | undefined>(
  props: TextareaProps<M>,
): JSX.Element {
  const merged = mergeProps(
    {
      rows: 3,
      maxrows: 0,
      autofocusDelay: 0,
      autoresizeDelay: 0,
      variant: 'outlined' as TextareaVariantProps['variant'],
      autoresize: false,
    },
    props,
  )
  const header = createMemo(() => merged.header)
  const footer = createMemo(() => merged.footer)

  const generatedId = useId(() => merged.id, 'textarea')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  let textareaEl: HTMLTextAreaElement | undefined
  const [isFocused, setIsFocused] = createSignal(false)

  const isLazy = createMemo(() => Boolean(merged.modelModifiers?.lazy))

  const textareaValueProps = createMemo<{
    value?: TextareaT.Value
    defaultValue?: TextareaT.Value
  }>(() => {
    if (merged.value !== undefined) {
      return { value: merged.value }
    }

    if (field.value() !== undefined) {
      return { value: field.value() as TextareaT.Value }
    }

    if (merged.defaultValue !== undefined) {
      return { defaultValue: merged.defaultValue }
    }

    return {}
  })
  const dataAttrs = createMemo(() => ({
    'data-invalid': field.invalid() ? '' : undefined,
    'data-disabled': field.disabled() ? '' : undefined,
    'data-required': merged.required ? '' : undefined,
    'data-readonly': merged.readOnly ? '' : undefined,
  }))

  function updateInputValue(value: string): void {
    const nextValue = applyInputModifiers<ModifierValue<M>>(value, merged.modelModifiers)
    field.setFormValue(nextValue)
    merged.onValueChange?.(nextValue)
    field.emit('input')
  }

  function autoResize(): void {
    if (!merged.autoResize || !textareaEl) {
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

  const onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()
    merged.onInput?.(event)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandler<HTMLTextAreaElement, Event> = (event) => {
    const value = event.currentTarget.value
    if (isLazy()) {
      updateInputValue(value)
    }

    if (merged.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emit('change')
    merged.onChange?.(applyInputModifiers<ModifierValue<M>>(value, merged.modelModifiers))
  }

  const onBlur: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    setIsFocused(false)
    field.emit('blur', event)
    merged.onBlur?.(event)
  }

  const onFocus: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    setIsFocused(true)
    field.emit('focus', event)
    merged.onFocus?.(event)
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
      style={{ ...merged.styles?.root, ...merged.style }}
      class={textareaRootVariants(
        {
          size: field.size(),
          variant: merged.variant,
        },
        merged.classes?.root,
        merged.class,
      )}
      onPointerDown={onRootPointerDown}
      data-focused={isFocused() ? '' : undefined}
      {...dataAttrs()}
    >
      <Show when={header()}>
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
          {header()}
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
        aria-required={merged.required || undefined}
        aria-disabled={field.disabled() || undefined}
        aria-readonly={merged.readOnly || undefined}
        data-slot="input"
        style={merged.styles?.input}
        class={textareaBaseVariants(
          {
            size: field.size(),
            autoresize: merged.autoResize,
          },
          merged.classes?.input,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...dataAttrs()}
        {...field.ariaAttrs()}
        {...textareaValueProps()}
      />

      {merged.children}

      <Show when={footer()}>
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
          {footer()}
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
