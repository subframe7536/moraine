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

import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers.ts'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import type { TextareaVariantProps } from './textarea.class.ts'
import { textareaRecipe } from './textarea.class.ts'

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
    onInput?: JSX.InputEventHandlerUnion<HTMLTextAreaElement, InputEvent>

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
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'div',
    Base<M>,
    Variant,
    Classes,
    Styles
  >
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
  type RootProps = TextareaProps<M> & {
    onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>
  }
  const [local, rest] = splitProps(props as RootProps, [
    'id',
    'name',
    'value',
    'defaultValue',
    'required',
    'readOnly',
    'disabled',
    'size',
    'variant',
    'placeholder',
    'autofocus',
    'autofocusDelay',
    'maxLength',
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
    'onPointerDown',
  ])

  const config = useMoraineConfig()
  const provider = () => config().textarea

  const merged = mergeProps(
    {
      rows: 3,
      maxRows: 0,
      autofocusDelay: 0,
      autoResizeDelay: 0,
      variant: 'outline' as const,
      autoResize: false,
    },
    () => provider()?.variants,
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
      size: merged.size ?? undefined,
      disabled: merged.disabled,
      required: local.required,
      readOnly: Boolean(merged.readOnly),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  const slots = createMemo(() =>
    textareaRecipe({
      size: field.size(),
      variant: merged.variant,
      autoresize: merged.autoResize,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  let textareaEl: HTMLTextAreaElement | undefined
  const [isFocused, setIsFocused] = createSignal(false)

  const textControl = useTextControlValue<TextareaT.Value, M>({
    defaultValue: () => merged.defaultValue,
    getElement: () => textareaEl,
    getFormValue: field.value,
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
    'data-readonly': merged.readOnly ? '' : undefined,
  }))

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
    const { defaultPrevented } = callHandler(event, merged.onInput)
    if (defaultPrevented) {
      if (!isLazy()) {
        restoreControlledValue()
      }
      return
    }
    autoResize()

    if (!isLazy()) {
      textControl.updateValue(event.currentTarget.value)
      field.emit('input')
      restoreControlledValue()
    }
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

    field.emit('change')
    merged.onChange?.(textControl.applyValue(value))
    restoreControlledValue()
  }

  const onBlur: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onBlur)
    if (defaultPrevented) {
      return
    }
    setIsFocused(false)
    field.emit('blur', event)
  }

  const onFocus: JSX.FocusEventHandler<HTMLTextAreaElement, FocusEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, merged.onFocus)
    if (defaultPrevented) {
      return
    }
    setIsFocused(true)
    field.emit('focus', event)
  }

  const onRootPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onPointerDown)
    if (defaultPrevented) {
      return
    }
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
      data-slot="root"
      {...resolved.rootClassAndStyle()}
      onPointerDown={onRootPointerDown}
      data-focused={isFocused() ? '' : undefined}
      {...dataAttrs()}
      {...rest}
    >
      <Show when={showHeader()}>
        <div data-slot="header" {...resolved.slotClassAndStyle('header')}>
          {header()}
        </div>
      </Show>

      <textarea
        id={field.id()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        rows={merged.rows ?? 3}
        placeholder={merged.placeholder}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={merged.readOnly}
        maxLength={merged.maxLength}
        data-slot="input"
        {...resolved.slotClassAndStyle('input')}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...dataAttrs()}
        {...field.ariaAttrs()}
        {...textControl.valueProps()}
      />

      {merged.children}

      <Show when={showFooter()}>
        <div data-slot="footer" {...resolved.slotClassAndStyle('footer')}>
          {footer()}
        </div>
      </Show>
    </div>
  )
}
