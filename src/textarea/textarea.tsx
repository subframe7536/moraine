import type { JSX, ValidComponent } from 'solid-js'
import { createEffect, createMemo, mergeProps, on, onMount, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useFieldGroupContext } from '../form-field/field-group-context'
import { useFormField } from '../form-field/form-field-context'
import type { ModelModifiers } from '../shared/input-modifiers'
import { applyInputModifiers } from '../shared/input-modifiers'
import { callHandler, cn, useId } from '../shared/utils'

import type { TextareaVariantProps } from './textarea.class'
import { textareaBaseVariants, textareaRootVariants, textareaSizePadding } from './textarea.class'

type TextareaStyleVariantProps = Pick<
  TextareaVariantProps,
  'color' | 'size' | 'variant' | 'highlight' | 'autoresize'
>
type TextareaColor = NonNullable<TextareaBaseProps['color']>
type TextareaSize = NonNullable<TextareaBaseProps['size']>
type TextareaVariant = NonNullable<TextareaBaseProps['variant']>

export type TextareaValue = string | number | null | undefined

export interface TextareaClasses {
  root?: string
  base?: string
}

export interface TextareaBaseProps extends TextareaStyleVariantProps {
  as?: ValidComponent
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  autofocus?: boolean
  autofocusDelay?: number
  autoresizeDelay?: number
  disabled?: boolean
  rows?: number
  maxrows?: number
  modelModifiers?: ModelModifiers<TextareaValue>
  onValueChange?: (value: TextareaValue) => void
  classes?: TextareaClasses
  children?: JSX.Element
}

export type TextareaProps = TextareaBaseProps &
  Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
    keyof TextareaBaseProps | 'id' | 'children' | 'class'
  >

function normalizeTextareaColor(value?: string): TextareaColor {
  if (value === 'secondary' || value === 'neutral' || value === 'error') {
    return value
  }

  return 'primary'
}

function normalizeTextareaSize(value?: string): TextareaSize {
  if (value === 'xs' || value === 'sm' || value === 'lg' || value === 'xl') {
    return value
  }

  return 'md'
}

function normalizeTextareaVariant(value?: string): TextareaVariant {
  if (value === 'soft' || value === 'subtle' || value === 'ghost' || value === 'none') {
    return value
  }

  return 'outline'
}

export function Textarea(props: TextareaProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      rows: 3,
      maxrows: 0,
      autofocusDelay: 0,
      autoresizeDelay: 0,
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'outline' as const,
      autoresize: false,
    },
    props,
  )

  const [local, rest] = splitProps(merged as TextareaProps, [
    'as',
    'id',
    'name',
    'placeholder',
    'color',
    'variant',
    'size',
    'required',
    'autofocus',
    'autofocusDelay',
    'autoresize',
    'autoresizeDelay',
    'disabled',
    'rows',
    'maxrows',
    'highlight',
    'modelModifiers',
    'onValueChange',
    'onInput',
    'onChange',
    'onBlur',
    'onFocus',
    'classes',
    'children',
    'value',
  ])

  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      color: local.color,
      highlight: local.highlight,
      disabled: local.disabled,
    }),
    { deferInputValidation: true },
  )
  const fieldGroup = useFieldGroupContext()
  const generatedId = useId(() => local.id, 'textarea')

  let textareaEl: HTMLTextAreaElement | undefined

  const textareaId = createMemo(() => field.id() ?? generatedId())
  const resolvedColor = createMemo(() => normalizeTextareaColor(field.color() ?? local.color))
  const resolvedSize = createMemo(() =>
    normalizeTextareaSize(local.size ?? fieldGroup?.size ?? field.size()),
  )
  const resolvedVariant = createMemo(() => normalizeTextareaVariant(local.variant))
  const resolvedHighlight = createMemo(() => field.highlight() ?? local.highlight)
  const disabled = createMemo(() => field.disabled())
  const fieldGroupOrientation = createMemo(() => fieldGroup?.orientation)
  const ariaAttrs = createMemo(() => field.ariaAttrs() ?? {})
  const isLazy = createMemo(() => Boolean(local.modelModifiers?.lazy))

  function updateInputValue(value: string | null | undefined): void {
    const nextValue = applyInputModifiers<TextareaValue>(value, local.modelModifiers)

    local.onValueChange?.(nextValue)
    field.emitFormInput()
  }

  function autoResize(): void {
    if (!local.autoresize || !textareaEl) {
      return
    }

    const rows = local.rows ?? 3
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
      textareaEl.rows = local.maxrows ? Math.min(nextRows, local.maxrows) : nextRows
    }

    textareaEl.style.overflow = previousOverflow
  }

  const onInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    autoResize()
    callHandler(event, local.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>)

    if (!isLazy()) {
      updateInputValue(event.currentTarget.value)
    }
  }

  const onChange: JSX.EventHandlerUnion<HTMLTextAreaElement, Event> = (event) => {
    const value = event.currentTarget.value

    if (isLazy()) {
      updateInputValue(value)
    }

    if (local.modelModifiers?.trim) {
      event.currentTarget.value = value.trim()
    }

    field.emitFormChange()
    callHandler(event, local.onChange as JSX.EventHandlerUnion<HTMLTextAreaElement, Event>)
  }

  const onBlur: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormBlur()
    callHandler(event, local.onBlur as any)
  }

  const onFocus: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (event) => {
    field.emitFormFocus()
    callHandler(event, local.onFocus as any)
  }

  createEffect(
    on(
      () => local.value,
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
      if (local.autofocus) {
        textareaEl?.focus()
      }
    }, local.autofocusDelay ?? 0)

    setTimeout(() => {
      autoResize()
    }, local.autoresizeDelay ?? 0)
  })

  return (
    <Dynamic
      component={local.as}
      data-slot="root"
      class={cn(
        textareaRootVariants({
          color: resolvedColor(),
          size: resolvedSize(),
          variant: resolvedVariant(),
          highlight: resolvedHighlight(),
          disabled: disabled(),
          fieldGroup: fieldGroupOrientation(),
        }),
        local.classes?.root,
      )}
      onclick={() => textareaEl?.focus()}
    >
      <textarea
        id={textareaId()}
        ref={(element) => (textareaEl = element)}
        name={field.name()}
        value={local.value as string | number | string[] | undefined}
        rows={local.rows ?? 3}
        placeholder={local.placeholder}
        required={local.required}
        disabled={disabled()}
        data-slot="base"
        class={cn(
          textareaBaseVariants({
            size: resolvedSize(),
            autoresize: local.autoresize,
          }),
          textareaSizePadding[resolvedSize()].start,
          textareaSizePadding[resolvedSize()].end,
          local.classes?.base,
        )}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...rest}
        {...(ariaAttrs() as Record<string, string | boolean | undefined>)}
      />

      {local.children}
    </Dynamic>
  )
}
