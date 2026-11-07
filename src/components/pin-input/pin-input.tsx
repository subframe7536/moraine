import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
  untrack,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'

import { defaultPinInputMessages } from './pin-input.messages'
import { pinInputDataAttributes, pinInputRecipe } from './pin-input.recipe'
import type { PinInputProps, PinInputT } from './pin-input.types'

function isValidChar(char: string, type: PinInputT.ValidationType): boolean {
  if (type === 'number' || type === 'numeric') {
    return /^\d$/.test(char)
  }
  if (type === 'alpha') {
    return /^[a-zA-Z]$/.test(char)
  }
  if (type === 'alphanumeric') {
    return /^[a-zA-Z0-9]$/.test(char)
  }
  return char.length === 1 && !/[\r\n]/.test(char)
}

function cleanPastedText(text: string, type: PinInputT.ValidationType): string[] {
  const stripped = text.replace(/[\s-]+/g, '')
  const result: string[] = []
  for (const char of Array.from(stripped)) {
    if (isValidChar(char, type)) {
      result.push(char)
    }
  }
  return result
}

function normalizeChars(
  val: string[] | string | undefined,
  length: number,
  type: PinInputT.ValidationType,
): string[] {
  const result: string[] = Array.from({ length }, () => '')
  if (val === undefined || val === null) {
    return result
  }
  const chars = Array.isArray(val) ? val.flatMap((s) => Array.from(s)) : Array.from(val)
  let idx = 0
  for (const c of chars) {
    if (idx >= length) {
      break
    }
    if (isValidChar(c, type)) {
      result[idx] = c
      idx++
    }
  }
  return result
}

/**
 * An accessible pin/OTP input component.
 */
