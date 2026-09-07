import type { JSX, Ref } from 'solid-js'
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

import type { ModelModifiers } from '../../shared/input-modifiers.ts'
import { hasNonEmptyJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { isInteractiveTarget } from '../shared/is-interactive-target.ts'
import { useFormReset } from '../shared/use-form-reset.ts'
import { useTextControlValue } from '../shared/use-text-control-value.ts'

import type { TextareaProps, TextareaT } from './textarea.types.ts'

export * from './textarea.types.ts'

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
  type RootProps = TextareaProps<M> & {
    onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>
    ref?: Ref<HTMLDivElement>
  }
  const [local, rest] = splitProps(props as RootProps, [
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

  const design = useMoraineDesign()
  const textareaDesign = () => design().textarea

  const merged = mergeProps(
    {
      rows: 3,
      maxRows: 0,
      autofocusDelay: 0,
      autoResizeDelay: 0,
      variant: 'outline' as const,
      autoResize: false,
    },
    () => textareaDesign()?.defaultVariants,
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
      readOnly: Boolean(merged.readOnly),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: textareaDesign()?.defaultVariants?.size ?? 'md',
      initialValue: merged.defaultValue ?? '',
    }),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return textareaDesign()?.recipe({
          size: field.size(),
          variant: merged.variant,
          autoresize: merged.autoResize ? 'true' : 'false',
        })
      },
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
      ref={(el) => callRef(local.ref, el)}
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
        ref={(element) => {
          textareaEl = element
          callRef(local.textareaRef, element)
        }}
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
