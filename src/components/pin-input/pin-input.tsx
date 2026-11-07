import type { JSX } from 'solid-js'
import {
  createComputed,
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
import { HiddenInput } from '../../shared/hidden-input'
import { callHandler, callRef, createId, isAndroidUserAgent } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { useFormReset } from '../shared/form/use-form-reset'

import { defaultPinInputMessages } from './pin-input.messages'
import { pinInputDataAttributes, pinInputRecipe } from './pin-input.recipe'
import type { PinInputProps, PinInputT } from './pin-input.types'

interface ValidationConfig {
  charPattern: RegExp
  slotPattern: string
  getRootPattern: (length: number) => string
  inputMode: 'numeric' | 'text'
}

const VALIDATION_CONFIG: Partial<Record<PinInputT.ValidationType, ValidationConfig>> = {
  number: {
    charPattern: /^\d$/,
    slotPattern: '\\d{1}',
    getRootPattern: (length) => `\\d{${length}}`,
    inputMode: 'numeric',
  },
  alpha: {
    charPattern: /^[a-zA-Z]$/,
    slotPattern: '[a-zA-Z]{1}',
    getRootPattern: (length) => `[a-zA-Z]{${length}}`,
    inputMode: 'text',
  },
  alphanumeric: {
    charPattern: /^[a-zA-Z0-9]$/,
    slotPattern: '[a-zA-Z0-9]{1}',
    getRootPattern: (length) => `[a-zA-Z0-9]{${length}}`,
    inputMode: 'text',
  },
}

function isValidChar(char: string, type: PinInputT.ValidationType): boolean {
  const config = VALIDATION_CONFIG[type]
  if (config) {
    return config.charPattern.test(char)
  }
  return char.length === 1 && !/\s/.test(char)
}

/**
 * Normalizes a string of slot characters through `normalizeValue`, then re-filters it.
 */
function applyNormalizeValue(
  chars: string[],
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): string[] {
  if (!normalizeValue) {
    return chars
  }
  return Array.from(normalizeValue(chars.join(''))).filter((char) => isValidChar(char, type))
}

/**
 * Filters pasted or autofilled text into valid slot characters.
 * Whitespace and dashes are silently stripped; dropped characters set `didReject`.
 */
function filterInputText(
  text: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: string[], didReject: boolean] {
  const stripped = text.replace(/[\s-]+/g, '')
  const valid = applyNormalizeValue(
    Array.from(stripped).filter((char) => isValidChar(char, type)),
    type,
    normalizeValue,
  )
  return [valid, Array.from(stripped).length > valid.length]
}

/**
 * Filters typed or IME-committed text into valid slot characters.
 * Whitespace is silently dropped like in `filterInputText`.
 */
function filterTypedChars(
  typed: string,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): [chars: string[], didReject: boolean] {
  const typedChars = Array.from(typed)
  const valid = applyNormalizeValue(
    typedChars.filter((char) => isValidChar(char, type)),
    type,
    normalizeValue,
  )
  return [valid, typedChars.filter((char) => !/\s/.test(char)).length > valid.length]
}

function normalizeChars(
  val: string[] | string | undefined,
  length: number,
  type: PinInputT.ValidationType,
  normalizeValue?: (value: string) => string,
): string[] {
  const result: string[] = Array.from({ length }, () => '')
  if (val === undefined || val === null) {
    return result
  }
  const chars = Array.isArray(val) ? val.flatMap((s) => Array.from(s)) : Array.from(val)
  const valid = applyNormalizeValue(
    chars.filter((char) => isValidChar(char, type)),
    type,
    normalizeValue,
  )
  for (const [index, char] of valid.slice(0, length).entries()) {
    result[index] = char
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
    'onValueInvalid',
    'onChange',
    'autoSubmit',
    'inputMode',
    'normalizeValue',
    'onFocus',
    'onBlur',
    'onFocusIn',
    'onFocusOut',
    'autofocus',
    'autofocusDelay',
    'disabled',
    'required',
    'readOnly',
    'translations',
    'size',
    'variant',
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
    bind: false,
    focus: true,
    get defaultId() {
      return generatedId()
    },
    get initialValue() {
      if (local.value !== undefined) {
        return typeof local.value === 'string' ? local.value : local.value.join('')
      }
      if (local.defaultValue !== undefined) {
        return typeof local.defaultValue === 'string'
          ? local.defaultValue
          : local.defaultValue.join('')
      }
      return ''
    },
  })
  const themeField = useFieldContext()
  const messages = useMessages('pinInput', defaultPinInputMessages, () => local.translations)
  const providerLocale = useLocale()

  const fieldDataState = {
    disabled: field.disabled,
    invalid: () => !field.disabled() && field.invalid(),
    readonly: field.readOnly,
    required: field.required,
  }

  const {
    slots: { root: rootSlot, separator: separatorSlot },
    slotWith,
  } = useRecipe(pinInputRecipe, local, {
    data: {
      root: pinInputDataAttributes.root({
        ...fieldDataState,
        complete,
        filled,
        focused,
      }),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const normalize = () => local.normalizeValue

  const initialChars = untrack(() => {
    if (local.value !== undefined) {
      return normalizeChars(local.value, length(), validationType(), normalize())
    }
    const formVal = field.value()
    if (formVal !== undefined) {
      return normalizeChars(formVal as string | string[], length(), validationType(), normalize())
    }
    return normalizeChars(local.defaultValue, length(), validationType(), normalize())
  })

  const [uncontrolledChars, setUncontrolledChars] = createSignal<string[]>(initialChars)

  const chars = createMemo<string[]>(() => {
    if (local.value !== undefined) {
      return normalizeChars(local.value, length(), validationType(), normalize())
    }
    const formVal = field.value()
    if (formVal !== undefined) {
      return normalizeChars(formVal as string | string[], length(), validationType(), normalize())
    }
    return uncontrolledChars()
  })

  /** Mirrors the value into the Field store, keeping the store's current array/string shape. */
  function toFormValue(val: string[] | string): unknown {
    if (Array.isArray(field.value())) {
      return Array.isArray(val) ? val : Array.from(val)
    }
    return typeof val === 'string' ? val : val.join('')
  }

  function setChars(
    update: string[] | ((prev: string[]) => string[]),
    completeOnUnchanged = false,
  ): void {
    const current = chars()
    const next = typeof update === 'function' ? update(current) : update
    const nextJoined = next.join('')
    const nextComplete = next.every((c) => c !== '')

    if (current.length === next.length && current.every((v, i) => v === next[i])) {
      // A complete paste that reconfirms the current value still completes.
      if (nextComplete && completeOnUnchanged) {
        completeValue(nextJoined)
      }
      return
    }

    if (local.value === undefined) {
      setUncontrolledChars(() => next)
      field.setFormValue(toFormValue(next))
    } else {
      field.setFormValue(toFormValue(local.value))
    }

    local.onValueChange?.(next)
    local.onChange?.(nextJoined)

    if (nextComplete) {
      if (chars().join('') === nextJoined) {
        completeValue(nextJoined)
      } else {
        // Controlled and not applied yet: complete once the value actually lands.
        pendingComplete = nextJoined
      }
    } else {
      pendingComplete = undefined
    }

    field.emit('change')
    field.emit('input')
  }

  function completeValue(joined: string): void {
    local.onComplete?.(joined)
    if (local.autoSubmit) {
      const formElement = hiddenInputEl?.form ?? inputEls[0]?.form ?? rootEl?.closest('form')
      if (formElement && typeof formElement.requestSubmit === 'function') {
        formElement.requestSubmit()
      }
    }
  }

  let pendingFocus: { index: number; joined: string } | undefined
  let pendingComplete: string | undefined

  /** Focuses a slot once `joined` is the applied value, or immediately when it already is. */
  function queueFocusInput(index: number, joined: string): void {
    if (chars().join('') === joined) {
      focusInput(index)
    } else {
      pendingFocus = { index, joined }
    }
  }

  createComputed(
    on(
      () => chars(),
      (currentChars) => {
        const joined = currentChars.join('')
        const focus = pendingFocus
        pendingFocus = undefined
        if (focus && joined === focus.joined) {
          focusInput(focus.index)
        }
        const complete = pendingComplete
        pendingComplete = undefined
        if (complete !== undefined && joined === complete) {
          completeValue(complete)
        }
      },
      { defer: true },
    ),
  )

  function resetChars(): void {
    if (local.value === undefined) {
      const resetValue = normalizeChars(local.defaultValue, length(), validationType(), normalize())
      setUncontrolledChars(() => resetValue)
      field.setFormValue(toFormValue(resetValue))
    } else {
      field.setFormValue(toFormValue(local.value))
    }
    const current = chars()
    for (const [index, element] of inputEls.slice(0, length()).entries()) {
      if (element) {
        element.value = current[index] ?? ''
      }
    }
  }

  createEffect(
    on(
      () => local.value,
      (val) => {
        if (val !== undefined) {
          const nextFormVal = toFormValue(val)
          if (field.value() !== nextFormVal) {
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
        const filtered = inputEls.slice(0, length()).filter(Boolean) as HTMLInputElement[]
        if (filtered.length > 0) {
          callRef(local.inputsRef, filtered)
        }
        const focused = focusedIndex()
        if (focused !== null) {
          const firstEmpty = currentChars.findIndex((c) => !c)
          const isSelectable =
            focused < currentChars.length &&
            (currentChars[focused] !== '' || focused === firstEmpty)
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

  /**
   * Commits raw input text (`onInput` and IME `compositionend`) into the slot at `idx`,
   * distributing consecutive valid characters across following slots.
   */
  function handleSlotInput(element: HTMLInputElement, idx: number): void {
    if (field.disabled() || field.readOnly()) {
      element.value = chars()[idx] ?? ''
      return
    }

    const raw = element.value
    const currentSlotChar = chars()[idx] ?? ''

    // Find newly typed characters
    let typed = raw
    if (raw.length > 1) {
      if (raw.startsWith(currentSlotChar)) {
        typed = raw.slice(currentSlotChar.length)
      } else if (raw.endsWith(currentSlotChar)) {
        typed = raw.slice(0, raw.length - currentSlotChar.length)
      }
    }

    const [validChars, didReject] = filterTypedChars(typed, validationType(), local.normalizeValue)
    if (didReject) {
      local.onValueInvalid?.(raw)
    }

    if (validChars.length === 0) {
      if (raw === '') {
        const next = [...chars()]
        next[idx] = ''
        setChars(next)
        element.value = chars()[idx] ?? ''
      } else {
        // Restore the rejected character and keep the slot selected, matching focus behavior.
        element.value = currentSlotChar
        element.select()
      }
      return
    }

    // Multiple valid characters (autofill or IME text) distribute across slots,
    // replacing the characters that occupied them.
    if (validChars.length > 1) {
      const next = [...chars()]
      next.splice(idx, validChars.length, ...validChars)
      next.length = length()
      const nextJoined = next.join('')
      setChars(next)
      element.value = chars()[idx] ?? ''
      queueFocusInput(Math.min(idx + validChars.length, length() - 1), nextJoined)
      return
    }

    const next = [...chars()]
    next[idx] = validChars[0] ?? ''
    const nextJoined = next.join('')
    setChars(next)
    element.value = chars()[idx] ?? ''

    if (idx < length() - 1) {
      queueFocusInput(idx + 1, nextJoined)
    } else {
      element.select()
    }
  }

  /** Whether any slot input currently has focus (and the field is not disabled). */
  function focused(): boolean {
    const index = focusedIndex()
    return index !== null && index < length() && !field.disabled()
  }

  function filled(): boolean {
    return chars().some((c) => c !== '')
  }

  function complete(): boolean {
    return chars().every((c) => c !== '')
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
    return (
      typeof local.separator === 'number' &&
      Number.isInteger(local.separator) &&
      local.separator > 0 &&
      position % local.separator === 0
    )
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
  const isRtl = () => providerLocale.dir() === 'rtl'
  const validationConfig = () => VALIDATION_CONFIG[validationType()]
  const inputMode = () => local.inputMode ?? validationConfig()?.inputMode ?? 'text'

  /** The single tabbable slot: the focused one, or the first editable target otherwise. */
  function tabbableIndex(): number {
    const index = focusedIndex()
    return index !== null ? Math.min(index, length() - 1) : getTargetIndex()
  }

  // While an IME composition is active, intermediate text is exposed through `input`
  // as an accumulating string; committing per event would fill too many slots.
  const [composing, setComposing] = createSignal(false)

  return (
    <div
      role="group"
      data-slot="pin-input"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      {...field.ariaAttrs()}
      ref={(element) => {
        rootEl = element
        callRef(local.ref, element)
      }}
      onFocusIn={(event) => {
        if (
          callHandler(event, local.onFocusIn).defaultPrevented ||
          (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
        ) {
          return
        }
        if (!callHandler(event, local.onFocus).defaultPrevented) {
          field.emit('focus', event)
        }
      }}
      onFocusOut={(event) => {
        if (
          callHandler(event, local.onFocusOut).defaultPrevented ||
          (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
        ) {
          return
        }
        if (!callHandler(event, local.onBlur).defaultPrevented) {
          field.emit('blur', event)
        }
      }}
      onMouseDown={(event) => {
        if (
          event.button === 0 &&
          (event.target === event.currentTarget ||
            (event.target as HTMLElement)?.closest('[data-slot="pin-input-separator"]'))
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
        <HiddenInput
          type="text"
          name={field.name()}
          form={local.form}
          value={joinedValue()}
          autocomplete={local.otp ? 'one-time-code' : 'off'}
          inputMode={inputMode()}
          minLength={length()}
          maxLength={length()}
          pattern={validationConfig()?.getRootPattern(length())}
          disabled={field.disabled()}
          readOnly={field.readOnly()}
          required={field.required()}
          tabIndex={-1}
          aria-hidden="true"
          ref={(element) => {
            hiddenInputEl = element
          }}
          onFocus={() => {
            if (!field.disabled()) {
              focusInput(getTargetIndex())
            }
          }}
          onInput={(event) => {
            if (field.disabled() || field.readOnly() || event.defaultPrevented) {
              event.currentTarget.value = joinedValue()
              return
            }

            const raw = event.currentTarget.value
            const [validChars, didReject] = filterInputText(
              raw,
              validationType(),
              local.normalizeValue,
            )
            if (didReject) {
              local.onValueInvalid?.(raw)
            }

            const next = Array.from({ length: length() }, (_, index) => validChars[index] ?? '')
            const nextJoined = next.join('')
            setChars(next)
            event.currentTarget.value = joinedValue()
            if (nextJoined !== '') {
              queueFocusInput(Math.min(validChars.length, length()) - 1, nextJoined)
            }
          }}
        />
      </Show>

      <For each={indices()}>
        {(idx) => {
          const itemSlot = slotWith('input', {
            data: pinInputDataAttributes.input({
              ...fieldDataState,
              complete,
              focused,
              filled: () => chars()[idx] !== '',
            }),
          })

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
                inputMode={inputMode()}
                pattern={validationConfig()?.slotPattern}
                autocomplete={idx === 0 && local.otp ? 'one-time-code' : 'off'}
                autocorrect="off"
                autocapitalize="off"
                spellcheck={false}
                enterkeyhint={idx === length() - 1 ? 'done' : 'next'}
                maxLength={idx === 0 ? length() : undefined}
                tabIndex={idx === tabbableIndex() ? 0 : -1}
                form={local.form}
                placeholder={focusedIndex() === idx ? '' : (local.placeholder ?? '')}
                disabled={field.disabled()}
                readOnly={field.readOnly()}
                required={field.required()}
                value={chars()[idx] ?? ''}
                aria-label={messages().input({ index: idx + 1, length: length() })}
                aria-invalid={field.ariaAttrs()['aria-invalid']}
                aria-describedby={field.ariaAttrs()['aria-describedby']}
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
                onBlur={(event) => {
                  if (event.relatedTarget && rootEl?.contains(event.relatedTarget as Node)) {
                    return
                  }
                  if (focusedIndex() === idx) {
                    setFocusedIndex(null)
                  }
                }}
                onMouseDown={(event) => {
                  if (event.button !== 0 || event.defaultPrevented || field.disabled()) {
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
                  if (event.defaultPrevented || field.disabled() || composing()) {
                    return
                  }

                  const previousKey = isRtl() ? 'ArrowRight' : 'ArrowLeft'
                  const nextKey = isRtl() ? 'ArrowLeft' : 'ArrowRight'
                  const endTargetIndex = getTargetIndex()
                  const hasBoundaryModifier = (event.ctrlKey || event.metaKey) && !event.altKey

                  const stopEvent = () => {
                    event.preventDefault()
                    event.stopPropagation()
                  }

                  if (event.key === previousKey) {
                    stopEvent()
                    focusInput(hasBoundaryModifier ? 0 : Math.max(0, idx - 1))
                    return
                  }

                  if (event.key === nextKey) {
                    stopEvent()
                    focusInput(
                      hasBoundaryModifier ? endTargetIndex : Math.min(endTargetIndex, idx + 1),
                    )
                    return
                  }

                  if (event.key === 'Home' || event.key === 'ArrowUp') {
                    stopEvent()
                    focusInput(0)
                    return
                  }

                  if (event.key === 'End' || event.key === 'ArrowDown') {
                    stopEvent()
                    focusInput(endTargetIndex)
                    return
                  }

                  if (field.readOnly()) {
                    return
                  }

                  if (event.key === 'Backspace') {
                    stopEvent()
                    if (hasBoundaryModifier) {
                      const next = Array.from({ length: length() }, () => '')
                      const nextJoined = next.join('')
                      setChars(next)
                      queueFocusInput(0, nextJoined)
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
                      const nextJoined = next.join('')
                      setChars(next)
                      queueFocusInput(prevIdx, nextJoined)
                    }
                    return
                  }

                  if (event.key === 'Delete') {
                    stopEvent()
                    const next = [...chars()]
                    next[idx] = ''
                    setChars(next)
                  }
                }}
                onInput={(event) => {
                  if (composing()) {
                    return
                  }
                  if (event.defaultPrevented) {
                    event.currentTarget.value = chars()[idx] ?? ''
                    return
                  }
                  handleSlotInput(event.currentTarget, idx)
                }}
                onCompositionStart={() => {
                  // Some Android keyboards report all text as always-composing, so they
                  // keep committing through `input` events instead of `compositionend`.
                  if (!isAndroidUserAgent()) {
                    setComposing(true)
                  }
                }}
                onCompositionEnd={(event) => {
                  if (!composing()) {
                    return
                  }
                  setComposing(false)
                  handleSlotInput(event.currentTarget, idx)
                }}
                onPaste={(event) => {
                  if (event.defaultPrevented || field.disabled() || field.readOnly()) {
                    return
                  }

                  let pastedText: string
                  try {
                    pastedText = event.clipboardData?.getData('text/plain') ?? ''
                  } catch {
                    return
                  }
                  event.preventDefault()

                  const [validChars, didReject] = filterInputText(
                    pastedText,
                    validationType(),
                    local.normalizeValue,
                  )
                  if (didReject || validChars.length > length()) {
                    local.onValueInvalid?.(pastedText)
                  }
                  if (validChars.length === 0) {
                    return
                  }

                  const next = [...chars()]
                  next.splice(idx, validChars.length, ...validChars)
                  next.length = length()
                  const nextJoined = next.join('')
                  setChars(
                    next,
                    next.every((c) => c !== ''),
                  )
                  queueFocusInput(Math.min(idx + validChars.length, length() - 1), nextJoined)
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