export function PinInput(props: PinInputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'form',
    'length',
    'validationType',
    'mask',
    'otp',
    'placeholder',
    'separator',
    'separatorRender',
    'value',
    'defaultValue',
    'onValueChange',
    'onComplete',
    'onChange',
    'onFocus',
    'onBlur',
    'autofocus',
    'autofocusDelay',
    'disabled',
    'required',
    'readOnly',
    'translations',
    'size',
    'variant',
    'tone',
    'highlight',
    'fixed',
    'ref',
    'inputsRef',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const length = () => Math.max(1, local.length ?? 5)
  const validationType = () => local.validationType ?? 'text'
  const generatedId = createId(() => local.id, 'pin-input')
  const field = useFormField(local, {
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      if (local.defaultValue !== undefined) {
        return typeof local.defaultValue === 'string'
          ? local.defaultValue
          : local.defaultValue.join('')
      }
      if (local.value !== undefined) {
        return typeof local.value === 'string' ? local.value : local.value.join('')
      }
      return ''
    },
  })
  const themeField = useFieldContext()
  const messages = useMessages('pinInput', defaultPinInputMessages, () => local.translations)
  const providerLocale = useLocale()

  const fieldDataState = {
    get disabled() {
      return field.disabled()
    },
    get invalid() {
      return !field.disabled() && (field.invalid?.() ?? false)
    },
    get readonly() {
      return field.readOnly()
    },
    get required() {
      return field.required()
    },
  }

  const {
    slots: { root: rootSlot },
    slotWith,
  } = useRecipe(pinInputRecipe, local, {
    data: {
      root: pinInputDataAttributes.root(() => fieldDataState),
      input: pinInputDataAttributes.input(() => fieldDataState),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const initialChars = untrack(() => {
    if (local.value !== undefined) {
      return normalizeChars(local.value, length(), validationType())
    }
    const formVal = field.value()
    if (formVal !== undefined) {
      return normalizeChars(formVal as string | string[], length(), validationType())
    }
    return normalizeChars(local.defaultValue, length(), validationType())
  })

  const [uncontrolledChars, setUncontrolledChars] = createSignal<string[]>(initialChars)

  const chars = createMemo<string[]>(() => {
    if (local.value !== undefined) {
      return normalizeChars(local.value, length(), validationType())
    }
    const formVal = field.value()
    if (formVal !== undefined) {
      return normalizeChars(formVal as string | string[], length(), validationType())
    }
    return uncontrolledChars()
  })

  function setChars(update: string[] | ((prev: string[]) => string[])): void {
    const current = chars()
    const next = typeof update === 'function' ? update(current) : update

    if (current.length === next.length && current.every((v, i) => v === next[i])) {
      return
    }

    const nextJoined = next.join('')

    if (local.value === undefined) {
      setUncontrolledChars(() => next)
      if (Array.isArray(field.value())) {
        field.setFormValue(next)
      } else {
        field.setFormValue(nextJoined)
      }
    } else {
      if (Array.isArray(field.value())) {
        field.setFormValue(local.value)
      } else {
        field.setFormValue(typeof local.value === 'string' ? local.value : nextJoined)
      }
    }

    local.onValueChange?.(next)
    local.onChange?.(nextJoined)

    if (next.length === length() && next.every((c) => c !== '')) {
      local.onComplete?.(nextJoined)
    }

    field.emit('change')
    field.emit('input')
  }

  function resetChars(): void {
    const resetValue = normalizeChars(local.defaultValue, length(), validationType())
    setChars(resetValue)
  }

  createEffect(
    on(
      () => local.value,
      (val) => {
        if (val !== undefined) {
          const formVal = field.value()
          const nextFormVal = Array.isArray(formVal)
            ? Array.isArray(val)
              ? val
              : Array.from(val)
            : typeof val === 'string'
              ? val
              : val.join('')
          if (formVal !== nextFormVal) {
            field.setFormValue(nextFormVal)
          }
        }
      },
    ),
  )

  const joinedValue = createMemo(() => chars().join(''))

  const inputEls: (HTMLInputElement | null)[] = []
  let rootEl: HTMLDivElement | undefined
  let hiddenInputEl: HTMLInputElement | undefined

  createEffect(
    on(
      () => chars(),
      (currentChars) => {
        const filtered = inputEls.filter(Boolean) as HTMLInputElement[]
        if (filtered.length > 0) {
          callRef(local.inputsRef, filtered)
        }
        const focused = focusedIndex()
        if (focused !== null) {
          const firstEmpty = currentChars.findIndex((c) => !c)
          const isSelectable = currentChars[focused] !== '' || focused === firstEmpty
          if (!isSelectable) {
            focusInput(firstEmpty !== -1 ? firstEmpty : length() - 1)
          }
        }
      },
    ),
  )

  function focusInput(index: number): void {
    const clamped = Math.max(0, Math.min(length() - 1, index))
    const target = inputEls[clamped]
    if (target) {
      target.focus()
      target.select()
    }
  }

  function getTargetIndex(): number {
    const currentChars = chars()
    const firstEmpty = currentChars.findIndex((c) => !c)
    return firstEmpty !== -1 ? firstEmpty : length() - 1
  }

  function getValidTargetIndex(idx: number): number {
    const currentChars = chars()
    const firstEmpty = currentChars.findIndex((c) => !c)
    const isSelectable = currentChars[idx] !== '' || idx === firstEmpty
    return isSelectable ? idx : firstEmpty !== -1 ? firstEmpty : length() - 1
  }

  function shouldInsertSeparator(index: number): boolean {
    if (local.separator === undefined || local.separator === false) {
      return false
    }
    const position = index + 1
    if (position >= length()) {
      return false
    }
    if (local.separator === true) {
      return position === Math.ceil(length() / 2)
    }
    if (Array.isArray(local.separator)) {
      return local.separator.includes(position)
    }
    const sep = typeof local.separator === 'number' ? local.separator : Number(local.separator)
    return Number.isInteger(sep) && sep > 0 && position % sep === 0
  }

  let autofocusTimeoutId: ReturnType<typeof setTimeout> | undefined

  onMount(() => {
    if (local.autofocus) {
      autofocusTimeoutId = setTimeout(() => {
        if (!field.disabled()) {
          focusInput(getTargetIndex())
        }
      }, local.autofocusDelay ?? 0)
    }
  })

  onCleanup(() => {
    if (autofocusTimeoutId !== undefined) {
      clearTimeout(autofocusTimeoutId)
    }
  })

  useFormReset(
    () => hiddenInputEl?.form ?? rootEl?.closest('form'),
    () => {
      resetChars()
    },
  )

  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null)
  const indices = createMemo(() => Array.from({ length: length() }, (_, i) => i))

  return (
    <div
      role="group"
      data-slot="pin-input"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      ref={(element) => {
        rootEl = element
        callRef(local.ref, element)
      }}
      onFocusIn={(event) => {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
          return
        }
        callHandler(event, local.onFocus)
        field.emit('focus')
      }}
      onFocusOut={(event) => {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
          return
        }
        callHandler(event, local.onBlur)
        field.emit('blur')
      }}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget ||
          (event.target as HTMLElement)?.closest('[data-slot="pin-input-separator"]')
        ) {
          event.preventDefault()
          focusInput(getTargetIndex())
        }
      }}
      onClick={(event) => {
        if (
          event.target === event.currentTarget ||
          (event.target as HTMLElement)?.closest('[data-slot="pin-input-separator"]')
        ) {
          focusInput(getTargetIndex())
        }
      }}
    >
      <Show when={field.name()}>
        <input
          type="hidden"
          name={field.name()}
          value={joinedValue()}
          form={local.form}
          disabled={field.disabled()}
          ref={(element) => {
            hiddenInputEl = element
          }}
        />
      </Show>

      <For each={indices()}>
        {(idx) => {
          const itemSlot = slotWith('input', {
            data: pinInputDataAttributes.input(() => fieldDataState),
          })
          const separatorSlot = slotWith('separator')

          const isRtl = () => providerLocale.dir() === 'rtl'

          return (
            <>
              <input
                data-slot="pin-input-input"
                {...itemSlot}
                id={`${field.id()}-${idx}`}
                ref={(element) => {
                  inputEls[idx] = element
                  if (idx === 0) {
                    field.setControlRef(element)
                  }
                }}
                type={local.mask ? 'password' : 'text'}
                inputMode={
                  validationType() === 'number' || validationType() === 'numeric'
                    ? 'numeric'
                    : 'text'
                }
                pattern={
                  validationType() === 'number' || validationType() === 'numeric'
                    ? '[0-9]*'
                    : undefined
                }
                autocomplete={idx === 0 && local.otp ? 'one-time-code' : 'off'}
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                placeholder={focusedIndex() === idx ? '' : (local.placeholder ?? '')}
                disabled={field.disabled()}
                readOnly={field.readOnly()}
                required={field.required()}
                value={chars()[idx] ?? ''}
                aria-label={messages().input({ index: idx + 1, length: length() })}
                aria-invalid={field.ariaAttrs()['aria-invalid']}
                onFocus={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }
                  const targetIdx = getValidTargetIndex(idx)
                  if (targetIdx !== idx) {
                    focusInput(targetIdx)
                    return
                  }
                  setFocusedIndex(idx)
                  event.currentTarget.select()
                }}
                onBlur={() => {
                  if (focusedIndex() === idx) {
                    setFocusedIndex(null)
                  }
                }}
                onMouseDown={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }
                  event.preventDefault()
                  const targetIdx = getValidTargetIndex(idx)
                  focusInput(targetIdx)
                }}
                onClick={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }
                  const targetIdx = getValidTargetIndex(idx)
                  focusInput(targetIdx)
                }}
                onKeyDown={(event) => {
                  if (event.defaultPrevented || field.disabled()) {
                    return
                  }

                  const previousKey = isRtl() ? 'ArrowRight' : 'ArrowLeft'
                  const nextKey = isRtl() ? 'ArrowLeft' : 'ArrowRight'
                  const endTargetIndex = getTargetIndex()

                  if (event.key === previousKey) {
                    event.preventDefault()
                    focusInput(event.ctrlKey || event.metaKey ? 0 : Math.max(0, idx - 1))
                    return
                  }

                  if (event.key === nextKey) {
                    event.preventDefault()
                    focusInput(
                      event.ctrlKey || event.metaKey
                        ? endTargetIndex
                        : Math.min(endTargetIndex, idx + 1),
                    )
                    return
                  }

                  if (event.key === 'Home' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    focusInput(0)
                    return
                  }

                  if (event.key === 'End' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    focusInput(endTargetIndex)
                    return
                  }

                  if (field.readOnly()) {
                    return
                  }

                  if (event.key === 'Backspace') {
                    event.preventDefault()
                    if (event.ctrlKey || event.metaKey) {
                      setChars(Array.from({ length: length() }, () => ''))
                      focusInput(0)
                      return
                    }

                    if (chars()[idx] !== '') {
                      const next = [...chars()]
                      next[idx] = ''
                      setChars(next)
                    } else {
                      const prevIdx = Math.max(0, idx - 1)
                      const next = [...chars()]
                      next[prevIdx] = ''
                      setChars(next)
                      focusInput(prevIdx)
                    }
                    return
                  }

                  if (event.key === 'Delete') {
                    event.preventDefault()
                    const next = [...chars()]
                    next[idx] = ''
                    setChars(next)
                  }
                }}
                onInput={(event) => {
                  if (field.disabled() || field.readOnly()) {
                    event.currentTarget.value = chars()[idx] ?? ''
                    return
                  }

                  const raw = event.currentTarget.value
                  const currentSlotChar = chars()[idx] ?? ''

                  // Find newly typed character
                  let typed = raw
                  if (raw.length > 1) {
                    if (raw.startsWith(currentSlotChar)) {
                      typed = raw.slice(currentSlotChar.length)
                    } else if (raw.endsWith(currentSlotChar)) {
                      typed = raw.slice(0, raw.length - currentSlotChar.length)
                    }
                  }

                  const validChars = Array.from(typed).filter((c) =>
                    isValidChar(c, validationType()),
                  )

                  if (validChars.length === 0) {
                    if (raw === '') {
                      const next = [...chars()]
                      next[idx] = ''
                      setChars(next)
                    } else {
                      event.currentTarget.value = currentSlotChar
                    }
                    return
                  }

                  // If multiple valid characters are typed or autofilled in a single input event
                  if (validChars.length > 1) {
                    const next = [...chars()]
                    let insertIdx = idx
                    for (const c of validChars) {
                      if (insertIdx < length()) {
                        next[insertIdx] = c
                        insertIdx++
                      }
                    }
                    setChars(next)
                    focusInput(Math.min(length() - 1, insertIdx))
                    return
                  }

                  const charToUse = validChars[validChars.length - 1]
                  if (charToUse === undefined) {
                    return
                  }
                  const next = [...chars()]
                  next[idx] = charToUse
                  setChars(next)
                  event.currentTarget.value = charToUse

                  if (idx < length() - 1) {
                    focusInput(idx + 1)
                  } else {
                    event.currentTarget.select()
                  }
                }}
                onPaste={(event) => {
                  if (event.defaultPrevented || field.disabled() || field.readOnly()) {
                    return
                  }

                  event.preventDefault()
                  const pastedText = event.clipboardData?.getData('text/plain') ?? ''
                  const validChars = cleanPastedText(pastedText, validationType())

                  if (validChars.length === 0) {
                    return
                  }

                  const next = [...chars()]
                  let insertIdx = idx
                  for (const c of validChars) {
                    if (insertIdx < length()) {
                      next[insertIdx] = c
                      insertIdx++
                    }
                  }
                  setChars(next)
                  focusInput(Math.min(length() - 1, insertIdx))
                }}
              />

              <Show when={shouldInsertSeparator(idx)}>
                <span
                  data-slot="pin-input-separator"
                  role="presentation"
                  aria-hidden="true"
                  {...separatorSlot}
                >
                  <Show
                    when={typeof local.separatorRender === 'function' && local.separatorRender}
                    fallback="•"
                    keyed
                  >
                    {(Separator) => <Separator index={idx} />}
                  </Show>
                </span>
              </Show>
            </>
          )
        }}
      </For>
    </div>
  )
}
